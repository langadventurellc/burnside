/**
 * OpenAI Provider Termination Detection Tests
 *
 * Comprehensive test suite for the detectTermination() method implementation
 * in the OpenAI provider, covering all finish_reason values, streaming/non-streaming
 * scenarios, edge cases, and backward compatibility with isTerminal().
 */

import { OpenAIResponsesV1Provider } from "../openAIResponsesV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";

describe("OpenAIResponsesV1Provider - Termination Detection", () => {
  let provider: OpenAIResponsesV1Provider;

  beforeEach(async () => {
    provider = new OpenAIResponsesV1Provider();
    await provider.initialize({
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  describe("detectTermination() - Non-streaming responses", () => {
    it("should detect natural completion with stop finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        },
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gpt-4o",
        metadata: { finish_reason: "stop" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("stop");
      expect(signal.message).toBe("Model completed response naturally");
      expect(signal.providerSpecific.metadata).toEqual({
        finish_reason: "stop",
      });
    });

    it("should detect token limit with length finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Truncated response..." }],
        },
        usage: { promptTokens: 100, completionTokens: 4096, totalTokens: 4196 },
        model: "gpt-4o",
        metadata: { finish_reason: "length" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("length");
      expect(signal.message).toBe("Response terminated due to token limit");
    });

    it("should detect content filtering with content_filter finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "I can't help with that." }],
        },
        usage: { promptTokens: 20, completionTokens: 8, totalTokens: 28 },
        model: "gpt-4o",
        metadata: { finish_reason: "content_filter" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("content_filter");
      expect(signal.message).toBe("Response terminated by content filter");
    });

    it("should detect function call completion with function_call finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [
            {
              type: "text" as const,
              text: "I'll help you with that function call.",
            },
          ],
        },
        usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
        model: "gpt-4o",
        metadata: { finish_reason: "function_call" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("function_call");
      expect(signal.message).toBe(
        "Function call completed and marked terminal",
      );
    });

    it("should detect tool calls completion with tool_calls finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [
            { type: "text" as const, text: "I'll use the tools to help you." },
          ],
        },
        usage: { promptTokens: 25, completionTokens: 12, totalTokens: 37 },
        model: "gpt-4o",
        metadata: { finish_reason: "tool_calls" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("tool_calls");
      expect(signal.message).toBe("Tool calls completed and marked terminal");
    });

    it("should handle unknown finish_reason values", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Response" }],
        },
        usage: { promptTokens: 15, completionTokens: 5, totalTokens: 20 },
        model: "gpt-4o",
        metadata: { finish_reason: "new_unknown_reason" },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("new_unknown_reason");
      expect(signal.message).toBe("Unknown finish_reason: new_unknown_reason");
    });

    it("should handle missing finish_reason in metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Response" }],
        },
        usage: { promptTokens: 15, completionTokens: 5, totalTokens: 20 },
        model: "gpt-4o",
        metadata: {},
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe(
        "Stream marked as finished but no finish_reason provided",
      );
    });

    it("should handle null finish_reason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Response" }],
        },
        usage: { promptTokens: 15, completionTokens: 5, totalTokens: 20 },
        model: "gpt-4o",
        metadata: { finish_reason: null },
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe(
        "Stream marked as finished but no finish_reason provided",
      );
    });
  });

  describe("detectTermination() - Streaming responses", () => {
    it("should detect completion in finished streaming delta with stop", () => {
      const delta: StreamDelta = {
        id: "chunk_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Final chunk" }],
        },
        finished: true,
        metadata: { finish_reason: "stop" },
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("stop");
      expect(signal.message).toBe("Model completed response naturally");
    });

    it("should detect token limit in streaming delta with length", () => {
      const delta: StreamDelta = {
        id: "chunk_456",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "..." }],
        },
        finished: true,
        metadata: { finish_reason: "length" },
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finish_reason");
      expect(signal.providerSpecific.originalValue).toBe("length");
    });

    it("should detect completion with response.completed event type", () => {
      const delta: StreamDelta = {
        id: "chunk_789",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Done" }],
        },
        finished: false,
        metadata: { eventType: "response.completed", finish_reason: "stop" },
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
    });

    it("should not terminate unfinished streaming delta without completion markers", () => {
      const delta: StreamDelta = {
        id: "chunk_abc",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Partial content" }],
        },
        finished: false,
        metadata: {},
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.message).toBe(
        "Stream not finished and no finish_reason available",
      );
    });

    it("should handle tool calls in streaming context", () => {
      const delta: StreamDelta = {
        id: "chunk_tool",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Using tools to help..." }],
        },
        finished: true,
        metadata: { finish_reason: "tool_calls" },
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalValue).toBe("tool_calls");
    });

    it("should preserve original metadata in streaming responses", () => {
      const delta: StreamDelta = {
        id: "chunk_meta",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Test" }],
        },
        finished: true,
        metadata: {
          finish_reason: "stop",
          model: "gpt-4o",
          usage: { total_tokens: 100 },
          custom_field: "custom_value",
        },
      };

      const signal = provider.detectTermination(delta);

      expect(signal.providerSpecific.metadata).toEqual({
        finish_reason: "stop",
        model: "gpt-4o",
        usage: { total_tokens: 100 },
        custom_field: "custom_value",
      });
    });
  });

  describe("isTerminal() integration", () => {
    it("should delegate to detectTermination() for non-streaming responses", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        },
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
        model: "gpt-4o",
        metadata: { finish_reason: "stop" },
      };

      const isTerminal = provider.isTerminal(response);
      const signal = provider.detectTermination(response);

      expect(isTerminal).toBe(signal.shouldTerminate);
      expect(isTerminal).toBe(true);
    });

    it("should delegate to detectTermination() for streaming responses", () => {
      const delta: StreamDelta = {
        id: "test_chunk",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Streaming" }],
        },
        finished: true,
        metadata: { finish_reason: "length" },
      };

      const isTerminal = provider.isTerminal(delta);
      const signal = provider.detectTermination(delta);

      expect(isTerminal).toBe(signal.shouldTerminate);
      expect(isTerminal).toBe(true);
    });

    it("should maintain backward compatibility with conversation context parameter", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Test" }],
        },
        usage: { promptTokens: 10, completionTokens: 3, totalTokens: 13 },
        model: "gpt-4o",
        metadata: { finish_reason: "stop" },
      };

      const conversationContext = {
        conversationHistory: [],
        currentIteration: 1,
        totalIterations: 5,
        startTime: Date.now() - 1000,
        lastIterationTime: Date.now(),
        streamingState: "idle" as const,
        toolExecutionHistory: [],
        estimatedTokensUsed: 13,
      };

      // Should not throw and should work with context parameter
      expect(() =>
        provider.isTerminal(response, conversationContext),
      ).not.toThrow();
      expect(provider.isTerminal(response, conversationContext)).toBe(true);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle response without metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "No metadata" }],
        },
        usage: { promptTokens: 8, completionTokens: 4, totalTokens: 12 },
        model: "gpt-4o",
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle streaming delta without metadata", () => {
      const delta: StreamDelta = {
        id: "no_meta",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "No metadata" }],
        },
        finished: true,
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle empty metadata object", () => {
      const delta: StreamDelta = {
        id: "empty_meta",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Empty metadata" }],
        },
        finished: false,
        metadata: {},
      };

      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.providerSpecific.metadata).toEqual({});
    });

    it("should handle malformed finish_reason types", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Malformed" }],
        },
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
        model: "gpt-4o",
        metadata: { finish_reason: 12345 }, // Number instead of string
      };

      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalValue).toBe(12345);
    });
  });
});
