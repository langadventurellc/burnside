/**
 * Node Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for Node environments.
 * Provides platform-specific implementations for HTTP, timers, and file operations
 * using Node built-in APIs.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import type { McpConnection } from "../mcpConnection";
import type { McpServerConfig } from "../mcpServerConfig";
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
 * Node.js-specific MCP connection implementation using JSON-RPC 2.0.
 * Uses the NodeRuntimeAdapter's fetch method for transport.
 */
class NodeMcpConnection implements McpConnection {
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
            name: "llm-bridge-node",
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
      } catch (parseError) {
        throw new RuntimeError(
          "Invalid JSON response from MCP server",
          "RUNTIME_MCP_PARSE_ERROR",
          {
            responseText,
            parseError,
            serverUrl: this.serverUrl,
          },
        );
      }

      // Validate JSON-RPC 2.0 response structure
      if (jsonResponse.jsonrpc !== "2.0") {
        throw new RuntimeError(
          "Invalid JSON-RPC 2.0 response",
          "RUNTIME_MCP_PROTOCOL_ERROR",
          {
            response: jsonResponse,
            serverUrl: this.serverUrl,
          },
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
          serverUrl: this.serverUrl,
          originalError: error,
        },
      );
    }
  }

  /**
   * Generate a unique request ID for JSON-RPC requests.
   */
  private generateRequestId(): string {
    return `node_${Date.now()}_${++this.requestIdCounter}`;
  }
}

/**
 * Node implementation of the RuntimeAdapter interface.
 *
 * Uses Node built-in modules for HTTP (global fetch), timers (built-in timers),
 * and file operations (fs/promises). Provides full platform capabilities for
 * Node environments.
 */
export class NodeRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "node",
      version: process.version,
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use global fetch (available in Node 18+)
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
      // Use global fetch to get the response
      const response = await globalThis.fetch(input, init);

      // Extract headers into a plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Convert response body to AsyncIterable
      if (!response.body) {
        throw new RuntimeError(
          "Response body is null for streaming request",
          "RUNTIME_HTTP_ERROR",
          {
            input: input.toString(),
            init,
          },
        );
      }

      // Return metadata + stream
      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        stream: this.createAsyncIterable(
          response.body,
          init?.signal ?? undefined,
        ),
      };
    } catch (error) {
      throw new RuntimeError(
        `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
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
    serverConfig: McpServerConfig,
    options?: McpConnectionOptions,
  ): Promise<McpConnection> {
    try {
      // For now, only support HTTP servers (URL-based)
      // STDIO support will be added in future tasks
      if (!serverConfig.url) {
        throw new RuntimeError(
          "STDIO MCP servers not yet implemented in NodeRuntimeAdapter",
          "MCP_STDIO_NOT_IMPLEMENTED",
        );
      }

      // Validate the server URL
      this.validateMcpServerUrl(serverConfig.url);

      // Create connection instance using this adapter's fetch method
      const connection = new NodeMcpConnection(
        serverConfig.url,
        (input, init) => this.fetch(input, init),
        options,
      );

      // Initialize the connection
      await connection.initialize(options?.signal);

      return connection;
    } catch (error) {
      throw new RuntimeError(
        `Failed to create MCP connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_MCP_CONNECTION_ERROR",
        {
          serverConfig,
          options,
          originalError: error,
        },
      );
    }
  }

  /**
   * Validate MCP server URL for Node.js platform.
   * Node.js has fewer restrictions than Electron renderer process.
   */
  private validateMcpServerUrl(serverUrl: string): void {
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

    // Validate protocol - support both HTTP and HTTPS
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new RuntimeError(
        "MCP server URL must use HTTP or HTTPS protocol",
        "RUNTIME_MCP_INVALID_PROTOCOL",
        {
          serverUrl,
          protocol: url.protocol,
          supportedProtocols: ["http:", "https:"],
        },
      );
    }

    // Node.js allows localhost and private IPs (unlike Electron renderer)
    // No additional restrictions needed for Node.js platform
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
      globalThis.clearTimeout(handle as NodeJS.Timeout);
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
      globalThis.clearInterval(handle as NodeJS.Timeout);
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

  // File Operations
  async readFile(
    path: string,
    options?: FileOperationOptions,
  ): Promise<string> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      const encoding = options?.encoding ?? "utf8";
      return await fs.readFile(path, { encoding });
    } catch (error) {
      throw new RuntimeError(
        `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_FILE_ERROR",
        {
          operation: "readFile",
          path,
          options,
          originalError: error,
        },
      );
    }
  }

  async writeFile(
    path: string,
    content: string,
    options?: FileOperationOptions,
  ): Promise<void> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      const encoding = options?.encoding ?? "utf8";

      // Create parent directories if requested
      if (options?.createDirectories) {
        const pathModule = await import("node:path");
        const dir = pathModule.dirname(path);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(path, content, { encoding });
    } catch (error) {
      throw new RuntimeError(
        `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_FILE_ERROR",
        {
          operation: "writeFile",
          path,
          contentLength: content.length,
          options,
          originalError: error,
        },
      );
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
