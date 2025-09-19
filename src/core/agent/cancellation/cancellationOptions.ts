/**
 * Cancellation Options Interface
 *
 * Configuration options for cancellation behavior in the CancellationManager.
 * Provides control over signal composition, check intervals, timeout handling,
 * and cleanup operations.
 */

/**
 * Configuration options for cancellation behavior
 *
 * Controls how the CancellationManager handles external signals, periodic checks,
 * timeout enforcement, and resource cleanup during cancellation operations.
 *
 * @example Basic external signal cancellation
 * ```typescript
 * const controller = new AbortController();
 * const options: CancellationOptions = {
 *   signal: controller.signal,
 *   cancellationCheckIntervalMs: 100,
 *   gracefulCancellationTimeoutMs: 5000,
 *   cleanupOnCancel: true
 * };
 *
 * const manager = new CancellationManager(options);
 * // Later: controller.abort("User cancelled");
 * ```
 *
 * @example Performance-optimized configuration
 * ```typescript
 * const options: CancellationOptions = {
 *   cancellationCheckIntervalMs: 50,  // More responsive
 *   gracefulCancellationTimeoutMs: 3000,  // Faster timeout
 *   cleanupOnCancel: false  // Skip cleanup for speed
 * };
 * ```
 */
export interface CancellationOptions {
  /**
   * External AbortSignal to compose with internal cancellation (optional)
   *
   * When provided, the CancellationManager will create a composed signal that
   * responds to both external cancellation (via this signal) and internal
   * cancellation (via the manager's internal AbortController).
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const options: CancellationOptions = {
   *   signal: controller.signal
   * };
   * // External cancellation: controller.abort("User cancelled");
   * ```
   */
  signal?: AbortSignal;

  /**
   * Interval in milliseconds for periodic cancellation checks (default: 100)
   *
   * Controls how frequently the manager checks for cancellation during
   * execution. Lower values provide more responsive cancellation but may
   * impact performance slightly.
   *
   * @example
   * ```typescript
   * const options: CancellationOptions = {
   *   cancellationCheckIntervalMs: 50  // Check every 50ms
   * };
   * ```
   */
  cancellationCheckIntervalMs?: number;

  /**
   * Timeout in milliseconds for graceful cancellation before forced termination (default: 5000)
   *
   * When cancellation is requested, cleanup handlers will be executed within
   * this timeout. If the timeout is exceeded, cleanup will be abandoned and
   * cancellation will proceed immediately.
   *
   * @example
   * ```typescript
   * const options: CancellationOptions = {
   *   gracefulCancellationTimeoutMs: 3000  // Allow 3 seconds for cleanup
   * };
   * ```
   */
  gracefulCancellationTimeoutMs?: number;

  /**
   * Whether to perform automatic cleanup when cancellation occurs (default: true)
   *
   * Controls whether registered cleanup handlers are executed during cancellation.
   * Disabling cleanup may improve cancellation speed but could lead to resource
   * leaks if cleanup is not handled manually.
   *
   * @example
   * ```typescript
   * const options: CancellationOptions = {
   *   cleanupOnCancel: false  // Skip automatic cleanup
   * };
   * ```
   */
  cleanupOnCancel?: boolean;
}
