/**
 * Cancellable Execution Context Interface
 *
 * Execution context that provides cancellation awareness for agent operations.
 * Integrates AbortSignal with cancellation detection methods and callbacks
 * to enable responsive interruption of long-running operations.
 */

/**
 * Execution context with cancellation capabilities
 *
 * Provides a standardized interface for agent operations to check for
 * cancellation, handle cancellation events, and access cancellation
 * state throughout execution.
 *
 * @example Basic cancellation checking in agent operations
 * ```typescript
 * async function performOperation(context: CancellableExecutionContext) {
 *   // Check if cancelled before starting
 *   context.checkCancellation();
 *
 *   // Perform some work...
 *   await doSomeWork();
 *
 *   // Check again during long operation
 *   if (context.isCancelled()) {
 *     console.log(`Cancelled: ${context.cancellationReason}`);
 *     return;
 *   }
 *
 *   // Use signal for native AbortSignal integration
 *   await fetch("/api/data", { signal: context.signal });
 * }
 * ```
 *
 * @example With cancellation callback
 * ```typescript
 * const context = manager.createCancellableContext();
 * context.onCancel = (reason) => {
 *   console.log(`Operation cancelled: ${reason}`);
 *   // Perform immediate cleanup
 * };
 * ```
 */
export interface CancellableExecutionContext {
  /**
   * AbortSignal for native cancellation integration
   *
   * Can be passed to native APIs (fetch, setTimeout, etc.) that support
   * AbortSignal for automatic cancellation handling.
   *
   * @example
   * ```typescript
   * // Pass to fetch for automatic request cancellation
   * const response = await fetch("/api/data", { signal: context.signal });
   *
   * // Pass to custom async operations
   * await performAsyncOperation({ signal: context.signal });
   * ```
   */
  readonly signal: AbortSignal;

  /**
   * Optional callback invoked when cancellation is detected (optional)
   *
   * Called immediately when cancellation occurs, allowing for immediate
   * response to cancellation events. The callback receives the cancellation
   * reason if available.
   *
   * @param reason - Optional reason for cancellation
   *
   * @example
   * ```typescript
   * context.onCancel = (reason) => {
   *   console.log(`Cancelled: ${reason || "Unknown reason"}`);
   *   // Perform immediate cleanup or state updates
   * };
   * ```
   */
  onCancel?: (reason?: string) => void;

  /**
   * Reason for cancellation if cancelled (optional, readonly)
   *
   * Contains the reason string provided when cancellation was triggered,
   * either from external AbortSignal or internal cancellation calls.
   */
  readonly cancellationReason?: string;

  /**
   * Check for cancellation and throw if cancelled
   *
   * Convenience method that checks cancellation status and throws a
   * CancellationError if cancellation has been detected. Use this at
   * strategic points in long-running operations.
   *
   * @throws {CancellationError} If cancellation has been detected
   *
   * @example
   * ```typescript
   * async function longOperation(context: CancellableExecutionContext) {
   *   for (let i = 0; i < 1000; i++) {
   *     // Check every 100 iterations
   *     if (i % 100 === 0) {
   *       context.checkCancellation();
   *     }
   *     await processItem(i);
   *   }
   * }
   * ```
   */
  checkCancellation(): void;

  /**
   * Throw CancellationError if cancellation has been detected
   *
   * More explicit version of checkCancellation() that clearly indicates
   * the method will throw on cancellation. Useful for code clarity.
   *
   * @throws {CancellationError} If cancellation has been detected
   *
   * @example
   * ```typescript
   * // Clear intent that this will throw on cancellation
   * context.throwIfCancelled();
   * await criticalOperation();
   * ```
   */
  throwIfCancelled(): void;

  /**
   * Check if cancellation has been detected
   *
   * Non-throwing method to check cancellation status. Returns true if
   * cancellation has been requested, false otherwise. Use this when you
   * need to handle cancellation gracefully without exceptions.
   *
   * @returns true if cancellation has been detected, false otherwise
   *
   * @example
   * ```typescript
   * if (context.isCancelled()) {
   *   console.log("Operation cancelled, cleaning up...");
   *   await performCleanup();
   *   return null;
   * }
   * ```
   */
  isCancelled(): boolean;
}
