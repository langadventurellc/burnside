/**
 * Cancellation Infrastructure Module
 *
 * Specialized error types for cancellation scenarios providing clear error
 * reporting and debugging context when agent execution is cancelled externally.
 *
 * @example Basic cancellation error handling
 * ```typescript
 * import {
 *   CancellationError,
 *   GracefulCancellationTimeoutError,
 *   isCancellationError,
 *   createCancellationError
 * } from '@llm-bridge/core/agent/cancellation';
 *
 * try {
 *   const result = await agentLoop.executeWithCancellation(options);
 * } catch (error) {
 *   if (isCancellationError(error)) {
 *     console.log(`Cancelled during ${error.phase} phase`);
 *     console.log(`Cleanup completed: ${error.cleanupCompleted}`);
 *   }
 * }
 * ```
 */

// Types
export type { CancellationPhase } from "./cancellationPhase";

// Classes
export { CancellationError } from "./cancellationError";
export { GracefulCancellationTimeoutError } from "./gracefulCancellationTimeoutError";

// Factory Methods
export { createCancellationError } from "./createCancellationError";
export { createTimeoutError } from "./createTimeoutError";
export { fromAbortSignal } from "./fromAbortSignal";

// Type Guards
export { isCancellationError } from "./isCancellationError";
export { isGracefulTimeoutError } from "./isGracefulTimeoutError";
