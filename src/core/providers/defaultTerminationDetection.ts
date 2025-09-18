import type { ProviderPlugin } from "./providerPlugin";
import type { ConversationContext } from "../agent/conversationContext";
import type { UnifiedTerminationSignal } from "../agent/unifiedTerminationSignal";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../messages/message";
import { createTerminationSignal } from "../agent/createTerminationSignal";
import { calculateTerminationConfidence } from "../agent/calculateTerminationConfidence";

/**
 * Response type that can be passed to termination detection.
 * Matches the union type used in ProviderPlugin.isTerminal() and detectTermination().
 */
type TerminationResponse =
  | StreamDelta
  | {
      message: Message;
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens?: number;
      };
      model: string;
      metadata?: Record<string, unknown>;
    };

/**
 * Provides fallback termination detection logic for providers that don't implement
 * the enhanced detectTermination() method. This function ensures backward compatibility
 * while providing enhanced termination signals through analysis of existing provider behavior.
 *
 * The function first attempts to use the provider's enhanced detectTermination() method.
 * If not available, it falls back to the existing isTerminal() method and enhances
 * the result with confidence scoring and reason inference based on response patterns.
 *
 * @param plugin - The provider plugin to use for termination detection
 * @param deltaOrResponse - The response or delta to analyze for termination
 * @param conversationContext - Optional conversation context for enhanced analysis
 * @returns Enhanced termination signal with confidence and reasoning
 *
 * @example Basic usage with enhanced provider
 * ```typescript
 * const signal = defaultDetectTermination(openaiPlugin, response);
 * // Uses plugin.detectTermination() if available
 * console.log(signal.reason); // "natural_completion"
 * console.log(signal.confidence); // "high"
 * ```
 *
 * @example Fallback usage with legacy provider
 * ```typescript
 * const signal = defaultDetectTermination(legacyPlugin, response);
 * // Falls back to plugin.isTerminal() and enhances result
 * console.log(signal.reason); // "unknown" or inferred reason
 * console.log(signal.confidence); // "low" or inferred confidence
 * ```
 */
export function defaultDetectTermination(
  plugin: ProviderPlugin,
  deltaOrResponse: TerminationResponse,
  conversationContext?: ConversationContext,
): UnifiedTerminationSignal {
  // Try enhanced detection first if available
  if (plugin.detectTermination) {
    return plugin.detectTermination(deltaOrResponse, conversationContext);
  }

  // Fallback to existing isTerminal() method with enhancement
  const isTerminal = plugin.isTerminal(deltaOrResponse, conversationContext);

  // Analyze response structure for enhanced reasoning
  const analysis = analyzeTerminationContext(deltaOrResponse, isTerminal);

  // Override isTerminal result if we have high-confidence metadata signals
  const shouldTerminate =
    analysis.confidence === "high"
      ? analysis.reason !== "unknown" // High confidence metadata overrides provider
      : isTerminal; // Otherwise trust the provider's decision

  // Create enhanced signal from enhanced analysis
  return createTerminationSignal(
    shouldTerminate,
    analysis.originalField,
    analysis.originalValue,
    analysis.reason,
    analysis.confidence,
    analysis.message,
    analysis.metadata,
  );
}

/**
 * Analyzes response structure to infer termination reasoning and confidence.
 * Used when falling back from enhanced detection to basic isTerminal() method.
 */
