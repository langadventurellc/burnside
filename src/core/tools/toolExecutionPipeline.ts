/**
 * Tool Execution Pipeline
 *
 * Implements the complete execution pipeline for tool calls with validation,
 * preparation, execution, and normalization stages. All stages include
 * comprehensive error handling that converts failures to ToolResult format.
 */

import type { ToolCall } from "./toolCall";
import type { ToolResult } from "./toolResult";
import type { ToolExecutionContext } from "./toolExecutionContext";
import type { ToolDefinition } from "./toolDefinition";
import type { ToolHandler } from "./toolHandler";
import type { PreparedContext } from "./preparedContext";
import type { ExecutionContext } from "./executionContext";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import { validateToolCall } from "./pipelineValidation";
import { prepareExecution } from "./pipelinePreparation";
import { executeToolHandler } from "./pipelineExecution";
import { normalizeResult } from "./pipelineNormalization";
import { logger } from "../logging";

/**
 * Complete execution pipeline orchestrator
 */
export class ExecutionPipeline {
  /**
   * Execute complete pipeline with error boundaries at each stage
   */
  async execute(
    toolCall: ToolCall,
    toolDefinition: ToolDefinition,
    toolHandler: ToolHandler,
    executionContext: ToolExecutionContext,
    timeoutMs: number = 5000,
    runtimeAdapter: RuntimeAdapter,
  ): Promise<ToolResult> {
    logger.debug("Pipeline execution started", {
      toolName: toolCall?.name || "unknown",
      callId: toolCall?.id || "unknown",
      timeout: timeoutMs,
    });

    try {
      // Validate pipeline inputs
      if (!toolHandler || typeof toolHandler !== "function") {
        throw new Error("Invalid tool handler provided to pipeline");
      }

      // Stage 1: Validation
      logger.debug("Pipeline stage 1: Validation", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
      });

      const validationError = validateToolCall(toolCall, toolDefinition);
      if (validationError) {
        logger.warn("Pipeline validation failed", {
          toolName: toolCall?.name || "unknown",
          callId: toolCall?.id || "unknown",
          validationError: validationError.error?.message,
        });
        return normalizeResult(validationError);
      }

      // Stage 2: Preparation
      logger.debug("Pipeline stage 2: Preparation", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
      });

      const preparationResult = prepareExecution(
        toolCall,
        toolDefinition,
        executionContext,
      );

      // Check if preparation returned an error ToolResult
      if ("success" in preparationResult && !preparationResult.success) {
        return normalizeResult(preparationResult);
      }

      // Type guard to ensure we have PreparedContext
      const preparedContext = preparationResult as PreparedContext;

      // Add missing properties to create ExecutionContext
      const context: ExecutionContext = {
        ...preparedContext,
        toolHandler,
        timeoutMs,
        runtimeAdapter,
      };

      // Stage 3: Execution
      logger.debug("Pipeline stage 3: Execution", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
      });

      const executionResult = await executeToolHandler(context);

      // Stage 4: Normalization
      logger.debug("Pipeline stage 4: Normalization", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
      });

      return normalizeResult(executionResult);
    } catch (error) {
      logger.error("Pipeline execution failed", {
        toolName: toolCall?.name || "unknown",
        callId: toolCall?.id || "unknown",
        error: error instanceof Error ? error.message : String(error),
        stage: "pipeline_orchestration",
      });

      // Pipeline-level error boundary
      return normalizeResult({
        callId: toolCall?.id || "unknown",
        success: false,
        error: {
          code: "pipeline_error",
          message: "Tool execution pipeline failed",
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
            toolCall,
            stage: "pipeline_orchestration",
          },
        },
        metadata: {
          executionTime: 0,
        },
      });
    }
  }
}
