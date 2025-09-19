/**
 * Default Token Usage Estimation
 *
 * Provides default token usage estimation using model registry configuration.
 * Integrates with defaultLlmModels to provide accurate token estimation based
 * on model capabilities and conversation context.
 */

import type { ChatRequest } from "../../client/chatRequest";
import type { Message } from "../messages/message";
import type { ConversationContext } from "../agent/conversationContext";
import { defaultLlmModels } from "../../data/defaultLlmModels";

/**
 * Default token usage estimation using model registry configuration.
 *
 * Provides reasonable token estimation based on model context length,
 * conversation history, and content analysis. Uses defaultLlmModels
 * configuration for model-specific capabilities and limits.
 *
 * @param request - The request to estimate tokens for
 * @param conversationContext - Optional conversation context for enhanced estimation
 * @returns Token usage estimation with breakdown
 *
 * @example Basic usage
 * ```typescript
 * const estimation = defaultEstimateTokenUsage({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
 *   model: "gpt-4"
 * });
 * console.log(estimation.estimatedTokens); // 50
 * ```
 *
 * @example With conversation context
 * ```typescript
 * const estimation = defaultEstimateTokenUsage(request, {
 *   conversationHistory: [...],
 *   estimatedTokensUsed: 200
 * });
 * console.log(estimation.estimatedTokens); // Includes conversation history
 * ```
 */
export function defaultEstimateTokenUsage(
  request: ChatRequest & { stream?: boolean },
  conversationContext?: ConversationContext,
): {
  estimatedTokens: number;
  breakdown?: {
    promptTokens: number;
    maxCompletionTokens: number;
    conversationTokens?: number;
  };
} {
  // Find model configuration from registry
  const modelConfig = findModelConfig(request.model);

  if (!modelConfig) {
    // Fallback estimation without model-specific info
    return {
      estimatedTokens: estimateTokensFromContent(request.messages),
      breakdown: {
        promptTokens: estimateTokensFromContent(request.messages),
        maxCompletionTokens: 1000, // Conservative default
      },
    };
  }

  // Calculate prompt tokens from current request
  const promptTokens = estimateTokensFromContent(request.messages);

  // Calculate conversation context tokens if available
  const conversationTokens = conversationContext?.estimatedTokensUsed || 0;

  // Calculate max completion tokens based on model context length
  const maxCompletionTokens = Math.min(
    modelConfig.contextLength - promptTokens - conversationTokens,
    4000, // Reasonable max completion limit
  );

  const totalEstimated = promptTokens + conversationTokens;

  return {
    estimatedTokens: totalEstimated,
    breakdown: {
      promptTokens,
      maxCompletionTokens: Math.max(0, maxCompletionTokens),
      conversationTokens:
        conversationTokens > 0 ? conversationTokens : undefined,
    },
  };
}

/**
 * Find model configuration from the default models registry.
 *
 * @param modelId - The model ID to look up
 * @returns Model configuration or undefined if not found
 */
function findModelConfig(modelId: string) {
  for (const provider of defaultLlmModels.providers) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      return model;
    }
  }
  return undefined;
}

/**
 * Estimate token count from message content.
 *
 * Provides rough token estimation based on character count and content type.
 * Uses conservative estimates for different content types.
 *
 * @param messages - Messages to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokensFromContent(messages: Message[]): number {
  let totalTokens = 0;

  for (const message of messages) {
    // Base tokens for message structure
    totalTokens += 10; // Role, formatting overhead

    // Message content is always an array of ContentPart
    for (const content of message.content) {
      switch (content.type) {
        case "text":
          // Rough approximation: 1 token per 4 characters
          totalTokens += Math.ceil((content.text?.length || 0) / 4);
          break;
        case "image":
          // Images consume significant tokens
          totalTokens += 765; // Standard image token cost
          break;
        case "document":
          // Documents vary widely, use conservative estimate
          totalTokens += 500;
          break;
        case "code":
          // Code content similar to text but slightly more overhead
          totalTokens += Math.ceil((content.text?.length || 0) / 4) + 20;
          break;
        default:
          // Unknown content type, conservative estimate
          totalTokens += 100;
      }
    }
  }

  return totalTokens;
}
