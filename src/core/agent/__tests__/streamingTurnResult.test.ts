import type { StreamingTurnResult } from "../streamingTurnResult";
import type { MultiTurnState } from "../multiTurnState";
import type { ExecutionMetrics } from "../executionMetrics";
import type { StreamingResult } from "../streamingResult";
import type { Message } from "../../messages/message";

describe("StreamingTurnResult", () => {
  const mockMessages: Message[] = [
    {
      role: "user",
      content: [{ type: "text", text: "Hello" }],
    },
    {
      role: "assistant",
      content: [{ type: "text", text: "Hi there!" }],
    },
  ];

  const mockMultiTurnState: MultiTurnState = {
    messages: mockMessages,
    toolCalls: [],
    results: [],
    shouldContinue: true,
    lastResponse: "Hi there!",
    iteration: 1,
    totalIterations: 5,
    startTime: Date.now(),
    lastIterationTime: Date.now(),
    streamingState: "idle",
    pendingToolCalls: [],
    completedToolCalls: [],
  };

  const mockExecutionMetrics: ExecutionMetrics = {
    totalExecutionTimeMs: 1500,
    totalIterations: 1,
    averageIterationTimeMs: 1500,
    minIterationTimeMs: 1500,
    maxIterationTimeMs: 1500,
    currentIteration: 1,
    isTerminated: false,
  };

  const mockStreamingResult: StreamingResult = {
    state: "idle",
    content: "Hi there!",
    detectedToolCalls: [],
    success: true,
    executionMetrics: {
      streamingDuration: 450,
      chunksProcessed: 3,
      toolCallsDetected: 0,
    },
  };

  describe("interface structure", () => {
    it("should accept valid StreamingTurnResult with all required properties", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      expect(streamingTurnResult.finalMessages).toEqual(mockMessages);
      expect(streamingTurnResult.updatedState).toEqual(mockMultiTurnState);
      expect(streamingTurnResult.executionMetrics).toEqual(
        mockExecutionMetrics,
      );
      expect(streamingTurnResult.streamingResult).toEqual(mockStreamingResult);
    });

    it("should accept StreamingTurnResult with optional error property", () => {
      const error = new Error("Test error");
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
        error,
      };

      expect(streamingTurnResult.error).toEqual(error);
    });

    it("should accept StreamingTurnResult with optional metadata property", () => {
      const metadata = { testKey: "testValue", retryCount: 2 };
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
        metadata,
      };

      expect(streamingTurnResult.metadata).toEqual(metadata);
    });

    it("should accept StreamingTurnResult with both optional properties", () => {
      const error = new Error("Test error");
      const metadata = { fallbackUsed: true, streamingAttempts: 3 };

      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
        error,
        metadata,
      };

      expect(streamingTurnResult.error).toEqual(error);
      expect(streamingTurnResult.metadata).toEqual(metadata);
    });
  });

  describe("property types", () => {
    it("should require finalMessages to be Message array", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: [],
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      expect(Array.isArray(streamingTurnResult.finalMessages)).toBe(true);
    });

    it("should require updatedState to be MultiTurnState", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      expect(streamingTurnResult.updatedState).toHaveProperty("iteration");
      expect(streamingTurnResult.updatedState).toHaveProperty("streamingState");
      expect(streamingTurnResult.updatedState).toHaveProperty(
        "pendingToolCalls",
      );
    });

    it("should require executionMetrics to be ExecutionMetrics", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      expect(streamingTurnResult.executionMetrics).toHaveProperty(
        "totalExecutionTimeMs",
      );
      expect(streamingTurnResult.executionMetrics).toHaveProperty(
        "totalIterations",
      );
      expect(streamingTurnResult.executionMetrics).toHaveProperty(
        "currentIteration",
      );
    });

    it("should require streamingResult to be StreamingResult", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      expect(streamingTurnResult.streamingResult).toHaveProperty("state");
      expect(streamingTurnResult.streamingResult).toHaveProperty("success");
      expect(streamingTurnResult.streamingResult).toHaveProperty(
        "detectedToolCalls",
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle streaming with tool call detection", () => {
      const toolCallStreamingResult: StreamingResult = {
        state: "idle",
        content: "Let me search for that information...",
        detectedToolCalls: [
          {
            id: "call_123",
            name: "search",
            parameters: { query: "test" },
          },
        ],
        success: true,
        executionMetrics: {
          streamingDuration: 850,
          chunksProcessed: 5,
          toolCallsDetected: 1,
        },
      };

      const updatedStateWithToolCalls: MultiTurnState = {
        ...mockMultiTurnState,
        streamingState: "tool_execution",
        pendingToolCalls: [
          {
            id: "call_123",
            name: "search",
            parameters: { query: "test" },
          },
        ],
      };

      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: [
          ...mockMessages,
          {
            role: "assistant",
            content: [
              { type: "text", text: "Let me search for that information..." },
            ],
          },
        ],
        updatedState: updatedStateWithToolCalls,
        executionMetrics: mockExecutionMetrics,
        streamingResult: toolCallStreamingResult,
      };

      expect(
        streamingTurnResult.streamingResult.detectedToolCalls,
      ).toHaveLength(1);
      expect(streamingTurnResult.updatedState.streamingState).toBe(
        "tool_execution",
      );
      expect(streamingTurnResult.updatedState.pendingToolCalls).toHaveLength(1);
    });

    it("should handle streaming error scenarios", () => {
      const errorStreamingResult: StreamingResult = {
        state: "idle",
        content: "",
        detectedToolCalls: [],
        success: false,
        error: "Network timeout during streaming",
        executionMetrics: {
          streamingDuration: 5000,
          chunksProcessed: 2,
          toolCallsDetected: 0,
        },
      };

      const streamingError = new Error("Streaming failed");
      const metadata = {
        fallbackUsed: true,
        errorRecovery: "fallback_non_streaming",
        originalErrorType: "NetworkError",
      };

      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: {
          ...mockMultiTurnState,
          streamingState: "idle",
          shouldContinue: true,
        },
        executionMetrics: mockExecutionMetrics,
        streamingResult: errorStreamingResult,
        error: streamingError,
        metadata,
      };

      expect(streamingTurnResult.streamingResult.success).toBe(false);
      expect(streamingTurnResult.error).toEqual(streamingError);
      expect(streamingTurnResult.metadata?.fallbackUsed).toBe(true);
    });

    it("should handle complex conversation flows", () => {
      const complexMessages: Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Search for latest AI research" }],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "I'll search for the latest AI research papers...",
            },
          ],
        },
        {
          role: "tool",
          content: [
            { type: "text", text: "Found 15 recent papers on AI research" },
          ],
          metadata: { tool_call_id: "call_123" },
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "Based on the search results..." }],
        },
      ];

      const complexState: MultiTurnState = {
        ...mockMultiTurnState,
        messages: complexMessages,
        iteration: 2,
        streamingState: "idle",
        completedToolCalls: [
          {
            id: "call_123",
            name: "search",
            parameters: { query: "latest AI research" },
          },
        ],
      };

      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: complexMessages,
        updatedState: complexState,
        executionMetrics: {
          ...mockExecutionMetrics,
          totalIterations: 2,
          currentIteration: 2,
        },
        streamingResult: {
          ...mockStreamingResult,
          content: "Based on the search results...",
          executionMetrics: {
            streamingDuration: 1200,
            chunksProcessed: 8,
            toolCallsDetected: 1,
          },
        },
      };

      expect(streamingTurnResult.finalMessages).toHaveLength(4);
      expect(streamingTurnResult.updatedState.iteration).toBe(2);
      expect(streamingTurnResult.updatedState.completedToolCalls).toHaveLength(
        1,
      );
    });
  });

  describe("type compatibility", () => {
    it("should be assignable to object with streaming turn properties", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
      };

      const genericResult: {
        finalMessages: Message[];
        updatedState: MultiTurnState;
        executionMetrics: ExecutionMetrics;
        streamingResult: StreamingResult;
      } = streamingTurnResult;

      expect(genericResult.finalMessages).toEqual(mockMessages);
      expect(genericResult.updatedState).toEqual(mockMultiTurnState);
    });

    it("should work with destructuring assignment", () => {
      const streamingTurnResult: StreamingTurnResult = {
        finalMessages: mockMessages,
        updatedState: mockMultiTurnState,
        executionMetrics: mockExecutionMetrics,
        streamingResult: mockStreamingResult,
        metadata: { testValue: true },
      };

      const {
        finalMessages,
        updatedState,
        executionMetrics,
        streamingResult,
        metadata,
      } = streamingTurnResult;

      expect(finalMessages).toEqual(mockMessages);
      expect(updatedState).toEqual(mockMultiTurnState);
      expect(executionMetrics).toEqual(mockExecutionMetrics);
      expect(streamingResult).toEqual(mockStreamingResult);
      expect(metadata).toEqual({ testValue: true });
    });
  });
});
