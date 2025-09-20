/**
 * Enhanced HTTP Transport with Rate Limiting and Retry Support
 *
 * A self-managing, fire-and-forget HTTP transport that wraps existing HttpTransport
 * with production-ready rate limiting and retry capabilities. No manual lifecycle
 * management is required - the transport automatically manages all internal resources
 * without timers or cleanup requirements.
 *
 * **Key Features:**
 * - Fire-and-forget design - no cleanup required
 * - Timer-free implementation prevents memory leaks
 * - Self-managing rate limiting with periodic cleanup
 * - Automatic retry logic with exponential backoff
 * - Full backward compatibility with Transport interface
 *
 * @example Basic usage with rate limiting and retries
 * ```typescript
 * const baseTransport = new HttpTransport(config, interceptors, errorNormalizer);
 * const enhancedTransport = new EnhancedHttpTransport({
 *   baseTransport,
 *   rateLimitConfig: { maxRps: 10, enabled: true, scope: "provider:model" },
 *   retryConfig: { attempts: 2, backoff: "exponential" }
 * });
 *
 * const response = await enhancedTransport.fetch(request);
 * // No cleanup needed - transport manages itself
 * ```
 *
 * @example Streaming with rate limiting
 * ```typescript
 * const stream = await enhancedTransport.stream(request);
 * for await (const chunk of stream) {
 *   console.log(new TextDecoder().decode(chunk));
 * }
 * // Transport automatically cleans up internal resources
 * ```
 *
 * @example Multiple instances work independently
 * ```typescript
 * // Create multiple instances without interference
 * const transport1 = new EnhancedHttpTransport({ baseTransport, rateLimitConfig: { ... } });
 * const transport2 = new EnhancedHttpTransport({ baseTransport, retryConfig: { ... } });
 *
 * // Use concurrently - no coordination needed
 * await Promise.all([
 *   transport1.fetch(request1),
 *   transport2.fetch(request2)
 * ]);
 * // All instances self-manage - no cleanup required
 * ```
 */

import type { Transport } from "./transport";
import type { ProviderHttpRequest } from "./providerHttpRequest";
import type { ProviderHttpResponse } from "./providerHttpResponse";
import type { StreamResponse } from "./streamResponse";
import type { RateLimitConfig } from "./rateLimiting/rateLimitConfig";
import type { RateLimitContext } from "./rateLimiting/rateLimitContext";
import type { RateLimitStatus } from "./rateLimiting/rateLimitStatus";
import type { RetryConfig } from "./retry/retryConfig";
import type { RetryContext } from "./retry/retryContext";
import type { RetryStats } from "./retryStats";
import { RateLimiter } from "./rateLimiting/rateLimiter";
import { RetryPolicy } from "./retry/retryPolicy";
import { delayPromise } from "./retry/delayPromise";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import { extractRateLimitContext } from "./contextExtractor";
import { TransportError } from "../errors/transportError";

/**
 * Configuration for enhanced transport with rate limiting and retry support.
 */
interface EnhancedTransportConfig {
  /** Base HTTP transport to wrap with enhanced functionality */
  baseTransport: Transport;

  /** Optional rate limiting configuration */
  rateLimitConfig?: RateLimitConfig;

  /** Optional retry configuration */
  retryConfig?: RetryConfig;

  /** Runtime adapter for timer operations (required for rate limiting and retry delays) */
  runtimeAdapter?: RuntimeAdapter;
}

/**
 * Enhanced HTTP Transport with rate limiting and retry capabilities.
 *
 * A self-managing transport that wraps existing HttpTransport with production-ready
 * reliability features including timer-free rate limiting and exponential backoff
 * retries. Designed as a fire-and-forget service with no manual lifecycle management
 * required - all internal resources are automatically managed without timers or
 * cleanup requirements.
 *
 * **Lifecycle Management:**
 * - No destroy() method needed or provided
 * - No manual cleanup required
 * - Multiple instances work independently
 * - Safe to create and discard at will
 * - Timer-free design prevents memory leaks
 */
export class EnhancedHttpTransport implements Transport {
  private readonly baseTransport: Transport;
  private readonly runtimeAdapter?: RuntimeAdapter;
  private rateLimiter?: RateLimiter;
  private retryPolicy?: RetryPolicy;
  private retryStats: RetryStats;

