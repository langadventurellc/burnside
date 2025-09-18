/**
 * Comprehensive test suite for Google Gemini termination detection
 *
 * Tests the detectTermination() method and isTerminal() integration for
 * GoogleGeminiV1Provider with various finishReason values and scenarios.
 */

import { GoogleGeminiV1Provider } from "../googleGeminiV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";

describe("GoogleGeminiV1Provider - Termination Detection", () => {
  let provider: GoogleGeminiV1Provider;

  beforeEach(async () => {
    provider = new GoogleGeminiV1Provider();
    await provider.initialize({
      apiKey: "AIza_test123",
    });
  });

  describe("detectTermination() - Non-streaming responses", () => {
    const createMockResponse = (finishReason: string | null | undefined) => ({
      message: {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hello world" }],
      } as Message,
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      model: "gemini-2.0-flash",
      metadata: {
        id: "chatcmpl_123",
        finishReason,
        model: "gemini-2.0-flash",
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            probability: "NEGLIGIBLE",
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      },
    });

    it("should detect natural completion with STOP", () => {
      const response = createMockResponse("STOP");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("STOP");
      expect(signal.message).toBe("Model completed response naturally");
    });

    it("should detect token limit reached with MAX_TOKENS", () => {
      const response = createMockResponse("MAX_TOKENS");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("MAX_TOKENS");
      expect(signal.message).toBe("Response terminated due to token limit");
    });

    it("should detect content filtered with SAFETY", () => {
      const response = createMockResponse("SAFETY");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("SAFETY");
      expect(signal.message).toBe("Response terminated by safety filter");
    });

    it("should detect content filtered with RECITATION", () => {
      const response = createMockResponse("RECITATION");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("RECITATION");
      expect(signal.message).toBe(
        "Response terminated due to recitation/copyright concerns",
      );
    });

    it("should handle OTHER finish reason", () => {
      const response = createMockResponse("OTHER");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("OTHER");
      expect(signal.message).toBe("Response terminated for unspecified reason");
    });

    it("should handle FINISH_REASON_UNSPECIFIED", () => {
      const response = createMockResponse("FINISH_REASON_UNSPECIFIED");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe(
        "FINISH_REASON_UNSPECIFIED",
      );
      expect(signal.message).toBe("Response with unspecified finish reason");
    });

    it("should handle unknown finishReason values", () => {
      const response = createMockResponse("CUSTOM_REASON");
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("CUSTOM_REASON");
      expect(signal.message).toBe(
        "Response with unknown finishReason: CUSTOM_REASON",
      );
    });

    it("should handle null finishReason", () => {
      const response = createMockResponse(null);
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe("Response terminated without finishReason");
    });

    it("should handle undefined finishReason", () => {
      const response = createMockResponse(undefined);
      const signal = provider.detectTermination(response);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe("Response terminated without finishReason");
    });

    it("should preserve Gemini metadata in termination signal", () => {
      const response = createMockResponse("STOP");
      const signal = provider.detectTermination(response);

      expect(signal.providerSpecific.metadata).toEqual({
        id: "chatcmpl_123",
        finishReason: "STOP",
        model: "gemini-2.0-flash",
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            probability: "NEGLIGIBLE",
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      });
    });
  });

  describe("detectTermination() - Streaming responses", () => {
    const createMockStreamDelta = (
      finishReason: string | null | undefined,
      finished: boolean,
    ): StreamDelta => ({
      id: "chunk_123",
      delta: {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
      },
      finished,
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      metadata: {
        id: "chatcmpl_123",
        finishReason,
        model: "gemini-2.0-flash",
        candidateIndex: 0,
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            probability: "NEGLIGIBLE",
          },
        ],
      },
    });

    it("should detect termination in streaming response with STOP", () => {
      const delta = createMockStreamDelta("STOP", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("STOP");
    });

    it("should detect token limit in streaming response with MAX_TOKENS", () => {
      const delta = createMockStreamDelta("MAX_TOKENS", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("token_limit_reached");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("MAX_TOKENS");
    });

    it("should detect safety filtering in streaming response", () => {
      const delta = createMockStreamDelta("SAFETY", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("SAFETY");
    });

    it("should detect recitation filtering in streaming response", () => {
      const delta = createMockStreamDelta("RECITATION", true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("content_filtered");
      expect(signal.confidence).toBe("high");
      expect(signal.providerSpecific.originalField).toBe("finishReason");
      expect(signal.providerSpecific.originalValue).toBe("RECITATION");
    });

    it("should handle mid-stream chunk without termination", () => {
      const delta = createMockStreamDelta(null, false);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(false);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("false");
      expect(signal.message).toBe("Response continuing without finishReason");
    });

    it("should handle finished flag without finishReason", () => {
      const delta = createMockStreamDelta(null, true);
      const signal = provider.detectTermination(delta);

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
      expect(signal.message).toBe("Response terminated without finishReason");
    });

    it("should preserve streaming metadata in termination signal", () => {
      const delta = createMockStreamDelta("STOP", true);
      const signal = provider.detectTermination(delta);

      expect(signal.providerSpecific.metadata).toEqual({
        id: "chatcmpl_123",
        finishReason: "STOP",
        model: "gemini-2.0-flash",
        candidateIndex: 0,
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            probability: "NEGLIGIBLE",
          },
        ],
      });
    });
  });

  describe("isTerminal() integration", () => {
    it("should delegate to detectTermination() for non-streaming responses", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.0-flash",
        metadata: { finishReason: "STOP" },
      };

      const isTerminal = provider.isTerminal(response);
      expect(isTerminal).toBe(true);
    });

    it("should delegate to detectTermination() for streaming responses", () => {
      const delta: StreamDelta = {
        id: "chunk_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: true,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        metadata: { finishReason: "MAX_TOKENS" },
      };

      const isTerminal = provider.isTerminal(delta);
      expect(isTerminal).toBe(true);
    });

    it("should return false for non-terminal streaming responses", () => {
      const delta: StreamDelta = {
        id: "chunk_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        metadata: {},
      };

      const isTerminal = provider.isTerminal(delta);
      expect(isTerminal).toBe(false);
    });

    it("should support optional conversation context parameter", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.0-flash",
        metadata: { finishReason: "STOP" },
      };

      const conversationContext = {
        conversationHistory: [],
        currentIteration: 1,
        totalIterations: 10,
        startTime: Date.now() - 30000,
        lastIterationTime: Date.now() - 5000,
        streamingState: "streaming" as const,
        toolExecutionHistory: [],
        estimatedTokensUsed: 15,
      };

      const isTerminal = provider.isTerminal(response, conversationContext);
      expect(isTerminal).toBe(true);
    });
  });

  describe("Edge cases and error scenarios", () => {
    it("should handle response with no metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.0-flash",
        metadata: undefined,
      };

      const signal = provider.detectTermination(response);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle streaming delta with no metadata", () => {
      const delta: StreamDelta = {
        id: "chunk_123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        metadata: undefined,
      };

      const signal = provider.detectTermination(delta);
      expect(signal.shouldTerminate).toBe(false);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
    });

    it("should handle malformed metadata", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.0-flash",
        metadata: { finishReason: 123 }, // Invalid type
      };

      const signal = provider.detectTermination(response);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("medium");
      expect(signal.message).toBe("Response with unknown finishReason: 123");
    });

    it("should handle empty string finishReason", () => {
      const response = {
        message: {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Hello world" }],
        } as Message,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gemini-2.0-flash",
        metadata: { finishReason: "" },
      };

      const signal = provider.detectTermination(response);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("unknown");
      expect(signal.confidence).toBe("low");
      expect(signal.providerSpecific.originalField).toBe("finished");
    });
  });
});
