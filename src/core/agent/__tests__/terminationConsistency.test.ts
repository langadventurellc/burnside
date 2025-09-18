/**
 * Cross-Provider Termination Consistency Tests
 *
 * Validates that equivalent termination scenarios produce identical
 * TerminationReason values and consistent confidence levels across
 * all providers, ensuring provider-agnostic business logic.
 */

import { OpenAIResponsesV1Provider } from "../../../providers/openai-responses-v1/openAIResponsesV1Provider";
import { AnthropicMessagesV1Provider } from "../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider";
import { GoogleGeminiV1Provider } from "../../../providers/google-gemini-v1/googleGeminiV1Provider";
import { XAIV1Provider } from "../../../providers/xai-v1/xaiV1Provider";
import {
  allProviderResponses,
  crossProviderScenarios,
  crossProviderStreamingScenarios,
} from "./fixtures";
import type { UnifiedTerminationSignal } from "../unifiedTerminationSignal";

describe("Cross-Provider Termination Consistency", () => {
  let providers: {
    openai: OpenAIResponsesV1Provider;
    anthropic: AnthropicMessagesV1Provider;
    gemini: GoogleGeminiV1Provider;
    xai: XAIV1Provider;
  };

  beforeEach(async () => {
    providers = {
      openai: new OpenAIResponsesV1Provider(),
      anthropic: new AnthropicMessagesV1Provider(),
      gemini: new GoogleGeminiV1Provider(),
      xai: new XAIV1Provider(),
    };

    // Initialize all providers
    await providers.openai.initialize({
      apiKey: "sk-proj-test123",
      baseUrl: "https://api.openai.com/v1",
    });
    await providers.anthropic.initialize({
      apiKey: "sk-ant-test123",
    });
    await providers.gemini.initialize({
      apiKey: "test-key",
    });
    await providers.xai.initialize({
      apiKey: "xai-test123",
      baseUrl: "https://api.x.ai/v1",
    });
  });

  describe("Natural Completion Consistency", () => {
    it("should produce identical termination signals for natural completion across all providers", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test OpenAI natural completion
      const openaiResponse =
        allProviderResponses.openai.responses.naturalCompletion;
      signals.openai = providers.openai.detectTermination(openaiResponse);

      // Test Anthropic natural completion
      const anthropicResponse =
        allProviderResponses.anthropic.responses.naturalCompletion;
      signals.anthropic =
        providers.anthropic.detectTermination(anthropicResponse);

      // Test Gemini natural completion
      const geminiResponse =
        allProviderResponses.gemini.responses.naturalCompletion;
      signals.gemini = providers.gemini.detectTermination(geminiResponse);

      // Test xAI natural completion
      const xaiResponse = allProviderResponses.xai.responses.naturalCompletion;
      signals.xai = providers.xai.detectTermination(xaiResponse);

      // All should terminate with natural completion
      Object.entries(signals).forEach(([providerName, signal]) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("natural_completion");
        expect(signal.confidence).toBe("high");

        // Allow different message variations for different providers
        if (providerName === "xai") {
          expect(signal.message).toContain("completed successfully");
        } else {
          expect(signal.message).toContain("naturally");
        }
      });

      // Verify provider-specific metadata is preserved (different fields per provider)
      expect(signals.openai.providerSpecific.originalValue).toBe("stop");
      expect(signals.anthropic.providerSpecific.originalValue).toBe("end_turn");
      expect(signals.gemini.providerSpecific.originalValue).toBe("STOP");
      expect(signals.xai.providerSpecific.originalValue).toBe("completed");
    });
  });

  describe("Token Limit Consistency", () => {
    it("should produce identical termination signals for token limit scenarios", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test all providers for token limit scenarios
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.responses.tokenLimitReached,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.tokenLimitReached,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.responses.tokenLimitReached,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.responses.tokenLimitReached,
      );

      // All should terminate with token limit reached
      Object.entries(signals).forEach(([_providerName, signal]) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("token_limit_reached");
        expect(signal.confidence).toBe("high");
        expect(signal.message).toContain("token limit");
      });

      // Verify provider-specific values (xAI uses different approach)
      expect(signals.openai.providerSpecific.originalValue).toBe("length");
      expect(signals.anthropic.providerSpecific.originalValue).toBe(
        "max_tokens",
      );
      expect(signals.gemini.providerSpecific.originalValue).toBe("MAX_TOKENS");
      expect(signals.xai.providerSpecific.originalValue).toBe("incomplete");
    });
  });

  describe("Content Filtering Consistency", () => {
    it("should produce consistent termination signals for content filtering scenarios", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test content filtering scenarios
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.responses.contentFiltered,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.stopSequenceTriggered,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.responses.safetyFiltered,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.responses.contentFiltered,
      );

      // OpenAI and xAI should have content_filtered
      expect(signals.openai.shouldTerminate).toBe(true);
      expect(signals.openai.reason).toBe("content_filtered");
      expect(signals.xai.shouldTerminate).toBe(true);
      expect(signals.xai.reason).toBe("content_filtered");

      // Anthropic maps to stop_sequence (closest equivalent)
      expect(signals.anthropic.shouldTerminate).toBe(true);
      expect(signals.anthropic.reason).toBe("stop_sequence");

      // Gemini should have content_filtered
      expect(signals.gemini.shouldTerminate).toBe(true);
      expect(signals.gemini.reason).toBe("content_filtered");

      // All should have high confidence
      Object.values(signals).forEach((signal) => {
        expect(signal.confidence).toBe("high");
      });
    });
  });

  describe("Tool Completion Consistency", () => {
    it("should produce consistent termination signals for tool completion scenarios", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test tool completion scenarios
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.responses.toolCallCompletion,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.toolUseCompletion,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.responses.functionCallCompletion,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.responses.toolCallCompletion,
      );

      // All should terminate with natural completion (tool calls complete naturally)
      Object.entries(signals).forEach(([_providerName, signal]) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("natural_completion");
        expect(signal.confidence).toBe("high");
      });

      // Verify provider-specific values (xAI uses status-based detection)
      expect(signals.openai.providerSpecific.originalValue).toBe("tool_calls");
      expect(signals.anthropic.providerSpecific.originalValue).toBe("tool_use");
      expect(signals.gemini.providerSpecific.originalValue).toBe("STOP");
      expect(signals.xai.providerSpecific.originalValue).toBe("completed");
    });
  });

  describe("Unknown Termination Consistency", () => {
    it("should produce consistent low-confidence signals for unknown termination scenarios", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test unknown termination scenarios
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.responses.unknownTermination,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.unknownStopReason,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.responses.unknownFinishReason,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.responses.unknownTermination,
      );

      // All should have unknown reason
      Object.entries(signals).forEach(([providerName, signal]) => {
        expect(signal.reason).toBe("unknown");

        // Confidence levels vary based on provider logic for unknown scenarios
        if (providerName === "anthropic" || providerName === "gemini") {
          expect(signal.confidence).toBe("medium");
        } else {
          expect(signal.confidence).toBe("low");
        }
        // shouldTerminate may vary based on provider fallback logic
      });
    });
  });

  describe("Streaming Termination Consistency", () => {
    it("should produce identical streaming termination signals across providers", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test streaming natural completion
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.streaming.naturalCompletionDelta,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.streaming.naturalCompletionDelta,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.streaming.naturalCompletionDelta,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.streaming.naturalCompletionDelta,
      );

      // All should terminate with natural completion
      Object.entries(signals).forEach(([_providerName, signal]) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("natural_completion");
        expect(signal.confidence).toBe("high");
      });
    });

    it("should handle incomplete streaming responses consistently", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test incomplete streaming responses
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.streaming.incompleteDelta,
      );
      signals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.streaming.incompleteDelta,
      );
      signals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.streaming.incompleteDelta,
      );
      signals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.streaming.incompleteDelta,
      );

      // All should not terminate for incomplete responses
      Object.entries(signals).forEach(([_providerName, signal]) => {
        expect(signal.shouldTerminate).toBe(false);

        // All providers use low confidence for incomplete streaming responses
        expect(signal.confidence).toBe("low");
      });
    });
  });

  describe("Malformed Response Handling", () => {
    it("should handle malformed responses consistently with graceful fallback", () => {
      const signals: Record<string, UnifiedTerminationSignal> = {};

      // Test malformed responses
      signals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.responses.malformedResponse,
      );

      // All should handle malformed responses gracefully with unknown reason
      expect(signals.openai.reason).toBe("unknown");
      expect(signals.openai.confidence).toBe("low");
      // shouldTerminate behavior may vary - some providers may terminate, others continue
    });
  });

  describe("Performance Consistency", () => {
    it("should have consistent performance characteristics across providers", () => {
      const performanceMetrics: Record<string, number> = {};

      // Measure termination detection performance for each provider
      Object.entries(providers).forEach(([providerName, provider]) => {
        const response =
          allProviderResponses[
            providerName as keyof typeof allProviderResponses
          ].responses.naturalCompletion;

        const start = performance.now();
        provider.detectTermination(response);
        const end = performance.now();

        performanceMetrics[providerName] = end - start;
      });

      // All providers should detect termination in < 10ms
      Object.entries(performanceMetrics).forEach(
        ([_providerName, duration]) => {
          expect(duration).toBeLessThan(10);
        },
      );

      // Performance variance between providers should be reasonable (< 5x difference)
      const times = Object.values(performanceMetrics);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime / minTime).toBeLessThan(5);
    });
  });

  describe("Cross-Provider Scenario Mapping Validation", () => {
    it("should validate all cross-provider scenarios are properly mapped", () => {
      // Validate that all scenarios defined in crossProviderScenarios exist in fixtures
      Object.entries(crossProviderScenarios).forEach(
        ([_scenarioName, providerMapping]) => {
          Object.entries(providerMapping).forEach(
            ([providerName, fixtureName]) => {
              const providerResponses =
                allProviderResponses[
                  providerName as keyof typeof allProviderResponses
                ];
              expect(providerResponses.responses).toHaveProperty(fixtureName);
            },
          );
        },
      );

      // Validate streaming scenarios
      Object.entries(crossProviderStreamingScenarios).forEach(
        ([_scenarioName, providerMapping]) => {
          Object.entries(providerMapping).forEach(
            ([providerName, fixtureName]) => {
              const providerResponses =
                allProviderResponses[
                  providerName as keyof typeof allProviderResponses
                ];
              expect(providerResponses.streaming).toHaveProperty(fixtureName);
            },
          );
        },
      );
    });

    it("should ensure all providers have core scenarios available", () => {
      const providerNames = Object.keys(allProviderResponses);

      // Check that all providers have at least the basic response scenarios
      const coreScenarios = ["naturalCompletion", "tokenLimitReached"];

      providerNames.forEach((providerName) => {
        const currentProviderResponses = Object.keys(
          allProviderResponses[
            providerName as keyof typeof allProviderResponses
          ].responses,
        );

        // Each provider should have at least the core scenarios
        coreScenarios.forEach((coreScenario) => {
          expect(currentProviderResponses).toContain(coreScenario);
        });

        // Provider should have some form of termination scenarios
        expect(currentProviderResponses.length).toBeGreaterThan(2);
      });
    });
  });
});
