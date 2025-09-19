/**
 * Default Conversation Continuation Logic
 *
 * Provides default conversation continuation recommendations based on
 * multi-turn state analysis, iteration limits, and response content patterns.
 */

import type { Message } from "../messages/message";
import type { MultiTurnState } from "../agent/multiTurnState";

/**
 * Default conversation continuation logic based on multi-turn state analysis.
 *
 * Provides intelligent conversation continuation recommendations based on
 * iteration limits, termination reasons, tool execution patterns, and
 * response content analysis.
 *
 * @param response - The response to analyze for continuation signals
 * @param multiTurnState - Current multi-turn conversation state
 * @returns Continuation recommendation with reasoning
 *
 * @example Basic usage
 * ```typescript
 * const recommendation = defaultShouldContinueConversation({
 *   message: { role: "assistant", content: [{ type: "text", text: "Task completed!" }] },
 *   model: "gpt-4"
 * }, {
 *   iteration: 3,
 *   totalIterations: 10,
 *   shouldContinue: true,
 *   terminationReason: undefined
 * });
 * console.log(recommendation.shouldContinue); // false (completion detected)
 * ```
 */
export function defaultShouldContinueConversation(
  response: {
    message: Message;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    };
    model: string;
    metadata?: Record<string, unknown>;
  },
  multiTurnState: MultiTurnState,
): {
  shouldContinue: boolean;
  reason?: string;
  confidence?: number;
} {
  // Check for explicit termination reason
  if (multiTurnState.terminationReason) {
    return {
      shouldContinue: false,
      reason: `Explicit termination: ${multiTurnState.terminationReason}`,
      confidence: 1.0,
    };
  }

  // Check iteration limits
  if (multiTurnState.iteration >= multiTurnState.totalIterations) {
    return {
      shouldContinue: false,
      reason: "Maximum iterations reached",
      confidence: 1.0,
    };
  }

  // Check if agent loop has already decided to stop
  if (!multiTurnState.shouldContinue) {
    return {
      shouldContinue: false,
      reason: "Agent loop decided to stop",
      confidence: 1.0,
    };
  }

  // Analyze response content for completion signals
  const messageContent = extractTextContent(response.message);
  const completionIndicators = [
    "task completed",
    "finished",
    "done",
    "complete",
    "that's all",
    "no further",
    "nothing more",
  ];

  const hasCompletionSignal = completionIndicators.some((indicator) =>
    messageContent.toLowerCase().includes(indicator),
  );

  if (hasCompletionSignal) {
    return {
      shouldContinue: false,
      reason: "Completion signal detected in response",
      confidence: 0.8,
    };
  }

  // Check for pending tool calls (should continue to execute them)
  if (multiTurnState.pendingToolCalls.length > 0) {
    return {
      shouldContinue: true,
      reason: "Pending tool calls require execution",
      confidence: 1.0,
    };
  }

  // Default to continue for normal conversation flow
  return {
    shouldContinue: true,
    reason: "Normal conversation flow",
    confidence: 0.6,
  };
}

/**
 * Extract text content from a message for analysis.
 *
 * @param message - Message to extract text from
 * @returns Combined text content
 */
function extractTextContent(message: Message): string {
  if (Array.isArray(message.content)) {
    return message.content
      .filter((content) => content.type === "text")
      .map((content) => content.text || "")
      .join(" ");
  } else {
    return message.content || "";
  }
}
