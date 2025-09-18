/**
 * Iteration Manager for Timeout and Limit Enforcement
 *
 * Manages iteration tracking, timeout enforcement, and termination detection
 * for multi-turn conversations. Provides comprehensive limit enforcement with
 * precise timing, security validation, and execution metrics.
 */

import type { AgentExecutionOptions } from "./agentExecutionOptions";
import type { TerminationReason } from "./terminationReason";
import type { IterationResult } from "./iterationResult";
import type { TimeoutStatus } from "./timeoutStatus";
import type { ExecutionMetrics } from "./executionMetrics";

/**
 * Iteration Manager for multi-turn conversation timeout and limit enforcement
 *
 * Tracks iteration counts, enforces timeout limits at both iteration and overall
 * levels, and manages termination conditions with comprehensive metrics collection.
 * Designed for integration with AgentLoop's executeMultiTurn() method.
 *
 * @example Basic iteration management
 * ```typescript
 * const manager = new IterationManager({
 *   maxIterations: 5,
 *   timeoutMs: 60000,
 *   iterationTimeoutMs: 10000
 * }, Date.now());
 *
 * // Start first iteration
 * manager.startIteration();
 *
 * // Check if can continue during iteration
 * if (!manager.canContinue()) {
 *   console.log("Should terminate:", manager.determineTerminationReason());
 * }
 *
 * // Complete iteration
 * const result = manager.completeIteration();
 * console.log(`Iteration ${result.iterationNumber} took ${result.duration}ms`);
 * ```
 *
 * @example Timeout monitoring
 * ```typescript
 * const manager = new IterationManager({
 *   maxIterations: 10,
 *   timeoutMs: 30000,
 *   iterationTimeoutMs: 5000
 * }, Date.now());
 *
 * // Check timeout status
 * const timeoutStatus = manager.checkTimeouts();
 * if (timeoutStatus.hasTimeout) {
 *   if (timeoutStatus.overallTimeout) {
 *     console.log("Overall conversation timeout exceeded");
 *   }
 *   if (timeoutStatus.iterationTimeout) {
 *     console.log("Current iteration timeout exceeded");
 *   }
 * }
 * ```
 */
export class IterationManager {
  private readonly maxIterations: number;
  private readonly overallTimeoutMs: number | null;
  private readonly iterationTimeoutMs: number | null;
  private readonly conversationStartTime: number;

  private currentIteration: number = 0;
  private currentIterationStartTime: number | null = null;
  private isTerminated: boolean = false;
  private terminationReason?: TerminationReason;
  private iterationDurations: number[] = [];

  /**
   * Creates a new IterationManager instance
   *
   * @param options Agent execution options containing timeout and limit configuration
   * @param startTime Conversation start timestamp in milliseconds (Unix timestamp)
   * @throws {Error} If configuration values are invalid (negative timeouts, zero maxIterations)
   */
  constructor(options: AgentExecutionOptions, startTime: number) {
    // Validate inputs for security and correctness
    if (!Number.isInteger(startTime) || startTime <= 0) {
      throw new Error("Start time must be a positive integer timestamp");
    }

    // Extract and validate configuration with secure defaults
    this.maxIterations = this.validateMaxIterations(
      options.maxIterations ?? 10,
    );
    this.overallTimeoutMs = this.validateTimeout(options.timeoutMs);
    this.iterationTimeoutMs = this.validateTimeout(options.iterationTimeoutMs);
    this.conversationStartTime = startTime;

    // Validate timeout combinations
    if (
      this.overallTimeoutMs !== null &&
      this.iterationTimeoutMs !== null &&
      this.iterationTimeoutMs >= this.overallTimeoutMs
    ) {
      throw new Error(
        "Iteration timeout cannot be greater than or equal to overall timeout",
      );
    }
  }

