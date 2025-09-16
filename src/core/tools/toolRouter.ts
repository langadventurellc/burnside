/**
 * Tool Router
 *
 * Central orchestration class for tool execution with validation, routing,
 * timeout handling, and result normalization. This is the main entry point
 * for all tool execution in the system.
 *
 * Delegates registration and discovery to ToolRegistry while providing
 * comprehensive execution pipeline with error boundaries.
 */

import type { ToolCall } from "./toolCall.js";
import type { ToolResult } from "./toolResult.js";
import type { ToolExecutionContext } from "./toolExecutionContext.js";
import type { ToolDefinition } from "./toolDefinition.js";
import type { ToolHandler } from "./toolHandler.js";
import type { ToolRegistry } from "./toolRegistry.js";
import { ExecutionPipeline } from "./toolExecutionPipeline.js";

/**
 * Central ToolRouter class that orchestrates tool execution
 */
export class ToolRouter {
  private registry: ToolRegistry;
  private defaultTimeoutMs: number;
  private pipeline: ExecutionPipeline;

  constructor(registry: ToolRegistry, defaultTimeoutMs = 5000) {
    this.registry = registry;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.pipeline = new ExecutionPipeline();
  }

  /**
   * Register a tool with name, definition, and handler (delegates to registry)
   */
  register(
    toolName: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void {
    this.registry.register(toolName, definition, handler);
  }

  /**
   * Core execution method with comprehensive error handling
   */
  async execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
    timeoutMs?: number,
  ): Promise<ToolResult> {
    try {
      // Check if tool exists in registry
      const registryEntry = this.registry.get(toolCall.name);
      if (!registryEntry) {
        return {
          callId: toolCall.id,
          success: false,
          error: {
            code: "tool_not_found",
            message: `Tool '${toolCall.name}' not found`,
            details: {
              toolName: toolCall.name,
              availableTools: this.registry.getNames(),
            },
          },
          metadata: {
            executionTime: 0,
          },
        };
      }

      // Use provided timeout or default
      const executionTimeout = timeoutMs ?? this.defaultTimeoutMs;

      // Execute using pipeline
      return await this.pipeline.execute(
        toolCall,
        registryEntry.definition,
        registryEntry.handler,
        context,
        executionTimeout,
      );
    } catch (error) {
      // Router-level error boundary
      return {
        callId: toolCall?.id || "unknown",
        success: false,
        error: {
          code: "router_error",
          message: "Tool router execution failed",
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
            toolCall,
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
        metadata: {
          executionTime: 0,
        },
      };
    }
  }

  /**
   * Get all registered tools (delegates to registry)
   */
  getRegisteredTools(): ToolDefinition[] {
    const allEntries = this.registry.getAll();
    return Array.from(allEntries.values()).map((entry) => entry.definition);
  }

  /**
   * Check if tool is registered (delegates to registry)
   */
  hasTool(toolName: string): boolean {
    return this.registry.has(toolName);
  }
}