  /**
   * Creates a new EnhancedHttpTransport instance.
   *
   * @param config - Configuration with base transport and optional policies
   */
  constructor(config: EnhancedTransportConfig) {
    this.baseTransport = config.baseTransport;
    this.runtimeAdapter = config.runtimeAdapter;

    // Initialize rate limiter if configuration provided
    if (config.rateLimitConfig) {
      this.rateLimiter = new RateLimiter(config.rateLimitConfig);
    }

    // Initialize retry policy if configuration provided
    if (config.retryConfig) {
      this.retryPolicy = new RetryPolicy(config.retryConfig);
    }

    // Initialize retry statistics
    this.retryStats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageDelayMs: 0,
      maxDelayMs: 0,
    };
  }

  /**
   * Performs a standard HTTP request with rate limiting and retry support.
   *
   * @param request - HTTP request configuration
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise resolving to HTTP response
   * @throws TransportError for network or HTTP-level failures
   */
  async fetch(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<ProviderHttpResponse> {
    // Check rate limits before proceeding
    await this.checkRateLimits(request);

    // Execute request with retry logic
    return this.executeWithRetries(
      () => this.baseTransport.fetch(request, signal),
      request,
      signal,
    );
  }

  /**
   * Performs a streaming HTTP request with rate limiting and retry support.
   *
   * @param request - HTTP request configuration
   * @param signal - Optional AbortSignal for stream cancellation
   * @returns Promise resolving to StreamResponse with HTTP metadata and stream
   * @throws TransportError for network or HTTP-level failures
   */
  async stream(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<StreamResponse> {
    // Check rate limits before proceeding
    await this.checkRateLimits(request);

    // Execute streaming request with retry logic
    return this.executeWithRetries(
      () => this.baseTransport.stream(request, signal),
      request,
      signal,
    );
  }

  /**
   * Updates rate limiting configuration for subsequent requests.
   *
   * @param config - Partial rate limiting configuration to update
   */
  updateRateLimitConfig(config: Partial<RateLimitConfig>): void {
    if (this.rateLimiter) {
      this.rateLimiter.updateConfig(config);
    } else if (config.enabled) {
      // Create new rate limiter if enabling for the first time
      this.rateLimiter = new RateLimiter({
        enabled: true,
        maxRps: 10,
        scope: "provider:model",
        ...config,
      });
    }
  }

  /**
   * Updates retry configuration for subsequent requests.
   *
   * @param config - Partial retry configuration to update
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    if (this.retryPolicy) {
      this.retryPolicy.updateConfig(config);
    } else {
      // Create new retry policy
      this.retryPolicy = new RetryPolicy({
        attempts: 2,
        backoff: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
        retryableStatusCodes: [429, 500, 502, 503, 504],
        ...config,
      });
    }
  }

  /**
   * Gets current rate limit status for a given context.
   *
   * @param context - Rate limiting context to check
   * @returns Rate limit status information
   */
  getRateLimitStatus(context: RateLimitContext): RateLimitStatus {
    if (!this.rateLimiter) {
      return {
        scopeKey: "disabled",
        availableTokens: Infinity,
        isEnabled: false,
      };
    }

    return this.rateLimiter.getStatus(context);
  }

  /**
   * Gets current retry statistics.
   *
   * @returns Retry operation statistics
   */
  getRetryStats(): RetryStats {
    return { ...this.retryStats };
  }

  /**
   * Checks rate limits for a request and waits if necessary.
   */
  private async checkRateLimits(request: ProviderHttpRequest): Promise<void> {
    if (!this.rateLimiter) {
      return;
    }

    const context = extractRateLimitContext(request);

    if (!this.rateLimiter.checkLimit(context)) {
      // Rate limit exceeded, wait for a short period before retrying
      const waitMs = 1000; // 1 second default wait time
      if (!this.runtimeAdapter) {
        throw new Error("RuntimeAdapter is required for rate limiting delays");
      }
      await delayPromise(waitMs, this.runtimeAdapter);
    }
  }

  /**
   * Executes a request with retry logic.
   */
  private async executeWithRetries<T>(
    operation: () => Promise<T>,
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!this.retryPolicy) {
      // No retry policy configured, execute directly
      return operation();
    }

    let lastError: Error | undefined;
    let lastResponse: ProviderHttpResponse | undefined;
    const delays: number[] = [];

    // Use a reasonable upper bound for attempts (the policy will stop us when appropriate)
    for (let attempt = 0; attempt < 11; attempt++) {
      try {
        this.checkAbortSignal(signal);
        const result = await operation();

        // Success - update statistics if this was a retry
        if (attempt > 0) {
          this.updateRetryStats(true, delays);
        }

        return result;
      } catch (error: unknown) {
        const processedError = this.processRetryError(error, attempt, delays);
        lastError = processedError.error;
        lastResponse = processedError.response;

        if (
          !this.shouldContinueRetrying(lastError, lastResponse, attempt, signal)
        ) {
          if (attempt > 0) {
            this.updateRetryStats(false, delays);
          }
          throw lastError;
        }

        await this.executeRetryDelay(
          lastError,
          lastResponse,
          attempt,
          delays,
          signal,
        );
      }
    }

    // Exhausted all retries
    this.updateRetryStats(false, delays);
    throw lastError || new TransportError("Unknown error during retries");
  }

  /**
   * Checks if the abort signal has been triggered.
   */
  private checkAbortSignal(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new TransportError("Request was aborted", {
        provider: "enhanced-transport",
        aborted: true,
      });
    }
  }

  /**
   * Processes an error for retry logic.
   */
  private processRetryError(
    error: unknown,
    _attempt: number,
    _delays: number[],
  ): {
    error: Error;
    response?: ProviderHttpResponse;
  } {
    const normalizedError = this.normalizeError(error);
    const response = this.extractResponseFromError(error);

    this.retryStats.totalAttempts++;

    return { error: normalizedError, response };
  }

  /**
   * Determines if retrying should continue.
   */
  private shouldContinueRetrying(
    error: Error,
    response: ProviderHttpResponse | undefined,
    attempt: number,
    signal?: AbortSignal,
  ): boolean {
    if (!this.retryPolicy) {
      return false;
    }

    const retryContext: RetryContext = {
      attempt,
      lastError: error,
      lastResponse: response,
      abortSignal: signal,
    };

    return this.retryPolicy.shouldRetry(retryContext).shouldRetry;
  }

  /**
   * Executes retry delay if needed.
   */
  private async executeRetryDelay(
    error: Error,
    response: ProviderHttpResponse | undefined,
    attempt: number,
    delays: number[],
    signal?: AbortSignal,
  ): Promise<void> {
    if (!this.retryPolicy) {
      return;
    }

    const retryContext: RetryContext = {
      attempt,
      lastError: error,
      lastResponse: response,
      abortSignal: signal,
    };

    const decision = this.retryPolicy.shouldRetry(retryContext);

    if (decision.delayMs > 0) {
      delays.push(decision.delayMs);
      if (!this.runtimeAdapter) {
        throw new Error("RuntimeAdapter is required for retry delays");
      }
      await delayPromise(decision.delayMs, this.runtimeAdapter, signal);
    }
  }

  /**
   * Normalizes an unknown error to an Error instance.
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    return new Error("Unknown error occurred");
  }

  /**
   * Extracts response information from an error.
   */
  private extractResponseFromError(
    error: unknown,
  ): ProviderHttpResponse | undefined {
    if (error instanceof TransportError) {
      const transportError = error as TransportError & {
        status?: number;
        statusText?: string;
      };

      if (typeof transportError.status === "number") {
        return {
          status: transportError.status,
          statusText:
            typeof transportError.statusText === "string"
              ? transportError.statusText
              : "",
          headers: {},
          body: null,
        };
      }
    }

    return undefined;
  }

  /**
   * Updates retry statistics with the outcome of a retry sequence.
   */
  private updateRetryStats(success: boolean, delays: number[]): void {
    if (success) {
      this.retryStats.successfulRetries++;
    } else {
      this.retryStats.failedRetries++;
    }

    // Update delay statistics
    if (delays.length > 0) {
      const totalDelay = delays.reduce((sum, delay) => sum + delay, 0);
      const maxDelay = Math.max(...delays);

      // Update running averages
      const totalDelayHistory =
        this.retryStats.averageDelayMs *
        (this.retryStats.successfulRetries + this.retryStats.failedRetries - 1);
      const newTotalDelays =
        this.retryStats.successfulRetries + this.retryStats.failedRetries;

      this.retryStats.averageDelayMs =
        (totalDelayHistory + totalDelay) / newTotalDelays;
      this.retryStats.maxDelayMs = Math.max(
        this.retryStats.maxDelayMs,
        maxDelay,
      );
    }
  }
}
