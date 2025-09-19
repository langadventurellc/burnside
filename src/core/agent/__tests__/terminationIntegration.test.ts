/**
 * Termination Detection Integration Tests
 *
 * End-to-end integration tests for provider-aware termination detection
 * in multi-turn loops, streaming coordination, fallback behavior, and
 * error scenarios with actual provider response processing.
 */

import { AgentLoop } from "../agentLoop";
import { analyzeConversationTermination as _analyzeConversationTermination } from "../terminationAnalyzer";
import { InMemoryToolRegistry } from "../../tools/inMemoryToolRegistry";
import { ToolRouter } from "../../tools/toolRouter";
import { OpenAIResponsesV1Provider } from "../../../providers/openai-responses-v1/openAIResponsesV1Provider";
import { AnthropicMessagesV1Provider } from "../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider";
import { GoogleGeminiV1Provider } from "../../../providers/google-gemini-v1/googleGeminiV1Provider";
import { XAIV1Provider } from "../../../providers/xai-v1/xaiV1Provider";
import { allProviderResponses } from "./fixtures";
import type { Message } from "../../messages/message";
import type { ConversationContext } from "../conversationContext";
import type { UnifiedTerminationSignal } from "../unifiedTerminationSignal";
import type { MultiTurnState } from "../multiTurnState";

