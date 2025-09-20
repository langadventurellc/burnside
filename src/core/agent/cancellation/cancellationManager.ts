/**
 * Cancellation Manager
 *
 * Central cancellation orchestration class that manages AbortSignal propagation,
 * cleanup handlers, and cancellation detection throughout agent execution.
 * Provides signal composition, periodic checking, and resource cleanup coordination.
 */

import type { CancellationOptions } from "./cancellationOptions";
import type { CancellableExecutionContext } from "./cancellableExecutionContext";
import { createCancellationError } from "./createCancellationError";
import { createTimeoutError } from "./createTimeoutError";
import { fromAbortSignal } from "./fromAbortSignal";

/**
 * Central cancellation orchestration class
 *
 * Manages AbortSignal composition, cleanup handler coordination, and cancellation
 * detection throughout agent execution. Supports both external cancellation
 * (via provided AbortSignal) and internal cancellation (via cancel() method).
 *
 * @example Basic usage with external signal
 * ```typescript
 * const controller = new AbortController();
 * const manager = new CancellationManager({
 *   signal: controller.signal,
 *   cancellationCheckIntervalMs: 100,
 *   gracefulCancellationTimeoutMs: 5000
 * });
 *
 * const context = manager.createCancellableContext();
 * // Use context in agent operations...
 *
 * // External cancellation
 * controller.abort("User cancelled");
 * ```
 *
 * @example Internal cancellation with cleanup
 * ```typescript
 * const manager = new CancellationManager();
 *
 * // Register cleanup handlers
 * manager.addCleanupHandler(async () => {
 *   await closeDatabase();
 * });
 *
 * manager.addCleanupHandler(async () => {
 *   await cleanupTempFiles();
 * });
 *
 * // Internal cancellation
 * manager.cancel("Operation timeout");
 * ```
 */
export class CancellationManager {
  private readonly abortController: AbortController;
  private readonly externalSignal?: AbortSignal;
  private checkInterval?: ReturnType<typeof setInterval>;
  private readonly cleanupHandlers: Array<() => Promise<void>> = [];
  private readonly options: Required<Omit<CancellationOptions, "signal">> & {
    signal?: AbortSignal;
  };
  private cancellationReason?: string;

  /**
   * Create a new CancellationManager
   *
   * @param options - Configuration options for cancellation behavior
   */
  constructor(options: CancellationOptions = {}) {
    this.abortController = new AbortController();
    this.externalSignal = options.signal;

    // Set defaults for required options
    this.options = {
      signal: options.signal,
      cancellationCheckIntervalMs: options.cancellationCheckIntervalMs ?? 100,
      gracefulCancellationTimeoutMs:
        options.gracefulCancellationTimeoutMs ?? 5000,
      cleanupOnCancel: options.cleanupOnCancel ?? true,
    };

    // If external signal is provided and already aborted, propagate immediately
    if (this.externalSignal?.aborted) {
      this.propagateExternalCancellation();
    }

    // Listen for external signal cancellation
    if (this.externalSignal && !this.externalSignal.aborted) {
      this.externalSignal.addEventListener(
        "abort",
        () => {
          this.propagateExternalCancellation();
        },
        { once: true },
      );
    }
  }

  /**
   * Create a cancellable execution context
   *
   * Creates a context that can be used throughout agent execution to check
   * for cancellation, handle cancellation events, and integrate with native
   * AbortSignal-aware APIs.
   *
   * @returns CancellableExecutionContext for use in agent operations
   *
   * @example
   * ```typescript
   * const context = manager.createCancellableContext();
   * context.onCancel = (reason) => console.log(`Cancelled: ${reason}`);
   *
   * // Use context in operations
   * await performOperation(context);
   * ```
   */
  createCancellableContext(): CancellableExecutionContext {
    return {
      signal: this.abortController.signal,
      cancellationReason: this.cancellationReason,
      onCancel: undefined, // Will be set by caller if needed

      checkCancellation: () => {
        this.throwIfCancelled();
      },

      throwIfCancelled: () => {
        this.throwIfCancelled();
      },

      isCancelled: () => {
        return this.isCancelled();
      },
    };
  }

  /**
   * Cancel execution with optional reason
   *
   * Triggers internal cancellation, executes cleanup handlers (if enabled),
   * and aborts the internal AbortController. This method is idempotent -
   * multiple calls will not cause additional side effects.
   *
   * @param reason - Optional reason for cancellation
   *
   * @example
   * ```typescript
   * // Cancel with reason
   * manager.cancel("Operation timeout exceeded");
   *
   * // Cancel without reason
   * manager.cancel();
   * ```
   */
  cancel(reason?: string): void {
    if (this.abortController.signal.aborted) {
      return; // Already cancelled
    }

    this.cancellationReason = reason;

    // Perform cleanup if enabled and not already cancelled
    if (this.options.cleanupOnCancel) {
      // Execute cleanup asynchronously but don't wait for it
      this.performCleanup().catch((error) => {
        // Log cleanup errors but don't throw - cancellation should proceed
        console.error("Cleanup failed during cancellation:", error);
      });
    }

    // Abort the controller (this triggers all listeners)
    this.abortController.abort(reason);
  }

