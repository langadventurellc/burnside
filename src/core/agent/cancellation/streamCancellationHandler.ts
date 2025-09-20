/**
 * Stream Cancellation Handler
 *
 * Specialized cancellation handling for streaming responses to enable mid-stream
 * interruption with proper buffer management and stream cleanup. Integrates with
 * the existing CancellationManager to provide stream-specific cancellation capabilities.
 */

import type { CancellationManager } from "./cancellationManager";
import type { StreamDelta } from "../../../client/streamDelta";
import type { StreamState } from "./streamState";
import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";
import type { TimerHandle } from "../../runtime/timerHandle";
import { createCancellationError } from "./createCancellationError";

/**
 * Stream Cancellation Handler implementation
 *
 * Provides specialized cancellation handling for streaming responses with:
 * - Mid-stream cancellation detection within 100ms
 * - Buffer management during interruption
 * - Stream state lifecycle management
 * - Provider stream cleanup coordination
 *
 * @example Basic usage
 * ```typescript
 * const handler = new StreamCancellationHandler(cancellationManager);
 *
 * // Start monitoring a stream
 * handler.startStreamMonitoring();
 *
 * // Process stream with cancellation awareness
 * for await (const chunk of stream) {
 *   handler.checkCancellationDuringStream();
 *   handler.appendToBuffer(chunk);
 * }
 * ```
 *
 * @example Integration with existing streaming
 * ```typescript
 * const handler = new StreamCancellationHandler(cancellationManager);
 * const wrappedStream = handler.wrapStreamWithCancellation(providerStream);
 *
 * for await (const delta of wrappedStream) {
 *   // Stream automatically handles cancellation
 *   console.log(delta);
 * }
 * ```
 */
export class StreamCancellationHandler {
  private streamState: StreamState = "active";
  private buffer: string = "";
  private cancellationCheckInterval?: TimerHandle;
  private readonly checkIntervalMs: number;
  private streamStartTime: number = 0;
  private lastActivity: number = 0;
  private pauseResolvers: Array<() => void> = [];
  private readonly runtimeAdapter: RuntimeAdapter;

  constructor(
    private readonly cancellationManager: CancellationManager,
    runtimeAdapter: RuntimeAdapter,
    options: {
      cancellationCheckIntervalMs?: number;
    } = {},
  ) {
    this.runtimeAdapter = runtimeAdapter;
    this.checkIntervalMs = options.cancellationCheckIntervalMs ?? 100;
  }

  /**
   * Pause the current stream
   *
   * Transitions stream to paused state and stops cancellation monitoring.
   * Used when stream needs to be temporarily halted (e.g., for tool execution).
   */
  pauseStream(): void {
    if (this.streamState === "cancelled" || this.streamState === "completed") {
      return; // Cannot pause already terminated streams
    }

    this.streamState = "paused";
    this.stopCancellationChecks();
  }

  /**
   * Resume a paused stream
   *
   * Transitions stream back to active state and resumes cancellation monitoring.
   * Used to continue stream processing after temporary interruption.
   */
  resumeStream(): void {
    if (this.streamState !== "paused") {
      return; // Can only resume paused streams
    }

    this.streamState = "active";
    this.startCancellationChecks();

    // Notify any waiting pause resolvers
    const resolvers = [...this.pauseResolvers];
    this.pauseResolvers = [];
    resolvers.forEach((resolve) => resolve());
  }

  /**
   * Cancel the current stream
   *
   * Immediately transitions stream to cancelled state, performs cleanup,
   * and stops all monitoring. This is a terminal state transition.
   *
   * @param reason - Optional reason for stream cancellation
   */
  cancelStream(reason?: string): void {
    if (this.streamState === "cancelled" || this.streamState === "completed") {
      return; // Already terminated
    }

    const previousState = this.streamState;
    this.streamState = "cancelled";

    try {
      // Stop monitoring
      this.stopCancellationChecks();

      // Perform cleanup
      this.performStreamCleanup();

      // If cancellation manager is still active, cancel it with context
      if (!this.cancellationManager.isCancelled()) {
        this.cancellationManager.cancel(
          reason || `Stream cancelled from ${previousState} state`,
        );
      }
    } catch (error) {
      // Log cleanup errors but don't throw - cancellation should proceed
      console.error("Stream cleanup failed during cancellation:", error);
    }
  }

  /**
   * Get current stream state
   *
   * @returns Current stream state
   */
  getStreamState(): StreamState {
    return this.streamState;
  }

  /**
   * Get current buffer content
   *
   * Returns accumulated content from the stream buffer. Useful for
   * debugging and partial response preservation.
   *
   * @returns Current buffer content as string
   */
  getCurrentBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear the stream buffer
   *
   * Removes all accumulated content from the buffer. Should be called
   * after successful completion or when starting fresh processing.
   */
  clearBuffer(): void {
    this.buffer = "";
  }

  /**
   * Start stream monitoring
   *
   * Initializes stream state and begins cancellation monitoring.
   * Should be called when stream processing begins.
   */
  startStreamMonitoring(): void {
    this.streamState = "active";
    this.streamStartTime = Date.now();
    this.lastActivity = this.streamStartTime;
    this.clearBuffer();
    this.startCancellationChecks();
  }