  /**
   * Starts a new iteration
   *
   * Increments the iteration counter and records the start time for timeout tracking.
   * Should be called at the beginning of each conversation turn.
   *
   * @throws {Error} If called when conversation is already terminated or max iterations exceeded
   */
  startIteration(): void {
    if (this.isTerminated) {
      throw new Error(
        `Cannot start iteration: conversation already terminated due to ${this.terminationReason}`,
      );
    }

    if (this.currentIterationStartTime !== null) {
      throw new Error(
        `Cannot start iteration: iteration ${this.currentIteration} is already active`,
      );
    }

    const nextIteration = this.currentIteration + 1;
    if (nextIteration > this.maxIterations) {
      this.terminate("max_iterations");
      throw new Error(
        `Cannot start iteration ${nextIteration}: exceeds maximum of ${this.maxIterations}`,
      );
    }

    this.currentIteration = nextIteration;
    this.currentIterationStartTime = Date.now();
  }

  /**
   * Completes the current iteration
   *
   * Records the iteration completion time and calculates metrics.
   * Determines if the conversation can continue based on limits and timeouts.
   *
   * @returns {IterationResult} Result containing iteration metrics and continuation status
   * @throws {Error} If no iteration is currently active
   */
  completeIteration(): IterationResult {
    if (this.currentIterationStartTime === null) {
      throw new Error("No active iteration to complete");
    }

    const endTime = Date.now();
    const duration = endTime - this.currentIterationStartTime;
    this.iterationDurations.push(duration);
    this.currentIterationStartTime = null;

    // Check if we can continue after this iteration
    const canContinue = this.canContinue();
    const terminationReason = canContinue
      ? undefined
      : this.determineTerminationReason();

    if (!canContinue && !this.isTerminated) {
      this.terminate(terminationReason!);
    }

    return {
      iterationNumber: this.currentIteration,
      duration,
      canContinue,
      terminationReason,
    };
  }

  /**
   * Gets the current iteration number
   *
   * @returns {number} Current iteration number (1-based), 0 if no iteration started
   */
  getCurrentIteration(): number {
    return this.currentIteration;
  }

  /**
   * Checks if the conversation can continue
   *
   * Evaluates all continuation criteria including iteration limits and timeouts.
   * This is the primary method for determining conversation flow control.
   *
   * @returns {boolean} True if conversation can continue, false if should terminate
   */
  canContinue(): boolean {
    if (this.isTerminated) {
      return false;
    }

    // Check iteration limit
    if (!this.enforceIterationLimit()) {
      return false;
    }

    // Check timeouts
    const timeoutStatus = this.checkTimeouts();
    if (timeoutStatus.hasTimeout) {
      return false;
    }

    return true;
  }

  /**
   * Checks timeout status for both overall and iteration levels
   *
   * Provides detailed timeout information for debugging and monitoring.
   * Used internally by canContinue() and externally for timeout awareness.
   *
   * @returns {TimeoutStatus} Comprehensive timeout status information
   */
  checkTimeouts(): TimeoutStatus {
    const now = Date.now();
    let hasTimeout = false;
    let overallTimeout = false;
    let iterationTimeout = false;
    let remainingOverallMs: number | null = null;
    let remainingIterationMs: number | null = null;

    // Check overall timeout
    if (this.overallTimeoutMs !== null) {
      const elapsed = now - this.conversationStartTime;
      remainingOverallMs = this.overallTimeoutMs - elapsed;
      if (remainingOverallMs <= 0) {
        hasTimeout = true;
        overallTimeout = true;
        remainingOverallMs = 0;
      }
    }

    // Check iteration timeout
    if (
      this.iterationTimeoutMs !== null &&
      this.currentIterationStartTime !== null
    ) {
      const elapsed = now - this.currentIterationStartTime;
      remainingIterationMs = this.iterationTimeoutMs - elapsed;
      if (remainingIterationMs <= 0) {
        hasTimeout = true;
        iterationTimeout = true;
        remainingIterationMs = 0;
      }
    }

    return {
      hasTimeout,
      overallTimeout,
      iterationTimeout,
      remainingOverallMs,
      remainingIterationMs,
    };
  }

