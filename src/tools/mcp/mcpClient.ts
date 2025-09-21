/**
 * MCP Client
 *
 * Core MCP client class that manages connection lifecycle, capability negotiation,
 * and provides tools-only MCP server communication. Handles connection establishment,
 * health monitoring, exponential backoff reconnection, and tool operations.
 *
 * @example Basic usage
 * ```typescript
 * const client = new McpClient(adapter, 'http://localhost:3000');
 * await client.connect();
 *
 * const tools = await client.listTools();
 * const result = await client.callTool('calculator', { operation: 'add', a: 1, b: 2 });
 *
 * await client.disconnect();
 * ```
 */

import type { RuntimeAdapter } from "../../core/runtime/runtimeAdapter";
import type { McpConnection } from "../../core/runtime/mcpConnection";
import { SimpleLogger } from "../../core/logging/simpleLogger";
import { ExponentialBackoffStrategy } from "../../core/transport/retry/exponentialBackoffStrategy";
import type { BackoffConfig } from "../../core/transport/retry/backoffConfig";

import type { McpClientOptions } from "./mcpClientOptions";
import { McpConnectionError } from "./mcpConnectionError";
import { McpToolError } from "./mcpToolError";
import { McpCapabilityError } from "./mcpCapabilityError";
import { McpErrorNormalizer } from "./mcpErrorNormalizer";
import { McpErrorRecovery } from "./mcpErrorRecovery";
import { createToolsOnlyRequest } from "./createToolsOnlyRequest";
import { validateInitializeResponse } from "./validateInitializeResponse";
import type { McpInitializeResponse } from "./mcpInitializeResponse";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { translateMcpToToolDefinition } from "./translateMcpToToolDefinition";
import type { McpToolDefinition as ExternalMcpToolDefinition } from "./mcpToolDefinition";

/**
 * MCP tool definition from server
 */
interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

/**
 * MCP tool call result
 */
interface McpToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

/**
 * Connection status enum
 */
enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

/**
 * Core MCP client class implementing connection lifecycle management
 * and tools-only MCP server communication.
 */
export class McpClient {
  private readonly runtimeAdapter: RuntimeAdapter;
  private readonly serverUrl: string;
  private readonly options: McpClientOptions & {
    maxRetries: number;
    baseRetryDelay: number;
    maxRetryDelay: number;
    healthCheckInterval: number;
    capabilityTimeout: number;
    logLevel: "debug" | "info" | "warn" | "error";
    retryJitter: boolean;
  };
  private readonly logger: SimpleLogger;
  private readonly backoffStrategy: ExponentialBackoffStrategy;
  private readonly errorNormalizer: McpErrorNormalizer;
  private readonly errorRecovery: McpErrorRecovery;

  private connection: McpConnection | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private abortController: AbortController | null = null;

  constructor(
    runtimeAdapter: RuntimeAdapter,
    serverUrl: string,
    options: McpClientOptions = {},
  ) {
    this.runtimeAdapter = runtimeAdapter;
    this.serverUrl = serverUrl;

    // Apply defaults to options
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      baseRetryDelay: options.baseRetryDelay ?? 1000,
      maxRetryDelay: options.maxRetryDelay ?? 30000,
      healthCheckInterval: options.healthCheckInterval ?? 30000,
      capabilityTimeout: options.capabilityTimeout ?? 5000,
      logLevel: options.logLevel ?? "info",
      retryJitter: options.retryJitter ?? true,
      ...options, // Include base connection options (signal, timeout, headers)
    };

    // Setup logger
    this.logger = new SimpleLogger();
    this.logger.configure({
      level: this.options.logLevel,
      enabled: true,
    });

    // Setup backoff strategy
    const backoffConfig: BackoffConfig = {
      strategy: "exponential",
      baseDelayMs: this.options.baseRetryDelay,
      maxDelayMs: this.options.maxRetryDelay,
      jitter: this.options.retryJitter,
      multiplier: 2,
    };
    this.backoffStrategy = new ExponentialBackoffStrategy(backoffConfig);

