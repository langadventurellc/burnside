import { defaultDetectTermination } from "../defaultTerminationDetection";
import type { ProviderPlugin } from "../providerPlugin";
import type { UnifiedTerminationSignal } from "../../agent/unifiedTerminationSignal";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ConversationContext } from "../../agent/conversationContext";
import type { Message } from "../../messages/message";

// Mock provider plugin for testing
const createMockProvider = (
  overrides: Partial<ProviderPlugin> = {},
): ProviderPlugin => ({
  id: "test-provider",
  name: "Test Provider",
  version: "1.0.0",
  translateRequest: jest.fn(),
  parseResponse: jest.fn(),
  isTerminal: jest.fn(),
  normalizeError: jest.fn(),
  ...overrides,
});

// Mock StreamDelta
const createMockStreamDelta = (
  overrides: Partial<StreamDelta> = {},
): StreamDelta => ({
  id: "delta-123",
  delta: { role: "assistant", content: [{ type: "text", text: "Hello" }] },
  finished: false,
  ...overrides,
});

// Mock complete response
const createMockResponse = (
  overrides: {
    message?: Partial<Message>;
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    };
    metadata?: Record<string, unknown>;
  } = {},
) => ({
  message: {
    role: "assistant" as const,
    content: [{ type: "text" as const, text: "Hello world" }],
    ...overrides.message,
  } as Message,
  model: overrides.model || "test-model",
  usage: overrides.usage || { promptTokens: 10, completionTokens: 5 },
  metadata: overrides.metadata,
});

