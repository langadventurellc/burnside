/**
 * Sequential Execution Strategy Tests
 *
 * Comprehensive unit tests for sequential tool execution strategy including
 * ordered execution, error handling modes, timeout enforcement, and
 * performance characteristics validation.
 */

import { SequentialExecutionStrategy } from "../sequentialExecutionStrategy";
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

describe("SequentialExecutionStrategy", () => {
  let strategy: SequentialExecutionStrategy;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    strategy = new SequentialExecutionStrategy();
    mockRouter = createMockRouter();
    jest.clearAllMocks();
  });

  describe("empty array handling", () => {
    it("should handle empty tool calls array", async () => {
      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
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
            strategy: "sequential",
            executionMode: "empty-array",
          },
        },
      });

      expect(mockRouter.execute).not.toHaveBeenCalled();
    });
  });

  describe("sequential execution order", () => {
    it("should execute tools in original order", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "tool2"),
        createToolCall("3", "tool3"),
      ];

      const results = [
        createSuccessResult("1"),
        createSuccessResult("2"),
        createSuccessResult("3"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(results[0])
        .mockResolvedValueOnce(results[1])
        .mockResolvedValueOnce(results[2]);

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      // Verify execution order
      expect(mockRouter.execute).toHaveBeenCalledTimes(3);
      expect(mockRouter.execute).toHaveBeenNthCalledWith(
        1,
        toolCalls[0],
        mockContext,
        undefined,
      );
      expect(mockRouter.execute).toHaveBeenNthCalledWith(
        2,
        toolCalls[1],
        mockContext,
        undefined,
      );
      expect(mockRouter.execute).toHaveBeenNthCalledWith(
        3,
        toolCalls[2],
        mockContext,
        undefined,
      );

      // Verify result ordering
      expect(result.results).toEqual(results);
      expect(result.success).toBe(true);
      expect(result.metadata.successCount).toBe(3);
      expect(result.metadata.errorCount).toBe(0);
    });

    it("should maintain result order even with varying execution times", async () => {
      const toolCalls = [
        createToolCall("1", "slow-tool"),
        createToolCall("2", "fast-tool"),
      ];

      // Mock slow then fast execution
      mockRouter.execute
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(createSuccessResult("1", 200)), 100),
            ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(createSuccessResult("2", 50)),
        );

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.results[0].callId).toBe("1");
      expect(result.results[1].callId).toBe("2");
    });
  });

  describe("fail-fast error handling", () => {
    it("should stop execution on first error in fail-fast mode", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "failing-tool"),
        createToolCall("3", "tool3"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createErrorResult("2"))
        .mockResolvedValueOnce(createSuccessResult("3")); // Should not be called

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(mockRouter.execute).toHaveBeenCalledTimes(2);
      expect(result.results).toHaveLength(2);
      expect(result.success).toBe(false);
      expect(result.metadata.successCount).toBe(1);
      expect(result.metadata.errorCount).toBe(1);
      expect(result.firstError).toEqual({
        toolCallId: "2",
        error: {
          code: "tool_error",
          message: "Tool execution failed",
          details: {},
        },
      });
    });

    it("should report success false in fail-fast mode even with later successes", async () => {
      const toolCalls = [createToolCall("1", "failing-tool")];

      mockRouter.execute.mockResolvedValueOnce(createErrorResult("1"));

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.success).toBe(false);
      expect(result.firstError?.toolCallId).toBe("1");
    });
  });

  describe("continue-on-error handling", () => {
    it("should continue execution after errors in continue-on-error mode", async () => {
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
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(mockRouter.execute).toHaveBeenCalledTimes(3);
      expect(result.results).toHaveLength(3);
      expect(result.success).toBe(true); // Continue-on-error mode reports success
      expect(result.metadata.successCount).toBe(2);
      expect(result.metadata.errorCount).toBe(1);
      expect(result.firstError).toEqual({
        toolCallId: "2",
        error: {
          code: "tool_error",
          message: "Tool execution failed",
          details: {},
        },
      });
    });
  });

  describe("timeout handling", () => {
    it("should pass timeout to individual tool executions", async () => {
      const toolCalls = [createToolCall("1", "tool1")];
      const timeoutMs = 5000;

      mockRouter.execute.mockResolvedValueOnce(createSuccessResult("1"));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        toolTimeoutMs: timeoutMs,
      };

      await strategy.execute(toolCalls, mockRouter, mockContext, options);

      expect(mockRouter.execute).toHaveBeenCalledWith(
        toolCalls[0],
        mockContext,
        timeoutMs,
      );
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
      expect(result.results[1].error?.message).toBe(
        "Sequential execution failed unexpectedly",
      );
    });

    it("should stop on exception in fail-fast mode", async () => {
      const toolCalls = [
        createToolCall("1", "throwing-tool"),
        createToolCall("2", "tool2"),
      ];

      mockRouter.execute.mockRejectedValueOnce(new Error("Unexpected error"));

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(mockRouter.execute).toHaveBeenCalledTimes(1);
      expect(result.results).toHaveLength(1);
      expect(result.success).toBe(false);
    });
  });

  describe("performance characteristics", () => {
    it("should provide accurate timing metadata", async () => {
      const toolCalls = [createToolCall("1", "tool1")];

      mockRouter.execute.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createSuccessResult("1", 150)), 50),
          ),
      );

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const startTime = Date.now();
      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );
      const endTime = Date.now();

      expect(result.metadata.totalExecutionTime).toBeGreaterThanOrEqual(50);
      expect(result.metadata.totalExecutionTime).toBeLessThanOrEqual(
        endTime - startTime + 10,
      );
      expect(result.metadata.strategyMetadata?.strategy).toBe("sequential");
      expect(result.metadata.strategyMetadata?.averageToolTime).toBe(
        result.metadata.totalExecutionTime,
      );
    });

    it("should track tools processed vs requested correctly", async () => {
      const toolCalls = [
        createToolCall("1", "tool1"),
        createToolCall("2", "failing-tool"),
        createToolCall("3", "tool3"),
      ];

      mockRouter.execute
        .mockResolvedValueOnce(createSuccessResult("1"))
        .mockResolvedValueOnce(createErrorResult("2"));

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
      };

      const result = await strategy.execute(
        toolCalls,
        mockRouter,
        mockContext,
        options,
      );

      expect(result.metadata.strategyMetadata?.toolsProcessed).toBe(2);
      expect(result.metadata.strategyMetadata?.toolsRequested).toBe(3);
    });

    it("should meet performance overhead requirements", async () => {
      const toolCalls = [createToolCall("1", "fast-tool")];

      // Mock very fast tool execution (1ms)
      mockRouter.execute.mockResolvedValueOnce(createSuccessResult("1", 1));

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const startTime = Date.now();
      await strategy.execute(toolCalls, mockRouter, mockContext, options);
      const endTime = Date.now();

      // Strategy overhead should be < 10ms as per requirements
      const overhead = endTime - startTime;
      expect(overhead).toBeLessThan(10);
    });
  });
});
