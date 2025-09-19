/**
 * Retry Module - Exponential and Linear Backoff Strategies
 *
 * This module provides backoff timing algorithms for retry mechanisms with
 * configurable jitter to prevent thundering herd problems. Supports both
 * exponential and linear backoff strategies with maximum delay capping.
 *
 * ## Core Interfaces
 * - `BackoffConfig` - Configuration for backoff timing strategies
 * - `BackoffCalculator` - Interface for calculating retry delays
 *
 * ## Strategy Implementations
 * - `ExponentialBackoffStrategy` - Exponential growth with multiplier
 * - `LinearBackoffStrategy` - Linear growth with fixed increments
 *
 * ## Utility Functions
 * - `createBackoffStrategy` - Factory function for creating strategies
 * - `delayPromise` - Promise-based delay with AbortSignal support
 *
 * @example Exponential backoff with jitter
 * ```typescript
 * import { createBackoffStrategy } from '@/core/transport/retry';
 *
 * const strategy = createBackoffStrategy({
 *   strategy: "exponential",
 *   baseDelayMs: 1000,
 *   maxDelayMs: 30000,
 *   jitter: true,
 *   multiplier: 2
 * });
 *
 * const delay = strategy.calculateDelay(2); // ~4000ms ± 50% jitter
 * ```
 */

// Configuration and interfaces
export type { BackoffConfig } from "./backoffConfig";
export type { BackoffCalculator } from "./backoffCalculator";

// Strategy implementations
export { ExponentialBackoffStrategy } from "./exponentialBackoffStrategy";
export { LinearBackoffStrategy } from "./linearBackoffStrategy";

// Utility functions
export { createBackoffStrategy } from "./createBackoffStrategy";
export { delayPromise } from "./delayPromise";
