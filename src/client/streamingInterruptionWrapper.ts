import type { StreamDelta } from "./streamDelta";
import type { ToolCall } from "../core/tools/toolCall";
import type { ToolResult } from "../core/tools/toolResult";
import type { ToolExecutionContext } from "../core/tools/toolExecutionContext";
import type { ToolRouter } from "../core/tools/toolRouter";
import { StreamingStateMachine } from "../core/agent/streamingStateMachine";
import { BridgeError } from "../core/errors/bridgeError";

/**
 * Streaming Interruption Wrapper
 *
 * Wraps provider streaming responses to enable tool call detection and execution
 * during streaming. Coordinates pause/resume cycle for tool execution while
 * maintaining stream state and providing transparent interruption handling.
 *
 * @example
 * ```typescript
 * const wrapper = new StreamingInterruptionWrapper(toolRouter, messages);
 * const interruptibleStream = wrapper.wrap(providerStream);
 *
 * for await (const delta of interruptibleStream) {
 *   // Handle streaming deltas with automatic tool execution
 * }
 * ```
 */
export class StreamingInterruptionWrapper {
  private stateMachine: StreamingStateMachine;

  constructor(
    private toolRouter: ToolRouter,
    private context: ToolExecutionContext,
    stateMachine?: StreamingStateMachine,
  ) {
    this.stateMachine = stateMachine ?? new StreamingStateMachine();
  }

  /**
   * Wraps a provider stream with interruption handling capabilities.
   *
   * @param providerStream - Original AsyncIterable<StreamDelta> from provider
   * @returns AsyncIterable<StreamDelta> with tool execution interruption
   */
  async *wrap(
    providerStream: AsyncIterable<StreamDelta>,
  ): AsyncIterable<StreamDelta> {
    try {
      // Process stream through state machine
      const streamingResult =
        await this.stateMachine.handleStreamingResponse(providerStream);

      // Yield all accumulated content
      if (streamingResult.content) {
        yield {
          id: `chunk-${Date.now()}`,
          delta: { content: [{ type: "text", text: streamingResult.content }] },
          finished: false,
        };
      }

      // If tool calls detected, execute them
      if (
        streamingResult.detectedToolCalls &&
        streamingResult.detectedToolCalls.length > 0
      ) {
        yield* this.handleToolExecution(streamingResult.detectedToolCalls);
      }

      // Yield final completion marker
      yield {
        id: `chunk-final-${Date.now()}`,
        delta: {},
        finished: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BridgeError(
        `Streaming interruption failed: ${errorMessage}`,
        "STREAMING_INTERRUPTION_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Handles tool execution during streaming interruption.
   *
   * @param toolCalls - Tool calls detected during streaming
   * @returns AsyncIterable<StreamDelta> with tool execution results
   */
  private async *handleToolExecution(
    toolCalls: ToolCall[],
  ): AsyncIterable<StreamDelta> {
    try {
      // Execute tools sequentially
      const toolResults: ToolResult[] = [];

      for (const toolCall of toolCalls) {
        const result = await this.toolRouter.execute(toolCall, this.context);
        toolResults.push(result);

        // Yield tool execution progress
        yield {
          id: `tool-progress-${toolCall.id}`,
          delta: {
            content: [
              { type: "text", text: `[Tool: ${toolCall.name} executed]` },
            ],
          },
          finished: false,
        };
      }

      // Yield tool results as content
      for (const result of toolResults) {
        const resultContent = result.success
          ? JSON.stringify(result.data)
          : `Error: ${result.error?.message}`;
        yield {
          id: `tool-result-${result.callId}`,
          delta: {
            content: [{ type: "text", text: `Tool result: ${resultContent}` }],
          },
          finished: false,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BridgeError(
        `Tool execution during streaming failed: ${errorMessage}`,
        "TOOL_EXECUTION_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Determines if streaming interruption should be enabled based on request.
   *
   * @param hasTools - Whether the request includes tools
   * @returns True if interruption should be enabled
   */
  static shouldEnableInterruption(hasTools: boolean): boolean {
    return hasTools;
  }
}