  /**
   * Enforces iteration limit checking
   *
   * Checks if the current iteration count is within the configured maximum.
   * Part of the comprehensive limit enforcement system.
   *
   * @returns {boolean} True if within limits, false if limit exceeded
   */
  enforceIterationLimit(): boolean {
    return this.currentIteration < this.maxIterations;
  }

  /**
   * Determines the termination reason based on current state
   *
   * Analyzes the current state to determine why the conversation should terminate.
   * Used for debugging, logging, and providing clear termination context.
   *
   * @returns {TerminationReason} The reason the conversation should/did terminate
   */
  determineTerminationReason(): TerminationReason {
    if (this.isTerminated && this.terminationReason) {
      return this.terminationReason;
    }

    // Check timeout conditions
    const timeoutStatus = this.checkTimeouts();
    if (timeoutStatus.hasTimeout) {
      return "timeout";
    }

    // Check iteration limit
    if (this.currentIteration >= this.maxIterations) {
      return "max_iterations";
    }

    // Default to natural completion if no other reason
    return "natural_completion";
  }

  /**
   * Gets comprehensive execution metrics
   *
   * Provides detailed performance and execution statistics for monitoring,
   * debugging, and optimization. Includes timing statistics and termination context.
   *
   * @returns {ExecutionMetrics} Complete execution metrics and statistics
   */
  getExecutionMetrics(): ExecutionMetrics {
    const now = Date.now();
    const totalExecutionTimeMs = now - this.conversationStartTime;
    const totalIterations = this.iterationDurations.length;

    let averageIterationTimeMs = 0;
    let minIterationTimeMs = 0;
    let maxIterationTimeMs = 0;

    if (totalIterations > 0) {
      const sum = this.iterationDurations.reduce(
        (acc, duration) => acc + duration,
        0,
      );
      averageIterationTimeMs = sum / totalIterations;
      minIterationTimeMs = Math.min(...this.iterationDurations);
      maxIterationTimeMs = Math.max(...this.iterationDurations);
    }

    return {
      totalExecutionTimeMs,
      totalIterations,
      averageIterationTimeMs,
      minIterationTimeMs,
      maxIterationTimeMs,
      currentIteration: this.currentIteration,
      isTerminated: this.isTerminated,
      terminationReason: this.terminationReason,
    };
  }

  /**
   * Internal method to terminate the conversation
   *
   * Sets termination state and reason. Used internally when limits are exceeded.
   *
   * @param reason The reason for termination
   */
  private terminate(reason: TerminationReason): void {
    this.isTerminated = true;
    this.terminationReason = reason;
  }

  /**
   * Validates max iterations configuration
   *
   * @param maxIterations The max iterations value to validate
   * @returns {number} Validated max iterations value
   * @throws {Error} If value is invalid
   */
  private validateMaxIterations(maxIterations: number): number {
    if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
      throw new Error("maxIterations must be a positive integer");
    }
    if (maxIterations > 1000) {
      throw new Error(
        "maxIterations cannot exceed 1000 for resource protection",
      );
    }
    return maxIterations;
  }

  /**
   * Validates timeout configuration values
   *
   * @param timeoutMs The timeout value to validate
   * @returns {number | null} Validated timeout value or null if undefined
   * @throws {Error} If value is invalid
   */
  private validateTimeout(timeoutMs: number | undefined): number | null {
    if (timeoutMs === undefined) {
      return null;
    }
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error("Timeout values must be positive integers");
    }
    if (timeoutMs > 24 * 60 * 60 * 1000) {
      // 24 hours max
      throw new Error(
        "Timeout values cannot exceed 24 hours for resource protection",
      );
    }
    return timeoutMs;
  }
}