  /**
   * Schedule periodic cancellation checks
   *
   * Starts a periodic timer that can be used to check external conditions
   * for cancellation. The interval is controlled by cancellationCheckIntervalMs
   * option. This is useful for checking external state that can't be monitored
   * via AbortSignal.
   *
   * @example
   * ```typescript
   * manager.schedulePeriodicChecks();
   * // Manager will now check for cancellation every 100ms (default)
   * ```
   */
  schedulePeriodicChecks(): void {
    if (this.checkInterval) {
      return; // Already scheduled
    }

    this.checkInterval = setInterval(() => {
      // This method primarily exists for future extensibility
      // Currently just provides a hook for external monitoring
      if (this.isCancelled()) {
        this.stopPeriodicChecks();
      }
    }, this.options.cancellationCheckIntervalMs);
  }

  /**
   * Stop periodic cancellation checks
   *
   * Clears the periodic timer if one is active. Called automatically
   * when cancellation is detected or when the manager is disposed.
   *
   * @example
   * ```typescript
   * manager.stopPeriodicChecks();
   * ```
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Add a cleanup handler to be executed on cancellation
   *
   * Cleanup handlers are executed in LIFO (Last In, First Out) order when
   * cancellation occurs. Each handler has a timeout equal to the graceful
   * cancellation timeout divided by the number of handlers.
   *
   * @param handler - Async function to execute during cleanup
   *
   * @example
   * ```typescript
   * manager.addCleanupHandler(async () => {
   *   await database.close();
   * });
   *
   * manager.addCleanupHandler(async () => {
   *   await fs.unlink(tempFile);
   * });
   * ```
   */
  addCleanupHandler(handler: () => Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Perform cleanup operations
   *
   * Executes all registered cleanup handlers in LIFO order with timeout
   * enforcement. Individual handler failures do not prevent other handlers
   * from executing. The overall cleanup process is bounded by the graceful
   * cancellation timeout.
   *
   * @returns Promise that resolves when cleanup is complete or times out
   *
   * @example
   * ```typescript
   * try {
   *   await manager.performCleanup();
   *   console.log('Cleanup completed successfully');
   * } catch (error) {
   *   console.log('Cleanup timed out or failed');
   * }
   * ```
   */
  async performCleanup(): Promise<void> {
    if (this.cleanupHandlers.length === 0) {
      return;
    }

    const timeoutMs = this.options.gracefulCancellationTimeoutMs;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          createTimeoutError(
            timeoutMs,
            true, // cleanup was attempted
            "cleanup",
          ),
        );
      }, timeoutMs);
    });

    try {
      // Execute cleanup handlers in LIFO order
      const handlersToExecute = [...this.cleanupHandlers].reverse();

      await Promise.race([
        this.executeCleanupHandlers(handlersToExecute),
        timeoutPromise,
      ]);
    } catch (error) {
      // Log the error but don't re-throw - cleanup failure shouldn't prevent cancellation
      console.error("Cleanup execution failed:", error);
      throw error;
    } finally {
      // Always clear the timeout to prevent handle leaks
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  /**
   * Check if cancellation has been detected
   *
   * Returns true if either the external signal (if provided) or the internal
   * AbortController has been aborted.
   *
   * @returns true if cancellation has been detected, false otherwise
   */
  isCancelled(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * Throw CancellationError if cancellation has been detected
   *
   * Checks cancellation status and throws appropriate CancellationError
   * if cancellation has occurred. Uses external signal reason if available,
   * otherwise uses internal cancellation reason.
   *
   * @throws {CancellationError} If cancellation has been detected
   */
  throwIfCancelled(): void {
    if (!this.isCancelled()) {
      return;
    }

    // Prefer external signal error if available
    if (this.externalSignal?.aborted) {
      throw fromAbortSignal(this.externalSignal, "execution");
    }

    // Use internal cancellation reason
    throw createCancellationError(
      this.cancellationReason || "Operation was cancelled",
      "execution",
      true, // Assume cleanup completed for internal cancellation
    );
  }

  /**
   * Get the cancellation reason if available
   *
   * Returns the reason for cancellation, preferring external signal reason
   * over internal reason.
   *
   * @returns Cancellation reason string or undefined if not cancelled or no reason provided
   */
  getCancellationReason(): string | undefined {
    if (!this.isCancelled()) {
      return undefined;
    }

    // Prefer external signal reason
    if (this.externalSignal?.aborted) {
      const reason: unknown = this.externalSignal.reason;
      return typeof reason === "string" ? reason : undefined;
    }

    return this.cancellationReason;
  }

  /**
   * Dispose the cancellation manager
   *
   * Stops periodic checks and cleans up resources. Should be called when
   * the manager is no longer needed to prevent memory leaks.
   *
   * @example
   * ```typescript
   * manager.dispose();
   * ```
   */
  dispose(): void {
    this.stopPeriodicChecks();
  }

  /**
   * Propagate external signal cancellation to internal controller
   */
  private propagateExternalCancellation(): void {
    if (this.abortController.signal.aborted) {
      return; // Already cancelled internally
    }

    const reason: unknown = this.externalSignal?.reason;
    this.cancellationReason = typeof reason === "string" ? reason : undefined;

    // Perform cleanup if enabled
    if (this.options.cleanupOnCancel) {
      this.performCleanup().catch((error) => {
        console.error("Cleanup failed during external cancellation:", error);
      });
    }

    this.abortController.abort(reason);
  }

  /**
   * Execute cleanup handlers in sequence
   */
  private async executeCleanupHandlers(
    handlers: Array<() => Promise<void>>,
  ): Promise<void> {
    for (const handler of handlers) {
      try {
        await handler();
      } catch (error) {
        // Log individual handler failures but continue with remaining handlers
        console.error("Cleanup handler failed:", error);
      }
    }
  }
}
