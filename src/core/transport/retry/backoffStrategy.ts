/**
 * @deprecated This file has been split into separate modules. Use the barrel export from ./index.ts instead.
 *
 * This module has been refactored to follow the one-export-per-file rule.
 * The functionality is now available through these separate modules:
 * - ./backoffConfig.ts - BackoffConfig interface
 * - ./backoffCalculator.ts - BackoffCalculator interface
 * - ./exponentialBackoffStrategy.ts - ExponentialBackoffStrategy class
 * - ./linearBackoffStrategy.ts - LinearBackoffStrategy class
 * - ./createBackoffStrategy.ts - createBackoffStrategy factory function
 * - ./delayPromise.ts - delayPromise utility function
 * - ./index.ts - Barrel export for all retry functionality
 */

// Re-export everything from the barrel export for backward compatibility
export * from "./index";
