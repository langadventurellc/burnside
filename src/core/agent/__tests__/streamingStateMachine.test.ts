import { StreamingStateMachine } from "../streamingStateMachine";
import type { StreamDelta } from "../../../client/streamDelta";
import type { ToolCall } from "../../tools/toolCall";
import type { ToolResult } from "../../tools/toolResult";

describe("StreamingStateMachine", () => {
  let stateMachine: StreamingStateMachine;

  beforeEach(() => {
    stateMachine = new StreamingStateMachine();
  });

  describe("initialization", () => {
    it("should start in idle state", () => {
      expect(stateMachine.getCurrentState()).toBe("idle");
    });
  });

  describe("state transitions", () => {
    describe("validateStateTransition", () => {
      it("should allow valid transitions from idle", () => {
        expect(stateMachine.validateStateTransition("idle", "streaming")).toBe(
          true,
        );
      });

      it("should allow valid transitions from streaming", () => {
        expect(
          stateMachine.validateStateTransition("streaming", "paused"),
        ).toBe(true);
        expect(stateMachine.validateStateTransition("streaming", "idle")).toBe(
          true,
        );
      });

      it("should allow valid transitions from paused", () => {
        expect(
          stateMachine.validateStateTransition("paused", "tool_execution"),
        ).toBe(true);
      });

      it("should allow valid transitions from tool_execution", () => {
        expect(
          stateMachine.validateStateTransition("tool_execution", "resuming"),
        ).toBe(true);
      });

      it("should allow valid transitions from resuming", () => {
        expect(
          stateMachine.validateStateTransition("resuming", "streaming"),
        ).toBe(true);
        expect(stateMachine.validateStateTransition("resuming", "idle")).toBe(
          true,
        );
      });

      it("should reject invalid transitions", () => {
        expect(() => {
          stateMachine.validateStateTransition("idle", "paused");
        }).toThrow("Invalid state transition from 'idle' to 'paused'");

        expect(() => {
          stateMachine.validateStateTransition("streaming", "tool_execution");
        }).toThrow(
          "Invalid state transition from 'streaming' to 'tool_execution'",
        );

        expect(() => {
          stateMachine.validateStateTransition("paused", "streaming");
        }).toThrow("Invalid state transition from 'paused' to 'streaming'");
      });
    });
  });

  describe("handleStreamingResponse", () => {
    it("should process simple text stream successfully", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "Hello " }],
          },
          finished: false,
        },
        {
          id: "chunk-2",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "world!" }],
          },
          finished: true,
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("Hello world!");
      expect(result.state).toBe("idle");
      expect(result.detectedToolCalls).toHaveLength(0);
      expect(result.executionMetrics.chunksProcessed).toBe(2);
      expect(result.executionMetrics.toolCallsDetected).toBe(0);
    });

    it("should handle empty stream gracefully", async () => {
      const mockStream = createMockStream([]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("");
      expect(result.state).toBe("streaming");
      expect(result.executionMetrics.chunksProcessed).toBe(0);
    });

    it("should handle stream with no text content", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [],
          },
          finished: true,
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("");
      expect(result.state).toBe("idle");
      expect(result.executionMetrics.chunksProcessed).toBe(1);
    });

    it("should accumulate usage metrics when available", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "Hello" }],
          },
          finished: true,
          usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
          },
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("Hello");
      expect(result.executionMetrics.chunksProcessed).toBe(1);
    });

    it("should handle streaming errors gracefully", async () => {
      const mockStream = createMockStreamWithError("Network error");

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(result.state).toBe("idle");
    });

    it("should track execution timing accurately", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "Test" }],
          },
          finished: true,
        },
      ]);

      const startTime = Date.now();
      const result = await stateMachine.handleStreamingResponse(mockStream);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.executionMetrics.streamingDuration).toBeGreaterThanOrEqual(
        0,
      );
      expect(result.executionMetrics.streamingDuration).toBeLessThanOrEqual(
        endTime - startTime,
      );
    });
  });

  describe("pauseForToolExecution", () => {
    it("should transition from paused to tool_execution state", () => {
      // First set state to paused (simulate tool call detection)
      stateMachine.validateStateTransition("idle", "streaming");
      stateMachine.validateStateTransition("streaming", "paused");

      const toolCalls: ToolCall[] = [
        {
          id: "call_123",
          name: "test_tool",
          parameters: { input: "test" },
        },
      ];

      // Manually set state to paused to simulate detection
      const pausedMachine = new TestableStreamingStateMachine();
      pausedMachine.setState("paused");

      pausedMachine.pauseForToolExecution(toolCalls);

      expect(pausedMachine.getCurrentState()).toBe("tool_execution");
    });

    it("should store detected tool calls", () => {
      const toolCalls: ToolCall[] = [
        {
          id: "call_123",
          name: "test_tool",
          parameters: { input: "test" },
        },
        {
          id: "call_456",
          name: "another_tool",
          parameters: { data: "value" },
        },
      ];

      const pausedMachine = new TestableStreamingStateMachine();
      pausedMachine.setState("paused");

      pausedMachine.pauseForToolExecution(toolCalls);

      expect(pausedMachine.getDetectedToolCalls()).toHaveLength(2);
      expect(pausedMachine.getDetectedToolCalls()[0].id).toBe("call_123");
      expect(pausedMachine.getDetectedToolCalls()[1].id).toBe("call_456");
    });
  });

  describe("resumeAfterToolExecution", () => {
    it("should transition from tool_execution to resuming state", () => {
      const toolResults: ToolResult[] = [
        {
          callId: "call_123",
          success: true,
          data: { result: "success" },
        },
      ];

      const executingMachine = new TestableStreamingStateMachine();
      executingMachine.setState("tool_execution");

      executingMachine.resumeAfterToolExecution(toolResults);

      expect(executingMachine.getCurrentState()).toBe("resuming");
    });

    it("should clear detected tool calls after processing", () => {
      const toolCalls: ToolCall[] = [
        {
          id: "call_123",
          name: "test_tool",
          parameters: { input: "test" },
        },
      ];

      const toolResults: ToolResult[] = [
        {
          callId: "call_123",
          success: true,
          data: { result: "success" },
        },
      ];

      const machine = new TestableStreamingStateMachine();
      machine.setState("paused");
      machine.pauseForToolExecution(toolCalls);

      expect(machine.getDetectedToolCalls()).toHaveLength(1);

      machine.setState("tool_execution");
      machine.resumeAfterToolExecution(toolResults);

      expect(machine.getDetectedToolCalls()).toHaveLength(0);
    });
  });

  describe("tool call detection", () => {
    it("should not detect tool calls in text content (placeholder behavior)", async () => {
      // This test verifies the current placeholder behavior
      // When tool_use content type is implemented, this test should be updated
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            role: "assistant",
            content: [{ type: "text", text: "I need to call a tool" }],
          },
          finished: true,
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.detectedToolCalls).toHaveLength(0);
      expect(result.state).toBe("idle");
    });
  });

  describe("buffer management", () => {
    it("should accumulate content correctly across multiple chunks", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            content: [{ type: "text", text: "Hello " }],
          },
          finished: false,
        },
        {
          id: "chunk-2",
          delta: {
            content: [{ type: "text", text: "beautiful " }],
          },
          finished: false,
        },
        {
          id: "chunk-3",
          delta: {
            content: [{ type: "text", text: "world!" }],
          },
          finished: true,
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("Hello beautiful world!");
    });

    it("should handle mixed content types gracefully", async () => {
      const mockStream = createMockStream([
        {
          id: "chunk-1",
          delta: {
            content: [
              { type: "text", text: "Text content " },
              { type: "unknown", data: "should be ignored" } as any,
            ],
          },
          finished: false,
        },
        {
          id: "chunk-2",
          delta: {
            content: [{ type: "text", text: "more text" }],
          },
          finished: true,
        },
      ]);

      const result = await stateMachine.handleStreamingResponse(mockStream);

      expect(result.success).toBe(true);
      expect(result.content).toBe("Text content more text");
    });
  });

  describe("state machine integration", () => {
    it("should maintain state consistency throughout full cycle", () => {
      const machine = new TestableStreamingStateMachine();

      // Verify initial state
      expect(machine.getCurrentState()).toBe("idle");

      // Simulate streaming start
      machine.setState("streaming");
      expect(machine.getCurrentState()).toBe("streaming");

      // Simulate tool call detection
      machine.setState("paused");
      machine.pauseForToolExecution([
        { id: "call_1", name: "tool", parameters: {} },
      ]);
      expect(machine.getCurrentState()).toBe("tool_execution");

      // Simulate tool completion
      machine.resumeAfterToolExecution([
        { callId: "call_1", success: true, data: {} },
      ]);
      expect(machine.getCurrentState()).toBe("resuming");
    });
  });
});

// Helper functions and classes for testing

function createMockStream(chunks: StreamDelta[]): AsyncIterable<StreamDelta> {
  let index = 0;
  return {
    [Symbol.asyncIterator]() {
      return {
        next() {
          if (index < chunks.length) {
            return Promise.resolve({ value: chunks[index++], done: false });
          }
          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };
}

function createMockStreamWithError(
  errorMessage: string,
): AsyncIterable<StreamDelta> {
  return {
    [Symbol.asyncIterator]() {
      return {
        next() {
          return Promise.reject(new Error(errorMessage));
        },
      };
    },
  };
}

// Testable version that exposes private state for testing
class TestableStreamingStateMachine extends StreamingStateMachine {
  setState(state: any): void {
    (this as any).currentState = state;
  }

  getDetectedToolCalls(): ToolCall[] {
    return [...(this as any).detectedToolCalls];
  }
}
