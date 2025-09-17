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
import { validateToolCall } from "./pipelineValidation";
import { prepareExecution } from "./pipelinePreparation";
import { executeToolHandler } from "./pipelineExecution";
import { normalizeResult } from "./pipelineNormalization";

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
  ): Promise<ToolResult> {
    try {
      // Validate pipeline inputs
      if (!toolHandler || typeof toolHandler !== "function") {
        throw new Error("Invalid tool handler provided to pipeline");
      }

      // Stage 1: Validation
      const validationError = validateToolCall(toolCall, toolDefinition);
      if (validationError) {
        return normalizeResult(validationError);
      }

      // Stage 2: Preparation
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
      };

      // Stage 3: Execution
      const executionResult = await executeToolHandler(context);

      // Stage 4: Normalization
      return normalizeResult(executionResult);
    } catch (error) {
      // Pipeline-level error boundary
      return normalizeResult({
        callId: toolCall.id,
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
