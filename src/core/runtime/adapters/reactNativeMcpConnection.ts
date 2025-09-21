/**
 * React Native MCP Connection Implementation
 *
 * Provides JSON-RPC 2.0 communication with MCP servers for React Native environments.
 * Uses React Native's fetch API for transport and supports connection lifecycle management.
 */

import type { McpConnection } from "../mcpConnection";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import { RuntimeError } from "../runtimeError";

/**
 * JSON-RPC 2.0 request structure for MCP communication.
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC 2.0 response structure for MCP communication.
 */
interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * React Native implementation of MCP connection using JSON-RPC 2.0 protocol.
 *
 * Handles connection lifecycle, request/response correlation, and error propagation
 * for MCP servers accessible via HTTP/HTTPS in React Native environments.
 */
export class ReactNativeMcpConnection implements McpConnection {
  private isConnectionActive = false;
  private requestIdCounter = 0;
  private readonly serverUrl: string;
  private readonly fetchFn: (
    input: string | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  private readonly options: McpConnectionOptions;

  constructor(
    serverUrl: string,
    fetchFn: (input: string | URL, init?: RequestInit) => Promise<Response>,
    options: McpConnectionOptions = {},
  ) {
    this.serverUrl = serverUrl;
    this.fetchFn = fetchFn;
    this.options = options;
  }

  /**
   * Initialize the MCP connection.
   * Sets up connection state for subsequent operations.
   */
  async initialize(): Promise<void> {
    try {
      // Test connectivity with a simple request
      const testRequest: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: this.generateRequestId(),
        method: "ping",
        params: {},
      };

      await this.sendRequest(testRequest);

      // Connection is considered active if we can make requests
      // (even if ping method is not supported)
      this.isConnectionActive = true;
    } catch (error) {
      throw new RuntimeError(
        `Failed to initialize MCP connection: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_INIT_FAILED",
        {
          serverUrl: this.serverUrl,
          originalError: error,
        },
      );
    }
  }

  /**
   * Current connection status.
   */
  get isConnected(): boolean {
    return this.isConnectionActive;
  }

  /**
   * Make a JSON-RPC 2.0 request and wait for response.
   */
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
      id: this.generateRequestId(),
      method,
      params,
    };

    try {
      const response = await this.sendRequest(request);
      const jsonResponse = await this.parseJsonResponse(response);

      if (jsonResponse.error) {
        throw new RuntimeError(
          `MCP call failed: ${jsonResponse.error.message}`,
          "RUNTIME_MCP_CALL_ERROR",
          {
            method,
            params,
            code: jsonResponse.error.code,
            message: jsonResponse.error.message,
            data: jsonResponse.error.data,
          },
        );
      }

      return jsonResponse.result as T;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        `MCP call failed: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_CALL_FAILED",
        {
          method,
          params,
          originalError: error,
        },
      );
    }
  }

  /**
   * Send a JSON-RPC 2.0 notification (no response expected).
   */
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
    };

    try {
      await this.sendRequest(notification);
    } catch (error) {
      throw new RuntimeError(
        `MCP notification failed: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_NOTIFY_FAILED",
        {
          method,
          params,
          originalError: error,
        },
      );
    }
  }

  /**
   * Close the MCP connection and clean up resources.
   */
  close(): Promise<void> {
    this.isConnectionActive = false;
    return Promise.resolve();
  }

  /**
   * Generate a unique request ID for JSON-RPC correlation.
   */
  private generateRequestId(): string {
    return `rn-${++this.requestIdCounter}-${Date.now()}`;
  }

  /**
   * Send HTTP request to MCP server with JSON-RPC payload.
   */
  private async sendRequest(request: JsonRpcRequest): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.options.headers,
    };

    const requestInit: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: this.options.signal,
    };

    return await this.fetchFn(this.serverUrl, requestInit);
  }

  /**
   * Parse JSON-RPC response from HTTP response.
   */
  private async parseJsonResponse(
    response: Response,
  ): Promise<JsonRpcResponse> {
    if (!response.ok) {
      throw new RuntimeError(
        `HTTP error: ${response.status} ${response.statusText}`,
        "RUNTIME_MCP_HTTP_ERROR",
        {
          status: response.status,
          statusText: response.statusText,
        },
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new RuntimeError(
        "Invalid response content type. Expected application/json",
        "RUNTIME_MCP_INVALID_CONTENT_TYPE",
        { contentType },
      );
    }

    try {
      const jsonResponse = (await response.json()) as JsonRpcResponse;

      if (jsonResponse.jsonrpc !== "2.0") {
        throw new RuntimeError(
          "Invalid JSON-RPC version. Expected 2.0",
          "RUNTIME_MCP_INVALID_JSONRPC_VERSION",
          { version: jsonResponse.jsonrpc },
        );
      }

      return jsonResponse;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_JSON_PARSE_ERROR",
        { originalError: error },
      );
    }
  }
}
