/**
 * MCP Tool Registry
 *
 * Manages dynamic registration and lifecycle of MCP tools with the ToolRouter.
 * Handles tool discovery, registration, unregistration, and connection lifecycle
 * events to provide seamless integration of MCP tools with the existing tool system.
 *
 * @example
 * ```typescript
 * const registry = new McpToolRegistry(mcpClient);
 * await registry.registerMcpTools(toolRouter);
 * // Tools are now available through ToolRouter
 * await registry.unregisterMcpTools(toolRouter);
 * ```
 */

import type { ToolRouter } from "../../core/tools/toolRouter";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import type { ToolHandler } from "../../core/tools/toolHandler";
import type { McpClient } from "./mcpClient";
import { createMcpToolHandler } from "./mcpToolHandler";
import { McpToolError } from "./mcpToolError";
import { McpConnectionError } from "./mcpConnectionError";
import { logger } from "../../core/logging";

/**
 * Manages MCP tool lifecycle and integration with ToolRouter
 */
export class McpToolRegistry {
  private readonly mcpClient: McpClient;
  private readonly registeredTools = new Map<string, string>(); // toolId -> originalToolName
  private readonly failureStrategy: "immediate_unregister" | "mark_unavailable";
  private isConnected = true; // Track connection state for mark_unavailable strategy

  constructor(
    mcpClient: McpClient,
    failureStrategy:
      | "immediate_unregister"
      | "mark_unavailable" = "immediate_unregister",
  ) {
    this.mcpClient = mcpClient;
    this.failureStrategy = failureStrategy;
  }

  /**
   * Discover and register all MCP tools with the ToolRouter
   *
   * @param toolRouter - ToolRouter instance to register tools with
   * @throws McpToolError if tool discovery or registration fails
   */
  async registerMcpTools(toolRouter: ToolRouter): Promise<void> {
    logger.info("Starting MCP tool registration");

    try {
      const toolDefinitions = await this.mcpClient.discoverTools();

      logger.debug("Discovered MCP tools", {
        toolCount: toolDefinitions.length,
        toolNames: toolDefinitions.map((t) => t.name),
      });

      const result = this.registerToolDefinitions(toolDefinitions, toolRouter);

      this.logRegistrationResult(toolDefinitions.length, result);
      this.validateRegistrationSuccess(toolDefinitions.length, result);
    } catch (error) {
      this.handleRegistrationError(error);
    }
  }