  /**
   * Complete stream processing
   *
   * Transitions stream to completed state and performs final cleanup.
   * Should be called when stream processing finishes successfully.
   */
  completeStream(): void {
    if (this.streamState === "cancelled") {
      return; // Already cancelled
    }

    this.streamState = "completed";
    this.stopCancellationChecks();
  }

  /**
   * Append content to stream buffer
   *
   * Accumulates streaming content and updates activity timestamp.
   * Used during stream processing to build up response content.
   *
   * @param chunk - Stream chunk to append to buffer
   */
  appendToBuffer(chunk: StreamDelta): void {
    this.lastActivity = Date.now();

    // Extract text content from chunk and append to buffer
    if (chunk.delta?.content) {
      for (const contentPart of chunk.delta.content) {
        if (contentPart.type === "text" && contentPart.text) {
          this.buffer += contentPart.text;
        }
      }
    }
  }

  /**
   * Check for cancellation during stream processing
   *
   * Throws CancellationError if cancellation has been detected.
   * Should be called periodically during stream processing.
   *
   * @throws CancellationError when cancellation is detected
   */
  checkCancellationDuringStream(): void {
    if (this.streamState === "cancelled") {
      throw createCancellationError(
        "Stream was already cancelled",
        "streaming",
        true,
      );
    }

    // Check with cancellation manager
    if (this.cancellationManager.isCancelled()) {
      // Transition to cancelled state
      this.streamState = "cancelled";
      this.stopCancellationChecks();

      throw createCancellationError(
        this.cancellationManager.getCancellationReason() ||
          "Stream cancelled during processing",
        "streaming",
        false, // cleanup not yet completed
      );
    }
  }

  /**
   * Wrap a stream with cancellation awareness
   *
   * Creates a new AsyncIterable that monitors the original stream for
   * cancellation and handles buffer management automatically.
   *
   * @param originalStream - Original stream to wrap
   * @returns Cancellation-aware stream wrapper
   */
  async *wrapStreamWithCancellation(
    originalStream: AsyncIterable<StreamDelta>,
  ): AsyncIterable<StreamDelta> {
    this.startStreamMonitoring();

    try {
      for await (const chunk of originalStream) {
        this.processStreamChunk(chunk);
        yield chunk;
      }
    } catch (error) {
      this.handleStreamError(error);
      throw error;
    } finally {
      this.stopCancellationChecks();
    }
  }

  /**
   * Process a stream chunk with cancellation checking
   */
  private processStreamChunk(chunk: StreamDelta): void {
    // Check for cancellation before processing each chunk
    this.checkCancellationDuringStream();

    // Append to buffer for preservation
    this.appendToBuffer(chunk);

    // Check if stream is finished
    if (chunk.finished) {
      this.completeStream();
    }
  }

  /**
   * Handle errors during stream processing
   */
  private handleStreamError(error: unknown): void {
    // If it's a cancellation error, handle gracefully
    if (error instanceof Error && error.message.includes("cancel")) {
      this.cancelStream(error.message);
    }
  }

  /**
   * Handle periodic cancellation checks
   */
  private handlePeriodicCancellationCheck(): void {
    try {
      this.checkCancellationDuringStream();
    } catch (error) {
      // Cancel the stream if cancellation detected
      if (error instanceof Error && error.message.includes("cancel")) {
        this.cancelStream(error.message);
      }
    }
  }

  /**
   * Get stream metrics for debugging and monitoring
   *
   * @returns Object containing stream processing metrics
   */
  getStreamMetrics(): {
    state: StreamState;
    bufferSize: number;
    streamDuration: number;
    lastActivity: number;
  } {
    return {
      state: this.streamState,
      bufferSize: this.buffer.length,
      streamDuration:
        this.streamStartTime > 0 ? Date.now() - this.streamStartTime : 0,
      lastActivity: this.lastActivity,
    };
  }

  /**
   * Start periodic cancellation checks
   */
  private startCancellationChecks(): void {
    if (this.cancellationCheckInterval) {
      return; // Already started
    }

    this.cancellationCheckInterval = this.runtimeAdapter.setInterval(
      this.handlePeriodicCancellationCheck.bind(this),
      this.checkIntervalMs,
    );
  }

  /**
   * Stop periodic cancellation checks
   */
  private stopCancellationChecks(): void {
    if (this.cancellationCheckInterval) {
      this.runtimeAdapter.clearInterval(this.cancellationCheckInterval);
      this.cancellationCheckInterval = undefined;
    }
  }

  /**
   * Perform stream-specific cleanup operations
   */
  private performStreamCleanup(): void {
    // Stop monitoring
    this.stopCancellationChecks();

    // Notify any waiting pause resolvers
    const resolvers = [...this.pauseResolvers];
    this.pauseResolvers = [];
    resolvers.forEach((resolve) => resolve());

    // Buffer is preserved for debugging - not cleared during cleanup
    // Call clearBuffer() explicitly if needed
  }

  /**
   * Dispose the stream cancellation handler
   *
   * Cleans up all resources and stops monitoring. Should be called
   * when the handler is no longer needed.
   */
  dispose(): void {
    this.stopCancellationChecks();
    this.pauseResolvers = [];
  }
}
