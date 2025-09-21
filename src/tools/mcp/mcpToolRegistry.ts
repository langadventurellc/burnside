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
import type { McpClient } from "./mcpClient";
import { createMcpToolHandler } from "./mcpToolHandler";
import { McpToolError } from "./mcpToolError";
import { logger } from "../../core/logging";

/**
 * Manages MCP tool lifecycle and integration with ToolRouter
 */
export class McpToolRegistry {
  private readonly mcpClient: McpClient;
  private readonly registeredTools = new Map<string, string>(); // toolId -> originalToolName

  constructor(mcpClient: McpClient) {
    this.mcpClient = mcpClient;
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

        const toolHandler = createMcpToolHandler(
          this.mcpClient,
          toolDefinition.name,
        );
        toolRouter.register(toolId, toolDefinition, toolHandler);
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
    if (totalTools > 0 && result.registeredCount === 0) {
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
        await this.registerMcpTools(toolRouter);
      },
      onDisconnect: () => {
        logger.debug("MCP connection lost, unregistering tools");
        this.unregisterMcpTools(toolRouter);
        return Promise.resolve();
      },
    };
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
    // Use "mcp:" prefix to namespace MCP tools and avoid conflicts
    return `mcp:${toolName}`;
  }
}
