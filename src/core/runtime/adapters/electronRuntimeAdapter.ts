/**
 * Electron Renderer Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for Electron renderer processes.
 * Uses browser-standard APIs available in the Electron renderer context for HTTP
 * and timer operations. File operations are not supported and will throw errors.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import type { McpConnection } from "../mcpConnection";
import { RuntimeError } from "../runtimeError";
import { getPlatformCapabilities } from "../getPlatformCapabilities";

/**
 * JSON-RPC 2.0 request structure for MCP communication.
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number;
}

/**
 * JSON-RPC 2.0 response structure for MCP communication.
 */
interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

/**
 * Electron-specific MCP connection implementation using JSON-RPC 2.0.
 * Uses the ElectronRuntimeAdapter's fetch method for transport.
 */
class ElectronMcpConnection implements McpConnection {
  private isConnectionActive = false;
  private requestIdCounter = 0;
  private readonly serverUrl: string;
  private readonly fetchFn: (
    input: string | URL,
    init?: RequestInit,
  ) => Promise<Response>;

  constructor(
    serverUrl: string,
    fetchFn: (input: string | URL, init?: RequestInit) => Promise<Response>,
    private readonly options?: McpConnectionOptions,
  ) {
    this.serverUrl = serverUrl;
    this.fetchFn = fetchFn;
  }

  get isConnected(): boolean {
    return this.isConnectionActive;
  }

