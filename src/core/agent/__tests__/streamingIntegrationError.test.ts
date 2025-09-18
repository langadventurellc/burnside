import { StreamingIntegrationError } from "../streamingIntegrationError";
import type { StreamingState } from "../streamingState";
import type { ToolCall } from "../../tools/toolCall";

describe("StreamingIntegrationError", () => {
  const mockToolCalls: ToolCall[] = [
    {
      id: "call_123",
      name: "search",
      parameters: { query: "test query" },
    },
    {
      id: "call_456",
      name: "calculate",
      parameters: { expression: "2 + 2" },
    },
  ];

  const mockToolContext = {
    pendingToolCalls: mockToolCalls,
    executedToolCalls: [],
    failedToolCalls: [],
  };

  describe("constructor", () => {
    it("should create error with required parameters", () => {
      const error = new StreamingIntegrationError(
        "Test error message",
        "streaming",
        "retry",
      );

      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("StreamingIntegrationError");
      expect(error.streamingState).toBe("streaming");
      expect(error.recoveryAction).toBe("retry");
      expect(error.debugContext).toEqual({});
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it("should create error with optional parameters", () => {
      const cause = new Error("Original error");
      const debugContext = { testKey: "testValue" };

      const error = new StreamingIntegrationError(
        "Test error with options",
        "paused",
        "fallback_non_streaming",
        {
          cause,
          toolContext: mockToolContext,
          debugContext,
        },
      );

      expect(error.cause).toBe(cause);
      expect(error.toolContext).toEqual(mockToolContext);
      expect(error.debugContext).toEqual(debugContext);
    });

    it("should inherit from Error class", () => {
      const error = new StreamingIntegrationError(
        "Test error",
        "idle",
        "abort",
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof StreamingIntegrationError).toBe(true);
    });
  });

  describe("createStreamingPauseError", () => {
    it("should create pause error with correct properties", () => {
      const originalError = new Error("Pause failed");
      const streamingState: StreamingState = "streaming";

      const error = StreamingIntegrationError.createStreamingPauseError(
        originalError,
        streamingState,
        mockToolCalls,
      );

      expect(error.message).toContain(
        "Failed to pause streaming for tool execution",
      );
      expect(error.message).toContain("Pause failed");
      expect(error.streamingState).toBe("streaming");
      expect(error.recoveryAction).toBe("retry");
      expect(error.cause).toBe(originalError);
      expect(error.toolContext?.pendingToolCalls).toEqual(mockToolCalls);
      expect(error.toolContext?.executedToolCalls).toEqual([]);
      expect(error.toolContext?.failedToolCalls).toEqual([]);
      expect(error.debugContext.errorType).toBe("streaming_pause_failure");
      expect(error.debugContext.toolCallCount).toBe(2);
    });
  });

  describe("createToolExecutionDuringStreamingError", () => {
    it("should create tool execution error with 'continue' recovery for partial failures", () => {
      const originalError = new Error("Tool execution failed");
      const toolContext = {
        pendingToolCalls: mockToolCalls,
        executedToolCalls: [mockToolCalls[0]],
        failedToolCalls: [mockToolCalls[1]],
      };

      const error =
        StreamingIntegrationError.createToolExecutionDuringStreamingError(
          originalError,
          "tool_execution",
          toolContext,
        );

      expect(error.message).toContain(
        "Tool execution failed during streaming interruption",
      );
      expect(error.recoveryAction).toBe("continue");
      expect(error.toolContext).toEqual(toolContext);
      expect(error.debugContext.errorType).toBe(
        "tool_execution_during_streaming_failure",
      );
      expect(error.debugContext.totalToolCalls).toBe(2);
      expect(error.debugContext.executedCount).toBe(1);
      expect(error.debugContext.failedCount).toBe(1);
    });

    it("should create tool execution error with 'fallback_non_streaming' recovery for total failure", () => {
      const originalError = new Error("All tools failed");
      const toolContext = {
        pendingToolCalls: mockToolCalls,
        executedToolCalls: [],
        failedToolCalls: mockToolCalls,
      };

      const error =
        StreamingIntegrationError.createToolExecutionDuringStreamingError(
          originalError,
          "tool_execution",
          toolContext,
        );

      expect(error.recoveryAction).toBe("fallback_non_streaming");
      expect(error.toolContext?.failedToolCalls).toHaveLength(2);
      expect(error.debugContext.failedCount).toBe(2);
    });
  });

  describe("createStreamingResumeError", () => {
    it("should create resume error with correct properties", () => {
      const originalError = new Error("Resume failed");
      const executedToolCalls = [mockToolCalls[0]];

      const error = StreamingIntegrationError.createStreamingResumeError(
        originalError,
        "resuming",
        executedToolCalls,
      );

      expect(error.message).toContain(
        "Failed to resume streaming after tool execution",
      );
      expect(error.streamingState).toBe("resuming");
      expect(error.recoveryAction).toBe("fallback_non_streaming");
      expect(error.toolContext?.executedToolCalls).toEqual(executedToolCalls);
      expect(error.toolContext?.pendingToolCalls).toEqual([]);
      expect(error.toolContext?.failedToolCalls).toEqual([]);
      expect(error.debugContext.errorType).toBe("streaming_resume_failure");
      expect(error.debugContext.toolCallsExecuted).toBe(1);
    });
  });

  describe("createStateSynchronizationError", () => {
    it("should create state synchronization error with mismatch details", () => {
      const originalError = new Error("State sync failed");
      const streamingState: StreamingState = "streaming";
      const multiTurnState: StreamingState = "paused";

      const error = StreamingIntegrationError.createStateSynchronizationError(
        originalError,
        streamingState,
        multiTurnState,
      );

      expect(error.message).toContain("State synchronization failed");
      expect(error.streamingState).toBe("streaming");
      expect(error.recoveryAction).toBe("abort");
      expect(error.debugContext.errorType).toBe(
        "state_synchronization_failure",
      );
      expect(error.debugContext.streamingMachineState).toBe("streaming");
      expect(error.debugContext.multiTurnState).toBe("paused");
      expect(error.debugContext.stateMismatch).toBe(true);
    });

    it("should detect when states match", () => {
      const originalError = new Error("State sync failed");
      const streamingState: StreamingState = "idle";
      const multiTurnState: StreamingState = "idle";

      const error = StreamingIntegrationError.createStateSynchronizationError(
        originalError,
        streamingState,
        multiTurnState,
      );

      expect(error.debugContext.stateMismatch).toBe(false);
    });
  });

  describe("createGenericStreamingError", () => {
    it("should create generic error with custom properties", () => {
      const customMessage = "Custom streaming error";
      const customDebugContext = { customProperty: "customValue" };
      const originalError = new Error("Original error");

      const error = StreamingIntegrationError.createGenericStreamingError(
        customMessage,
        "paused",
        "retry",
        customDebugContext,
        originalError,
      );

      expect(error.message).toBe(customMessage);
      expect(error.streamingState).toBe("paused");
      expect(error.recoveryAction).toBe("retry");
      expect(error.cause).toBe(originalError);
      expect(error.debugContext.errorType).toBe(
        "generic_streaming_integration_failure",
      );
      expect(error.debugContext.customProperty).toBe("customValue");
    });

    it("should create generic error without cause", () => {
      const error = StreamingIntegrationError.createGenericStreamingError(
        "No cause error",
        "idle",
        "abort",
      );

      expect(error.cause).toBeUndefined();
      expect(error.debugContext.errorType).toBe(
        "generic_streaming_integration_failure",
      );
    });
  });

  describe("toJSON", () => {
    it("should serialize error to JSON with all properties", () => {
      const originalError = new Error("Original error");
      const error = new StreamingIntegrationError(
        "Test serialization",
        "streaming",
        "retry",
        {
          cause: originalError,
          toolContext: mockToolContext,
          debugContext: { testKey: "testValue" },
        },
      );

      const json = error.toJSON();

      expect(json.name).toBe("StreamingIntegrationError");
      expect(json.message).toBe("Test serialization");
      expect(json.streamingState).toBe("streaming");
      expect(json.recoveryAction).toBe("retry");
      expect(json.toolContext).toEqual(mockToolContext);
      expect(json.debugContext).toEqual({ testKey: "testValue" });
      expect(json.timestamp).toBeGreaterThan(0);
      expect(json.stack).toBeDefined();
      expect(json.cause).toEqual({
        name: "Error",
        message: "Original error",
      });
    });

    it("should serialize error without cause", () => {
      const error = new StreamingIntegrationError(
        "Test no cause",
        "idle",
        "abort",
      );

      const json = error.toJSON();

      expect(json.cause).toBeUndefined();
    });

    it("should handle nested error serialization", () => {
      const nestedError = new TypeError("Type error");
      const error = StreamingIntegrationError.createStreamingPauseError(
        nestedError,
        "streaming",
        mockToolCalls,
      );

      const json = error.toJSON();

      expect(json.cause).toBeDefined();
      expect((json.cause as { name: string; message: string }).name).toBe(
        "TypeError",
      );
      expect((json.cause as { name: string; message: string }).message).toBe(
        "Type error",
      );
    });
  });

  describe("recovery actions", () => {
    it("should support all recovery action types", () => {
      const actions: Array<
        "retry" | "fallback_non_streaming" | "abort" | "continue"
      > = ["retry", "fallback_non_streaming", "abort", "continue"];

      actions.forEach((action) => {
        const error = new StreamingIntegrationError(
          "Test recovery action",
          "idle",
          action,
        );

        expect(error.recoveryAction).toBe(action);
      });
    });
  });

  describe("streaming states", () => {
    it("should support all streaming state types", () => {
      const states: StreamingState[] = [
        "idle",
        "streaming",
        "paused",
        "tool_execution",
        "resuming",
      ];

      states.forEach((state) => {
        const error = new StreamingIntegrationError(
          "Test streaming state",
          state,
          "retry",
        );

        expect(error.streamingState).toBe(state);
      });
    });
  });

  describe("error inheritance", () => {
    it("should preserve error stack trace", () => {
      const error = new StreamingIntegrationError(
        "Stack trace test",
        "idle",
        "retry",
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("StreamingIntegrationError");
    });

    it("should work with instanceof checks", () => {
      const error = new StreamingIntegrationError(
        "Instance test",
        "streaming",
        "abort",
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof StreamingIntegrationError).toBe(true);
    });

    it("should preserve cause chain", () => {
      const rootCause = new Error("Root cause");
      const intermediateCause = new Error("Intermediate", { cause: rootCause });

      const error = new StreamingIntegrationError(
        "Final error",
        "idle",
        "retry",
        { cause: intermediateCause },
      );

      expect(error.cause).toBe(intermediateCause);
      expect((error.cause as Error).cause).toBe(rootCause);
    });
  });
});
