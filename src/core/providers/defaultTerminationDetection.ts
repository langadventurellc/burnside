import type { ProviderPlugin } from "./providerPlugin";
import type { ConversationContext } from "../agent/conversationContext";
import type { UnifiedTerminationSignal } from "../agent/unifiedTerminationSignal";
import type { StreamDelta } from "../../client/streamDelta";
import type { Message } from "../messages/message";

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

  // Since isTerminal is deprecated, throw an error if detectTermination is not available
  throw new Error(
    "Provider does not implement detectTermination() method. Legacy isTerminal() support has been removed.",
  );
}
