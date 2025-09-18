/**
 * Iteration Manager Tests
 *
 * Comprehensive test suite for IterationManager including iteration counting,
 * timeout enforcement, limit validation, termination detection, and metrics calculation.
 */

import { IterationManager } from "../iterationManager";
import type { AgentExecutionOptions } from "../agentExecutionOptions";

describe("IterationManager", () => {
  const mockStartTime = 1000000000000; // Fixed timestamp for testing
  let mockNow: jest.SpyInstance;

  beforeEach(() => {
    mockNow = jest.spyOn(Date, "now").mockReturnValue(mockStartTime);
  });

  afterEach(() => {
    mockNow.mockRestore();
  });

  describe("constructor", () => {
    it("should create instance with default configuration", () => {
      const manager = new IterationManager({}, mockStartTime);
      expect(manager.getCurrentIteration()).toBe(0);
      expect(manager.canContinue()).toBe(true);
    });

    it("should create instance with custom configuration", () => {
      const options: AgentExecutionOptions = {
        maxIterations: 5,
        timeoutMs: 30000,
        iterationTimeoutMs: 5000,
      };
      const manager = new IterationManager(options, mockStartTime);
      expect(manager.getCurrentIteration()).toBe(0);
      expect(manager.canContinue()).toBe(true);
    });

    it("should throw error for invalid start time", () => {
      expect(() => new IterationManager({}, 0)).toThrow(
        "Start time must be a positive integer timestamp",
      );
      expect(() => new IterationManager({}, -1)).toThrow(
        "Start time must be a positive integer timestamp",
      );
      expect(() => new IterationManager({}, 1.5)).toThrow(
        "Start time must be a positive integer timestamp",
      );
    });

    it("should throw error for invalid maxIterations", () => {
      expect(
        () => new IterationManager({ maxIterations: 0 }, mockStartTime),
      ).toThrow("maxIterations must be a positive integer");
      expect(
        () => new IterationManager({ maxIterations: -1 }, mockStartTime),
      ).toThrow("maxIterations must be a positive integer");
      expect(
        () => new IterationManager({ maxIterations: 1001 }, mockStartTime),
      ).toThrow("maxIterations cannot exceed 1000 for resource protection");
    });

    it("should throw error for invalid timeout values", () => {
      expect(
        () => new IterationManager({ timeoutMs: 0 }, mockStartTime),
      ).toThrow("Timeout values must be positive integers");
      expect(
        () => new IterationManager({ iterationTimeoutMs: -1 }, mockStartTime),
      ).toThrow("Timeout values must be positive integers");
      expect(
        () =>
          new IterationManager(
            { timeoutMs: 25 * 60 * 60 * 1000 },
            mockStartTime,
          ),
      ).toThrow(
        "Timeout values cannot exceed 24 hours for resource protection",
      );
    });

    it("should throw error when iteration timeout >= overall timeout", () => {
      expect(
        () =>
          new IterationManager(
            { timeoutMs: 10000, iterationTimeoutMs: 10000 },
            mockStartTime,
          ),
      ).toThrow(
        "Iteration timeout cannot be greater than or equal to overall timeout",
      );

      expect(
        () =>
          new IterationManager(
            { timeoutMs: 10000, iterationTimeoutMs: 15000 },
            mockStartTime,
          ),
      ).toThrow(
        "Iteration timeout cannot be greater than or equal to overall timeout",
      );
    });
  });

  describe("iteration tracking", () => {
    it("should track iteration numbers correctly", () => {
      const manager = new IterationManager({ maxIterations: 3 }, mockStartTime);

      expect(manager.getCurrentIteration()).toBe(0);

      manager.startIteration();
      expect(manager.getCurrentIteration()).toBe(1);

      mockNow.mockReturnValue(mockStartTime + 1000);
      const result1 = manager.completeIteration();
      expect(result1.iterationNumber).toBe(1);
      expect(result1.duration).toBe(1000);

      manager.startIteration();
      expect(manager.getCurrentIteration()).toBe(2);

      mockNow.mockReturnValue(mockStartTime + 2500);
      const result2 = manager.completeIteration();
      expect(result2.iterationNumber).toBe(2);
      expect(result2.duration).toBe(1500); // 2500 - 1000 = 1500
    });

    it("should prevent starting iteration when terminated", () => {
      const manager = new IterationManager({ maxIterations: 1 }, mockStartTime);

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      manager.completeIteration();

      expect(() => manager.startIteration()).toThrow(
        "Cannot start iteration: conversation already terminated due to max_iterations",
      );
    });

    it("should prevent completing iteration when none active", () => {
      const manager = new IterationManager({}, mockStartTime);

      expect(() => manager.completeIteration()).toThrow(
        "No active iteration to complete",
      );
    });
  });

  describe("timeout enforcement", () => {
    it("should detect overall timeout", () => {
      const manager = new IterationManager(
        { timeoutMs: 5000, maxIterations: 10 },
        mockStartTime,
      );

      manager.startIteration();

      // Before timeout
      mockNow.mockReturnValue(mockStartTime + 4000);
      expect(manager.canContinue()).toBe(true);
      const status1 = manager.checkTimeouts();
      expect(status1.hasTimeout).toBe(false);
      expect(status1.remainingOverallMs).toBe(1000);

      // After timeout
      mockNow.mockReturnValue(mockStartTime + 6000);
      expect(manager.canContinue()).toBe(false);
      const status2 = manager.checkTimeouts();
      expect(status2.hasTimeout).toBe(true);
      expect(status2.overallTimeout).toBe(true);
      expect(status2.remainingOverallMs).toBe(0);
    });

    it("should detect iteration timeout", () => {
      const manager = new IterationManager(
        { iterationTimeoutMs: 2000, maxIterations: 10 },
        mockStartTime,
      );

      manager.startIteration();

      // Before timeout
      mockNow.mockReturnValue(mockStartTime + 1500);
      expect(manager.canContinue()).toBe(true);
      const status1 = manager.checkTimeouts();
      expect(status1.hasTimeout).toBe(false);
      expect(status1.remainingIterationMs).toBe(500);

      // After timeout
      mockNow.mockReturnValue(mockStartTime + 2500);
      expect(manager.canContinue()).toBe(false);
      const status2 = manager.checkTimeouts();
      expect(status2.hasTimeout).toBe(true);
      expect(status2.iterationTimeout).toBe(true);
      expect(status2.remainingIterationMs).toBe(0);
    });

    it("should handle no timeout configuration", () => {
      const manager = new IterationManager({ maxIterations: 5 }, mockStartTime);

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 100000); // Large elapsed time

      expect(manager.canContinue()).toBe(true);
      const status = manager.checkTimeouts();
      expect(status.hasTimeout).toBe(false);
      expect(status.remainingOverallMs).toBe(null);
      expect(status.remainingIterationMs).toBe(null);
    });
  });

  describe("iteration limit enforcement", () => {
    it("should enforce maximum iterations", () => {
      const manager = new IterationManager({ maxIterations: 2 }, mockStartTime);

      // First iteration
      manager.startIteration();
      expect(manager.canContinue()).toBe(true);
      expect(manager.enforceIterationLimit()).toBe(true);

      mockNow.mockReturnValue(mockStartTime + 1000);
      const result1 = manager.completeIteration();
      expect(result1.canContinue).toBe(true);

      // Second iteration
      manager.startIteration();
      expect(manager.canContinue()).toBe(false); // At limit now
      expect(manager.enforceIterationLimit()).toBe(false);

      mockNow.mockReturnValue(mockStartTime + 2000);
      const result2 = manager.completeIteration();
      expect(result2.canContinue).toBe(false);
      expect(result2.terminationReason).toBe("max_iterations");
    });

    it("should prevent iteration beyond maximum", () => {
      const manager = new IterationManager({ maxIterations: 1 }, mockStartTime);

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      manager.completeIteration();

      expect(() => manager.startIteration()).toThrow(
        "Cannot start iteration: conversation already terminated due to max_iterations",
      );
    });
  });

  describe("termination detection", () => {
    it("should determine timeout termination reason", () => {
      const manager = new IterationManager(
        { timeoutMs: 1000, maxIterations: 10 },
        mockStartTime,
      );

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1500);

      expect(manager.determineTerminationReason()).toBe("timeout");
    });

    it("should determine max iterations termination reason", () => {
      const manager = new IterationManager({ maxIterations: 1 }, mockStartTime);

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      manager.completeIteration();

      expect(manager.determineTerminationReason()).toBe("max_iterations");
    });

    it("should determine natural completion termination reason", () => {
      const manager = new IterationManager(
        { maxIterations: 10 },
        mockStartTime,
      );

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      manager.completeIteration();

      expect(manager.determineTerminationReason()).toBe("natural_completion");
    });
  });

  describe("execution metrics", () => {
    it("should calculate metrics correctly with no iterations", () => {
      const manager = new IterationManager({}, mockStartTime);

      mockNow.mockReturnValue(mockStartTime + 5000);
      const metrics = manager.getExecutionMetrics();

      expect(metrics).toEqual({
        totalExecutionTimeMs: 5000,
        totalIterations: 0,
        averageIterationTimeMs: 0,
        minIterationTimeMs: 0,
        maxIterationTimeMs: 0,
        currentIteration: 0,
        isTerminated: false,
        terminationReason: undefined,
      });
    });

    it("should calculate metrics correctly with multiple iterations", () => {
      const manager = new IterationManager({ maxIterations: 3 }, mockStartTime);

      // First iteration: 1000ms
      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      manager.completeIteration();

      // Second iteration: 2000ms
      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 3000);
      manager.completeIteration();

      // Third iteration: 500ms
      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 3500);
      const result = manager.completeIteration();

      expect(result.canContinue).toBe(false);
      expect(result.terminationReason).toBe("max_iterations");

      const metrics = manager.getExecutionMetrics();
      expect(metrics.totalExecutionTimeMs).toBe(3500);
      expect(metrics.totalIterations).toBe(3);
      expect(metrics.averageIterationTimeMs).toBe((1000 + 2000 + 500) / 3);
      expect(metrics.minIterationTimeMs).toBe(500);
      expect(metrics.maxIterationTimeMs).toBe(2000);
      expect(metrics.currentIteration).toBe(3);
      expect(metrics.isTerminated).toBe(true);
      expect(metrics.terminationReason).toBe("max_iterations");
    });
  });

  describe("edge cases", () => {
    it("should handle clock changes gracefully", () => {
      const manager = new IterationManager({ timeoutMs: 5000 }, mockStartTime);

      manager.startIteration();

      // Simulate clock going backwards (should not cause negative duration)
      mockNow.mockReturnValue(mockStartTime - 1000);
      const result = manager.completeIteration();

      expect(result.duration).toBe(-1000); // Negative duration indicates clock issue
      expect(result.iterationNumber).toBe(1);
    });

    it("should handle rapid iteration cycles", () => {
      const manager = new IterationManager(
        { maxIterations: 100 },
        mockStartTime,
      );

      for (let i = 1; i <= 50; i++) {
        manager.startIteration();
        mockNow.mockReturnValue(mockStartTime + i * 100);
        const result = manager.completeIteration();
        expect(result.iterationNumber).toBe(i);
        expect(result.duration).toBe(100);
        expect(result.canContinue).toBe(true);
      }

      expect(manager.getCurrentIteration()).toBe(50);
    });

    it("should handle simultaneous timeout and iteration limit", () => {
      const manager = new IterationManager(
        { maxIterations: 1, timeoutMs: 1000 },
        mockStartTime,
      );

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1500); // Both timeout and at max iterations

      expect(manager.canContinue()).toBe(false);
      // Timeout takes precedence over iteration limit in termination reason
      expect(manager.determineTerminationReason()).toBe("timeout");
    });

    it("should handle zero timeout edge case", () => {
      expect(
        () => new IterationManager({ timeoutMs: 0 }, mockStartTime),
      ).toThrow("Timeout values must be positive integers");
    });

    it("should prevent multiple startIteration calls without completion", () => {
      const manager = new IterationManager({}, mockStartTime);

      manager.startIteration();
      // Should prevent starting another iteration without completing the current one
      expect(() => manager.startIteration()).toThrow(
        "Cannot start iteration: iteration 1 is already active",
      );
    });
  });

  describe("memory and performance", () => {
    it("should maintain constant memory usage regardless of iteration count", () => {
      const manager = new IterationManager(
        { maxIterations: 1000 },
        mockStartTime,
      );

      // Run many iterations to test memory behavior
      for (let i = 1; i <= 100; i++) {
        manager.startIteration();
        mockNow.mockReturnValue(mockStartTime + i * 10);
        manager.completeIteration();
      }

      const metrics = manager.getExecutionMetrics();
      expect(metrics.totalIterations).toBe(100);
      expect(metrics.averageIterationTimeMs).toBe(10);
    });

    it("should have accurate duration calculation", () => {
      const manager = new IterationManager({}, mockStartTime);

      manager.startIteration();
      mockNow.mockReturnValue(mockStartTime + 1000);
      const result = manager.completeIteration();

      // Should accurately calculate iteration duration
      expect(result.duration).toBe(1000);
      expect(result.iterationNumber).toBe(1);
    });
  });
});
