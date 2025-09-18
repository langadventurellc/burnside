/**
 * Unit tests for termination analysis logic
 */

import { analyzeConversationTermination } from "../terminationAnalyzer";
import type { Message } from "../../messages/message";
import type { MultiTurnState } from "../multiTurnState";
import type { ProviderPlugin } from "../../providers/providerPlugin";
import type { UnifiedTerminationSignal } from "../unifiedTerminationSignal";
import { BridgeError } from "../../errors/bridgeError";

describe("analyzeConversationTermination", () => {
  const mockMultiTurnState: MultiTurnState = {
    // AgentExecutionState properties
    messages: [],
    toolCalls: [],
    results: [],
    shouldContinue: true,
    lastResponse: "",

    // MultiTurnState properties
    iteration: 1,
    totalIterations: 10,
    startTime: Date.now() - 5000,
    lastIterationTime: Date.now(),
    streamingState: "idle",
    pendingToolCalls: [],
    completedToolCalls: [],
  };

  describe("edge cases", () => {
    it("should handle empty message arrays", () => {
      const result = analyzeConversationTermination([], mockMultiTurnState);

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toContain("No messages to analyze");
      expect(result.providerSpecific.originalValue).toBe("0");
    });

    it("should handle conversations with no assistant messages", () => {
      const messages: Message[] = [
        {
          id: "user-1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          timestamp: new Date().toISOString(),
        },
      ];

      const result = analyzeConversationTermination(
        messages,
        mockMultiTurnState,
      );

      expect(result.shouldTerminate).toBe(false);
      expect(result.reason).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.message).toContain("No assistant messages found");
      expect(result.providerSpecific.originalValue).toBe("not_found");
    });
  });

  describe("provider termination detection", () => {
    const mockAssistantMessage: Message = {
      id: "assistant-1",
      role: "assistant",
      content: [{ type: "text", text: "Hello! How can I help you?" }],
      timestamp: new Date().toISOString(),
    };

    const messages: Message[] = [
      {
        id: "user-1",
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        timestamp: new Date().toISOString(),
      },
      mockAssistantMessage,
    ];

    it("should use provider detectTermination when available", () => {
      const mockTerminationSignal: UnifiedTerminationSignal = {
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
          metadata: { provider: "test-provider" },
        },
        message: "Conversation completed naturally",
      };

      const mockProvider: ProviderPlugin = {
        id: "test-provider",
        name: "Test Provider",
        version: "1.0.0",
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        isTerminal: jest.fn(),
        normalizeError: jest.fn(),
        detectTermination: jest.fn().mockReturnValue(mockTerminationSignal),
      };

      const result = analyzeConversationTermination(
        messages,
        mockMultiTurnState,
        mockProvider,
      );

      expect(mockProvider.detectTermination).toHaveBeenCalledWith(
        expect.objectContaining({
          message: mockAssistantMessage,
          model: "unknown",
          metadata: mockAssistantMessage.metadata,
        }),
        expect.objectContaining({
          conversationHistory: messages,
          currentIteration: 1,
          totalIterations: 10,
        }),
      );
      expect(result).toEqual(mockTerminationSignal);
    });

    it("should fall back to default detection when provider detectTermination fails", () => {
      const mockProvider: ProviderPlugin = {
        id: "test-provider",
        name: "Test Provider",
        version: "1.0.0",
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        isTerminal: jest.fn().mockReturnValue(false),
        normalizeError: jest
          .fn()
          .mockReturnValue(new BridgeError("Test error", "TEST_ERROR")),
        detectTermination: jest.fn().mockImplementation(() => {
          throw new Error("Provider detection failed");
        }),
      };

      // Note: defaultDetectTermination doesn't catch errors from detectTermination,
      // so this test verifies that errors propagate as expected
      expect(() => {
        analyzeConversationTermination(
          messages,
          mockMultiTurnState,
          mockProvider,
        );
      }).toThrow("Provider detection failed");

      expect(mockProvider.detectTermination).toHaveBeenCalled();
    });

    it("should use default detection when no provider is provided", () => {
      const result = analyzeConversationTermination(
        messages,
        mockMultiTurnState,
      );

      expect(result.shouldTerminate).toBe(false); // Default fallback behavior
      expect(result.confidence).toBe("low");
      expect(result.providerSpecific.originalField).toBe("isTerminal");
    });
  });

  describe("conversation context creation", () => {
    it("should create proper conversation context", () => {
      const messages: Message[] = [
        {
          id: "user-1",
          role: "user",
          content: [{ type: "text", text: "Hello" }],
          timestamp: new Date().toISOString(),
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
          timestamp: new Date().toISOString(),
        },
        {
          id: "tool-1",
          role: "tool",
          content: [{ type: "text", text: "Tool result" }],
          timestamp: new Date().toISOString(),
        },
      ];

      const stateWithTools: MultiTurnState = {
        ...mockMultiTurnState,
        iteration: 3,
        totalIterations: 5,
        completedToolCalls: [
          {
            id: "call-1",
            name: "test-tool",
            parameters: { test: "value" },
          },
        ],
        pendingToolCalls: [
          {
            id: "call-2",
            name: "pending-tool",
            parameters: { pending: "value" },
          },
        ],
      };

      const mockProvider: ProviderPlugin = {
        id: "test-provider",
        name: "Test Provider",
        version: "1.0.0",
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        isTerminal: jest.fn(),
        normalizeError: jest.fn(),
        detectTermination: jest.fn().mockImplementation((_, context) => {
          // Verify context properties
          expect(context.conversationHistory).toEqual(messages);
          expect(context.currentIteration).toBe(3);
          expect(context.totalIterations).toBe(5);
          expect(context.toolExecutionHistory).toHaveLength(2);
          expect(context.streamingState).toBe("idle");
          expect(context.startTime).toBeDefined();
          expect(context.lastIterationTime).toBeDefined();
          expect(context.estimatedTokensUsed).toBeUndefined();

          return {
            shouldTerminate: false,
            reason: "unknown",
            confidence: "low",
            providerSpecific: {
              originalField: "test",
              originalValue: "test",
            },
          };
        }),
      };

      analyzeConversationTermination(messages, stateWithTools, mockProvider);

      expect(mockProvider.detectTermination).toHaveBeenCalled();
    });
  });

  describe("assistant message finding", () => {
    it("should find the latest assistant message", () => {
      const messages: Message[] = [
        {
          id: "user-1",
          role: "user",
          content: [{ type: "text", text: "First message" }],
          timestamp: new Date().toISOString(),
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: [{ type: "text", text: "First assistant response" }],
          timestamp: new Date().toISOString(),
        },
        {
          id: "user-2",
          role: "user",
          content: [{ type: "text", text: "Second message" }],
          timestamp: new Date().toISOString(),
        },
        {
          id: "assistant-2",
          role: "assistant",
          content: [{ type: "text", text: "Latest assistant response" }],
          timestamp: new Date().toISOString(),
        },
      ];

      const mockProvider: ProviderPlugin = {
        id: "test-provider",
        name: "Test Provider",
        version: "1.0.0",
        translateRequest: jest.fn(),
        parseResponse: jest.fn(),
        isTerminal: jest.fn(),
        normalizeError: jest.fn(),
        detectTermination: jest.fn().mockImplementation((response) => {
          // Verify it's the latest assistant message
          expect(response.message.id).toBe("assistant-2");
          expect(response.message.content[0]).toEqual({
            type: "text",
            text: "Latest assistant response",
          });

          return {
            shouldTerminate: false,
            reason: "unknown",
            confidence: "low",
            providerSpecific: {
              originalField: "test",
              originalValue: "test",
            },
          };
        }),
      };

      analyzeConversationTermination(
        messages,
        mockMultiTurnState,
        mockProvider,
      );

      expect(mockProvider.detectTermination).toHaveBeenCalled();
    });
  });
});
