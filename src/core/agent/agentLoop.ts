/**
 * Agent Loop Implementation
 *
 * Main agent loop implementation with single-turn execution capability.
 * Provides orchestration between tool calls and conversation continuation,
 * handling tool execution, result formatting, and flow control.
 */

import type { Message } from "../messages/message";
import type { ContentPart } from "../messages/contentPart";
import type { ToolCall } from "../tools/toolCall";
import type { ToolResult } from "../tools/toolResult";
import type { ToolRouter } from "../tools/toolRouter";
import type { AgentExecutionOptions } from "./agentExecutionOptions";
import { createExecutionContext } from "./agentExecutionContext";

/**
 * Agent Loop class for single-turn tool execution and conversation flow
 *
 * Orchestrates tool execution within conversation flow, providing stateless
 * single-turn execution with proper message formatting and continuation logic.
 * Handles tool result conversion to message format and determines conversation
 * continuation status.
 *
 * @example
 * ```typescript
 * const agentLoop = new AgentLoop(toolRouter, {
 *   maxToolCalls: 1,
 *   timeoutMs: 10000,
 *   continueOnToolError: true
 * });
 *
 * const result = await agentLoop.executeSingleTurn(
 *   messages,
 *   toolCall,
 *   router
 * );
 * ```
 */
export class AgentLoop {
  private defaultOptions: Required<AgentExecutionOptions>;

  constructor(
    private toolRouter: ToolRouter,
    defaultOptions: AgentExecutionOptions = {},
  ) {
    this.defaultOptions = {
      maxToolCalls: defaultOptions.maxToolCalls ?? 1,
      timeoutMs: defaultOptions.timeoutMs ?? 30000,
      toolTimeoutMs: defaultOptions.toolTimeoutMs ?? 5000,
      continueOnToolError: defaultOptions.continueOnToolError ?? true,
    };
  }

  /**
   * Execute single tool call and resume conversation flow
   *
   * Core method for single-turn execution as specified in requirements.
   * Executes tool call through router, converts result to message format,
   * appends to conversation, and determines continuation status.
   *
   * @param messages - Current conversation message history
   * @param toolCall - Tool call to execute
   * @param router - Tool router for execution (allows override)
   * @returns Updated messages and continuation flag
   */
  async executeSingleTurn(
    messages: Message[],
    toolCall: ToolCall,
    router: ToolRouter,
  ): Promise<{ updatedMessages: Message[]; shouldContinue: boolean }> {
    try {
      // 1. Execute tool call through router
      const context = this.createContext(messages);
      const result = await router.execute(
        toolCall,
        context,
        this.defaultOptions.toolTimeoutMs,
      );

      // 2. Convert tool result to message format
      const toolResultMessage = this.formatToolResultAsMessage(
        toolCall,
        result,
      );

      // 3. Append to conversation
      const updatedMessages = [...messages, toolResultMessage];

      // 4. Determine if conversation should continue
      const shouldContinue = this.determineContinuation(result);

      return { updatedMessages, shouldContinue };
    } catch (error) {
      // Handle execution errors gracefully
      const errorMessage = this.formatErrorAsMessage(toolCall, error);
      const updatedMessages = [...messages, errorMessage];

      // Continue conversation on error if configured to do so
      const shouldContinue = this.defaultOptions.continueOnToolError;

      return { updatedMessages, shouldContinue };
    }
  }

  /**
   * Create execution context from message history
   *
   * Generates ToolExecutionContext with conversation metadata and unique
   * context ID for tool execution tracking and security constraints.
   *
   * @param messages - Message history for context extraction
   * @returns ToolExecutionContext for tool execution
   */
  private createContext(messages: Message[]) {
    return createExecutionContext(messages, {
      environment: "agent-loop-execution",
      permissions: ["read", "execute"],
    });
  }

