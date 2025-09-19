/**
 * Termination Analysis Logic
 *
 * Centralized termination analysis that works with or without provider plugins,
 * providing intelligent conversation termination decisions based on
 * UnifiedTerminationSignal analysis and conversation context.
 */

import type { Message } from "../messages/message";
import type { MultiTurnState } from "./multiTurnState";
import type { ProviderPlugin } from "../providers/providerPlugin";
import type { UnifiedTerminationSignal } from "./unifiedTerminationSignal";
import type { ConversationContext } from "./conversationContext";
import { BridgeError } from "../errors/bridgeError";

/**
 * Analyze conversation termination using provider-aware detection
 *
 * Extracts the latest assistant message and analyzes it for termination signals,
 * using provider.detectTermination() if available or falling back to
 * defaultDetectTermination. Includes conversation context analysis.
 *
 * @param messages - Current conversation messages
 * @param state - Current multi-turn state
 * @param provider - Optional provider plugin for enhanced detection
 * @returns UnifiedTerminationSignal with termination analysis
 */
export function analyzeConversationTermination(
  messages: Message[],
  state: MultiTurnState,
  provider?: ProviderPlugin,
): UnifiedTerminationSignal {
  // Handle edge case: empty message arrays
  if (messages.length === 0) {
    return {
      shouldTerminate: false,
      reason: "unknown",
      confidence: "low",
      providerSpecific: {
        originalField: "message_count",
        originalValue: "0",
        metadata: { context: "empty_conversation" },
      },
      message: "No messages to analyze for termination",
    };
  }

  // Find the latest assistant message for termination analysis
  const latestAssistantMessage = findLatestAssistantMessage(messages);
  if (!latestAssistantMessage) {
    return {
      shouldTerminate: false,
      reason: "unknown",
      confidence: "low",
      providerSpecific: {
        originalField: "assistant_message",
        originalValue: "not_found",
        metadata: { context: "no_assistant_messages" },
      },
      message: "No assistant messages found for termination analysis",
    };
  }

  // Create conversation context for provider analysis
  const conversationContext = createConversationContext(messages, state);

  // Create response object for detectTermination
  const response = {
    message: latestAssistantMessage,
    model: "unknown", // We don't have model info in this context
    metadata: latestAssistantMessage.metadata,
  };

  // Use provider detectTermination if available, otherwise throw error
  if (provider?.detectTermination) {
    try {
      return provider.detectTermination(response, conversationContext);
    } catch (error) {
      throw new BridgeError(
        `Provider termination detection failed: ${String(error)}`,
        "PROVIDER_ERROR",
      );
    }
  }

  // If no provider or no detectTermination method, return a safe default signal
  return {
    shouldTerminate: false, // Default to continuing when no detection available
    reason: "unknown",
    confidence: "low",
    providerSpecific: {
      originalField: "fallback",
      originalValue: "no_provider_detection",
      metadata: { fallback: true },
    },
    message:
      "No provider termination detection available, defaulting to continuation",
  };
}

/**
 * Find the most recent assistant message in the conversation
 *
 * @param messages - Conversation messages
 * @returns Latest assistant message or undefined if none found
 */
function findLatestAssistantMessage(messages: Message[]): Message | undefined {
  // Search backwards through messages to find the most recent assistant message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "assistant") {
      return message;
    }
  }
  return undefined;
}

/**
 * Create conversation context from current state
 *
 * @param messages - Current conversation messages
 * @param state - Current multi-turn state
 * @returns ConversationContext for provider analysis
 */
function createConversationContext(
  messages: Message[],
  state: MultiTurnState,
): ConversationContext {
  return {
    conversationHistory: messages,
    currentIteration: state.iteration,
    totalIterations: state.totalIterations,
    startTime: state.startTime,
    lastIterationTime: state.lastIterationTime,
    streamingState: state.streamingState,
    toolExecutionHistory: [
      ...state.completedToolCalls,
      ...state.pendingToolCalls,
    ],
    estimatedTokensUsed: undefined, // We don't have token usage info in this context
  };
}
