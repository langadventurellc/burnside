/**
 * Termination Detection Test Fixtures Index
 *
 * Barrel export file for all provider-specific response fixtures
 * used in comprehensive termination detection testing.
 */

// OpenAI response fixtures
export { openAIResponses, openAIStreamingResponses } from "./openaiResponses";

// Anthropic response fixtures
export {
  anthropicResponses,
  anthropicStreamingResponses,
} from "./anthropicResponses";

// Google Gemini response fixtures
export { geminiResponses, geminiStreamingResponses } from "./geminiResponses";

// xAI response fixtures
export { xaiResponses, xaiStreamingResponses } from "./xaiResponses";

// Import fixtures for use in aggregated exports
import { openAIResponses, openAIStreamingResponses } from "./openaiResponses";
import {
  anthropicResponses,
  anthropicStreamingResponses,
} from "./anthropicResponses";
import { geminiResponses, geminiStreamingResponses } from "./geminiResponses";
import { xaiResponses, xaiStreamingResponses } from "./xaiResponses";

/**
 * All provider response fixtures organized by provider
 */
export const allProviderResponses = {
  openai: {
    responses: openAIResponses,
    streaming: openAIStreamingResponses,
  },
  anthropic: {
    responses: anthropicResponses,
    streaming: anthropicStreamingResponses,
  },
  gemini: {
    responses: geminiResponses,
    streaming: geminiStreamingResponses,
  },
  xai: {
    responses: xaiResponses,
    streaming: xaiStreamingResponses,
  },
} as const;

/**
 * Cross-provider termination scenario mapping
 * for consistency testing across all providers
 */
export const crossProviderScenarios = {
  naturalCompletion: {
    openai: "naturalCompletion",
    anthropic: "naturalCompletion",
    gemini: "naturalCompletion",
    xai: "naturalCompletion",
  },
  tokenLimitReached: {
    openai: "tokenLimitReached",
    anthropic: "tokenLimitReached",
    gemini: "tokenLimitReached",
    xai: "tokenLimitReached",
  },
  contentFiltered: {
    openai: "contentFiltered",
    anthropic: "stopSequenceTriggered", // Closest equivalent
    gemini: "safetyFiltered",
    xai: "contentFiltered",
  },
  toolCompletion: {
    openai: "toolCallCompletion",
    anthropic: "toolUseCompletion",
    gemini: "functionCallCompletion",
    xai: "toolCallCompletion",
  },
  unknownTermination: {
    openai: "unknownTermination",
    anthropic: "unknownStopReason",
    gemini: "unknownFinishReason",
    xai: "unknownTermination",
  },
} as const;

/**
 * Streaming cross-provider scenario mapping
 */
export const crossProviderStreamingScenarios = {
  naturalCompletion: {
    openai: "naturalCompletionDelta",
    anthropic: "naturalCompletionDelta",
    gemini: "naturalCompletionDelta",
    xai: "naturalCompletionDelta",
  },
  tokenLimitReached: {
    openai: "tokenLimitDelta",
    anthropic: "tokenLimitDelta",
    gemini: "tokenLimitDelta",
    xai: "tokenLimitDelta",
  },
  contentFiltered: {
    openai: "contentFilterDelta",
    anthropic: "stopSequenceDelta", // Closest equivalent
    gemini: "safetyFilterDelta",
    xai: "contentFilterDelta",
  },
  toolCompletion: {
    openai: "toolCallDelta",
    anthropic: "toolUseDelta",
    gemini: "functionCallDelta",
    xai: "toolCallDelta",
  },
  incompleteResponse: {
    openai: "incompleteDelta",
    anthropic: "incompleteDelta",
    gemini: "incompleteDelta",
    xai: "incompleteDelta",
  },
} as const;