describe("defaultDetectTermination", () => {
  describe("Enhanced Provider Detection", () => {
    it("should use provider's detectTermination method when available", () => {
      const mockTerminationSignal: UnifiedTerminationSignal = {
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
        },
      };

      const mockProvider = createMockProvider({
        detectTermination: jest.fn().mockReturnValue(mockTerminationSignal),
      });

      const response = createMockResponse();
      const result = defaultDetectTermination(mockProvider, response);

      expect(mockProvider.detectTermination).toHaveBeenCalledWith(
        response,
        undefined,
      );
      expect(result).toBe(mockTerminationSignal);
    });

    it("should pass conversation context to enhanced detection", () => {
      const mockContext: ConversationContext = {
        conversationHistory: [],
        currentIteration: 1,
        totalIterations: 5,
        startTime: Date.now() - 30000,
        lastIterationTime: Date.now() - 5000,
        streamingState: "idle",
        toolExecutionHistory: [],
        estimatedTokensUsed: 100,
      };

      const mockProvider = createMockProvider({
        detectTermination: jest.fn().mockReturnValue({
          shouldTerminate: false,
          reason: "unknown",
          confidence: "low",
          providerSpecific: { originalField: "test", originalValue: "test" },
        }),
      });

      const response = createMockResponse();
      defaultDetectTermination(mockProvider, response, mockContext);

      expect(mockProvider.detectTermination).toHaveBeenCalledWith(
        response,
        mockContext,
      );
    });
  });

  describe("Fallback to isTerminal", () => {
    it("should fallback to isTerminal when detectTermination not available", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const response = createMockResponse();
      const result = defaultDetectTermination(mockProvider, response);

      expect(mockProvider.isTerminal).toHaveBeenCalledWith(response, undefined);
      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("medium");
    });

    it("should create appropriate signal for non-terminal response", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(false),
      });

      const response = createMockResponse();
      const result = defaultDetectTermination(mockProvider, response);

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
    });
  });

  describe("Streaming Delta Analysis", () => {
    it("should detect finished streaming delta", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const finishedDelta = createMockStreamDelta({ finished: true });
      const result = defaultDetectTermination(mockProvider, finishedDelta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.providerSpecific.originalField).toBe("finished");
      expect(result.providerSpecific.originalValue).toBe("true");
    });

    it("should detect metadata-based termination signals", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(false),
      });

      const deltaWithMetadata = createMockStreamDelta({
        metadata: { done: true },
      });
      const result = defaultDetectTermination(mockProvider, deltaWithMetadata);

      expect(result.shouldTerminate).toBe(true); // High confidence metadata overrides isTerminal()
      expect(result.providerSpecific.originalField).toBe("metadata.done");
    });

    it("should handle streaming delta without special signals", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(false),
      });

      const normalDelta = createMockStreamDelta();
      const result = defaultDetectTermination(mockProvider, normalDelta);

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toContain("continuing");
    });
  });

  describe("Provider-Specific Metadata Analysis", () => {
    it("should analyze OpenAI finish_reason", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithFinishReason = createMockResponse({
        metadata: { finish_reason: "stop" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithFinishReason,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.providerSpecific.originalField).toBe("finish_reason");
      expect(result.providerSpecific.originalValue).toBe("stop");
    });

    it("should analyze OpenAI length termination", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithLength = createMockResponse({
        metadata: { finish_reason: "length" },
      });
      const result = defaultDetectTermination(mockProvider, responseWithLength);

      expect(result.reason).toBe("token_limit_reached");
      expect(result.confidence).toBe("high");
      expect(result.message).toContain("token limit");
    });

    it("should analyze OpenAI content filter", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithFilter = createMockResponse({
        metadata: { finish_reason: "content_filter" },
      });
      const result = defaultDetectTermination(mockProvider, responseWithFilter);

      expect(result.reason).toBe("content_filtered");
      expect(result.confidence).toBe("high");
      expect(result.message).toContain("content filter");
    });

    it("should analyze Anthropic stop_reason", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithStopReason = createMockResponse({
        metadata: { stop_reason: "end_turn" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithStopReason,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.providerSpecific.originalField).toBe("stop_reason");
      expect(result.providerSpecific.originalValue).toBe("end_turn");
    });

    it("should analyze Anthropic max_tokens", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithMaxTokens = createMockResponse({
        metadata: { stop_reason: "max_tokens" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithMaxTokens,
      );

      expect(result.reason).toBe("token_limit_reached");
      expect(result.confidence).toBe("high");
    });

    it("should analyze Anthropic stop_sequence", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithStopSequence = createMockResponse({
        metadata: { stop_reason: "stop_sequence" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithStopSequence,
      );

      expect(result.reason).toBe("stop_sequence");
      expect(result.confidence).toBe("high");
      expect(result.message).toContain("stop sequence");
    });

    it("should analyze Google Gemini finishReason", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithGeminiReason = createMockResponse({
        metadata: { finishReason: "STOP" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithGeminiReason,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.providerSpecific.originalField).toBe("finishReason");
      expect(result.providerSpecific.originalValue).toBe("STOP");
    });

    it("should handle unknown provider metadata values", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithUnknown = createMockResponse({
        metadata: { finish_reason: "unknown_reason" },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithUnknown,
      );

      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("medium");
      expect(result.message).toContain("Unknown finish reason");
    });
  });

  describe("Message Content Analysis", () => {
    it("should detect tool calls in metadata", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithToolCalls = createMockResponse({
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Using tools" }],
          metadata: { toolCalls: [{ id: "call_1", name: "test_tool" }] },
        },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithToolCalls,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.message).toContain("tool calls");
    });

    it("should analyze text content for completion patterns", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithCompletion = createMockResponse({
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "The task is now complete and finished." },
          ],
        },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithCompletion,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("medium");
      expect(result.message).toContain("completion");
    });

    it("should handle empty message content", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithEmptyContent = createMockResponse({
        message: {
          role: "assistant",
          content: [],
        },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithEmptyContent,
      );

      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("low");
      expect(result.message).toContain("Empty message");
    });
  });

  describe("Edge Cases", () => {
    it("should handle provider without isTerminal method", () => {
      const incompleteProvider = {
        id: "incomplete",
        name: "Incomplete Provider",
        version: "1.0.0",
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        normalizeError: jest.fn(),
        // Missing isTerminal method
      } as unknown as ProviderPlugin;

      const response = createMockResponse();

      expect(() => {
        defaultDetectTermination(incompleteProvider, response);
      }).toThrow();
    });

    it("should handle malformed response objects", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(false),
      });

      const malformedResponse = {
        message: {
          role: "assistant" as const,
          content: [],
        },
        model: "test-model",
        // Missing other required fields but typed correctly
      };

      // This should not throw since we have the minimum required structure
      const result = defaultDetectTermination(mockProvider, malformedResponse);
      expect(result.shouldTerminate).toBe(false);
    });

    it("should preserve provider metadata in signal", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const responseWithRichMetadata = createMockResponse({
        metadata: {
          finish_reason: "stop",
          model: "gpt-4",
          usage: { total_tokens: 150 },
          custom_field: "custom_value",
        },
      });
      const result = defaultDetectTermination(
        mockProvider,
        responseWithRichMetadata,
      );

      expect(result.providerSpecific.metadata).toEqual(
        responseWithRichMetadata.metadata,
      );
    });
  });

  describe("Integration with Conversation Context", () => {
    it("should pass conversation context to isTerminal fallback", () => {
      const mockContext: ConversationContext = {
        conversationHistory: [],
        currentIteration: 3,
        totalIterations: 5,
        startTime: Date.now() - 60000,
        lastIterationTime: Date.now() - 2000,
        streamingState: "streaming",
        toolExecutionHistory: [],
        estimatedTokensUsed: 250,
      };

      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(true),
      });

      const response = createMockResponse();
      defaultDetectTermination(mockProvider, response, mockContext);

      expect(mockProvider.isTerminal).toHaveBeenCalledWith(
        response,
        mockContext,
      );
    });

    it("should work without conversation context", () => {
      const mockProvider = createMockProvider({
        isTerminal: jest.fn().mockReturnValue(false),
      });

      const response = createMockResponse();
      const result = defaultDetectTermination(mockProvider, response);

      expect(mockProvider.isTerminal).toHaveBeenCalledWith(response, undefined);
      expect(result.shouldTerminate).toBe(false);
    });
  });
});
