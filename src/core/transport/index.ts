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
export type { HttpMethod } from "./httpMethod.js";
export type { ProviderHttpRequest } from "./providerHttpRequest.js";
export type { ProviderHttpResponse } from "./providerHttpResponse.js";

// Transport interfaces
export type { Transport } from "./transport.js";
export { HttpTransport } from "./httpTransport.js";
export type { HttpClient } from "./httpClient.js";

// Interceptor chain system
export { InterceptorChain } from "./interceptorChain.js";
export { InterceptorError } from "./interceptorError.js";
export type { InterceptorContext } from "./interceptorContext.js";
export type { InterceptorErrorContext } from "./interceptorErrorContext.js";
export type { RequestInterceptor } from "./requestInterceptorChain.js";
export type { ResponseInterceptor } from "./responseInterceptorChain.js";

// Streaming support
export type { StreamingResponse } from "./streamingResponse.js";
export type { StreamChunk } from "./streamChunk.js";
export type { StreamingOptions } from "./streamingOptions.js";

// Fetch injection and configuration
export type { FetchFunction } from "./fetchFunction.js";
export type { HttpClientConfig } from "./httpClientConfig.js";

// Legacy interceptor types (for backward compatibility)
export type { RequestInterceptor as LegacyRequestInterceptor } from "./requestInterceptor.js";
export type { ResponseInterceptor as LegacyResponseInterceptor } from "./responseInterceptor.js";
