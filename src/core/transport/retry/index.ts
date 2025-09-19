/**
 * Retry Module - Backoff Strategies and Retry Policy Management
 *
 * This module provides comprehensive retry functionality including backoff timing
 * algorithms and retry policy management with configurable decision logic.
 * Supports exponential and linear backoff strategies with intelligent retry decisions.
 *
 * ## Backoff Interfaces
 * - `BackoffConfig` - Configuration for backoff timing strategies
 * - `BackoffCalculator` - Interface for calculating retry delays
 *
 * ## Retry Policy Interfaces
 * - `RetryConfig` - Configuration for retry behavior and policies
 * - `RetryContext` - Context information for retry decision making
 * - `RetryDecision` - Decision outcome for retry attempts
 *
 * ## Strategy Implementations
 * - `ExponentialBackoffStrategy` - Exponential growth with multiplier
 * - `LinearBackoffStrategy` - Linear growth with fixed increments
 * - `RetryPolicy` - Comprehensive retry decision manager
 *
 * ## Utility Functions
 * - `createBackoffStrategy` - Factory function for creating backoff strategies
 * - `delayPromise` - Promise-based delay with AbortSignal support
 *
 * @example Retry policy with exponential backoff
 * ```typescript
 * import { RetryPolicy } from '@/core/transport/retry';
 *
 * const policy = new RetryPolicy({
 *   attempts: 3,
 *   backoff: "exponential",
 *   baseDelayMs: 1000,
 *   maxDelayMs: 30000,
 *   jitter: true,
 *   retryableStatusCodes: [429, 500, 502, 503, 504]
 * });
 *
 * const decision = policy.shouldRetry({
 *   attempt: 0,
 *   lastError: new Error("HTTP 503"),
 *   lastResponse: { status: 503, statusText: "Service Unavailable", headers: {}, body: null }
 * });
 * ```
 */

// Backoff configuration and interfaces
export type { BackoffConfig } from "./backoffConfig";
export type { BackoffCalculator } from "./backoffCalculator";

// Retry policy interfaces
export type { RetryConfig } from "./retryConfig";
export type { RetryContext } from "./retryContext";
export type { RetryDecision } from "./retryDecision";

// Strategy implementations
export { ExponentialBackoffStrategy } from "./exponentialBackoffStrategy";
export { LinearBackoffStrategy } from "./linearBackoffStrategy";

// Retry policy implementation
export { RetryPolicy } from "./retryPolicy";

// Utility functions
export { createBackoffStrategy } from "./createBackoffStrategy";
export { delayPromise } from "./delayPromise";
