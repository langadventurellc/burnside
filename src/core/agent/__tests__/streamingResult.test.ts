import type { StreamingResult } from "../streamingResult";

describe("StreamingResult", () => {
  describe("interface validation", () => {
    it("should allow valid streaming result with success state", () => {
      const result: StreamingResult = {
        state: "idle",
        content: "Hello world",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 1000,
          chunksProcessed: 5,
          toolCallsDetected: 0,
        },
      };

      expect(result.state).toBe("idle");
      expect(result.content).toBe("Hello world");
      expect(result.detectedToolCalls).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.executionMetrics.streamingDuration).toBe(1000);
    });

    it("should allow valid streaming result with error state", () => {
      const result: StreamingResult = {
        state: "streaming",
        content: "Partial content",
        detectedToolCalls: [],
        success: false,
        error: "Network timeout",
        executionMetrics: {
          streamingDuration: 500,
          chunksProcessed: 2,
          toolCallsDetected: 0,
        },
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network timeout");
      expect(result.state).toBe("streaming");
    });

    it("should allow streaming result with detected tool calls", () => {
      const result: StreamingResult = {
        state: "paused",
        content: "I can help you with",
        detectedToolCalls: [
          {
            id: "call_123",
            name: "search",
            parameters: { query: "weather" },
          },
        ],
        success: true,
        executionMetrics: {
          streamingDuration: 750,
          chunksProcessed: 8,
          toolCallsDetected: 1,
        },
      };

      expect(result.detectedToolCalls).toHaveLength(1);
      expect(result.detectedToolCalls[0].name).toBe("search");
      expect(result.executionMetrics.toolCallsDetected).toBe(1);
    });

    it("should allow streaming result with usage metrics", () => {
      const result: StreamingResult = {
        state: "idle",
        content: "Response complete",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 2000,
          chunksProcessed: 15,
          toolCallsDetected: 0,
          usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
          },
        },
      };

      expect(result.executionMetrics.usage).toBeDefined();
      expect(result.executionMetrics.usage?.promptTokens).toBe(100);
      expect(result.executionMetrics.usage?.completionTokens).toBe(50);
      expect(result.executionMetrics.usage?.totalTokens).toBe(150);
    });

    it("should allow streaming result with metadata", () => {
      const result: StreamingResult = {
        state: "resuming",
        content: "Continuing response",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 1200,
          chunksProcessed: 10,
          toolCallsDetected: 0,
        },
        metadata: {
          providerId: "openai",
          modelName: "gpt-4",
          temperature: 0.7,
        },
      };

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.providerId).toBe("openai");
      expect(result.metadata?.modelName).toBe("gpt-4");
    });
  });

  describe("streaming states", () => {
    it("should support all valid streaming states", () => {
      const states: Array<StreamingResult["state"]> = [
        "idle",
        "streaming",
        "paused",
        "tool_execution",
        "resuming",
      ];

      states.forEach((state) => {
        const result: StreamingResult = {
          state,
          content: "",
          detectedToolCalls: [],
          success: true,
          executionMetrics: {
            streamingDuration: 0,
            chunksProcessed: 0,
            toolCallsDetected: 0,
          },
        };

        expect(result.state).toBe(state);
      });
    });
  });

  describe("execution metrics", () => {
    it("should require all mandatory metrics fields", () => {
      const result: StreamingResult = {
        state: "idle",
        content: "Test content",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 1000,
          chunksProcessed: 5,
          toolCallsDetected: 2,
        },
      };

      expect(result.executionMetrics.streamingDuration).toBeDefined();
      expect(result.executionMetrics.chunksProcessed).toBeDefined();
      expect(result.executionMetrics.toolCallsDetected).toBeDefined();
    });

    it("should support optional usage metrics", () => {
      const resultWithUsage: StreamingResult = {
        state: "idle",
        content: "Test",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 1000,
          chunksProcessed: 5,
          toolCallsDetected: 0,
          usage: {
            promptTokens: 10,
            completionTokens: 5,
          },
        },
      };

      const resultWithoutUsage: StreamingResult = {
        state: "idle",
        content: "Test",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 1000,
          chunksProcessed: 5,
          toolCallsDetected: 0,
        },
      };

      expect(resultWithUsage.executionMetrics.usage).toBeDefined();
      expect(resultWithoutUsage.executionMetrics.usage).toBeUndefined();
    });
  });

  describe("error handling scenarios", () => {
    it("should support error results with partial content", () => {
      const result: StreamingResult = {
        state: "streaming",
        content: "Partial response before error",
        detectedToolCalls: [],
        success: false,
        error: "Connection lost",
        executionMetrics: {
          streamingDuration: 300,
          chunksProcessed: 3,
          toolCallsDetected: 0,
        },
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection lost");
      expect(result.content).toBe("Partial response before error");
    });

    it("should support error with detected tool calls", () => {
      const result: StreamingResult = {
        state: "paused",
        content: "Response with tool call",
        detectedToolCalls: [
          {
            id: "call_error",
            name: "failing_tool",
            parameters: { test: true },
          },
        ],
        success: false,
        error: "Tool parsing failed",
        executionMetrics: {
          streamingDuration: 800,
          chunksProcessed: 7,
          toolCallsDetected: 1,
        },
      };

      expect(result.success).toBe(false);
      expect(result.detectedToolCalls).toHaveLength(1);
      expect(result.executionMetrics.toolCallsDetected).toBe(1);
    });
  });
});