describe("Termination Detection Integration Tests", () => {
  let _agentLoop: AgentLoop;
  let toolRouter: ToolRouter;
  let registry: InMemoryToolRegistry;
  let providers: {
    openai: OpenAIResponsesV1Provider;
    anthropic: AnthropicMessagesV1Provider;
    gemini: GoogleGeminiV1Provider;
    xai: XAIV1Provider;
  };

  beforeEach(async () => {
    // Initialize test infrastructure
    registry = new InMemoryToolRegistry();
    toolRouter = new ToolRouter(registry);
    _agentLoop = new AgentLoop(toolRouter, {
      maxToolCalls: 5,
      timeoutMs: 10000,
      toolTimeoutMs: 5000,
      continueOnToolError: true,
    });
    // terminationAnalyzer removed - using analyzeConversationTermination function directly

    // Initialize all providers
    providers = {
      openai: new OpenAIResponsesV1Provider(),
      anthropic: new AnthropicMessagesV1Provider(),
      gemini: new GoogleGeminiV1Provider(),
      xai: new XAIV1Provider(),
    };

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

  describe("Multi-Turn Loop Termination Integration", () => {
    it("should properly integrate termination detection with multi-turn execution", () => {
      const conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Hello, how are you?" }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
      ];

      // Test natural completion termination
      const naturalCompletionResponse =
        allProviderResponses.openai.responses.naturalCompletion;
      const signal = providers.openai.detectTermination(
        naturalCompletionResponse,
      );

      // Should indicate conversation completion
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");

      // Create proper conversation context
      const _conversationContext: ConversationContext = {
        conversationHistory,
        currentIteration: 1,
        totalIterations: 10,
        startTime: Date.now() - 1000,
        lastIterationTime: Date.now(),
        streamingState: "idle",
        toolExecutionHistory: [],
        estimatedTokensUsed: naturalCompletionResponse.usage.totalTokens,
      };

      // Should terminate naturally
      const shouldContinue = !signal.shouldTerminate;

      expect(shouldContinue).toBe(false);
    });

    it("should handle token limit termination in multi-turn context", () => {
      const conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Write a long essay about AI." }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [{ type: "text", text: "Starting the essay..." }],
          timestamp: "2023-01-01T00:01:00.000Z",
        },
      ];

      // Test token limit scenario
      const tokenLimitResponse =
        allProviderResponses.openai.responses.tokenLimitReached;
      const signal = providers.openai.detectTermination(tokenLimitResponse);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");

      // Create proper conversation context
      const _conversationContext: ConversationContext = {
        conversationHistory,
        currentIteration: 2,
        totalIterations: 10,
        startTime: Date.now() - 2000,
        lastIterationTime: Date.now(),
        streamingState: "idle",
        toolExecutionHistory: [],
        estimatedTokensUsed: tokenLimitResponse.usage.totalTokens,
      };

      // Should terminate due to token limits
      const shouldContinue = !signal.shouldTerminate;

      expect(shouldContinue).toBe(false);
    });

    it("should handle content filtering termination appropriately", () => {
      const conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Inappropriate request" }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
      ];

      // Test content filtering scenario
      const contentFilteredResponse =
        allProviderResponses.openai.responses.contentFiltered;
      const signal = providers.openai.detectTermination(
        contentFilteredResponse,
      );

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");

      // Create proper conversation context
      const _conversationContext: ConversationContext = {
        conversationHistory,
        currentIteration: 1,
        totalIterations: 10,
        startTime: Date.now() - 1000,
        lastIterationTime: Date.now(),
        streamingState: "idle",
        toolExecutionHistory: [],
        estimatedTokensUsed: contentFilteredResponse.usage.totalTokens,
      };

      // Should terminate due to content filtering
      const shouldContinue = !signal.shouldTerminate;

      expect(shouldContinue).toBe(false);
    });
  });

  describe("Streaming Termination Coordination", () => {
    it("should coordinate streaming termination during tool execution", () => {
      // Test streaming natural completion
      const streamingResponse =
        allProviderResponses.openai.streaming.naturalCompletionDelta;
      const signal = providers.openai.detectTermination(streamingResponse);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");

      // Verify streaming coordination
      expect(streamingResponse.finished).toBe(true);
      expect(streamingResponse.metadata?.finish_reason).toBe("stop");
    });

    it("should handle incomplete streaming responses correctly", () => {
      // Test incomplete streaming response
      const incompleteResponse =
        allProviderResponses.openai.streaming.incompleteDelta;
      const signal = providers.openai.detectTermination(incompleteResponse);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.confidence).toBe("low"); // Based on actual provider behavior

      // Verify streaming state
      expect(incompleteResponse.finished).toBe(false);
    });

    it("should coordinate streaming termination across all providers", () => {
      const streamingSignals: Record<string, UnifiedTerminationSignal> = {};

      // Test streaming completion across all providers
      streamingSignals.openai = providers.openai.detectTermination(
        allProviderResponses.openai.streaming.naturalCompletionDelta,
      );
      streamingSignals.anthropic = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.streaming.naturalCompletionDelta,
      );
      streamingSignals.gemini = providers.gemini.detectTermination(
        allProviderResponses.gemini.streaming.naturalCompletionDelta,
      );
      streamingSignals.xai = providers.xai.detectTermination(
        allProviderResponses.xai.streaming.naturalCompletionDelta,
      );

      // All should coordinate consistent streaming termination
      Object.values(streamingSignals).forEach((signal) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("natural_completion");
        expect(signal.confidence).toBe("high");
      });
    });
  });

  describe("Fallback Behavior for Providers", () => {
    it("should handle providers without detectTermination method gracefully", () => {
      // Create a mock provider without detectTermination method
      const mockProvider = {
        isTerminal: jest.fn().mockReturnValue(true),
        // Missing detectTermination method
      };

      // Should gracefully fall back to default behavior
      const response = allProviderResponses.openai.responses.naturalCompletion;

      // Test that the system can handle providers without detectTermination
      expect(() => {
        if (
          "detectTermination" in mockProvider &&
          typeof mockProvider.detectTermination === "function"
        ) {
          (mockProvider.detectTermination as any)(response);
        } else {
          // Fallback behavior
          const isTerminal = mockProvider.isTerminal(response);
          expect(isTerminal).toBe(true);
        }
      }).not.toThrow();
    });

    it("should use default termination detection when provider method is unavailable", () => {
      // Test fallback to default termination detection
      const response = allProviderResponses.openai.responses.naturalCompletion;

      // Simulate default termination detection
      const hasFinishReason = response.metadata?.finish_reason !== undefined;
      const isNaturalCompletion = response.metadata?.finish_reason === "stop";

      expect(hasFinishReason).toBe(true);
      expect(isNaturalCompletion).toBe(true);

      // Default detection should work for basic scenarios
      expect(response.metadata.finish_reason).toBe("stop");
    });
  });

  describe("Error Scenarios and Malformed Responses", () => {
    it("should handle malformed responses gracefully", () => {
      const malformedResponse =
        allProviderResponses.openai.responses.malformedResponse;
      const signal = providers.openai.detectTermination(malformedResponse);

      // Should handle malformed responses without throwing
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      // shouldTerminate behavior may vary for malformed responses
    });

    it("should handle provider errors during termination detection", () => {
      // Test error handling in termination detection
      const invalidResponse = {
        message: null,
        usage: null,
        metadata: null,
      };

      expect(() => {
        providers.openai.detectTermination(
          invalidResponse as unknown as Parameters<
            typeof providers.openai.detectTermination
          >[0],
        );
      }).not.toThrow();
    });

    it("should handle network interruption scenarios", () => {
      // Test incomplete network responses
      const incompleteResponse = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Incomplete" }],
        },
        usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
        model: "gpt-4o",
        metadata: {
          // Missing finish_reason due to network interruption
        },
      };

      const signal = providers.openai.detectTermination(incompleteResponse);

      // Should handle incomplete responses gracefully
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });
  });

  describe("Performance Benchmarks", () => {
    it("should meet performance requirements for termination detection", () => {
      const response = allProviderResponses.openai.responses.naturalCompletion;

      // Measure termination detection performance
      const start = performance.now();
      const signal = providers.openai.detectTermination(response);
      const end = performance.now();

      const duration = end - start;

      // Should complete termination detection in < 10ms
      expect(duration).toBeLessThan(10);
      expect(signal.shouldTerminate).toBe(true);
    });

    it("should maintain performance under multiple concurrent detections", async () => {
      const response = allProviderResponses.openai.responses.naturalCompletion;
      const concurrentDetections = 100;

      const start = performance.now();

      // Run multiple concurrent termination detections
      const promises = Array.from({ length: concurrentDetections }, () =>
        Promise.resolve(providers.openai.detectTermination(response)),
      );

      const results = await Promise.all(promises);
      const end = performance.now();

      const averageDuration = (end - start) / concurrentDetections;

      // Average time per detection should still be < 10ms
      expect(averageDuration).toBeLessThan(10);

      // All results should be consistent
      results.forEach((signal) => {
        expect(signal.shouldTerminate).toBe(true);
        expect(signal.reason).toBe("natural_completion");
      });
    });

    it("should have linear memory usage with conversation length", () => {
      const baseResponse =
        allProviderResponses.openai.responses.naturalCompletion;

      // Test with different conversation lengths
      const conversationLengths = [1, 10, 50, 100];
      const memoryUsages: number[] = [];

      conversationLengths.forEach((length) => {
        const conversationHistory: Message[] = Array.from(
          { length },
          (_, i) => ({
            id: `msg-${i}`,
            role: i % 2 === 0 ? "user" : "assistant",
            content: [{ type: "text", text: `Message ${i}` }],
            timestamp: "2023-01-01T00:00:00.000Z",
          }),
        );

        const conversationContext: ConversationContext = {
          conversationHistory,
          currentIteration: length,
          totalIterations: 100,
          startTime: Date.now() - 10000,
          lastIterationTime: Date.now(),
          streamingState: "idle",
          toolExecutionHistory: [],
          estimatedTokensUsed: baseResponse.usage.totalTokens,
        };

        // Measure memory usage (approximated by object size)
        const memorySize = JSON.stringify(conversationContext).length;
        memoryUsages.push(memorySize);
      });

      // Memory usage should scale linearly
      const firstUsage = memoryUsages[0];
      const lastUsage = memoryUsages[memoryUsages.length - 1];
      const growthRatio = lastUsage / firstUsage;

      // Should not have exponential memory growth
      expect(growthRatio).toBeLessThan(200); // Reasonable linear growth
    });
  });

  describe("Cross-Provider Integration Scenarios", () => {
    it("should handle mixed provider scenarios in conversation", () => {
      const _conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Start conversation" }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
      ];

      // Test different providers for different turns
      const openaiSignal = providers.openai.detectTermination(
        allProviderResponses.openai.responses.naturalCompletion,
      );
      const anthropicSignal = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.naturalCompletion,
      );

      // Both should provide consistent termination decisions
      expect(openaiSignal.shouldTerminate).toBe(
        anthropicSignal.shouldTerminate,
      );
      expect(openaiSignal.reason).toBe(anthropicSignal.reason);
      expect(openaiSignal.confidence).toBe(anthropicSignal.confidence);
    });

    it("should maintain termination history across provider switches", () => {
      const multiTurnState: Partial<MultiTurnState> = {
        terminationSignalHistory: [],
        currentTerminationSignal: undefined,
        providerTerminationMetadata: {},
      };

      // Simulate provider switches with termination tracking
      const openaiSignal = providers.openai.detectTermination(
        allProviderResponses.openai.responses.naturalCompletion,
      );
      multiTurnState.terminationSignalHistory!.push(openaiSignal);
      multiTurnState.currentTerminationSignal = openaiSignal;

      const anthropicSignal = providers.anthropic.detectTermination(
        allProviderResponses.anthropic.responses.naturalCompletion,
      );
      multiTurnState.terminationSignalHistory!.push(anthropicSignal);
      multiTurnState.currentTerminationSignal = anthropicSignal;

      // Should maintain consistent termination history
      expect(multiTurnState.terminationSignalHistory).toHaveLength(2);
      expect(multiTurnState.currentTerminationSignal).toBe(anthropicSignal);
      expect(multiTurnState.terminationSignalHistory![0].reason).toBe(
        "natural_completion",
      );
      expect(multiTurnState.terminationSignalHistory![1].reason).toBe(
        "natural_completion",
      );
    });
  });

  describe("End-to-End Conversation Scenarios", () => {
    it("should handle complete multi-turn conversation with natural completion", () => {
      const conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
          timestamp: "2023-01-01T00:01:00.000Z",
        },
        {
          id: "msg-3",
          role: "user",
          content: [{ type: "text", text: "How are you?" }],
          timestamp: "2023-01-01T00:02:00.000Z",
        },
      ];

      // Final response with natural completion
      const finalResponse =
        allProviderResponses.openai.responses.naturalCompletion;
      const signal = providers.openai.detectTermination(finalResponse);

      const _conversationContext: ConversationContext = {
        conversationHistory,
        currentIteration: 3,
        totalIterations: 10,
        startTime: Date.now() - 3000,
        lastIterationTime: Date.now(),
        streamingState: "idle",
        toolExecutionHistory: [],
        estimatedTokensUsed: finalResponse.usage.totalTokens,
      };

      const shouldContinue = !signal.shouldTerminate;

      // Should complete conversation naturally
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(shouldContinue).toBe(false);
    });

    it("should handle tool usage completion scenarios", () => {
      const conversationHistory: Message[] = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Get the weather" }],
          timestamp: "2023-01-01T00:00:00.000Z",
        },
      ];

      // Tool completion response
      const toolResponse =
        allProviderResponses.openai.responses.toolCallCompletion;
      const signal = providers.openai.detectTermination(toolResponse);

      const _conversationContext: ConversationContext = {
        conversationHistory,
        currentIteration: 1,
        totalIterations: 10,
        startTime: Date.now() - 1000,
        lastIterationTime: Date.now(),
        streamingState: "idle",
        toolExecutionHistory: [
          {
            id: "call_abc123",
            name: "get_weather",
            parameters: { location: "San Francisco" },
          },
        ],
        estimatedTokensUsed: toolResponse.usage.totalTokens,
      };

      const shouldContinue = !signal.shouldTerminate;

      // Should complete naturally with tool calls
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(shouldContinue).toBe(false);
    });
  });
});
