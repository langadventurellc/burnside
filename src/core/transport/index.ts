/**
 * HTTP Transport Interfaces Module
 *
 * This module provides HTTP client interfaces and contracts for
 * communicating with LLM provider APIs. It includes transport interfaces,
 * HTTP request/response types, streaming support, and fetch injection
 * patterns for platform-agnostic HTTP operations.
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
 * ## Streaming Support
 * - `StreamingResponse` - Interface for streaming HTTP responses
 * - `StreamChunk` - Individual data chunks within streams
 * - `StreamingOptions` - Configuration for streaming operations
 *
 * ## Fetch Injection
 * - `FetchFunction` - Type for injectable fetch implementations
 * - `HttpClientConfig` - Configuration with fetch and interceptors
 * - `RequestInterceptor` - Request processing hooks
 * - `ResponseInterceptor` - Response processing hooks
 *
 * @example Basic usage
 * ```typescript
 * import { Transport, ProviderHttpRequest } from '@/core/transport';
 *
 * const request: ProviderHttpRequest = {
 *   url: 'https://api.openai.com/v1/chat/completions',
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer sk-...' }
 * };
 * ```
 */

// Core HTTP types
export type { HttpMethod } from "./httpMethod.js";
export type { ProviderHttpRequest } from "./providerHttpRequest.js";
export type { ProviderHttpResponse } from "./providerHttpResponse.js";

// Transport interfaces
export type { Transport } from "./transport.js";
export type { HttpClient } from "./httpClient.js";

// Streaming support
export type { StreamingResponse } from "./streamingResponse.js";
export type { StreamChunk } from "./streamChunk.js";
export type { StreamingOptions } from "./streamingOptions.js";

// Fetch injection and configuration
export type { FetchFunction } from "./fetchFunction.js";
export type { HttpClientConfig } from "./httpClientConfig.js";
export type { RequestInterceptor } from "./requestInterceptor.js";
export type { ResponseInterceptor } from "./responseInterceptor.js";
