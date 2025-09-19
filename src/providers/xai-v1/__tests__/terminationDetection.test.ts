/**
 * Tests for xAI Termination Detection
 *
 * Comprehensive test coverage for the detectTermination() method in xAI provider.
 * Tests all xAI status values, streaming eventType scenarios, edge cases,
 * and integration with isTerminal() method.
 */

import { XAIV1Provider } from "../xaiV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";
import type { ConversationContext } from "../../../core/agent/conversationContext";

/**
 * Helper function to create mock xAI provider
 */
function createMockXAIProvider(): XAIV1Provider {
  return new XAIV1Provider();
}

/**
 * Helper function to create mock non-streaming response
 */
function createMockResponse(
  status?: string,
  incompleteDetails?: { reason: string } | null,
  additionalMetadata?: Record<string, unknown>,
): {
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
} {
  return {
    message: {
      id: "msg_test",
      role: "assistant",
      content: [{ type: "text", text: "Test message" }],
      timestamp: "2024-01-01T00:00:00Z",
    },
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
    model: "grok-3",
    metadata: {
      provider: "xai",
      status,
      incomplete_details: incompleteDetails,
      ...additionalMetadata,
    },
  };
}

/**
 * Helper function to create mock streaming delta
 */
function createMockStreamDelta(
  finished = false,
  eventType?: string,
  status?: string,
  additionalMetadata?: Record<string, unknown>,
): StreamDelta {
  return {
    id: "delta_test",
    delta: {
      role: "assistant",
      content: [{ type: "text", text: "Test delta" }],
    },
    finished,
    metadata: {
      provider: "xai",
      eventType,
      status,
      ...additionalMetadata,
    },
  };
}

/**
 * Helper function to create mock conversation context
 */
function createMockConversationContext(): ConversationContext {
  return {
    conversationHistory: [],
    currentIteration: 1,
    totalIterations: 10,
    startTime: Date.now() - 30000,
    lastIterationTime: Date.now() - 5000,
    streamingState: "streaming",
    toolExecutionHistory: [],
    estimatedTokensUsed: 50,
  };
}

