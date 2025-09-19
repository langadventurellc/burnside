/**
 * Comprehensive unit tests for multi-turn error types covering error creation,
 * inheritance, serialization, and integration scenarios.
 */

import { MultiTurnExecutionError } from "../multiTurnErrors";
import { MaxIterationsExceededError } from "../maxIterationsExceededError";
import { IterationTimeoutError } from "../iterationTimeoutError";
import { MultiTurnStreamingInterruptionError } from "../multiTurnStreamingInterruptionError";
import type { MultiTurnState } from "../multiTurnState";
import type { ExecutionMetrics } from "../executionMetrics";
import type { ExecutionPhase } from "../executionPhase";

describe("MultiTurnExecutionError", () => {
  const mockMultiTurnState: Partial<MultiTurnState> = {
    iteration: 3,
    totalIterations: 10,
    startTime: Date.now() - 5000,
    lastIterationTime: Date.now() - 1000,
    streamingState: "idle",
    shouldContinue: true,
    messages: [
      { role: "user", content: [{ type: "text", text: "Hello" }] },
      { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
    ],
    toolCalls: [],
    pendingToolCalls: [],
    completedToolCalls: [],
  };

  const mockExecutionMetrics: ExecutionMetrics = {
    totalExecutionTimeMs: 5000,
    totalIterations: 3,
    averageIterationTimeMs: 1666,
    minIterationTimeMs: 1200,
    maxIterationTimeMs: 2100,
    currentIteration: 3,
    isTerminated: false,
  };

  describe("constructor", () => {
    it("should create error with required parameters", () => {
      const originalError = new Error("Original failure");
      const error = new MultiTurnExecutionError(
        "Test multi-turn error",
        "tool_execution",
        originalError,
        mockMultiTurnState,
      );

      expect(error.message).toBe("Test multi-turn error");
      expect(error.name).toBe("MultiTurnExecutionError");
      expect(error.cause).toBe(originalError);
      expect(error.multiTurnContext.phase).toBe("tool_execution");
      expect(error.multiTurnContext.state).toBe(mockMultiTurnState);
      expect(error.recoveryAction).toBe("abort");
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it("should create error with optional parameters", () => {
      const originalError = new Error("Original failure");
      const debugContext = { customKey: "customValue" };
      const timing = {
        totalElapsed: 4000,
        iterationElapsed: 800,
        lastIterationTime: Date.now() - 800,
      };

      const error = new MultiTurnExecutionError(
        "Test with options",
        "streaming_response",
        originalError,
        mockMultiTurnState,
        {
          metrics: mockExecutionMetrics,
          recoveryAction: "retry",
          debugContext,
          timing,
        },
      );

      expect(error.multiTurnContext.metrics).toBe(mockExecutionMetrics);
      expect(error.recoveryAction).toBe("retry");
      expect(error.multiTurnContext.timing).toBe(timing);
      expect(error.multiTurnContext.debugContext).toMatchObject({
        originalError: "Error",
        originalMessage: "Original failure",
        ...debugContext,
      });
    });

    it("should calculate timing automatically when not provided", () => {
      const originalError = new Error("Test error");
      const stateWithTiming = {
        ...mockMultiTurnState,
        startTime: Date.now() - 3000,
        lastIterationTime: Date.now() - 500,
      };

      const error = new MultiTurnExecutionError(
        "Timing test",
        "initialization",
        originalError,
        stateWithTiming,
      );

      expect(error.multiTurnContext.timing.totalElapsed).toBeGreaterThanOrEqual(
        2900,
      );
      expect(
        error.multiTurnContext.timing.iterationElapsed,
      ).toBeGreaterThanOrEqual(400);
      expect(error.multiTurnContext.timing.lastIterationTime).toBe(
        stateWithTiming.lastIterationTime,
      );
    });
  });

  describe("createExecutionError static method", () => {
    it("should create execution error with proper context", () => {
      const originalError = new Error("Execution failed");
      const phase: ExecutionPhase = "provider_request";

      const error = MultiTurnExecutionError.createExecutionError(
        phase,
        originalError,
        mockMultiTurnState,
        {
          metrics: mockExecutionMetrics,
          recoveryAction: "continue",
          debugContext: { requestId: "req_123" },
        },
      );

      expect(error.message).toBe(
        "Multi-turn execution failed during provider_request: Execution failed",
      );
      expect(error.multiTurnContext.phase).toBe(phase);
      expect(error.recoveryAction).toBe("continue");
      expect(error.multiTurnContext.debugContext.errorType).toBe(
        "multi_turn_execution_failure",
      );
      expect(error.multiTurnContext.debugContext.requestId).toBe("req_123");
    });
  });

  describe("toJSON", () => {
    it("should serialize error with redacted sensitive data", () => {
      const originalError = new Error("Test error");
      const error = new MultiTurnExecutionError(
        "Serialization test",
        "state_update",
        originalError,
        mockMultiTurnState,
        {
          metrics: mockExecutionMetrics,
        },
      );

      const json = error.toJSON();

      expect(json.name).toBe("MultiTurnExecutionError");
      expect(json.message).toBe("Serialization test");
      expect(json.recoveryAction).toBe("abort");
      expect(json.timestamp).toBe(error.timestamp);

      // Check that state is redacted properly
      const stateData = json.multiTurnContext as any;
      expect(stateData.state.iteration).toBe(3);
      expect(stateData.state.totalIterations).toBe(10);
      expect(stateData.state.streamingState).toBe("idle");
      expect(stateData.state.messageCount).toBe(2);
      expect(stateData.state.toolCallCount).toBe(0);
      expect(stateData.state.pendingToolCallCount).toBe(0);
      expect(stateData.state.completedToolCallCount).toBe(0);

      // Check that sensitive data is not included
      expect(stateData.state.messages).toBeUndefined();
      expect(stateData.state.toolCalls).toBeUndefined();

      // Check cause serialization
      expect(json.cause).toEqual({
        name: "Error",
        message: "Test error",
      });
    });
  });

  describe("inheritance", () => {
    it("should be instance of Error", () => {
      const originalError = new Error("Test");
      const error = new MultiTurnExecutionError(
        "Test",
        "cleanup",
        originalError,
        mockMultiTurnState,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MultiTurnExecutionError);
    });
  });
});

describe("MaxIterationsExceededError", () => {
  const mockState: Partial<MultiTurnState> = {
    iteration: 11,
    totalIterations: 10,
    startTime: Date.now() - 10000,
    shouldContinue: false,
    terminationReason: "max_iterations",
  };

  describe("constructor", () => {
    it("should create error with iteration details", () => {
      const error = new MaxIterationsExceededError(11, 10, mockState);

      expect(error.message).toBe(
        "Conversation exceeded maximum iterations: 11/10",
      );
      expect(error.name).toBe("MaxIterationsExceededError");
      expect(error.currentIteration).toBe(11);
      expect(error.maxIterations).toBe(10);
      expect(error.multiTurnContext.phase).toBe("termination_check");
      expect(error.recoveryAction).toBe("abort");
    });

    it("should include iteration-specific debug context", () => {
      const error = new MaxIterationsExceededError(15, 10, mockState, {
        debugContext: { conversationId: "conv_123" },
      });

      expect(error.multiTurnContext.debugContext.errorType).toBe(
        "max_iterations_exceeded",
      );
      expect(error.multiTurnContext.debugContext.iterationLimit).toBe(10);
      expect(error.multiTurnContext.debugContext.actualIterations).toBe(15);
      expect(error.multiTurnContext.debugContext.conversationId).toBe(
        "conv_123",
      );
    });
  });

  describe("toJSON", () => {
    it("should include iteration-specific fields", () => {
      const error = new MaxIterationsExceededError(12, 10, mockState);
      const json = error.toJSON();

      expect(json.currentIteration).toBe(12);
      expect(json.maxIterations).toBe(10);
      expect(json.name).toBe("MaxIterationsExceededError");
    });
  });

  describe("inheritance", () => {
    it("should extend MultiTurnExecutionError", () => {
      const error = new MaxIterationsExceededError(11, 10, mockState);

      expect(error).toBeInstanceOf(MultiTurnExecutionError);
      expect(error).toBeInstanceOf(MaxIterationsExceededError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe("IterationTimeoutError", () => {
  const mockState: Partial<MultiTurnState> = {
    iteration: 5,
    totalIterations: 10,
    startTime: Date.now() - 8000,
    lastIterationTime: Date.now() - 3500,
  };

  describe("constructor", () => {
    it("should create error with timeout details", () => {
      const error = new IterationTimeoutError(5, 3000, 3500, mockState);

      expect(error.message).toBe(
        "Iteration 5 exceeded timeout: 3500ms > 3000ms",
      );
      expect(error.name).toBe("IterationTimeoutError");
      expect(error.iteration).toBe(5);
      expect(error.timeoutMs).toBe(3000);
      expect(error.actualExecutionTime).toBe(3500);
      expect(error.multiTurnContext.phase).toBe("iteration_start");
      expect(error.recoveryAction).toBe("abort");
    });

    it("should include timeout-specific debug context", () => {
      const error = new IterationTimeoutError(3, 2000, 2100, mockState, {
        debugContext: { operationId: "op_456" },
      });

      expect(error.multiTurnContext.debugContext.errorType).toBe(
        "iteration_timeout",
      );
      expect(error.multiTurnContext.debugContext.timeoutLimit).toBe(2000);
      expect(error.multiTurnContext.debugContext.actualTime).toBe(2100);
      expect(error.multiTurnContext.debugContext.iterationNumber).toBe(3);
      expect(error.multiTurnContext.debugContext.operationId).toBe("op_456");
    });
  });

  describe("toJSON", () => {
    it("should include timeout-specific fields", () => {
      const error = new IterationTimeoutError(7, 4000, 4200, mockState);
      const json = error.toJSON();

      expect(json.iteration).toBe(7);
      expect(json.timeoutMs).toBe(4000);
      expect(json.actualExecutionTime).toBe(4200);
      expect(json.name).toBe("IterationTimeoutError");
    });
  });

  describe("inheritance", () => {
    it("should extend MultiTurnExecutionError", () => {
      const error = new IterationTimeoutError(5, 3000, 3500, mockState);

      expect(error).toBeInstanceOf(MultiTurnExecutionError);
      expect(error).toBeInstanceOf(IterationTimeoutError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe("MultiTurnStreamingInterruptionError", () => {
  const mockState: Partial<MultiTurnState> = {
    iteration: 2,
    totalIterations: 10,
    streamingState: "paused",
    pendingToolCalls: [
      {
        id: "call_123",
        name: "search",
        parameters: { query: "test" },
      },
    ],
  };

  describe("constructor", () => {
    it("should create error with streaming context", () => {
      const cause = new Error("Streaming pause failed");
      const error = new MultiTurnStreamingInterruptionError(
        "streaming",
        cause,
        mockState,
      );

      expect(error.message).toBe(
        "Streaming interruption failed during multi-turn execution: Streaming pause failed",
      );
      expect(error.name).toBe("MultiTurnStreamingInterruptionError");
      expect(error.streamingState).toBe("streaming");
      expect(error.cause).toBe(cause);
      expect(error.multiTurnContext.phase).toBe("streaming_response");
      expect(error.recoveryAction).toBe("fallback_single_turn");
    });

    it("should create error with interruption context", () => {
      const cause = new Error("Resume failed");
      const interruptionContext = {
        expectedState: "streaming" as const,
        actualState: "paused" as const,
        operationType: "resume" as const,
      };

      const error = new MultiTurnStreamingInterruptionError(
        "paused",
        cause,
        mockState,
        {
          interruptionContext,
          debugContext: { streamId: "stream_789" },
        },
      );

      expect(error.interruptionContext).toEqual(interruptionContext);
      expect(error.multiTurnContext.debugContext.streamId).toBe("stream_789");
      expect(error.multiTurnContext.debugContext.errorType).toBe(
        "streaming_interruption_failure",
      );
    });
  });

  describe("createPauseError static method", () => {
    it("should create pause error with proper context", () => {
      const cause = new Error("Cannot pause stream");
      const error = MultiTurnStreamingInterruptionError.createPauseError(
        cause,
        mockState,
        "streaming",
      );

      expect(error.interruptionContext.expectedState).toBe("paused");
      expect(error.interruptionContext.actualState).toBe("streaming");
      expect(error.interruptionContext.operationType).toBe("pause");
      expect(error.multiTurnContext.debugContext.interruptionType).toBe(
        "streaming_pause_failure",
      );
    });
  });

  describe("createResumeError static method", () => {
    it("should create resume error with proper context", () => {
      const cause = new Error("Cannot resume stream");
      const error = MultiTurnStreamingInterruptionError.createResumeError(
        cause,
        mockState,
        "resuming",
      );

      expect(error.interruptionContext.expectedState).toBe("streaming");
      expect(error.interruptionContext.actualState).toBe("resuming");
      expect(error.interruptionContext.operationType).toBe("resume");
      expect(error.multiTurnContext.debugContext.interruptionType).toBe(
        "streaming_resume_failure",
      );
    });
  });

  describe("toJSON", () => {
    it("should include streaming-specific fields", () => {
      const cause = new Error("Test streaming error");
      const error = new MultiTurnStreamingInterruptionError(
        "tool_execution",
        cause,
        mockState,
      );
      const json = error.toJSON();

      expect(json.streamingState).toBe("tool_execution");
      expect(json.interruptionContext).toEqual({
        expectedState: "tool_execution",
        actualState: "tool_execution",
        operationType: "pause",
      });
      expect(json.name).toBe("MultiTurnStreamingInterruptionError");
    });
  });

  describe("inheritance", () => {
    it("should extend MultiTurnExecutionError", () => {
      const cause = new Error("Test error");
      const error = new MultiTurnStreamingInterruptionError(
        "streaming",
        cause,
        mockState,
      );

      expect(error).toBeInstanceOf(MultiTurnExecutionError);
      expect(error).toBeInstanceOf(MultiTurnStreamingInterruptionError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe("Error type integration", () => {
  it("should be distinguishable by instanceof checks", () => {
    const baseError = new MultiTurnExecutionError(
      "base",
      "cleanup",
      new Error("test"),
      {},
    );
    const iterationError = new MaxIterationsExceededError(11, 10, {});
    const timeoutError = new IterationTimeoutError(5, 3000, 3500, {});
    const streamingError = new MultiTurnStreamingInterruptionError(
      "streaming",
      new Error("test"),
      {},
    );

    expect(baseError instanceof MultiTurnExecutionError).toBe(true);
    expect(baseError instanceof MaxIterationsExceededError).toBe(false);

    expect(iterationError instanceof MultiTurnExecutionError).toBe(true);
    expect(iterationError instanceof MaxIterationsExceededError).toBe(true);
    expect(iterationError instanceof IterationTimeoutError).toBe(false);

    expect(timeoutError instanceof MultiTurnExecutionError).toBe(true);
    expect(timeoutError instanceof IterationTimeoutError).toBe(true);
    expect(timeoutError instanceof MaxIterationsExceededError).toBe(false);

    expect(streamingError instanceof MultiTurnExecutionError).toBe(true);
    expect(streamingError instanceof MultiTurnStreamingInterruptionError).toBe(
      true,
    );
    expect(streamingError instanceof IterationTimeoutError).toBe(false);
  });
});