function analyzeTerminationContext(
  deltaOrResponse: TerminationResponse,
  isTerminal: boolean,
): {
  originalField: string;
  originalValue: string;
  reason: import("../agent/enhancedTerminationReason").EnhancedTerminationReason;
  confidence: import("../agent/terminationConfidence").TerminationConfidence;
  message?: string;
  metadata?: Record<string, unknown>;
} {
  // Check if this is a streaming delta
  if ("delta" in deltaOrResponse) {
    const delta = deltaOrResponse;

    // Look for streaming termination indicators in metadata
    if (delta.finished === true) {
      return {
        originalField: "finished",
        originalValue: "true",
        reason: "natural_completion",
        confidence: calculateTerminationConfidence(true, true, true),
        message: "Streaming completed with finished flag",
        metadata: {
          finished: delta.finished,
          hasUsage: !!delta.usage,
          deltaId: delta.id,
        },
      };
    }

    // Check for provider-specific termination signals in metadata
    if (delta.metadata?.done === true || delta.metadata?.finished === true) {
      return {
        originalField: "metadata.done",
        originalValue: "true",
        reason: "natural_completion",
        confidence: calculateTerminationConfidence(true, true, false),
        message: "Streaming completed with metadata signal",
        metadata: delta.metadata,
      };
    }

    return {
      originalField: "isTerminal",
      originalValue: isTerminal.toString(),
      reason: "unknown",
      confidence: calculateTerminationConfidence(false, false, false),
      message: isTerminal
        ? "Streaming delta marked as terminal"
        : "Streaming delta continuing",
      metadata: {
        finished: delta.finished,
        hasContent: !!delta.delta?.content,
        deltaId: delta.id,
      },
    };
  }

  // Handle complete response analysis
  const response = deltaOrResponse as {
    message: Message;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    };
    model: string;
    metadata?: Record<string, unknown>;
  };

  // Look for provider-specific metadata that might indicate termination reason
  const metadata = response.metadata || {};

  // Check for common provider termination fields
  if (metadata.finish_reason) {
    return analyzeFinishReason(metadata.finish_reason as string, metadata);
  }

  if (metadata.stop_reason) {
    return analyzeStopReason(metadata.stop_reason as string, metadata);
  }

  if (metadata.finishReason) {
    return analyzeGeminiFinishReason(metadata.finishReason as string, metadata);
  }

  // Analyze message content for completion indicators
  const messageAnalysis = analyzeMessageContent(response.message, isTerminal);

  return {
    originalField: "isTerminal",
    originalValue: isTerminal.toString(),
    reason: messageAnalysis.reason,
    confidence: messageAnalysis.confidence,
    message: messageAnalysis.message,
    metadata: {
      model: response.model,
      hasUsage: !!response.usage,
      messageRole: response.message.role,
    },
  };
}

/**
 * Analyzes OpenAI-style finish_reason field.
 */
function analyzeFinishReason(
  finishReason: string,
  metadata: Record<string, unknown>,
) {
  const confidence = calculateTerminationConfidence(true, true, true);

  switch (finishReason) {
    case "stop":
      return {
        originalField: "finish_reason",
        originalValue: finishReason,
        reason: "natural_completion" as const,
        confidence,
        message: "Model completed response naturally",
        metadata,
      };
    case "length":
      return {
        originalField: "finish_reason",
        originalValue: finishReason,
        reason: "token_limit_reached" as const,
        confidence,
        message: "Response terminated due to token limit",
        metadata,
      };
    case "content_filter":
      return {
        originalField: "finish_reason",
        originalValue: finishReason,
        reason: "content_filtered" as const,
        confidence,
        message: "Response terminated by content filter",
        metadata,
      };
    default:
      return {
        originalField: "finish_reason",
        originalValue: finishReason,
        reason: "unknown" as const,
        confidence: calculateTerminationConfidence(true, false, true),
        message: `Unknown finish reason: ${finishReason}`,
        metadata,
      };
  }
}

/**
 * Analyzes Anthropic-style stop_reason field.
 */
