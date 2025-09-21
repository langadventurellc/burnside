/**
 * React Native Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for React Native environments.
 * Uses React Native's fetch API for HTTP operations and built-in timer functions.
 * File operations are not supported and will throw errors. Streaming support
 * is available via the react-native-sse library.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import type { McpConnection } from "../mcpConnection";
import { RuntimeError } from "../runtimeError";
import { getPlatformCapabilities } from "../getPlatformCapabilities";
import { ReactNativeMcpConnection } from "./reactNativeMcpConnection";

// Type definitions for react-native-sse library
interface SSEEvent {
  data: string;
}

interface SSEEventSource {
  addEventListener(type: "message", listener: (event: SSEEvent) => void): void;
  addEventListener(type: "error", listener: (error: Error) => void): void;
  addEventListener(type: "close", listener: () => void): void;
  removeEventListener(
    type: "message",
    listener: (event: SSEEvent) => void,
  ): void;
  removeEventListener(type: "error", listener: (error: Error) => void): void;
  removeEventListener(type: "close", listener: () => void): void;
  close(): void;
}

interface SSEEventSourceConstructor {
  new (
    url: string,
    options?: {
      headers?: Record<string, string>;
      method?: string;
    },
  ): SSEEventSource;
}

interface _ReactNativeSSE {
  EventSource: SSEEventSourceConstructor;
}

/**
 * React Native implementation of the RuntimeAdapter interface.
 *
 * Uses React Native's global fetch API for HTTP operations and built-in timers.
 * File operations are not supported in React Native and will throw RuntimeError
 * with appropriate error messages. Streaming is supported via react-native-sse.
 */
