import type { StreamDelta } from "../../client/streamDelta";
import type { ToolCall } from "../tools/toolCall";
import type { ToolResult } from "../tools/toolResult";
import type { ContentPart } from "../messages/contentPart";
import type { StreamingState } from "./streamingState";
import type { StreamingResult } from "./streamingResult";

/**
 * Streaming State Machine for Tool Call Interruption Handling
 *
 * Manages the pause/resume cycle for streaming responses when tool calls are detected.
 * Orchestrates the transition from streaming → tool execution → resume next turn,
 * providing comprehensive state management and tool call detection capabilities.
 *
 * @example
 * ```typescript
 * const stateMachine = new StreamingStateMachine();
 *
 * // Process streaming response
 * const result = await stateMachine.handleStreamingResponse(
 *   streamFromProvider
 * );
 *
 * if (result.detectedToolCalls.length > 0) {
 *   // Execute tools
 *   await stateMachine.pauseForToolExecution(result.detectedToolCalls);
 *   const toolResults = await executeTools(result.detectedToolCalls);
 *   await stateMachine.resumeAfterToolExecution(toolResults);
 * }
 * ```
 */
export class StreamingStateMachine {
  private currentState: StreamingState = "idle";
  private streamBuffer: string = "";
  private detectedToolCalls: ToolCall[] = [];
  private executionMetrics = {
    streamingDuration: 0,
    chunksProcessed: 0,
    toolCallsDetected: 0,
    startTime: 0,
  };

  /**
   * Main orchestration method for processing streaming responses.
   * Handles stream processing, tool call detection, and state transitions.
   *
   * @param stream - AsyncIterable of StreamDelta chunks
   * @returns Promise resolving to streaming result with final state and detected tool calls
   */
  async handleStreamingResponse(
    stream: AsyncIterable<StreamDelta>,
  ): Promise<StreamingResult> {
    this.resetState();
    this.executionMetrics.startTime = Date.now();

    try {
      this.validateStateTransition(this.currentState, "streaming");
      this.currentState = "streaming";

      for await (const chunk of stream) {
        this.executionMetrics.chunksProcessed++;

        // Accumulate content from chunk
        this.accumulateStreamBuffer(chunk);

        // Check for tool calls in chunk
        const toolCalls = this.detectToolCallsInChunk(chunk);
        if (toolCalls.length > 0) {
          this.detectedToolCalls.push(...toolCalls);
          this.executionMetrics.toolCallsDetected += toolCalls.length;

          // Pause streaming when tool calls detected
          this.validateStateTransition(this.currentState, "paused");
          this.currentState = "paused";
          break;
        }

        // Check if stream is finished
        if (chunk.finished) {
          this.validateStateTransition(this.currentState, "idle");
          this.currentState = "idle";
          break;
        }
      }

      this.executionMetrics.streamingDuration =
        Date.now() - this.executionMetrics.startTime;

      return {
        state: this.currentState,
        content: this.streamBuffer,
        detectedToolCalls: [...this.detectedToolCalls],
        success: true,
        executionMetrics: {
          streamingDuration: this.executionMetrics.streamingDuration,
          chunksProcessed: this.executionMetrics.chunksProcessed,
          toolCallsDetected: this.executionMetrics.toolCallsDetected,
        },
      };
    } catch (error) {
      this.executionMetrics.streamingDuration =
        Date.now() - this.executionMetrics.startTime;

      // Reset to idle state on error
      this.currentState = "idle";

      return {
        state: this.currentState,
        content: this.streamBuffer,
        detectedToolCalls: [...this.detectedToolCalls],
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown streaming error",
        executionMetrics: {
          streamingDuration: this.executionMetrics.streamingDuration,
          chunksProcessed: this.executionMetrics.chunksProcessed,
          toolCallsDetected: this.executionMetrics.toolCallsDetected,
        },
      };
    }
  }

  /**
   * Pauses streaming for tool execution.
   * Transitions state machine to tool_execution phase.
   *
   * @param detectedToolCalls - Tool calls that triggered the pause
   */
  pauseForToolExecution(detectedToolCalls: ToolCall[]): void {
    this.validateStateTransition(this.currentState, "tool_execution");
    this.currentState = "tool_execution";

    // Store tool calls for coordination
    this.detectedToolCalls = [...detectedToolCalls];
  }

