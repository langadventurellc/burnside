/**
 * HTTP Transport Interfaces Module
 *
 * This module provides HTTP client interfaces and contracts for
 * communicating with LLM provider APIs. It includes transport interfaces,
 * HTTP request/response types, streaming support, interceptor chain system,
 * and fetch injection patterns for platform-agnostic HTTP operations.
 *
 * ## Core Types
 * - `HttpMethod` - Supported HTTP methods (GET, POST, PUT, DELETE)
 * - `ProviderHttpRequest` - HTTP request interface for provider APIs
 * - `ProviderHttpResponse` - HTTP response interface from provider APIs
 *
 * ## Transport Interfaces
 * - `Transport` - Main interface for HTTP operations with streaming support
 * - `HttpClient` - Configurable HTTP client with fetch injection
 *
 * ## Interceptor Chain System
 * - `InterceptorChain` - Manages request/response interceptor execution
 * - `InterceptorContext` - Context passed through interceptor chain
 * - `RequestInterceptor` - Request processing hooks with context
 * - `ResponseInterceptor` - Response processing hooks with context
 * - `InterceptorError` - Specialized error for interceptor failures
 * - `InterceptorErrorContext` - Context for interceptor error details
 *
 * ## Streaming Support
 * - `StreamingResponse` - Interface for streaming HTTP responses
 * - `StreamChunk` - Individual data chunks within streams
 * - `StreamingOptions` - Configuration for streaming operations
 *
 * ## Request/Response Redaction System
 * - `RedactionProcessor` - Configurable processor for redacting sensitive data
 * - `DEFAULT_REDACTION_CONFIG` - Default configuration with common security patterns
 *
 * ## Fetch Injection
 * - `FetchFunction` - Type for injectable fetch implementations
 * - `HttpClientConfig` - Configuration with fetch and interceptors
 *
 * @example Basic usage with interceptor chain
 * ```typescript
 * import { InterceptorChain, InterceptorContext } from '@/core/transport';
 *
 * const chain = new InterceptorChain();
 * chain.addRequestInterceptor(async (context: InterceptorContext) => {
 *   return {
 *     ...context,
 *     request: {
 *       ...context.request,
 *       headers: { ...context.request.headers, 'Authorization': 'Bearer token' }
 *     }
 *   };
 * });
 * ```
 */

// Core HTTP types
export type { HttpMethod } from "./httpMethod";
export type { ProviderHttpRequest } from "./providerHttpRequest";
export type { ProviderHttpResponse } from "./providerHttpResponse";

// Transport interfaces
export type { Transport } from "./transport";
export { HttpTransport } from "./httpTransport";
export { EnhancedHttpTransport } from "./enhancedHttpTransport";
export type { HttpClient } from "./httpClient";

// Interceptor chain system
export { InterceptorChain } from "./interceptorChain";
export { InterceptorError } from "./interceptorError";
export type { InterceptorContext } from "./interceptorContext";
export type { InterceptorErrorContext } from "./interceptorErrorContext";
export type { RequestInterceptor } from "./requestInterceptorChain";
export type { ResponseInterceptor } from "./responseInterceptorChain";

// Streaming support
export type { StreamingResponse } from "./streamingResponse";
export type { StreamResponse } from "./streamResponse";
export type { StreamChunk } from "./streamChunk";
export type { StreamingOptions } from "./streamingOptions";

// Retry and backoff strategies
export * from "./retry";

// Rate limiting system
export * from "./rateLimiting";

// Enhanced transport utilities
export type { RetryStats } from "./retryStats";
export { extractRateLimitContext } from "./contextExtractor";

// Request/Response redaction system
export { RedactionProcessor, DEFAULT_REDACTION_CONFIG } from "./redactionHooks";

// Fetch injection and configuration
export type { FetchFunction } from "./fetchFunction";
export type { HttpClientConfig } from "./httpClientConfig";

// Legacy interceptor types (for backward compatibility)
export type { RequestInterceptor as LegacyRequestInterceptor } from "./requestInterceptor";
export type { ResponseInterceptor as LegacyResponseInterceptor } from "./responseInterceptor";
