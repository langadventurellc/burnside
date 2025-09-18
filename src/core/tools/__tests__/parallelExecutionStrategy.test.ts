/**
 * Parallel Execution Strategy Tests
 *
 * Comprehensive unit tests for parallel tool execution strategy including
 * concurrency limiting, result ordering, partial failure handling, and
 * performance characteristics validation.
 */

import { ParallelExecutionStrategy } from "../parallelExecutionStrategy";
import type { ToolCall } from "../toolCall";
import type { ToolResult } from "../toolResult";
import type { ToolExecutionContext } from "../toolExecutionContext";
import type { ToolRouter } from "../toolRouter";
import type { ToolExecutionOptions } from "../toolExecutionOptions";

// Mock ToolRouter for controlled testing
const createMockRouter = () => {
  const mockRouter = {
    execute: jest.fn(),
    register: jest.fn(),
    getRegisteredTools: jest.fn(),
    hasTool: jest.fn(),
    executeMultiple: jest.fn(),
  };
  return mockRouter as unknown as jest.Mocked<ToolRouter>;
};

// Mock ToolExecutionContext
const mockContext: ToolExecutionContext = {
  userId: "test-user",
  sessionId: "test-session",
  metadata: {},
};

// Helper to create mock tool calls
const createToolCall = (id: string, name: string): ToolCall => ({
  id,
  name,
  parameters: {},
});

// Helper to create successful tool result
const createSuccessResult = (
  callId: string,
  executionTime = 100,
): ToolResult => ({
  callId,
  success: true,
  data: { result: "success" },
  metadata: { executionTime },
});

// Helper to create error tool result
const createErrorResult = (
  callId: string,
  executionTime = 100,
): ToolResult => ({
  callId,
  success: false,
  error: {
    code: "tool_error",
    message: "Tool execution failed",
    details: {},
  },
  metadata: { executionTime },
});

describe("ParallelExecutionStrategy", () => {
  let strategy: ParallelExecutionStrategy;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    strategy = new ParallelExecutionStrategy();
    mockRouter = createMockRouter();
    jest.clearAllMocks();
  });

  describe("empty array handling", () => {
    it("should handle empty tool calls array", async () => {
      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        maxConcurrentTools: 3,
      };

      const result = await strategy.execute(
        [],
        mockRouter,
        mockContext,
        options,
      );

      expect(result).toEqual({
        results: [],
        success: true,
        metadata: {
          totalExecutionTime: 0,
          successCount: 0,
          errorCount: 0,
          strategyMetadata: {
            strategy: "parallel",
            executionMode: "empty-array",
            maxConcurrency: 3,
          },
        },
      });

      expect(mockRouter.execute).not.toHaveBeenCalled();
    });
  });

  describe("parallel execution with ordering", () => {
    it("should maintain result order despite parallel execution", async () => {
      const toolCalls = [
        createToolCall("1", "slow-tool"),
        createToolCall("2", "fast-tool"),
        createToolCall("3", "medium-tool"),
      ];

      // Mock different execution times but return in completion order
      mockRouter.execute
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(createSuccessResult("1", 200)), 100),
            ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(createSuccessResult("2", 50)),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(createSuccessResult("3", 100)), 50),
            ),
        );

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 3,
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      // Results should be in original order despite different completion times
      expect(result.results[0].callId).toBe("1");
      expect(result.results[1].callId).toBe("2");
      expect(result.results[2].callId).toBe("3");
      expect(result.success).toBe(true);
      expect(result.metadata.successCount).toBe(3);
      expect(result.metadata.errorCount).toBe(0);
    });
  });

  describe("concurrency limiting", () => {
    it("should respect maxConcurrentTools limit", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "tool2"),
        createToolCall("3", "tool3"),
        createToolCall("4", "tool4"),
      ];

      // All tools should complete successfully
      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createSuccessResult("2"))
        .mockResolvedValueOnce(createSuccessResult("3"))
        .mockResolvedValueOnce(createSuccessResult("4"));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 2, // Limit to 2 concurrent
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.results).toHaveLength(4);
      expect(result.metadata.strategyMetadata?.maxConcurrency).toBe(2);
      expect(result.metadata.strategyMetadata?.concurrencyUtilization).toBe(
        0.5,
      ); // 2/4
    });

    it("should handle concurrency limit greater than tool count", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "tool2"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createSuccessResult("2"));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 5, // More than tool count
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.metadata.strategyMetadata?.maxConcurrency).toBe(2); // Limited to tool count
    });
  });

  describe("error handling modes", () => {
    it("should handle partial failures in continue-on-error mode", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "failing-tool"),
        createToolCall("3", "tool3"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createErrorResult("2"))
        .mockResolvedValueOnce(createSuccessResult("3"));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 3,
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.results).toHaveLength(3);
      expect(result.success).toBe(true); // Continue-on-error reports success if any succeed
      expect(result.metadata.successCount).toBe(2);
      expect(result.metadata.errorCount).toBe(1);
      expect(result.firstError?.toolCallId).toBe("2");
    });

    it("should report failure in fail-fast mode with errors", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "failing-tool"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createErrorResult("2"));

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        maxConcurrentTools: 2,
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.success).toBe(false);
      expect(result.firstError?.toolCallId).toBe("2");
    });
  });

  describe("performance characteristics", () => {
    it("should provide comprehensive performance metadata", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "tool2"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1", 100))
        .mockResolvedValueOnce(createSuccessResult("2", 150));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 2,
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.metadata.strategyMetadata?.strategy).toBe("parallel");
      expect(result.metadata.strategyMetadata?.maxConcurrency).toBe(2);
      expect(result.metadata.strategyMetadata?.toolsProcessed).toBe(2);
      expect(result.metadata.strategyMetadata?.toolsRequested).toBe(2);
      expect(typeof result.metadata.strategyMetadata?.averageToolTime).toBe(
        "number",
      );
      expect(typeof result.metadata.strategyMetadata?.parallelEfficiency).toBe(
        "number",
      );
    });

    it("should meet coordination overhead requirements", async () => {
      const toolCalls = [createToolCall("1", "fast-tool")];

      // Mock very fast tool execution
      mockRouter.execute.mockResolvedValueOnce(createSuccessResult("1", 1));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 1,
      };

      const startTime = Date.now();
      await strategy.execute(toolCalls, mockRouter, mockContext, options);
      const endTime = Date.now();

      // Coordination overhead should be < 50ms as per requirements
      const overhead = endTime - startTime;
      expect(overhead).toBeLessThan(50);
    });
  });

  describe("exception handling", () => {
    it("should handle unexpected execution exceptions", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "throwing-tool"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockRejectedValueOnce(new Error("Unexpected error"));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 2,
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.results).toHaveLength(2);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error?.code).toBe("strategy_execution_error");
    });
  });
});