    // Setup error handling
    this.errorNormalizer = new McpErrorNormalizer();
    this.errorRecovery = new McpErrorRecovery({
      maxRetries: this.options.maxRetries,
      baseDelayMs: this.options.baseRetryDelay,
      maxDelayMs: this.options.maxRetryDelay,
      jitterFactor: this.options.retryJitter ? 0.1 : 0,
    });
  }

  /**
   * Current connection status
   */
  get isConnected(): boolean {
    return (
      this.status === ConnectionStatus.CONNECTED &&
      this.connection?.isConnected === true
    );
  }

  /**
   * Establish connection to MCP server with capability negotiation
   */
  async connect(): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTING || this.isConnected) {
      return;
    }

    this.status = ConnectionStatus.CONNECTING;
    this.abortController = new AbortController();

    try {
      this.logger.info(`Connecting to MCP server: ${this.serverUrl}`);

      // Create connection through runtime adapter
      const connectionOptions = {
        signal: this.abortController.signal,
        timeout: this.options.capabilityTimeout,
        headers: this.options.headers,
      };

      this.connection = await this.runtimeAdapter.createMcpConnection(
        this.serverUrl,
        connectionOptions,
      );

      // Perform capability negotiation
      await this.negotiateCapabilities();

      this.status = ConnectionStatus.CONNECTED;
      this.reconnectAttempts = 0;
      this.backoffStrategy.reset();

      this.logger.info(
        `Successfully connected to MCP server: ${this.serverUrl}`,
      );

      // Start health monitoring if enabled
      if (this.options.healthCheckInterval > 0) {
        this.startHealthMonitoring();
      }
    } catch (error) {
      this.status = ConnectionStatus.FAILED;
      void this.cleanup();

      if (error instanceof Error && error.name === "AbortError") {
        throw McpConnectionError.timeout(
          this.serverUrl,
          this.options.capabilityTimeout,
        );
      }

      const message =
        error instanceof Error ? error.message : "Unknown connection error";
      throw new McpConnectionError(
        `Failed to connect to MCP server: ${message}`,
        { serverUrl: this.serverUrl, originalError: error },
      );
    }
  }

  /**
   * Disconnect from MCP server and cleanup resources
   */
  async disconnect(): Promise<void> {
    this.logger.info(`Disconnecting from MCP server: ${this.serverUrl}`);

    this.status = ConnectionStatus.DISCONNECTED;
    await this.cleanup();

    this.logger.info(`Disconnected from MCP server: ${this.serverUrl}`);
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<McpToolDefinition[]> {
    if (!this.isConnected || !this.connection) {
      throw new McpConnectionError("Not connected to MCP server", {
        serverUrl: this.serverUrl,
      });
    }

    try {
      this.logger.debug(`Listing tools from MCP server: ${this.serverUrl}`);

      const response = await this.connection.call<{
        tools: McpToolDefinition[];
      }>("tools/list");

      if (!response.tools || !Array.isArray(response.tools)) {
        throw McpToolError.discoveryFailed(
          this.serverUrl,
          "Invalid tools list response format",
        );
      }

      this.logger.debug(
        `Found ${response.tools.length} tools from MCP server: ${this.serverUrl}`,
      );
      return response.tools;
    } catch (error) {
      if (error instanceof McpToolError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw McpToolError.discoveryFailed(this.serverUrl, message);
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName: string, params: unknown): Promise<McpToolResult> {
    if (!this.isConnected || !this.connection) {
      throw new McpConnectionError("Not connected to MCP server", {
        serverUrl: this.serverUrl,
      });
    }

    try {
      this.logger.debug(
        `Calling tool '${toolName}' on MCP server: ${this.serverUrl}`,
      );

      const response = await this.connection.call<McpToolResult>("tools/call", {
        name: toolName,
        arguments: params,
      });

      this.logger.debug(
        `Tool '${toolName}' completed on MCP server: ${this.serverUrl}`,
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        // Check for JSON-RPC method not found
        if ("code" in error && error.code === -32601) {
          throw McpToolError.notFound(toolName, this.serverUrl);
        }

        // Check for invalid parameters
        if ("code" in error && error.code === -32602) {
          throw McpToolError.invalidParams(toolName, error.message);
        }
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw McpToolError.executionFailed(toolName, message);
    }
  }

  /**
   * Discover tools from MCP server and convert to ToolDefinition format
   *
   * This method provides tool discovery with automatic schema translation
   * to Bridge ToolDefinition format for seamless integration with the
   * existing tool system.
   */
  async discoverTools(): Promise<ToolDefinition[]> {
    const mcpTools = await this.listTools();
    return mcpTools.map((mcpTool) =>
      translateMcpToToolDefinition(this.convertToExternalMcpTool(mcpTool)),
    );
  }

  /**
   * Get a single tool definition by name in ToolDefinition format
   *
   * @param toolName - Name of the tool to retrieve
   * @returns ToolDefinition object or null if not found
   */
  async getToolDefinition(toolName: string): Promise<ToolDefinition | null> {
    const mcpTools = await this.listTools();
    const mcpTool = mcpTools.find((tool) => tool.name === toolName);

    if (!mcpTool) {
      return null;
    }

    return translateMcpToToolDefinition(this.convertToExternalMcpTool(mcpTool));
  }

  /**
   * Convert internal McpToolDefinition to external format
   */
  private convertToExternalMcpTool(
    internalTool: McpToolDefinition,
  ): ExternalMcpToolDefinition {
    return {
      name: internalTool.name,
      description: internalTool.description,
      inputSchema: internalTool.inputSchema
        ? (internalTool.inputSchema as ExternalMcpToolDefinition["inputSchema"])
        : undefined,
    };
  }

  /**
   * Perform MCP capability negotiation
   */
  private async negotiateCapabilities(): Promise<void> {
    if (!this.connection) {
      throw new McpConnectionError(
        "No connection available for capability negotiation",
        { serverUrl: this.serverUrl },
      );
    }

    try {
      this.logger.debug(
        `Starting capability negotiation with MCP server: ${this.serverUrl}`,
      );

      const request = createToolsOnlyRequest("llm-bridge", "1.0.0");
      const response = await this.connection.call<McpInitializeResponse>(
        "initialize",
        request.params,
      );

      // Validate response and ensure tools-only compliance
      validateInitializeResponse(this.serverUrl, response);

      this.logger.debug(
        `Capability negotiation successful with MCP server: ${this.serverUrl}`,
      );
    } catch (error) {
      this.logger.error(`Capability negotiation failed: ${String(error)}`);

      // Use error normalizer to handle capability errors properly
      const normalizedError = this.errorNormalizer.normalize(error, {
        serverUrl: this.serverUrl,
        operation: "capability_negotiation",
      });

      // Create appropriate capability error
      if (normalizedError.type === "ProviderError") {
        throw new McpCapabilityError(normalizedError.message, {
          ...normalizedError.context,
          serverUrl: this.serverUrl,
          originalError: error instanceof Error ? error.name : String(error),
        });
      }

      // Fallback to generic capability error
      throw new McpCapabilityError(
        `Capability negotiation failed: ${String(error)}`,
        {
          serverUrl: this.serverUrl,
          originalError: error instanceof Error ? error.name : String(error),
        },
      );
    }
  }

  /**
   * Start health monitoring timer
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      void this.checkConnectionHealth();
    }, this.options.healthCheckInterval);
  }

  /**
   * Check connection health and attempt reconnection if needed
   */
  private checkConnectionHealth(): void {
    if (!this.connection || !this.connection.isConnected) {
      this.logger.warn(`Connection lost to MCP server: ${this.serverUrl}`);
      void this.handleConnectionLoss();
    }
  }

  /**
   * Handle connection loss with exponential backoff reconnection
   */
  private handleConnectionLoss(): void {
    if (this.status === ConnectionStatus.RECONNECTING) {
      return; // Already attempting reconnection
    }

    this.status = ConnectionStatus.RECONNECTING;
    void this.cleanup();

    if (this.reconnectAttempts >= this.options.maxRetries) {
      this.logger.error(
        `Max reconnection attempts (${this.options.maxRetries}) reached for MCP server: ${this.serverUrl}`,
      );
      this.status = ConnectionStatus.FAILED;
      return;
    }

    const delay = this.backoffStrategy.calculateDelay(this.reconnectAttempts);
    this.reconnectAttempts++;

    this.logger.info(
      `Attempting reconnection ${this.reconnectAttempts}/${this.options.maxRetries} ` +
        `to MCP server ${this.serverUrl} in ${delay}ms`,
    );

    setTimeout(() => {
      void (async () => {
        try {
          await this.connect();
        } catch (error) {
          this.logger.error(
            `Reconnection attempt ${this.reconnectAttempts} failed for MCP server: ${this.serverUrl}`,
            { error },
          );

          if (this.reconnectAttempts < this.options.maxRetries) {
            this.handleConnectionLoss(); // Try again
          } else {
            this.status = ConnectionStatus.FAILED;
          }
        }
      })();
    }, delay);
  }

  /**
   * Cleanup resources and timers
   */
  private async cleanup(): Promise<void> {
    // Cancel any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Close connection
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        this.logger.warn("Error closing MCP connection", { error });
      }
      this.connection = null;
    }
  }
}
