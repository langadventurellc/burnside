/* eslint-disable statement-count/function-statement-count-warn */
/**
 * HTTP Transport Implementation
 *
 * Main implementation of the Transport interface that orchestrates all
 * foundational transport components into a concrete HTTP client. Provides
 * streaming support, error normalization, interceptor chains, and platform-agnostic
 * operation via injected fetch function.
 *
 * @example Basic HTTP request
 * ```typescript
 * const transport = new HttpTransport(
 *   config,
 *   interceptorChain,
 *   errorNormalizer
 * );
 *
 * const response = await transport.fetch({
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-..." },
 *   body: JSON.stringify({ model: "gpt-4", messages: [...] })
 * });
 * ```
 *
 * @example Streaming request
 * ```typescript
 * const stream = await transport.stream({
 *   url: "https://api.openai.com/v1/responses",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-..." },
 *   body: JSON.stringify({ model: "gpt-4", stream: true, messages: [...] })
 * });
 *
 * for await (const chunk of stream) {
 *   console.log(new TextDecoder().decode(chunk));
 * }
 * ```
 */
import type { Transport } from "./transport";
import type { ProviderHttpRequest } from "./providerHttpRequest";
import type { ProviderHttpResponse } from "./providerHttpResponse";
import type { InterceptorContext } from "./interceptorContext";
import type { StreamResponse } from "./streamResponse";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import { InterceptorChain } from "./interceptorChain";
import { TransportError } from "../errors/transportError";
import { logger } from "../logging/simpleLogger";

/**
 * HTTP Transport implementation with streaming support.
 *
 * Orchestrates all transport components into a cohesive HTTP client that
 * supports both standard and streaming requests with proper error handling,
 * interceptor chains, and platform compatibility.
 */
export class HttpTransport implements Transport {
  /**
   * Sanitizes headers for logging by removing authentication information.
   */
  private sanitizeHeadersForLogging(
    headers: Record<string, string> | undefined,
  ): Record<string, string> {
    if (!headers) {
      return {};
    }

    const sanitized = { ...headers };

    // Remove common authentication headers
    const authHeaders = [
      "authorization",
      "x-api-key",
      "x-goog-api-key",
      "api-key",
      "bearer",
      "token",
      "auth-token",
      "access-token",
    ];

    authHeaders.forEach((header) => {
      // Case-insensitive removal
      Object.keys(sanitized).forEach((key) => {
        if (key.toLowerCase() === header.toLowerCase()) {
          sanitized[key] = "[REDACTED]";
        }
      });
    });

    return sanitized;
  }
  private readonly runtimeAdapter: RuntimeAdapter;

  /**
   * Creates a new HttpTransport instance.
   *
   * @param runtimeAdapter - Runtime adapter for platform operations
   * @param interceptors - Interceptor chain for request/response processing
   */
  constructor(
    runtimeAdapter: RuntimeAdapter,
    private readonly interceptors: InterceptorChain,
  ) {
    this.runtimeAdapter = runtimeAdapter;
  }

  /**
   * Performs a standard HTTP request with interceptor processing.
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
    try {
      return await this.executeFetchRequest(request, signal);
    } catch (error) {
      return this.handleFetchError(error, signal);
    }
  }

  /**
   * Executes the fetch request with interceptor processing.
   */
  private async executeFetchRequest(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<ProviderHttpResponse> {
    // Create interceptor context
    const context = this.createInterceptorContext(request, signal);

    // Execute request interceptors
    const processedContext = await this.interceptors.executeRequest(context);

    // Log request details for debugging
    logger.debug("HTTP request details", {
      transport: "http",
      method: processedContext.request.method,
      url: processedContext.request.url,
      headers: this.sanitizeHeadersForLogging(processedContext.request.headers),
      body: processedContext.request.body,
    });

    // Perform HTTP request
    const fetchResponse = await this.runtimeAdapter.fetch(
      processedContext.request.url,
      {
        method: processedContext.request.method,
        headers: processedContext.request.headers,
        body: processedContext.request.body as BodyInit | null | undefined,
        signal,
      },
    );

    // Convert to ProviderHttpResponse
    const response = this.convertFetchResponse(fetchResponse);

    // Log response details for debugging (including body)
    let responseBodyForLogging: string | null = null;
    if (response.body) {
      try {
        // Read the response body for logging
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine chunks and decode to string for logging
        const totalLength = chunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0,
        );
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        responseBodyForLogging = new TextDecoder().decode(combined);

        // Create a new ReadableStream from the chunks for actual use
        response.body = new ReadableStream({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        });
      } catch (error) {
        logger.debug("Failed to read response body for logging", { error });
      }
    }

    logger.debug("HTTP response details", {
      transport: "http",
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: responseBodyForLogging,
    });

    // Update context with response
    const responseContext: InterceptorContext = {
      ...processedContext,
      response,
    };

    // Execute response interceptors
    const finalContext =
      await this.interceptors.executeResponse(responseContext);

    return finalContext.response!;
  }