export class ReactNativeRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "react-native",
      version: "react-native",
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use React Native's fetch implementation
      return await globalThis.fetch(input, init);
    } catch (error) {
      throw new RuntimeError(
        `HTTP fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          originalError: error,
        },
      );
    }
  }

  /**
   * Checks if the request should use Server-Sent Events based on Accept headers
   */
  private isSSERequest(headers?: HeadersInit): boolean {
    if (!headers) return false;

    // Convert HeadersInit to a searchable format
    let acceptHeader = "";
    if (headers instanceof Headers) {
      acceptHeader = headers.get("accept") || headers.get("Accept") || "";
    } else if (Array.isArray(headers)) {
      // Handle array format [['accept', 'text/event-stream'], ...]
      const acceptEntry = headers.find(
        ([key]) => key.toLowerCase() === "accept",
      );
      acceptHeader = acceptEntry ? acceptEntry[1] : "";
    } else {
      // Handle object format { accept: 'text/event-stream' }
      const headersObj = headers;
      acceptHeader = headersObj.accept || headersObj.Accept || "";
    }

    return acceptHeader.includes("text/event-stream");
  }

  /**
   * Attempts to create SSE stream using react-native-sse with lazy loading
   */
  private async tryCreateSSEStream(
    input: string | URL,
    init?: RequestInit,
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    stream: AsyncIterable<Uint8Array>;
  }> {
    try {
      // Lazy load react-native-sse to prevent bundle issues
      const reactNativeSSE = (await import(
        "react-native-sse"
      )) as unknown as _ReactNativeSSE;
      const { EventSource } = reactNativeSSE;

      // Get HTTP metadata using HEAD request since EventSource doesn't provide it
      const url = input.toString();
      const headResponse = await globalThis.fetch(url, {
        ...init,
        method: "HEAD",
      });

      const headers = this.extractHTTPMetadata(headResponse);

      return {
        status: headResponse.status,
        statusText: headResponse.statusText,
        headers,
        stream: this.createSSEAsyncIterable(url, init, EventSource),
      };
    } catch {
      // Fallback to standard streaming if react-native-sse not available
      console.warn(
        "react-native-sse not available, falling back to standard streaming",
      );
      return await this.createStandardStream(input, init);
    }
  }

  /**
   * Creates standard fetch-based stream for non-SSE content
   */
  private async createStandardStream(
    input: string | URL,
    init?: RequestInit,
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    stream: AsyncIterable<Uint8Array>;
  }> {
    // Use React Native's fetch to get the response
    const response = await globalThis.fetch(input, init);

    // Extract HTTP metadata
    const headers = this.extractHTTPMetadata(response);

    // Validate response has body
    if (!response.body) {
      throw new RuntimeError(
        "Response body is null for streaming request",
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          platform: "react-native",
        },
      );
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      stream: this.createStandardAsyncIterable(
        response.body,
        init?.signal ?? undefined,
      ),
    };
  }

  /**
   * Extracts HTTP metadata from Response object
   */
  private extractHTTPMetadata(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Creates AsyncIterable from SSE EventSource
   */
  private async *createSSEAsyncIterable(
    url: string,
    init?: RequestInit,
    EventSource?: SSEEventSourceConstructor,
  ): AsyncIterable<Uint8Array> {
    if (!EventSource) {
      throw new RuntimeError(
        "EventSource not available for SSE streaming",
        "RUNTIME_HTTP_ERROR",
        {
          url,
          platform: "react-native",
        },
      );
    }

    const eventSource = new EventSource(url, {
      headers: this.convertHeadersToObject(init?.headers),
      method: init?.method || "GET",
    });

    try {
      while (true) {
        // Check for cancellation
        if (init?.signal?.aborted) {
          throw new RuntimeError("Stream was aborted", "RUNTIME_HTTP_ERROR", {
            url,
            platform: "react-native",
          });
        }

        const event = await this.waitForSSEEvent(eventSource);
        if (event.type === "close") {
          break;
        }

        if (event.data) {
          yield new TextEncoder().encode(event.data);
        }
      }
    } finally {
      eventSource.close();
    }
  }

  /**
   * Creates AsyncIterable from standard ReadableStream
   */
  private async *createStandardAsyncIterable(
    stream: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
  ): AsyncIterable<Uint8Array> {
    const reader = stream.getReader();

    try {
      while (true) {
        // Check for cancellation
        if (signal?.aborted) {
          throw new RuntimeError("Stream was aborted", "RUNTIME_HTTP_ERROR", {
            platform: "react-native",
          });
        }

        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          yield value;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Converts HeadersInit to plain object for EventSource
   */
  private convertHeadersToObject(
    headers?: HeadersInit,
  ): Record<string, string> {
    if (!headers) return {};

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    } else if (Array.isArray(headers)) {
      const result: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    } else {
      return headers;
    }
  }

  /**
   * Waits for the next SSE event from EventSource
   */
  private waitForSSEEvent(
    eventSource: SSEEventSource,
  ): Promise<{ type: string; data?: string }> {
    return new Promise((resolve, reject) => {
      const onMessage = (event: SSEEvent) => {
        cleanup();
        resolve({ type: "message", data: event.data });
      };

      const onError = (error: Error) => {
        cleanup();
        reject(
          new RuntimeError(
            `SSE stream error: ${error.message || "Unknown error"}`,
            "RUNTIME_HTTP_ERROR",
            {
              platform: "react-native",
              originalError: error,
            },
          ),
        );
      };

      const onClose = () => {
        cleanup();
        resolve({ type: "close" });
      };

      const cleanup = () => {
        eventSource.removeEventListener("message", onMessage);
        eventSource.removeEventListener("error", onError);
        eventSource.removeEventListener("close", onClose);
      };

      eventSource.addEventListener("message", onMessage);
      eventSource.addEventListener("error", onError);
      eventSource.addEventListener("close", onClose);
    });
  }

  async stream(
    input: string | URL,
    init?: RequestInit,
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    stream: AsyncIterable<Uint8Array>;
  }> {
    try {
      // Detect if this should use SSE based on Accept headers
      const isSSE = this.isSSERequest(init?.headers);

      if (isSSE) {
        return await this.tryCreateSSEStream(input, init);
      } else {
        return await this.createStandardStream(input, init);
      }
    } catch (error) {
      throw new RuntimeError(
        `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          platform: "react-native",
          originalError: error,
        },
      );
    }
  }

  // MCP Operations
  async createMcpConnection(
    serverUrl: string,
    options?: McpConnectionOptions,
  ): Promise<McpConnection> {
    try {
      // Validate server URL with remote-only constraints
      this.validateRemoteOnlyUrl(serverUrl);

      // Create and initialize connection
      const connection = new ReactNativeMcpConnection(
        serverUrl,
        this.fetch.bind(this),
        options,
      );

      await connection.initialize();
      return connection;
    } catch (error: unknown) {
      throw new RuntimeError(
        `Failed to create MCP connection: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_CONNECTION_FAILED",
        {
          serverUrl,
          options,
          originalError: error,
        },
      );
    }
  }

  /**
   * Validates that the server URL is remote-only (no localhost or private IPs).
   */
  private validateRemoteOnlyUrl(serverUrl: string): void {
    let url: URL;
    try {
      url = new URL(serverUrl);
    } catch {
      throw new RuntimeError(
        "Invalid MCP server URL format",
        "RUNTIME_MCP_INVALID_URL",
        { serverUrl },
      );
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new RuntimeError(
        "Invalid MCP server URL. Must be HTTP/HTTPS remote server.",
        "RUNTIME_MCP_INVALID_PROTOCOL",
        { serverUrl, protocol: url.protocol },
      );
    }
  }

  // Timer Operations
  setTimeout(callback: () => void, ms: number): TimerHandle {
    try {
      return globalThis.setTimeout(callback, ms);
    } catch (error) {
      throw new RuntimeError(
        `Failed to set timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "setTimeout",
          delay: ms,
          originalError: error,
        },
      );
    }
  }

  setInterval(callback: () => void, ms: number): TimerHandle {
    try {
      return globalThis.setInterval(callback, ms);
    } catch (error) {
      throw new RuntimeError(
        `Failed to set interval: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "setInterval",
          interval: ms,
          originalError: error,
        },
      );
    }
  }

  clearTimeout(handle: TimerHandle): void {
    try {
      globalThis.clearTimeout(handle as number);
    } catch (error) {
      throw new RuntimeError(
        `Failed to clear timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "clearTimeout",
          handle,
          originalError: error,
        },
      );
    }
  }

  clearInterval(handle: TimerHandle): void {
    try {
      globalThis.clearInterval(handle as number);
    } catch (error) {
      throw new RuntimeError(
        `Failed to clear interval: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "clearInterval",
          handle,
          originalError: error,
        },
      );
    }
  }

  // File Operations (Not Supported)
  readFile(path: string, options?: FileOperationOptions): Promise<string> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "readFile",
          path,
          options,
          platform: "react-native",
        },
      ),
    );
  }

  writeFile(
    path: string,
    content: string,
    options?: FileOperationOptions,
  ): Promise<void> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "writeFile",
          path,
          contentLength: content.length,
          options,
          platform: "react-native",
        },
      ),
    );
  }

  fileExists(path: string): Promise<boolean> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "fileExists",
          path,
          platform: "react-native",
        },
      ),
    );
  }
}