  /**
   * Initialize the connection by testing connectivity.
   */
  async initialize(signal?: AbortSignal): Promise<void> {
    try {
      // Test connection with a simple JSON-RPC request
      const testRequest: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "llm-bridge-electron",
            version: "1.0.0",
          },
        },
        id: this.generateRequestId(),
      };

      await this.sendRequest(testRequest, signal);

      // If we get here without throwing, connection is working
      this.isConnectionActive = true;
    } catch (error) {
      this.isConnectionActive = false;
      throw error;
    }
  }

  async call<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.isConnectionActive) {
      throw new RuntimeError(
        "MCP connection is not active",
        "RUNTIME_MCP_CONNECTION_INACTIVE",
        { method, params },
      );
    }

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: this.generateRequestId(),
    };

    const response = await this.sendRequest(request, this.options?.signal);

    if (response.error) {
      const error = new Error(response.error.message) as Error & {
        code?: number;
        data?: unknown;
      };
      error.code = response.error.code;
      error.data = response.error.data;
      throw error;
    }

    return response.result as T;
  }

  async notify(method: string, params?: unknown): Promise<void> {
    if (!this.isConnectionActive) {
      throw new RuntimeError(
        "MCP connection is not active",
        "RUNTIME_MCP_CONNECTION_INACTIVE",
        { method, params },
      );
    }

    const notification: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      // Notifications don't have an ID
    };

    // Send notification without expecting response
    await this.sendRequest(notification, this.options?.signal, false);
  }

  close(): Promise<void> {
    this.isConnectionActive = false;
    // No additional cleanup needed for HTTP-based connections
    return Promise.resolve();
  }

  /**
   * Send a JSON-RPC request to the MCP server.
   */
  private async sendRequest(
    request: JsonRpcRequest,
    signal?: AbortSignal,
    expectResponse = true,
  ): Promise<JsonRpcResponse> {
    try {
      const body = JSON.stringify(request);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.options?.headers,
      };

      const init: RequestInit = {
        method: "POST",
        headers,
        body,
        signal: signal || this.options?.signal,
      };

      const response = await this.fetchFn(this.serverUrl, init);

      if (!response.ok) {
        throw new RuntimeError(
          `MCP server returned HTTP ${response.status}: ${response.statusText}`,
          "RUNTIME_MCP_HTTP_ERROR",
          {
            status: response.status,
            statusText: response.statusText,
            serverUrl: this.serverUrl,
          },
        );
      }

      if (!expectResponse) {
        // For notifications, we don't parse the response
        return { jsonrpc: "2.0", id: null };
      }

      const responseText = await response.text();

      let jsonResponse: JsonRpcResponse;
      try {
        jsonResponse = JSON.parse(responseText) as JsonRpcResponse;
      } catch (error) {
        throw new RuntimeError(
          "Invalid JSON response from MCP server",
          "RUNTIME_MCP_INVALID_RESPONSE",
          {
            responseText,
            originalError: error,
          },
        );
      }

      // Validate JSON-RPC 2.0 response format
      if (jsonResponse.jsonrpc !== "2.0") {
        throw new RuntimeError(
          "Invalid JSON-RPC 2.0 response",
          "RUNTIME_MCP_INVALID_JSONRPC",
          { jsonResponse },
        );
      }

      return jsonResponse;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        `MCP request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_MCP_REQUEST_ERROR",
        {
          request,
          originalError: error,
        },
      );
    }
  }

  /**
   * Generate a unique request ID for JSON-RPC requests.
   */
  private generateRequestId(): number {
    return ++this.requestIdCounter;
  }
}

/**
 * Electron renderer implementation of the RuntimeAdapter interface.
 *
 * Uses browser-standard APIs for HTTP (global fetch) and timers (built-in timers).
 * File operations are not supported in the renderer process and will throw
 * RuntimeError with appropriate error messages.
 */
export class ElectronRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "electron-renderer",
      version: process.versions.electron,
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use global fetch (available in Electron renderer)
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
      // Use global fetch (available in Electron renderer)
      const response = await globalThis.fetch(input, init);

      // Extract HTTP metadata
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Validate response has body
      const body = response.body;
      if (!body) {
        throw new RuntimeError(
          "Response body is empty for streaming request",
          "RUNTIME_HTTP_ERROR",
          {
            status: response.status,
            statusText: response.statusText,
            platform: "electron-renderer",
          },
        );
      }

      // Return metadata + stream
      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        stream: this.createAsyncIterable(body, init?.signal ?? undefined),
      };
    } catch (error) {
      throw new RuntimeError(
        `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          platform: "electron-renderer",
          originalError: error,
        },
      );
    }
  }

  private async *createAsyncIterable(
    stream: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
  ): AsyncIterable<Uint8Array> {
    const reader = stream.getReader();

    try {
      while (true) {
        // Check for cancellation
        if (signal?.aborted) {
          throw new Error("Stream was aborted");
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

  // MCP Operations
  async createMcpConnection(
    serverUrl: string,
    options?: McpConnectionOptions,
  ): Promise<McpConnection> {
    try {
      // Validate server URL for Electron renderer security
      this.validateMcpServerUrl(serverUrl);

      // Create connection with Electron-specific transport
      const connection = new ElectronMcpConnection(
        serverUrl,
        this.fetch.bind(this),
        options,
      );

      // Test connection to ensure it works
      await connection.initialize(options?.signal);

      return connection;
    } catch (error) {
      throw new RuntimeError(
        `Failed to create MCP connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_MCP_CONNECTION_ERROR",
        {
          operation: "createMcpConnection",
          serverUrl,
          options,
          platform: "electron-renderer",
          originalError: error,
        },
      );
    }
  }

  /**
   * Validates MCP server URL for Electron renderer security.
   * Enforces HTTPS for remote connections and blocks unsafe localhost access.
   */
  private validateMcpServerUrl(serverUrl: string): void {
    let url: URL;

    try {
      url = new URL(serverUrl);
    } catch (error) {
      throw new RuntimeError(
        "Invalid MCP server URL format",
        "RUNTIME_MCP_INVALID_URL",
        {
          serverUrl,
          originalError: error,
        },
      );
    }

    // Enforce HTTPS for remote connections in Electron renderer
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new RuntimeError(
        "MCP server URL must use HTTP or HTTPS protocol",
        "RUNTIME_MCP_INVALID_PROTOCOL",
        {
          serverUrl,
          protocol: url.protocol,
        },
      );
    }

    // Warn about HTTP usage (should prefer HTTPS)
    if (url.protocol === "http:" && !this.isLocalhost(url.hostname)) {
      console.warn(
        `Warning: Using HTTP for remote MCP server. HTTPS is recommended for security: ${serverUrl}`,
      );
    }

    // Block suspicious localhost patterns that could bypass renderer security
    const effectivePort = this.getEffectivePort(url);
    if (this.isLocalhost(url.hostname) && effectivePort < 1024) {
      throw new RuntimeError(
        "MCP server on privileged port blocked for security",
        "RUNTIME_MCP_SECURITY_VIOLATION",
        {
          serverUrl,
          hostname: url.hostname,
          port: effectivePort.toString(),
        },
      );
    }
  }

  /**
   * Gets the effective port number, including default ports for protocols.
   */
  private getEffectivePort(url: URL): number {
    if (url.port) {
      return parseInt(url.port, 10);
    }

    // Return default ports for protocols
    if (url.protocol === "http:") {
      return 80;
    }
    if (url.protocol === "https:") {
      return 443;
    }

    // For other protocols, assume no privileged port
    return 8080;
  }

  /**
   * Checks if hostname refers to localhost/loopback.
   */
  private isLocalhost(hostname: string): boolean {
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
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
          platform: "electron-renderer",
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
          platform: "electron-renderer",
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
          platform: "electron-renderer",
        },
      ),
    );
  }
}
