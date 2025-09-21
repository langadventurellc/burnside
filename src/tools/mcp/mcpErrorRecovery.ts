/**
 * MCP Error Recovery
 *
 * Implements error recovery strategies with exponential backoff and retry policies
 * for MCP connections. Provides connection health monitoring and graceful degradation
 * when servers become permanently unavailable.
 *
 * @example
 * ```typescript
 * const recovery = new McpErrorRecovery({
 *   maxRetries: 3,
 *   baseDelayMs: 1000
 * });
 *
 * const shouldRetry = recovery.shouldRetryConnection(error);
 * if (shouldRetry) {
 *   const delay = recovery.getNextRetryDelay();
 *   await new Promise(resolve => setTimeout(resolve, delay));
 * }
 * ```
 */

import { getErrorSeverity } from "./getErrorSeverity";
import { ERROR_SEVERITY } from "./mcpErrorCodes";

/**
 * Configuration options for error recovery
 */
interface McpErrorRecoveryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeMs?: number;
}

/**
 * Connection state for health monitoring
 */
interface ConnectionState {
  failureCount: number;
  lastFailureTime?: number;
  circuitBreakerOpen: boolean;
  circuitBreakerOpenTime?: number;
}

export class McpErrorRecovery {
  private readonly config: Required<McpErrorRecoveryConfig>;
  private readonly connectionStates = new Map<string, ConnectionState>();

  constructor(config: McpErrorRecoveryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      baseDelayMs: config.baseDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      jitterFactor: config.jitterFactor ?? 0.1,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerResetTimeMs: config.circuitBreakerResetTimeMs ?? 60000,
    };
  }

  /**
   * Determine if a connection error should be retried
   */
  shouldRetryConnection(error: unknown, serverUrl: string): boolean {
    const state = this.getConnectionState(serverUrl);

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(state)) {
      return false;
    }

    // Check retry limit
    if (state.failureCount >= this.config.maxRetries) {
      return false;
    }

    // Check error severity
    const errorCode = this.extractErrorCode(error);
    const severity = getErrorSeverity(errorCode);

    return (
      severity === ERROR_SEVERITY.RECOVERABLE ||
      severity === ERROR_SEVERITY.TEMPORARY
    );
  }

  /**
   * Get the next retry delay with exponential backoff and jitter
   */
  getNextRetryDelay(serverUrl: string): number {
    const state = this.getConnectionState(serverUrl);
    const attempt = state.failureCount;

    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);
    const clampedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter to prevent thundering herd
    const jitter = clampedDelay * this.config.jitterFactor * Math.random();

    return Math.floor(clampedDelay + jitter);
  }

  /**
   * Record a connection failure
   */
  recordFailure(serverUrl: string, _error: unknown): void {
    const state = this.getConnectionState(serverUrl);
    state.failureCount++;
    state.lastFailureTime = Date.now();

    // Open circuit breaker if threshold reached
    if (state.failureCount >= this.config.circuitBreakerThreshold) {
      state.circuitBreakerOpen = true;
      state.circuitBreakerOpenTime = Date.now();
    }

    this.connectionStates.set(serverUrl, state);
  }

  /**
   * Record a successful connection
   */
  recordSuccess(serverUrl: string): void {
    // Reset connection state on success
    this.connectionStates.set(serverUrl, {
      failureCount: 0,
      circuitBreakerOpen: false,
    });
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy(serverUrl: string): boolean {
    const state = this.getConnectionState(serverUrl);
    return (
      !this.isCircuitBreakerOpen(state) &&
      state.failureCount < this.config.maxRetries
    );
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(serverUrl: string): {
    healthy: boolean;
    failureCount: number;
    circuitBreakerOpen: boolean;
    lastFailureTime?: number;
  } {
    const state = this.getConnectionState(serverUrl);
    return {
      healthy: this.isConnectionHealthy(serverUrl),
      failureCount: state.failureCount,
      circuitBreakerOpen: state.circuitBreakerOpen,
      lastFailureTime: state.lastFailureTime,
    };
  }

  /**
   * Reset connection state (for manual recovery)
   */
  resetConnection(serverUrl: string): void {
    this.connectionStates.delete(serverUrl);
  }

  /**
   * Get all connection states for monitoring
   */
  getAllConnectionStates(): Record<
    string,
    {
      healthy: boolean;
      failureCount: number;
      circuitBreakerOpen: boolean;
      lastFailureTime?: number;
    }
  > {
    const states: Record<
      string,
      ReturnType<McpErrorRecovery["getConnectionHealth"]>
    > = {};

    for (const [serverUrl] of this.connectionStates) {
      states[serverUrl] = this.getConnectionHealth(serverUrl);
    }

    return states;
  }

  private getConnectionState(serverUrl: string): ConnectionState {
    return (
      this.connectionStates.get(serverUrl) || {
        failureCount: 0,
        circuitBreakerOpen: false,
      }
    );
  }

  private isCircuitBreakerOpen(state: ConnectionState): boolean {
    if (!state.circuitBreakerOpen) {
      return false;
    }

    // Check if circuit breaker should reset
    if (state.circuitBreakerOpenTime) {
      const timeSinceOpen = Date.now() - state.circuitBreakerOpenTime;
      if (timeSinceOpen >= this.config.circuitBreakerResetTimeMs) {
        state.circuitBreakerOpen = false;
        state.circuitBreakerOpenTime = undefined;
        return false;
      }
    }

    return true;
  }

  private extractErrorCode(error: unknown): string {
    if (typeof error === "object" && error !== null) {
      // Check for BridgeError with code property
      if ("code" in error && typeof error.code === "string") {
        return error.code;
      }

      // Check for Error with message containing error code
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("MCP_")) {
          const match = message.match(/MCP_[A-Z_]+/);
          if (match) {
            return match[0];
          }
        }
      }
    }

    return "UNKNOWN_ERROR";
  }
}