  /**
   * Format tool result as message with role="tool"
   *
   * Converts ToolResult to Message format for conversation integration.
   * Includes tool call ID for linking, formats content based on success/error
   * state, and preserves execution metadata.
   *
   * @param call - Original tool call for reference
   * @param result - Tool execution result
   * @returns Formatted message for conversation
   */
  private formatToolResultAsMessage(
    call: ToolCall,
    result: ToolResult,
  ): Message {
    const content: ContentPart[] = [];

    if (result.success) {
      // Format successful result
      const resultText = this.formatSuccessfulResult(result);
      content.push({ type: "text", text: resultText });
    } else {
      // Format error result
      const errorText = this.formatErrorResult(result);
      content.push({ type: "text", text: errorText });
    }

    return {
      id: `tool-result-${result.callId}`,
      role: "tool",
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        toolCallId: call.id,
        toolName: call.name,
        executionSuccess: result.success,
        executionTime: result.metadata?.executionTime,
        ...(result.metadata || {}),
      },
    };
  }

  /**
   * Format error as message when execution fails
   *
   * Creates a tool result message for execution errors that don't come
   * from the tool itself (e.g., router errors, timeout errors).
   *
   * @param call - Original tool call that failed
   * @param error - Error that occurred during execution
   * @returns Formatted error message
   */
  private formatErrorAsMessage(call: ToolCall, error: unknown): Message {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      id: `tool-error-${call.id}`,
      role: "tool",
      content: [
        {
          type: "text",
          text: `Tool execution failed: ${errorMessage}`,
        },
      ],
      timestamp: new Date().toISOString(),
      metadata: {
        toolCallId: call.id,
        toolName: call.name,
        executionSuccess: false,
        errorType: "execution_error",
        errorMessage,
      },
    };
  }

  /**
   * Format successful tool result as text content
   *
   * Converts successful ToolResult data to human-readable text format
   * for conversation display.
   *
   * @param result - Successful tool result
   * @returns Formatted text representation
   */
  private formatSuccessfulResult(result: ToolResult): string {
    if (!result.success) {
      throw new Error("Cannot format unsuccessful result as success");
    }

    // If result has data, format it
    if (result.data !== undefined) {
      if (typeof result.data === "string") {
        return result.data;
      }
      if (typeof result.data === "object" && result.data !== null) {
        return JSON.stringify(result.data, null, 2);
      }
      if (typeof result.data === "number" || typeof result.data === "boolean") {
        return String(result.data);
      }
      // For other primitive types, use JSON.stringify for safe conversion
      return JSON.stringify(result.data);
    }

    // Fallback to a generic success message
    return "Tool executed successfully";
  }

  /**
   * Format error tool result as text content
   *
   * Converts failed ToolResult error information to human-readable text
   * format for conversation display.
   *
   * @param result - Failed tool result
   * @returns Formatted error text
   */
  private formatErrorResult(result: ToolResult): string {
    if (result.success) {
      throw new Error("Cannot format successful result as error");
    }

    const error = result.error;
    if (!error) {
      return "Tool execution failed: Unknown error";
    }

    let errorText = `Tool execution failed: ${error.message}`;

    // Include error code if available
    if (error.code) {
      errorText = `Tool execution failed (${error.code}): ${error.message}`;
    }

    // Include details if available and useful
    if (error.details && typeof error.details === "object") {
      const detailsText = JSON.stringify(error.details, null, 2);
      errorText += `\nDetails: ${detailsText}`;
    }

    return errorText;
  }

  /**
   * Determine conversation continuation based on tool result
   *
   * Analyzes tool execution result to determine if conversation should
   * continue. For Phase 5, focuses on single-turn execution with simple
   * continuation logic.
   *
   * @param result - Tool execution result
   * @returns Whether conversation should continue
   */
  private determineContinuation(result: ToolResult): boolean {
    // For successful executions, generally continue
    if (result.success) {
      return true;
    }

    // For errors, continue based on configuration
    return this.defaultOptions.continueOnToolError;
  }
}