function analyzeStopReason(
  stopReason: string,
  metadata: Record<string, unknown>,
) {
  const confidence = calculateTerminationConfidence(true, true, true);

  switch (stopReason) {
    case "end_turn":
      return {
        originalField: "stop_reason",
        originalValue: stopReason,
        reason: "natural_completion" as const,
        confidence,
        message: "Model completed turn naturally",
        metadata,
      };
    case "max_tokens":
      return {
        originalField: "stop_reason",
        originalValue: stopReason,
        reason: "token_limit_reached" as const,
        confidence,
        message: "Response terminated due to token limit",
        metadata,
      };
    case "stop_sequence":
      return {
        originalField: "stop_reason",
        originalValue: stopReason,
        reason: "stop_sequence" as const,
        confidence,
        message: "Response terminated by custom stop sequence",
        metadata,
      };
    default:
      return {
        originalField: "stop_reason",
        originalValue: stopReason,
        reason: "unknown" as const,
        confidence: calculateTerminationConfidence(true, false, true),
        message: `Unknown stop reason: ${stopReason}`,
        metadata,
      };
  }
}

/**
 * Analyzes Google Gemini-style finishReason field.
 */
function analyzeGeminiFinishReason(
  finishReason: string,
  metadata: Record<string, unknown>,
) {
  const confidence = calculateTerminationConfidence(true, true, true);

  switch (finishReason) {
    case "STOP":
      return {
        originalField: "finishReason",
        originalValue: finishReason,
        reason: "natural_completion" as const,
        confidence,
        message: "Model completed response naturally",
        metadata,
      };
    case "MAX_TOKENS":
      return {
        originalField: "finishReason",
        originalValue: finishReason,
        reason: "token_limit_reached" as const,
        confidence,
        message: "Response terminated due to token limit",
        metadata,
      };
    case "SAFETY":
      return {
        originalField: "finishReason",
        originalValue: finishReason,
        reason: "content_filtered" as const,
        confidence,
        message: "Response terminated by safety filter",
        metadata,
      };
    default:
      return {
        originalField: "finishReason",
        originalValue: finishReason,
        reason: "unknown" as const,
        confidence: calculateTerminationConfidence(true, false, true),
        message: `Unknown finish reason: ${finishReason}`,
        metadata,
      };
  }
}

/**
 * Analyzes message content for completion indicators when no explicit termination metadata is available.
 */
function analyzeMessageContent(
  message: Message,
  isTerminal: boolean,
): {
  reason: import("../agent/enhancedTerminationReason").EnhancedTerminationReason;
  confidence: import("../agent/terminationConfidence").TerminationConfidence;
  message: string;
} {
  // Check for tool calls in the message metadata
  // Note: Tool calls are typically stored in metadata, not content parts
  const hasToolCalls =
    message.metadata?.toolCalls ||
    message.metadata?.tool_calls ||
    (Array.isArray(message.metadata?.toolCalls) &&
      message.metadata.toolCalls.length > 0);

  if (hasToolCalls) {
    return {
      reason: isTerminal ? "natural_completion" : "unknown",
      confidence: calculateTerminationConfidence(false, isTerminal, true),
      message: isTerminal
        ? "Message contains tool calls and is marked terminal"
        : "Message contains tool calls but not marked terminal",
    };
  }

  // Analyze text content for completion patterns
  const textContent = message.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join(" ");

  if (textContent.length === 0) {
    return {
      reason: isTerminal ? "natural_completion" : "unknown",
      confidence: calculateTerminationConfidence(false, false, false),
      message: isTerminal
        ? "Empty message marked as terminal"
        : "Empty message not marked terminal",
    };
  }

  // Look for completion indicators in text
  const completionPatterns = [
    /\b(done|finished|complete|completed)\b/i,
    /\b(that's all|that's it|finished up)\b/i,
    /\b(no more|nothing more|nothing else)\b/i,
  ];

  const hasCompletionIndicator = completionPatterns.some((pattern) =>
    pattern.test(textContent),
  );

  if (hasCompletionIndicator && isTerminal) {
    return {
      reason: "natural_completion",
      confidence: calculateTerminationConfidence(false, true, true),
      message: "Message content suggests completion and is marked terminal",
    };
  }

  return {
    reason: isTerminal ? "natural_completion" : "unknown",
    confidence: calculateTerminationConfidence(false, isTerminal, false),
    message: isTerminal
      ? "Message marked as terminal without clear completion signal"
      : "Message not marked terminal, analysis inconclusive",
  };
}