describe("XAIV1Provider - detectTermination", () => {
  let provider: XAIV1Provider;

  beforeEach(() => {
    provider = createMockXAIProvider();
  });

  describe("Non-streaming response termination detection", () => {
    it("should detect completed status as natural completion", () => {
      const response = createMockResponse("completed");
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe("xAI response completed successfully");
      expect(result.providerSpecific.originalField).toBe("status");
      expect(result.providerSpecific.originalValue).toBe("completed");
    });

    it("should detect incomplete status as token limit reached", () => {
      const response = createMockResponse("incomplete");
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("token_limit_reached");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe(
        "xAI response incomplete (likely token limit)",
      );
      expect(result.providerSpecific.originalField).toBe("status");
      expect(result.providerSpecific.originalValue).toBe("incomplete");
    });

    it("should detect failed status as error termination", () => {
      const response = createMockResponse("failed");
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("error");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe("xAI response failed");
      expect(result.providerSpecific.originalField).toBe("status");
      expect(result.providerSpecific.originalValue).toBe("failed");
    });

    it("should handle unknown status values", () => {
      const response = createMockResponse("unknown_status");
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true); // Non-streaming responses are always terminal
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("medium");
      expect(result.message).toBe("Unknown xAI status: unknown_status");
      expect(result.providerSpecific.originalField).toBe("status");
      expect(result.providerSpecific.originalValue).toBe("unknown_status");
    });

    it("should handle incomplete_details with specific reason", () => {
      const response = createMockResponse("incomplete", {
        reason: "max_tokens",
      });
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("token_limit_reached");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe("Response incomplete: max_tokens");
      expect(result.providerSpecific.originalField).toBe(
        "incomplete_details.reason",
      );
      expect(result.providerSpecific.originalValue).toBe("max_tokens");
    });

    it("should handle missing status gracefully", () => {
      const response = createMockResponse(undefined);
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toBe(
        "Stream marked as finished but no status provided",
      );
      expect(result.providerSpecific.originalField).toBe("finished");
    });

    it("should handle null status gracefully", () => {
      const response = createMockResponse(undefined);
      // Manually set status to null in metadata to test null handling
      if (response.metadata) {
        response.metadata.status = null;
      }
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toBe(
        "Stream marked as finished but no status provided",
      );
    });

    it("should preserve metadata in termination signal", () => {
      const additionalMetadata = { custom_field: "test_value", id: "resp_123" };
      const response = createMockResponse(
        "completed",
        null,
        additionalMetadata,
      );
      const result = provider.detectTermination(response);

      expect(result.providerSpecific.metadata).toEqual(
        expect.objectContaining(additionalMetadata),
      );
    });
  });

  describe("Streaming response termination detection", () => {
    it("should detect response.completed eventType as natural completion", () => {
      const delta = createMockStreamDelta(true, "response.completed");
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe(
        "Stream completed with response.completed event",
      );
      expect(result.providerSpecific.originalField).toBe("eventType");
      expect(result.providerSpecific.originalValue).toBe("response.completed");
    });

    it("should detect finished flag with completed status", () => {
      const delta = createMockStreamDelta(true, undefined, "completed");
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe("xAI response completed successfully");
    });

    it("should handle unfinished stream with no status", () => {
      const delta = createMockStreamDelta(false, undefined, undefined);
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toBe(
        "Stream not finished and no status available",
      );
    });

    it("should handle finished stream with no status", () => {
      const delta = createMockStreamDelta(true, undefined, undefined);
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toBe(
        "Stream marked as finished but no status provided",
      );
    });

    it("should handle streaming with unknown eventType", () => {
      const delta = createMockStreamDelta(
        true,
        "response.unknown",
        "completed",
      );
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
      expect(result.message).toBe("xAI response completed successfully");
    });

    it("should preserve streaming metadata in termination signal", () => {
      const additionalMetadata = { model: "grok-3", sequence_number: 5 };
      const delta = createMockStreamDelta(
        true,
        "response.completed",
        undefined,
        additionalMetadata,
      );
      const result = provider.detectTermination(delta);

      expect(result.providerSpecific.metadata).toEqual(
        expect.objectContaining(additionalMetadata),
      );
    });
  });

  describe("Conversation context handling", () => {
    it("should accept conversation context parameter without affecting result", () => {
      const response = createMockResponse("completed");
      const context = createMockConversationContext();
      const result = provider.detectTermination(response, context);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
    });

    it("should work without conversation context", () => {
      const response = createMockResponse("completed");
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("natural_completion");
      expect(result.confidence).toBe("high");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle response with empty metadata", () => {
      const response = {
        message: {
          id: "msg_test",
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Test" }],
          timestamp: "2024-01-01T00:00:00Z",
        },
        model: "grok-3",
        metadata: {},
      };
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
    });

    it("should handle delta with empty metadata", () => {
      const delta: StreamDelta = {
        id: "delta_test",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Test" }],
        },
        finished: false,
        metadata: {},
      };
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
    });

    it("should handle response without metadata field", () => {
      const response = {
        message: {
          id: "msg_test",
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "Test" }],
          timestamp: "2024-01-01T00:00:00Z",
        },
        model: "grok-3",
      };
      const result = provider.detectTermination(response);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
    });

    it("should handle delta without metadata field", () => {
      const delta: StreamDelta = {
        id: "delta_test",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Test" }],
        },
        finished: true,
      };
      const result = provider.detectTermination(delta);

      expect(result.shouldTerminate).toBe(true);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
    });
  });

  describe("Integration with isTerminal", () => {
    it("should delegate isTerminal to detectTermination for non-streaming", () => {
      const response = createMockResponse("completed");
      const isTerminalResult = provider.isTerminal(response);
      const detectTerminationResult = provider.detectTermination(response);

      expect(isTerminalResult).toBe(detectTerminationResult.shouldTerminate);
      expect(isTerminalResult).toBe(true);
    });

    it("should delegate isTerminal to detectTermination for streaming", () => {
      const delta = createMockStreamDelta(true, "response.completed");
      const isTerminalResult = provider.isTerminal(delta);
      const detectTerminationResult = provider.detectTermination(delta);

      expect(isTerminalResult).toBe(detectTerminationResult.shouldTerminate);
      expect(isTerminalResult).toBe(true);
    });

    it("should delegate isTerminal with conversation context", () => {
      const response = createMockResponse("completed");
      const context = createMockConversationContext();
      const isTerminalResult = provider.isTerminal(response, context);
      const detectTerminationResult = provider.detectTermination(
        response,
        context,
      );

      expect(isTerminalResult).toBe(detectTerminationResult.shouldTerminate);
      expect(isTerminalResult).toBe(true);
    });

    it("should return false for non-terminal streaming responses", () => {
      const delta = createMockStreamDelta(false, "response.output_text.delta");
      const isTerminalResult = provider.isTerminal(delta);
      const detectTerminationResult = provider.detectTermination(delta);

      expect(isTerminalResult).toBe(detectTerminationResult.shouldTerminate);
      expect(isTerminalResult).toBe(false);
    });
  });

  describe("Termination signal structure validation", () => {
    it("should return valid UnifiedTerminationSignal structure", () => {
      const response = createMockResponse("completed");
      const result = provider.detectTermination(response);

      // Validate structure matches UnifiedTerminationSignal interface
      expect(result).toEqual({
        shouldTerminate: expect.any(Boolean),
        reason: expect.any(String),
        confidence: expect.stringMatching(/^(high|medium|low)$/),
        providerSpecific: expect.objectContaining({
          originalField: expect.any(String),
          originalValue: expect.any(String),
          metadata: expect.any(Object),
        }),
        message: expect.any(String),
      });
    });

    it("should include all required fields in every termination signal", () => {
      const testCases = [
        createMockResponse("completed"),
        createMockResponse("incomplete"),
        createMockResponse("failed"),
        createMockStreamDelta(true, "response.completed"),
        createMockStreamDelta(false, "response.output_text.delta"),
      ];

      testCases.forEach((testCase) => {
        const result = provider.detectTermination(testCase);

        expect(result.shouldTerminate).toBeDefined();
        expect(result.reason).toBeDefined();
        expect(result.confidence).toBeDefined();
        expect(result.providerSpecific).toBeDefined();
        expect(result.providerSpecific.originalField).toBeDefined();
        expect(result.providerSpecific.originalValue).toBeDefined();
        expect(result.message).toBeDefined();
      });
    });
  });
});
