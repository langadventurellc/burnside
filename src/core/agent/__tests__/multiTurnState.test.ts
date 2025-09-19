/**
 * Multi-Turn State Tests
 *
 * Comprehensive unit tests for the MultiTurnState interface that verify
 * TypeScript compilation, type safety, interface extension compliance,
 * and documentation accuracy for multi-turn conversation state tracking.
 */

import type { MultiTurnState } from "../multiTurnState";
import type { StreamingState } from "../streamingState";
import type { TerminationReason } from "../terminationReason";
import type { AgentExecutionState } from "../agentExecutionState";
import type { ToolCall } from "../../tools/toolCall";

describe("MultiTurnState", () => {
  describe("Interface Extension", () => {
    it("should properly extend AgentExecutionState", () => {
      const baseState: AgentExecutionState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
      };

      const multiTurnState: MultiTurnState = {
        ...baseState,
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      // Verify inheritance - all base properties should be accessible
      expect(multiTurnState.messages).toEqual([]);
      expect(multiTurnState.toolCalls).toEqual([]);
      expect(multiTurnState.results).toEqual([]);
      expect(multiTurnState.shouldContinue).toBe(true);

      // Verify new properties
      expect(multiTurnState.iteration).toBe(1);
      expect(multiTurnState.totalIterations).toBe(10);
      expect(typeof multiTurnState.startTime).toBe("number");
      expect(typeof multiTurnState.lastIterationTime).toBe("number");
      expect(multiTurnState.streamingState).toBe("idle");
      expect(multiTurnState.pendingToolCalls).toEqual([]);
      expect(multiTurnState.completedToolCalls).toEqual([]);
    });

    it("should include optional lastResponse from base interface", () => {
      const stateWithResponse: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        lastResponse: "Test response",
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(stateWithResponse.lastResponse).toBe("Test response");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct iteration number types", () => {
      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 5,
        totalIterations: 10,
        startTime: 1640995200000,
        lastIterationTime: 1640995260000,
        streamingState: "streaming",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(typeof state.iteration).toBe("number");
      expect(typeof state.totalIterations).toBe("number");
      expect(state.iteration).toBe(5);
      expect(state.totalIterations).toBe(10);
    });

    it("should enforce correct timestamp types", () => {
      const now = Date.now();
      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 10,
        startTime: now,
        lastIterationTime: now + 1000,
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(typeof state.startTime).toBe("number");
      expect(typeof state.lastIterationTime).toBe("number");
      expect(state.startTime).toBe(now);
      expect(state.lastIterationTime).toBe(now + 1000);
    });

    it("should enforce ToolCall array types", () => {
      const mockToolCall: ToolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: { param1: "value1" },
      };

      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "tool_execution",
        pendingToolCalls: [mockToolCall],
        completedToolCalls: [mockToolCall],
      };

      expect(Array.isArray(state.pendingToolCalls)).toBe(true);
      expect(Array.isArray(state.completedToolCalls)).toBe(true);
      expect(state.pendingToolCalls[0]).toEqual(mockToolCall);
      expect(state.completedToolCalls[0]).toEqual(mockToolCall);
    });
  });

  describe("StreamingState Union Type", () => {
    it("should accept all valid streaming state values", () => {
      const validStates: StreamingState[] = [
        "idle",
        "streaming",
        "paused",
        "tool_execution",
        "resuming",
      ];

      validStates.forEach((streamingState) => {
        const state: MultiTurnState = {
          messages: [],
          toolCalls: [],
          results: [],
          shouldContinue: true,
          iteration: 1,
          totalIterations: 10,
          startTime: Date.now(),
          lastIterationTime: Date.now(),
          streamingState,
          pendingToolCalls: [],
          completedToolCalls: [],
        };

        expect(state.streamingState).toBe(streamingState);
      });
    });

    it("should support streaming state transitions", () => {
      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      // Test state transitions
      state.streamingState = "streaming";
      expect(state.streamingState).toBe("streaming");

      state.streamingState = "paused";
      expect(state.streamingState).toBe("paused");

      state.streamingState = "tool_execution";
      expect(state.streamingState).toBe("tool_execution");

      state.streamingState = "resuming";
      expect(state.streamingState).toBe("resuming");
    });
  });

  describe("TerminationReason Union Type", () => {
    it("should accept all valid termination reason values", () => {
      const validReasons: TerminationReason[] = [
        "natural_completion",
        "max_iterations",
        "timeout",
        "cancelled",
        "error",
      ];

      validReasons.forEach((terminationReason) => {
        const state: MultiTurnState = {
          messages: [],
          toolCalls: [],
          results: [],
          shouldContinue: false,
          iteration: 5,
          totalIterations: 10,
          startTime: Date.now(),
          lastIterationTime: Date.now(),
          streamingState: "idle",
          pendingToolCalls: [],
          completedToolCalls: [],
          terminationReason,
        };

        expect(state.terminationReason).toBe(terminationReason);
      });
    });

    it("should handle optional terminationReason property", () => {
      const stateWithoutReason: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(stateWithoutReason.terminationReason).toBeUndefined();

      const stateWithReason: MultiTurnState = {
        ...stateWithoutReason,
        shouldContinue: false,
        terminationReason: "natural_completion",
      };

      expect(stateWithReason.terminationReason).toBe("natural_completion");
    });
  });

  describe("Complete State Object Creation", () => {
    it("should compile with all properties specified", () => {
      const completeState: MultiTurnState = {
        // Base AgentExecutionState properties
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Hello, help me calculate something" },
            ],
          },
        ],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        lastResponse:
          "I'll help you with calculations. What would you like me to calculate?",

        // Multi-turn specific properties
        iteration: 2,
        totalIterations: 10,
        startTime: 1640995200000,
        lastIterationTime: 1640995260000,
        streamingState: "streaming",
        pendingToolCalls: [
          {
            id: "call_123",
            name: "calculator",
            parameters: { operation: "add", a: 5, b: 3 },
          },
        ],
        completedToolCalls: [
          {
            id: "call_previous",
            name: "search",
            parameters: { query: "math operations" },
          },
        ],
        terminationReason: undefined,
      };

      expect(completeState.iteration).toBe(2);
      expect(completeState.totalIterations).toBe(10);
      expect(completeState.streamingState).toBe("streaming");
      expect(completeState.pendingToolCalls).toHaveLength(1);
      expect(completeState.completedToolCalls).toHaveLength(1);
    });

    it("should support empty tool call arrays", () => {
      const stateWithEmptyArrays: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 5,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(stateWithEmptyArrays.pendingToolCalls).toHaveLength(0);
      expect(stateWithEmptyArrays.completedToolCalls).toHaveLength(0);
    });
  });

  describe("Documentation Examples", () => {
    it("should compile the basic multi-turn state example", () => {
      const state: MultiTurnState = {
        // Inherited from AgentExecutionState
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Hello, help me calculate something" },
            ],
          },
        ],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        lastResponse:
          "I'll help you with calculations. What would you like me to calculate?",

        // Multi-turn specific properties
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(state.iteration).toBe(1);
      expect(state.totalIterations).toBe(10);
      expect(state.streamingState).toBe("idle");
    });

    it("should compile the streaming interruption example", () => {
      const streamingState: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 2,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "paused",
        pendingToolCalls: [
          {
            id: "call_123",
            name: "calculator",
            parameters: { operation: "add", a: 5, b: 3 },
          },
        ],
        completedToolCalls: [
          {
            id: "call_previous",
            name: "search",
            parameters: { query: "math operations" },
          },
        ],
      };

      expect(streamingState.iteration).toBe(2);
      expect(streamingState.streamingState).toBe("paused");
      expect(streamingState.pendingToolCalls).toHaveLength(1);
      expect(streamingState.completedToolCalls).toHaveLength(1);
    });

    it("should compile the completed conversation example", () => {
      const completedState: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: false,
        iteration: 4,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "idle",
        terminationReason: "natural_completion",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(completedState.iteration).toBe(4);
      expect(completedState.shouldContinue).toBe(false);
      expect(completedState.terminationReason).toBe("natural_completion");
      expect(completedState.streamingState).toBe("idle");
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimum iteration values", () => {
      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 1,
        startTime: 0,
        lastIterationTime: 0,
        streamingState: "idle",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(state.iteration).toBe(1);
      expect(state.totalIterations).toBe(1);
      expect(state.startTime).toBe(0);
      expect(state.lastIterationTime).toBe(0);
    });

    it("should handle large iteration values", () => {
      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 999,
        totalIterations: 1000,
        startTime: Number.MAX_SAFE_INTEGER,
        lastIterationTime: Number.MAX_SAFE_INTEGER,
        streamingState: "streaming",
        pendingToolCalls: [],
        completedToolCalls: [],
      };

      expect(state.iteration).toBe(999);
      expect(state.totalIterations).toBe(1000);
      expect(state.startTime).toBe(Number.MAX_SAFE_INTEGER);
      expect(state.lastIterationTime).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle multiple tool calls in arrays", () => {
      const toolCall1: ToolCall = {
        id: "call_1",
        name: "tool1",
        parameters: { param: "value1" },
      };

      const toolCall2: ToolCall = {
        id: "call_2",
        name: "tool2",
        parameters: { param: "value2" },
      };

      const state: MultiTurnState = {
        messages: [],
        toolCalls: [],
        results: [],
        shouldContinue: true,
        iteration: 1,
        totalIterations: 10,
        startTime: Date.now(),
        lastIterationTime: Date.now(),
        streamingState: "tool_execution",
        pendingToolCalls: [toolCall1, toolCall2],
        completedToolCalls: [toolCall1],
      };

      expect(state.pendingToolCalls).toHaveLength(2);
      expect(state.completedToolCalls).toHaveLength(1);
      expect(state.pendingToolCalls[0].id).toBe("call_1");
      expect(state.pendingToolCalls[1].id).toBe("call_2");
      expect(state.completedToolCalls[0].id).toBe("call_1");
    });
  });
});