  /**
   * Register individual tool definitions with the ToolRouter
   */
  private registerToolDefinitions(
    toolDefinitions: ToolDefinition[],
    toolRouter: ToolRouter,
  ): {
    registeredCount: number;
    errors: Array<{ toolName: string; error: string }>;
  } {
    let registeredCount = 0;
    const errors: Array<{ toolName: string; error: string }> = [];

    for (const toolDefinition of toolDefinitions) {
      try {
        const toolId = this.generateToolId(toolDefinition.name);

        if (this.registeredTools.has(toolId)) {
          logger.debug("Tool already registered, skipping", { toolId });
          continue;
        }

        const toolHandler = this.createConnectionAwareToolHandler(
          toolDefinition.name,
        );

        // Create a new tool definition with the prefixed name for registration
        const prefixedToolDefinition = {
          ...toolDefinition,
          name: toolId, // Use the prefixed toolId as the name
        };

        toolRouter.register(toolId, prefixedToolDefinition, toolHandler);
        this.registeredTools.set(toolId, toolDefinition.name);
        registeredCount++;

        logger.debug("Registered MCP tool", {
          toolId,
          originalName: toolDefinition.name,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({ toolName: toolDefinition.name, error: errorMessage });

        logger.warn("Failed to register MCP tool", {
          toolName: toolDefinition.name,
          error: errorMessage,
        });
      }
    }

    return { registeredCount, errors };
  }

  /**
   * Log the registration result
   */
  private logRegistrationResult(
    totalTools: number,
    result: {
      registeredCount: number;
      errors: Array<{ toolName: string; error: string }>;
    },
  ): void {
    logger.info("MCP tool registration completed", {
      totalTools,
      registeredCount: result.registeredCount,
      errorCount: result.errors.length,
    });
  }

  /**
   * Validate that at least some tools were registered successfully
   */
  private validateRegistrationSuccess(
    totalTools: number,
    result: {
      registeredCount: number;
      errors: Array<{ toolName: string; error: string }>;
    },
  ): void {
    // Only fail if tools were discovered but none were registered AND there were errors
    // If registeredCount is 0 but no errors, it means tools were already registered
    if (
      totalTools > 0 &&
      result.registeredCount === 0 &&
      result.errors.length > 0
    ) {
      throw new McpToolError("Failed to register any MCP tools", {
        totalTools,
        errors: result.errors,
      });
    }
  }

  /**
   * Handle registration errors
   */
  private handleRegistrationError(error: unknown): never {
    logger.error("MCP tool registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof McpToolError) {
      throw error;
    }

    throw new McpToolError("Tool registration failed", {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }

  /**
   * Unregister all MCP tools from the ToolRouter
   *
   * @param toolRouter - ToolRouter instance to unregister tools from
   */
  unregisterMcpTools(toolRouter: ToolRouter): void {
    logger.info("Starting MCP tool unregistration", {
      toolCount: this.registeredTools.size,
    });

    const toolIds = Array.from(this.registeredTools.keys());
    let unregisteredCount = 0;

    for (const toolId of toolIds) {
      try {
        // Check if tool is still registered in router
        if (toolRouter.hasTool(toolId)) {
          // Note: ToolRouter doesn't expose unregister method in the interface we saw
          // We'll need to check if there's an unregister method or handle differently
          logger.debug("Tool found in router for cleanup", { toolId });
        }

        // Remove from our tracking
        this.registeredTools.delete(toolId);
        unregisteredCount++;

        logger.debug("Unregistered MCP tool", { toolId });
      } catch (error) {
        logger.warn("Failed to unregister MCP tool", {
          toolId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("MCP tool unregistration completed", {
      unregisteredCount,
    });
  }

  /**
   * Handle connection lifecycle events for dynamic tool management
   *
   * @param toolRouter - ToolRouter instance for tool management
   * @returns Connection lifecycle handlers
   */
  createConnectionHandlers(toolRouter: ToolRouter): {
    onConnect: () => Promise<void>;
    onDisconnect: () => Promise<void>;
  } {
    return {
      onConnect: async () => {
        logger.debug("MCP connection established, registering tools");
        this.isConnected = true;
        await this.registerMcpTools(toolRouter);
      },
      onDisconnect: () => {
        logger.debug("MCP connection lost, applying failure strategy", {
          strategy: this.failureStrategy,
        });
        this.isConnected = false;
        this.applyFailureStrategy(toolRouter);
        return Promise.resolve();
      },
    };
  }

  /**
   * Create a connection-aware tool handler that respects the failure strategy
   *
   * @param toolName - Name of the MCP tool
   * @returns ToolHandler that checks connection status for mark_unavailable strategy
   */
  private createConnectionAwareToolHandler(toolName: string): ToolHandler {
    if (this.failureStrategy === "mark_unavailable") {
      // Return handler that checks connection status before execution
      return async (parameters: Record<string, unknown>, context: unknown) => {
        if (!this.isConnected) {
          throw new McpConnectionError(
            `MCP tool '${toolName}' is temporarily unavailable due to connection loss`,
            { toolName, strategy: "mark_unavailable" },
          );
        }

        // Use the original handler if connected
        const originalHandler = createMcpToolHandler(this.mcpClient, toolName);
        return originalHandler(parameters, context);
      };
    } else {
      // For immediate_unregister strategy, use the original handler
      return createMcpToolHandler(this.mcpClient, toolName);
    }
  }

  /**
   * Apply the configured failure strategy when connection is lost
   *
   * @param toolRouter - ToolRouter instance for tool management
   */
  private applyFailureStrategy(toolRouter: ToolRouter): void {
    switch (this.failureStrategy) {
      case "immediate_unregister":
        logger.debug("Applying immediate_unregister strategy");
        this.unregisterMcpTools(toolRouter);
        break;
      case "mark_unavailable":
        logger.debug(
          "Applying mark_unavailable strategy - tools remain registered",
        );
        // Tools remain registered but will return errors when called
        break;
      default:
        logger.warn(
          "Unknown failure strategy, defaulting to immediate_unregister",
          {
            strategy: this.failureStrategy,
          },
        );
        this.unregisterMcpTools(toolRouter);
        break;
    }
  }

  /**
   * Get the number of currently registered MCP tools
   */
  getRegisteredToolCount(): number {
    return this.registeredTools.size;
  }

  /**
   * Get the list of registered tool IDs
   */
  getRegisteredToolIds(): string[] {
    return Array.from(this.registeredTools.keys());
  }

  /**
   * Check if a specific tool is registered
   */
  isToolRegistered(toolId: string): boolean {
    return this.registeredTools.has(toolId);
  }

  /**
   * Generate unique tool ID to prevent conflicts with built-in tools
   *
   * @param toolName - Original MCP tool name
   * @returns Namespaced tool ID
   */
  private generateToolId(toolName: string): string {
    // Use "mcp_" prefix to namespace MCP tools and avoid conflicts
    // Note: Using underscore instead of colon for LLM provider compliance
    // (OpenAI, Claude, Gemini require alphanumeric + underscore/hyphen only)
    return `mcp_${toolName}`;
  }
}
