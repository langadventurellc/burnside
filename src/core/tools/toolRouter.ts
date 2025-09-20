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

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolDefinition } from "./toolDefinition";
import type { ToolHandler } from "./toolHandler";
import type { ToolRegistry } from "./toolRegistry";
import type { ToolExecutionStrategy } from "./toolExecutionStrategy";
import type { ToolExecutionOptions } from "./toolExecutionOptions";
import type { ToolExecutionResult } from "./toolExecutionResult";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import { ExecutionPipeline } from "./toolExecutionPipeline";
import { SequentialExecutionStrategy } from "./sequentialExecutionStrategy";
import { ParallelExecutionStrategy } from "./parallelExecutionStrategy";
import { createCancellationError } from "../agent/cancellation";
import { logger } from "../logging";

/**
 * Central ToolRouter class that orchestrates tool execution
 */
export class ToolRouter {
  private registry: ToolRegistry;
  private defaultTimeoutMs: number;
  private pipeline: ExecutionPipeline;
  private strategyCache = new Map<string, ToolExecutionStrategy>();
  private runtimeAdapter: RuntimeAdapter;

  constructor(
    registry: ToolRegistry,
    defaultTimeoutMs = 5000,
    runtimeAdapter: RuntimeAdapter,
  ) {
    this.registry = registry;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.runtimeAdapter = runtimeAdapter;
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
    const startTime = Date.now();
    const executionTimeout = timeoutMs ?? this.defaultTimeoutMs;

    logger.debug("Tool execution started", {
      toolName: toolCall?.name || "unknown",
      callId: toolCall?.id || "unknown",
      timeout: executionTimeout,
      hasParameters: Boolean(
        toolCall?.parameters && Object.keys(toolCall.parameters).length > 0,
      ),
    });

    try {
      // Check if tool exists in registry
      const registryEntry = this.registry.get(toolCall.name);
      if (!registryEntry) {
        const toolName = toolCall?.name || "unknown";
        const callId = toolCall?.id || "unknown";

        logger.warn("Tool not found in registry", {
          toolName,
          callId,
          availableTools: this.registry.getNames(),
        });

        return {
          callId,
          success: false,
          error: {
            code: "tool_not_found",
            message: `Tool '${toolName}' not found`,
            details: {
              toolName,
              availableTools: this.registry.getNames(),
            },
          },
          metadata: {
            executionTime: 0,
          },
        };
      }

      logger.info("Tool execution started", {
        toolName: toolCall.name,
        callId: toolCall.id,
        timeout: executionTimeout,
      });

      // Execute using pipeline
      const result = await this.pipeline.execute(
        toolCall,
        registryEntry.definition,
        registryEntry.handler,
        context,
        executionTimeout,
        this.runtimeAdapter,
      );

      const executionTime = Date.now() - startTime;

      if (result.success) {
        logger.info("Tool execution completed successfully", {
          toolName: toolCall.name,
          callId: toolCall.id,
          executionTime,
        });
      } else {
        logger.error("Tool execution failed", {
          toolName: toolCall.name,
          callId: toolCall.id,
          executionTime,
          errorCode: result.error?.code,
          errorMessage: result.error?.message,
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error("Tool router execution failed", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
        executionTime,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

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
          executionTime,
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

  /**
   * Execute multiple tool calls using configurable strategy
   */
  async executeMultiple(
    toolCalls: ToolCall[],
    context: ToolExecutionContext,
    options: ToolExecutionOptions,
  ): Promise<ToolExecutionResult> {
    // Check for cancellation before starting
    if (options.signal?.aborted) {
      throw createCancellationError(
        "Tool execution cancelled before starting",
        "tool_calls",
        true,
      );
    }

    // Validate options
    this.validateExecutionOptions(options);

    // Get strategy for execution
    const strategy = this.getExecutionStrategy(options);

    try {
      // Execute using strategy
      return await strategy.execute(toolCalls, this, context, options);
    } catch (error) {
      // Router-level error boundary
      return {
        results: [],
        success: false,
        metadata: {
          totalExecutionTime: 0,
          successCount: 0,
          errorCount: toolCalls.length,
          strategyMetadata: {
            strategy: "unknown",
            error: "router_execution_failed",
          },
        },
        firstError: {
          toolCallId: toolCalls[0]?.id || "unknown",
          error: {
            code: "router_error",
            message: "Multiple tool execution failed at router level",
            details: {
              originalError:
                error instanceof Error ? error.message : String(error),
              toolCalls,
              stack: error instanceof Error ? error.stack : undefined,
            },
          },
        },
      };
    }
  }

  /**
   * Get execution strategy based on options with caching
   */
  private getExecutionStrategy(
    options: ToolExecutionOptions,
  ): ToolExecutionStrategy {
    const strategyKey = `${options.errorHandling}-${options.maxConcurrentTools || 3}`;

    let strategy = this.strategyCache.get(strategyKey);
    if (!strategy) {
      // Default to sequential if not specified
      if (options.maxConcurrentTools === 1) {
        strategy = new SequentialExecutionStrategy();
      } else {
        strategy = new ParallelExecutionStrategy();
      }
      this.strategyCache.set(strategyKey, strategy);
    }

    return strategy;
  }

  /**
   * Validate execution options
   */
  private validateExecutionOptions(options: ToolExecutionOptions): void {
    if (
      options.maxConcurrentTools !== undefined &&
      options.maxConcurrentTools < 1
    ) {
      throw new Error("maxConcurrentTools must be at least 1");
    }

    if (options.toolTimeoutMs !== undefined && options.toolTimeoutMs < 0) {
      throw new Error("toolTimeoutMs must be non-negative");
    }

    if (!["fail-fast", "continue-on-error"].includes(options.errorHandling)) {
      throw new Error(
        "errorHandling must be 'fail-fast' or 'continue-on-error'",
      );
    }

    if (
      options.cancellationMode !== undefined &&
      !["graceful", "immediate"].includes(options.cancellationMode)
    ) {
      throw new Error("cancellationMode must be 'graceful' or 'immediate'");
    }

    if (
      options.gracefulCancellationTimeoutMs !== undefined &&
      options.gracefulCancellationTimeoutMs < 0
    ) {
      throw new Error("gracefulCancellationTimeoutMs must be non-negative");
    }
  }
}
