/**
 * Comprehensive test suite for Anthropic termination detection
 *
 * Tests the detectTermination() method and isTerminal() integration for
 * AnthropicMessagesV1Provider with various stop_reason values and scenarios.
 */

import { AnthropicMessagesV1Provider } from "../anthropicMessagesV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";
import type { ToolCall } from "../../../core/tools/toolCall";

describe("AnthropicMessagesV1Provider - Termination Detection", () => {
  let provider: AnthropicMessagesV1Provider;

  beforeEach(async () => {
    provider = new AnthropicMessagesV1Provider();
    await provider.initialize({
      apiKey: "sk-ant-test123",
    });
  });

  describe("detectTermination() - Non-streaming responses", () => {
    const createMockResponse = (stopReason: string | null | undefined) => ({
      message: {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hello world" }],
      } as Message,
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      model: "claude-3-sonnet-20240229",
      metadata: {
        id: "msg_123",
        stopReason,
        model: "claude-3-sonnet-20240229",
      },
    });

    it("should detect natural completion with end_turn", () => {
      const response = createMockResponse("end_turn");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("end_turn");
      expect(signal.message).toBe("Model completed turn naturally");
    });

    it("should detect token limit reached with max_tokens", () => {
      const response = createMockResponse("max_tokens");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("max_tokens");
      expect(signal.message).toBe("Response terminated due to token limit");
    });

    it("should detect stop sequence termination", () => {
      const response = createMockResponse("stop_sequence");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("stop_sequence");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("stop_sequence");
      expect(signal.message).toBe(
        "Response terminated by custom stop sequence",
      );
    });

    it("should handle tool_use completion", () => {
      const response = createMockResponse("tool_use");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("tool_use");
      expect(signal.message).toBe("Tool use completed and marked terminal");
    });

    it("should handle unknown stop_reason values", () => {
      const response = createMockResponse("unknown_reason");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("unknown_reason");
      expect(signal.message).toBe("Unknown stop reason: unknown_reason");
    });

    it("should handle null stop_reason", () => {
      const response = createMockResponse(null);
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe("Response terminated without stop_reason");
    });

    it("should handle undefined stop_reason", () => {
      const response = createMockResponse(undefined);
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
    });

    it("should preserve provider metadata", () => {
      const response = createMockResponse("end_turn");
      const signal = provider.detectTermination(response);

      expect(signal.providerSpecific.metadata).toEqual({
        id: "msg_123",
        stopReason: "end_turn",
        model: "claude-3-sonnet-20240229",
      });
    });
  });

  describe("detectTermination() - Streaming responses", () => {
    const createMockStreamDelta = (
      stopReason: string | null | undefined,
      finished: boolean,
    ): StreamDelta => ({
      id: "msg_123",
      delta: {
        content: [{ type: "text", text: "Hello" }],
      },
      finished,
      metadata: {
        provider: "anthropic",
        eventType: "message_delta",
        stopReason,
      },
    });

    it("should detect streaming completion with end_turn", () => {
      const delta = createMockStreamDelta("end_turn", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("stop_reason");
      expect(signal.providerSpecific.originalValue).toBe("end_turn");
      expect(signal.message).toBe("Model completed turn naturally");
    });

    it("should detect streaming token limit with max_tokens", () => {
      const delta = createMockStreamDelta("max_tokens", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalValue).toBe("max_tokens");
    });

    it("should handle ongoing streaming without termination", () => {
      const delta = createMockStreamDelta(null, false);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("false");
      expect(signal.message).toBe("Response continuing without stop_reason");
    });

    it("should handle tool_use in streaming", () => {
      const delta = createMockStreamDelta("tool_use", false);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalValue).toBe("tool_use");
      expect(signal.message).toBe("Tool use detected but not terminal");
    });

    it("should handle finished streaming without stop_reason", () => {
      const delta = createMockStreamDelta(undefined, true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.message).toBe("Response terminated without stop_reason");
    });

    it("should preserve streaming metadata", () => {
      const delta = createMockStreamDelta("end_turn", true);
      const signal = provider.detectTermination(delta);

      expect(signal.providerSpecific.metadata).toEqual({
        provider: "anthropic",
        eventType: "message_delta",
        stopReason: "end_turn",
      });
    });
  });

  describe("isTerminal() - Backward compatibility", () => {
    it("should delegate to detectTermination() for non-streaming", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "claude-3-sonnet-20240229",
        metadata: { stopReason: "end_turn" },
      };

      const isTerminal = provider.isTerminal(response);
      expect(isTerminal).toBe(true);
    });

    it("should delegate to detectTermination() for streaming", () => {
      const delta: StreamDelta = {
        id: "msg_123",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: true,
        metadata: { stopReason: "end_turn" },
      };

      const isTerminal = provider.isTerminal(delta);
      expect(isTerminal).toBe(true);
    });

    it("should return false for ongoing streaming", () => {
      const delta: StreamDelta = {
        id: "msg_123",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: false,
        metadata: { stopReason: null },
      };

      const isTerminal = provider.isTerminal(delta);
      expect(isTerminal).toBe(false);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle responses without metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "claude-3-sonnet-20240229",
        // No metadata field
      };

      const signal = provider.detectTermination(response);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle streaming deltas without metadata", () => {
      const delta: StreamDelta = {
        id: "msg_123",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: true,
        // No metadata field
      };

      const signal = provider.detectTermination(delta);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle malformed stopReason types", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "claude-3-sonnet-20240229",
        metadata: {
          stopReason: 42, // Wrong type
        },
      };

      const signal = provider.detectTermination(response);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalValue).toBe(42);
    });
  });

  describe("Conversation context integration", () => {
    it("should accept conversation context parameter", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "claude-3-sonnet-20240229",
        metadata: { stopReason: "end_turn" },
      };

      const conversationContext = {
        conversationHistory: [],
        currentIteration: 1,
        totalIterations: 5,
        startTime: Date.now() - 30000,
        lastIterationTime: Date.now() - 5000,
        streamingState: "idle" as const,
        toolExecutionHistory: [] as ToolCall[],
        estimatedTokensUsed: 15,
      };

      expect(() => {
        const signal = provider.detectTermination(
          response,
          conversationContext,
        );
        expect(signal.shouldTerminate).toBe(true);
      }).not.toThrow();
    });

    it("should work without conversation context", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5 },
        model: "claude-3-sonnet-20240229",
        metadata: { stopReason: "end_turn" },
      };

      expect(() => {
        const signal = provider.detectTermination(response);
        expect(signal.shouldTerminate).toBe(true);
      }).not.toThrow();
    });
  });
});