  /**
   * Resumes streaming after tool execution completion.
   * Transitions state machine to resuming phase.
   *
   * @param _toolResults - Results from executed tools
   */
  resumeAfterToolExecution(_toolResults: ToolResult[]): void {
    this.validateStateTransition(this.currentState, "resuming");
    this.currentState = "resuming";

    // Clear tool calls since they've been processed
    this.detectedToolCalls = [];
  }

  /**
   * Gets the current streaming state.
   *
   * @returns Current state of the streaming state machine
   */
  getCurrentState(): StreamingState {
    return this.currentState;
  }

  /**
   * Validates if a state transition is allowed.
   * Ensures state machine integrity and prevents invalid transitions.
   *
   * @param from - Current state
   * @param to - Target state
   * @returns True if transition is valid
   * @throws Error if transition is invalid
   */
  validateStateTransition(from: StreamingState, to: StreamingState): boolean {
    const validTransitions: Record<StreamingState, StreamingState[]> = {
      idle: ["streaming"],
      streaming: ["paused", "idle"],
      paused: ["tool_execution"],
      tool_execution: ["resuming"],
      resuming: ["streaming", "idle"],
    };

    const allowedStates = validTransitions[from];
    if (!allowedStates || !allowedStates.includes(to)) {
      throw new Error(
        `Invalid state transition from '${from}' to '${to}'. ` +
          `Allowed transitions from '${from}': [${allowedStates?.join(", ") || "none"}]`,
      );
    }

    return true;
  }

  /**
   * Detects tool calls within a streaming chunk.
   * Parses chunk content for tool call patterns.
   *
   * @param chunk - StreamDelta chunk to analyze
   * @returns Array of detected tool calls
   */
  private detectToolCallsInChunk(chunk: StreamDelta): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // Check if chunk contains tool use content
    if (chunk.delta.content) {
      for (const contentPart of chunk.delta.content) {
        // Tool calls would be detected here when tool_use content type is implemented
        // For now, this is a placeholder that follows the existing content structure
        if (this.isToolUseContent(contentPart)) {
          // Extract tool call from content part
          const toolCall = this.extractToolCallFromContent(contentPart);
          if (toolCall) {
            toolCalls.push(toolCall);
          }
        }
      }
    }

    return toolCalls;
  }

  /**
   * Accumulates streaming content into buffer.
   * Efficiently manages streaming content aggregation.
   *
   * @param chunk - StreamDelta chunk to process
   */
  private accumulateStreamBuffer(chunk: StreamDelta): void {
    if (chunk.delta.content) {
      for (const contentPart of chunk.delta.content) {
        if (contentPart.type === "text" && contentPart.text) {
          this.streamBuffer += contentPart.text;
        }
      }
    }
  }

  /**
   * Checks if content part contains tool use information.
   * Placeholder for future tool_use content type detection.
   *
   * @param _contentPart - Content part to check
   * @returns True if content contains tool use
   */
  private isToolUseContent(_contentPart: ContentPart): boolean {
    // This is a placeholder implementation
    // When tool_use content type is added to the schema, this will check:
    // return contentPart.type === "tool_use";

    // For now, return false since tool_use is not yet implemented
    return false;
  }

  /**
   * Extracts tool call from content part.
   * Placeholder for future tool call extraction logic.
   *
   * @param _contentPart - Content part containing tool call
   * @returns Extracted tool call or null
   */
  private extractToolCallFromContent(
    _contentPart: ContentPart,
  ): ToolCall | null {
    // This is a placeholder implementation
    // When tool_use content type is implemented, this will extract:
    // - Tool call ID
    // - Tool name
    // - Tool parameters
    // - Metadata

    // For now, return null since tool_use is not yet implemented
    return null;
  }

  /**
   * Resets state machine to initial state.
   * Clears buffers and metrics for new streaming session.
   */
  private resetState(): void {
    this.currentState = "idle";
    this.streamBuffer = "";
    this.detectedToolCalls = [];
    this.executionMetrics = {
      streamingDuration: 0,
      chunksProcessed: 0,
      toolCallsDetected: 0,
      startTime: 0,
    };
  }
}