  /**
   * Handles fetch errors with proper normalization.
   */
  private handleFetchError(error: unknown, signal?: AbortSignal): never {
    // Log transport error details
    logger.error("HTTP transport error", {
      transport: "http",
      error: error instanceof Error ? error.message : String(error),
      aborted: signal?.aborted || false,
      status: error instanceof Response ? error.status : undefined,
    });

    // Handle AbortSignal cancellation
    if (signal?.aborted) {
      throw new TransportError("Request was aborted", {
        provider: "http-transport",
        aborted: true,
      });
    }

    // Handle Response errors
    if (error instanceof Response) {
      const response = this.convertFetchResponse(error);

      // Log HTTP error details
      logger.debug("HTTP error response details", {
        transport: "http",
        status: response.status,
        statusText: response.statusText,
      });

      throw new TransportError(
        `HTTP ${response.status}: ${response.statusText}`,
        {
          provider: "http-transport",
          status: response.status,
          statusText: response.statusText,
        },
      );
    }

    // Handle Error objects
    if (error instanceof Error) {
      throw new TransportError(error.message, {
        provider: "http-transport",
        originalError: error,
      });
    }

    // Handle unknown errors
    throw new TransportError("Unknown network error", {
      provider: "http-transport",
      originalError: error,
    });
  }

  /**
   * Performs a streaming HTTP request with content-type detection.
   *
   * Returns a StreamResponse containing both HTTP metadata and raw stream content.
   * For SSE responses (text/event-stream), preserves raw SSE framing for provider parsing.
   * For other content types, maintains current parsing behavior.
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
    try {
      return await this.executeStreamRequest(request, signal);
    } catch (error) {
      return this.handleStreamError(error, signal);
    }
  }

  /**
   * Executes the streaming request with interceptor processing.
   */
  private async executeStreamRequest(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<StreamResponse> {
    // Create interceptor context
    const context = this.createInterceptorContext(request, signal);

    // Execute request interceptors
    const processedContext = await this.interceptors.executeRequest(context);

    // Log streaming request details for debugging
    logger.debug("HTTP streaming request details", {
      transport: "http",
      method: processedContext.request.method,
      url: processedContext.request.url,
      headers: this.sanitizeHeadersForLogging(processedContext.request.headers),
      body: processedContext.request.body,
    });

    // Use runtime adapter for streaming - single call with metadata and stream
    const streamResponse = await this.runtimeAdapter.stream(
      processedContext.request.url,
      {
        method: processedContext.request.method,
        headers: processedContext.request.headers,
        body: processedContext.request.body as BodyInit | null | undefined,
        signal,
      },
    );

    // Log streaming response details for debugging
    logger.debug("HTTP streaming response details", {
      transport: "http",
      status: streamResponse.status,
      statusText: streamResponse.statusText,
      headers: streamResponse.headers,
      note: "Stream response received from runtime adapter",
    });

    // Check for HTTP errors before streaming
    if (streamResponse.status < 200 || streamResponse.status >= 400) {
      throw new TransportError(
        `HTTP ${streamResponse.status}: ${streamResponse.statusText}`,
        {
          provider: "http-transport",
          status: streamResponse.status,
        },
      );
    }

    // Return stream response directly from adapter (already includes metadata + stream)
    return {
      status: streamResponse.status,
      statusText: streamResponse.statusText,
      headers: streamResponse.headers,
      stream: streamResponse.stream,
    };
  }

  /**
   * Handles streaming errors with proper normalization.
   */
  private handleStreamError(error: unknown, signal?: AbortSignal): never {
    // Log streaming error details
    logger.error("HTTP streaming error", {
      transport: "http",
      error: error instanceof Error ? error.message : String(error),
      aborted: signal?.aborted || false,
    });

    // Handle AbortSignal cancellation
    if (signal?.aborted) {
      throw new TransportError("Stream was aborted", {
        provider: "http-transport",
        aborted: true,
      });
    }

    // Handle Error objects
    if (error instanceof Error) {
      throw new TransportError(error.message, {
        provider: "http-transport",
        originalError: error,
      });
    }

    // Handle unknown errors
    throw new TransportError("Unknown streaming error", {
      provider: "http-transport",
      originalError: error,
    });
  }

  /**
   * Creates an interceptor context from request and signal.
   */
  private createInterceptorContext(
    request: ProviderHttpRequest,
    signal?: AbortSignal,
  ): InterceptorContext {
    return {
      request,
      metadata: {
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      },
      abortSignal: signal,
    };
  }

  /**
   * Converts fetch Response to ProviderHttpResponse format.
   */
  private convertFetchResponse(fetchResponse: Response): ProviderHttpResponse {
    // Convert headers
    const headers: Record<string, string> = {};
    fetchResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get body stream or null if empty
    const body = fetchResponse.body;

    return {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers,
      body,
    };
  }
}
