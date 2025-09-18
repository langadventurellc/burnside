/**
 * Agent Execution Options Tests
 *
 * Comprehensive unit tests for the AgentExecutionOptions interface that verify
 * TypeScript compilation, type safety, backward compatibility, and documentation
 * accuracy for both single-turn and multi-turn configuration options.
 */

import type { AgentExecutionOptions } from "../agentExecutionOptions";

describe("AgentExecutionOptions", () => {
  describe("Backward Compatibility", () => {
    it("should compile with existing single-turn options only", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: 1,
        timeoutMs: 10000,
        toolTimeoutMs: 5000,
        continueOnToolError: true,
      };

      expect(options.maxToolCalls).toBe(1);
      expect(options.timeoutMs).toBe(10000);
      expect(options.toolTimeoutMs).toBe(5000);
      expect(options.continueOnToolError).toBe(true);
    });

    it("should compile with empty options object", () => {
      const options: AgentExecutionOptions = {};
      expect(options).toEqual({});
    });

    it("should compile with partial single-turn options", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: 5,
        continueOnToolError: false,
      };

      expect(options.maxToolCalls).toBe(5);
      expect(options.continueOnToolError).toBe(false);
      expect(options.timeoutMs).toBeUndefined();
      expect(options.toolTimeoutMs).toBeUndefined();
    });
  });

  describe("Multi-Turn Options", () => {
    it("should compile with all new multi-turn options", () => {
      const options: AgentExecutionOptions = {
        maxIterations: 5,
        iterationTimeoutMs: 15000,
        enableStreaming: true,
        toolExecutionStrategy: "parallel",
        maxConcurrentTools: 2,
      };

      expect(options.maxIterations).toBe(5);
      expect(options.iterationTimeoutMs).toBe(15000);
      expect(options.enableStreaming).toBe(true);
      expect(options.toolExecutionStrategy).toBe("parallel");
      expect(options.maxConcurrentTools).toBe(2);
    });

    it("should compile with sequential tool execution strategy", () => {
      const options: AgentExecutionOptions = {
        toolExecutionStrategy: "sequential",
      };

      expect(options.toolExecutionStrategy).toBe("sequential");
    });

    it("should compile with parallel tool execution strategy", () => {
      const options: AgentExecutionOptions = {
        toolExecutionStrategy: "parallel",
        maxConcurrentTools: 4,
      };

      expect(options.toolExecutionStrategy).toBe("parallel");
      expect(options.maxConcurrentTools).toBe(4);
    });

    it("should compile with undefined iterationTimeoutMs", () => {
      const options: AgentExecutionOptions = {
        maxIterations: 10,
        iterationTimeoutMs: undefined,
      };

      expect(options.maxIterations).toBe(10);
      expect(options.iterationTimeoutMs).toBeUndefined();
    });
  });

  describe("Combined Single-Turn and Multi-Turn Options", () => {
    it("should compile with complete configuration", () => {
      const options: AgentExecutionOptions = {
        // Single-turn options
        maxToolCalls: 5,
        timeoutMs: 60000,
        toolTimeoutMs: 10000,
        continueOnToolError: true,
        // Multi-turn options
        maxIterations: 3,
        iterationTimeoutMs: 20000,
        enableStreaming: false,
        toolExecutionStrategy: "parallel",
        maxConcurrentTools: 3,
      };

      // Verify single-turn options
      expect(options.maxToolCalls).toBe(5);
      expect(options.timeoutMs).toBe(60000);
      expect(options.toolTimeoutMs).toBe(10000);
      expect(options.continueOnToolError).toBe(true);

      // Verify multi-turn options
      expect(options.maxIterations).toBe(3);
      expect(options.iterationTimeoutMs).toBe(20000);
      expect(options.enableStreaming).toBe(false);
      expect(options.toolExecutionStrategy).toBe("parallel");
      expect(options.maxConcurrentTools).toBe(3);
    });

    it("should compile with mixed single-turn and partial multi-turn options", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: 2,
        continueOnToolError: false,
        maxIterations: 8,
        enableStreaming: true,
      };

      expect(options.maxToolCalls).toBe(2);
      expect(options.continueOnToolError).toBe(false);
      expect(options.maxIterations).toBe(8);
      expect(options.enableStreaming).toBe(true);
      expect(options.toolExecutionStrategy).toBeUndefined();
      expect(options.maxConcurrentTools).toBeUndefined();
    });
  });

  describe("Type Safety", () => {
    it("should ensure numeric properties accept valid numbers", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: 100,
        timeoutMs: 999999,
        toolTimeoutMs: 1,
        maxIterations: 1,
        iterationTimeoutMs: 0,
        maxConcurrentTools: 10,
      };

      expect(typeof options.maxToolCalls).toBe("number");
      expect(typeof options.timeoutMs).toBe("number");
      expect(typeof options.toolTimeoutMs).toBe("number");
      expect(typeof options.maxIterations).toBe("number");
      expect(typeof options.iterationTimeoutMs).toBe("number");
      expect(typeof options.maxConcurrentTools).toBe("number");
    });

    it("should ensure boolean properties accept valid booleans", () => {
      const options: AgentExecutionOptions = {
        continueOnToolError: false,
        enableStreaming: true,
      };

      expect(typeof options.continueOnToolError).toBe("boolean");
      expect(typeof options.enableStreaming).toBe("boolean");
    });

    it("should ensure toolExecutionStrategy accepts only valid union values", () => {
      const sequentialOptions: AgentExecutionOptions = {
        toolExecutionStrategy: "sequential",
      };
      const parallelOptions: AgentExecutionOptions = {
        toolExecutionStrategy: "parallel",
      };

      expect(sequentialOptions.toolExecutionStrategy).toBe("sequential");
      expect(parallelOptions.toolExecutionStrategy).toBe("parallel");
    });
  });

  describe("Optional Properties", () => {
    it("should allow all properties to be undefined", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: undefined,
        timeoutMs: undefined,
        toolTimeoutMs: undefined,
        continueOnToolError: undefined,
        maxIterations: undefined,
        iterationTimeoutMs: undefined,
        enableStreaming: undefined,
        toolExecutionStrategy: undefined,
        maxConcurrentTools: undefined,
      };

      // All properties should be undefined
      Object.values(options).forEach((value) => {
        expect(value).toBeUndefined();
      });
    });

    it("should not require any properties to be defined", () => {
      // This should compile without errors
      const emptyOptions: AgentExecutionOptions = {};
      const partialOptions: AgentExecutionOptions = {
        maxIterations: 5,
      };

      expect(emptyOptions).toEqual({});
      expect(partialOptions.maxIterations).toBe(5);
    });
  });

  describe("Documentation Examples", () => {
    it("should match the single-turn example from documentation", () => {
      const singleTurnOptions: AgentExecutionOptions = {
        maxToolCalls: 1,
        timeoutMs: 10000,
        toolTimeoutMs: 5000,
        continueOnToolError: true,
      };

      expect(singleTurnOptions.maxToolCalls).toBe(1);
      expect(singleTurnOptions.timeoutMs).toBe(10000);
      expect(singleTurnOptions.toolTimeoutMs).toBe(5000);
      expect(singleTurnOptions.continueOnToolError).toBe(true);
    });

    it("should match the multi-turn example from documentation", () => {
      const multiTurnOptions: AgentExecutionOptions = {
        maxToolCalls: 5,
        timeoutMs: 60000,
        toolTimeoutMs: 10000,
        continueOnToolError: true,
        maxIterations: 5,
        iterationTimeoutMs: 15000,
        enableStreaming: true,
        toolExecutionStrategy: "parallel",
        maxConcurrentTools: 2,
      };

      expect(multiTurnOptions.maxToolCalls).toBe(5);
      expect(multiTurnOptions.timeoutMs).toBe(60000);
      expect(multiTurnOptions.toolTimeoutMs).toBe(10000);
      expect(multiTurnOptions.continueOnToolError).toBe(true);
      expect(multiTurnOptions.maxIterations).toBe(5);
      expect(multiTurnOptions.iterationTimeoutMs).toBe(15000);
      expect(multiTurnOptions.enableStreaming).toBe(true);
      expect(multiTurnOptions.toolExecutionStrategy).toBe("parallel");
      expect(multiTurnOptions.maxConcurrentTools).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values correctly", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: 0,
        timeoutMs: 0,
        toolTimeoutMs: 0,
        maxIterations: 0,
        iterationTimeoutMs: 0,
        maxConcurrentTools: 0,
      };

      expect(options.maxToolCalls).toBe(0);
      expect(options.timeoutMs).toBe(0);
      expect(options.toolTimeoutMs).toBe(0);
      expect(options.maxIterations).toBe(0);
      expect(options.iterationTimeoutMs).toBe(0);
      expect(options.maxConcurrentTools).toBe(0);
    });

    it("should handle large numeric values", () => {
      const options: AgentExecutionOptions = {
        maxToolCalls: Number.MAX_SAFE_INTEGER,
        timeoutMs: Number.MAX_SAFE_INTEGER,
        maxIterations: 1000,
        maxConcurrentTools: 100,
      };

      expect(options.maxToolCalls).toBe(Number.MAX_SAFE_INTEGER);
      expect(options.timeoutMs).toBe(Number.MAX_SAFE_INTEGER);
      expect(options.maxIterations).toBe(1000);
      expect(options.maxConcurrentTools).toBe(100);
    });

    it("should handle boolean edge cases", () => {
      const falseOptions: AgentExecutionOptions = {
        continueOnToolError: false,
        enableStreaming: false,
      };

      const trueOptions: AgentExecutionOptions = {
        continueOnToolError: true,
        enableStreaming: true,
      };

      expect(falseOptions.continueOnToolError).toBe(false);
      expect(falseOptions.enableStreaming).toBe(false);
      expect(trueOptions.continueOnToolError).toBe(true);
      expect(trueOptions.enableStreaming).toBe(true);
    });
  });
});
