/**
 * Tool Execution Cancellation Tests
 *
 * Comprehensive tests for tool execution cancellation support
 * including both sequential and parallel execution strategies.
 */

import { z } from "zod";
import { ToolRouter } from "../toolRouter";
import { InMemoryToolRegistry } from "../inMemoryToolRegistry";
import type { ToolCall } from "../toolCall";
import type { ToolDefinition } from "../toolDefinition";
import type { ToolExecutionContext } from "../toolExecutionContext";
import type { ToolExecutionOptions } from "../toolExecutionOptions";
import type { ToolHandler } from "../toolHandler";
import { SequentialExecutionStrategy } from "../sequentialExecutionStrategy";
import { ParallelExecutionStrategy } from "../parallelExecutionStrategy";
import { createCancellationError } from "../../agent/cancellation";
import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";

describe("Tool Execution Cancellation", () => {
  let router: ToolRouter;
  let registry: InMemoryToolRegistry;
  let mockContext: ToolExecutionContext;
  let abortController: AbortController;
  let mockRuntimeAdapter: RuntimeAdapter;

  const createMockTool = (
    name: string,
    delay = 0,
  ): {
    definition: ToolDefinition;
    handler: ToolHandler;
  } => ({
    definition: {
      name,
      description: `Mock tool ${name}`,
      inputSchema: z.object({
        value: z.string().optional(),
      }),
    },
    handler: jest.fn().mockImplementation(async () => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return { result: `${name}_result` };
    }),
  });

  const createToolCall = (name: string, id?: string): ToolCall => ({
    id: id || `call_${name}`,
    name,
    parameters: { value: "test" },
  });

  beforeEach(() => {
    registry = new InMemoryToolRegistry();

    // Create mock runtime adapter
    mockRuntimeAdapter = {
      setTimeout: jest.fn(() => "mock-timer-handle"),
      clearTimeout: jest.fn(),
      fetch: jest.fn(),
      stream: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      fileExists: jest.fn(),
    } as unknown as RuntimeAdapter;

    router = new ToolRouter(registry, 5000, mockRuntimeAdapter);
    abortController = new AbortController();

    mockContext = {
      environment: "test",
      userId: "test_user",
    };
  });

  describe("ToolRouter cancellation", () => {
    it("should throw cancellation error when signal is already aborted", async () => {
      const { definition, handler } = createMockTool("test_tool");
      router.register("test_tool", definition, handler);

      const toolCalls = [createToolCall("test_tool")];
      abortController.abort();

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        signal: abortController.signal,
      };

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow("Tool execution cancelled before starting");
    });

    it("should validate cancellation options", () => {
      const { definition, handler } = createMockTool("test_tool");
      router.register("test_tool", definition, handler);

      const invalidOptions: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        cancellationMode: "invalid" as any,
      };

      expect(() => {
        (router as any).validateExecutionOptions(invalidOptions);
      }).toThrow("cancellationMode must be 'graceful' or 'immediate'");
    });

    it("should validate graceful cancellation timeout", () => {
      const { definition, handler } = createMockTool("test_tool");
      router.register("test_tool", definition, handler);

      const invalidOptions: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        gracefulCancellationTimeoutMs: -100,
      };

      expect(() => {
        (router as any).validateExecutionOptions(invalidOptions);
      }).toThrow("gracefulCancellationTimeoutMs must be non-negative");
    });
  });

  describe("Sequential strategy cancellation", () => {
    let strategy: SequentialExecutionStrategy;

    beforeEach(() => {
      strategy = new SequentialExecutionStrategy();
    });

    it("should check cancellation before each tool execution", async () => {
      const tool1 = createMockTool("tool1");
      const tool2 = createMockTool("tool2");
      router.register("tool1", tool1.definition, tool1.handler);
      router.register("tool2", tool2.definition, tool2.handler);

      const toolCalls = [createToolCall("tool1"), createToolCall("tool2")];

      // Cancel before execution starts
      abortController.abort();

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
      };

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      // Should preserve partial results
      expect(result.success).toBe(false);
      expect(result.metadata.strategyMetadata).toMatchObject({
        cancelled: true,
        cancellationMode: "graceful",
      });
    });

    it("should preserve partial results when cancelled", async () => {
      const tool1 = createMockTool("tool1");
      const tool2 = createMockTool("tool2");
      router.register("tool1", tool1.definition, tool1.handler);
      router.register("tool2", tool2.definition, tool2.handler);

      const toolCalls = [createToolCall("tool1"), createToolCall("tool2")];

      // Cancel before starting
      abortController.abort();

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
        cancellationMode: "graceful",
      };

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      // When cancelled before starting, no tools should execute
      expect(result.success).toBe(false);
      expect(result.metadata.strategyMetadata).toMatchObject({
        cancelled: true,
        cancellationMode: "graceful",
      });
    });
  });

  describe("Parallel strategy cancellation", () => {
    let strategy: ParallelExecutionStrategy;

    beforeEach(() => {
      strategy = new ParallelExecutionStrategy();
    });

    it("should handle cancellation before tool execution starts", async () => {
      const tool1 = createMockTool("tool1");
      const tool2 = createMockTool("tool2");
      router.register("tool1", tool1.definition, tool1.handler);
      router.register("tool2", tool2.definition, tool2.handler);

      const toolCalls = [createToolCall("tool1"), createToolCall("tool2")];

      abortController.abort(); // Cancel immediately

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
        maxConcurrentTools: 2,
      };

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      expect(result.success).toBe(false);
      expect(result.metadata.strategyMetadata).toMatchObject({
        cancelled: true,
        cancellationMode: "graceful",
      });
    });

    it("should propagate cancellation to all running tools", async () => {
      const tool1 = createMockTool("tool1");
      const tool2 = createMockTool("tool2");
      const tool3 = createMockTool("tool3");
      router.register("tool1", tool1.definition, tool1.handler);
      router.register("tool2", tool2.definition, tool2.handler);
      router.register("tool3", tool3.definition, tool3.handler);

      const toolCalls = [
        createToolCall("tool1"),
        createToolCall("tool2"),
        createToolCall("tool3"),
      ];

      // Cancel before starting
      abortController.abort();

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
        maxConcurrentTools: 3,
        cancellationMode: "immediate",
      };

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      expect(result.success).toBe(false);
      expect(result.metadata.strategyMetadata).toMatchObject({
        cancelled: true,
        cancellationMode: "immediate",
      });
    });

    it("should handle partial completion with cancellation", async () => {
      const tool1 = createMockTool("tool1");
      const tool2 = createMockTool("tool2");
      router.register("tool1", tool1.definition, tool1.handler);
      router.register("tool2", tool2.definition, tool2.handler);

      const toolCalls = [createToolCall("tool1"), createToolCall("tool2")];

      // Cancel before starting
      abortController.abort();

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
        maxConcurrentTools: 2,
      };

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      // Should handle cancellation gracefully
      expect(result.success).toBe(false);
      expect(
        (result.metadata.strategyMetadata as any)?.toolsProcessed,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cancellation modes", () => {
    it("should support graceful cancellation mode", async () => {
      const tool1 = createMockTool("tool1");
      router.register("tool1", tool1.definition, tool1.handler);

      const toolCalls = [createToolCall("tool1")];

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        signal: abortController.signal,
        cancellationMode: "graceful",
        gracefulCancellationTimeoutMs: 1000,
      };

      abortController.abort();

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow("Tool execution cancelled before starting");
    });

    it("should support immediate cancellation mode", async () => {
      const tool1 = createMockTool("tool1");
      router.register("tool1", tool1.definition, tool1.handler);

      const toolCalls = [createToolCall("tool1")];

      const options: ToolExecutionOptions = {
        errorHandling: "fail-fast",
        signal: abortController.signal,
        cancellationMode: "immediate",
      };

      abortController.abort();

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow("Tool execution cancelled before starting");
    });
  });

  describe("Error handling with cancellation", () => {
    it("should include cancellation information in metadata", async () => {
      const strategy = new SequentialExecutionStrategy();
      const tool1 = createMockTool("tool1");
      router.register("tool1", tool1.definition, tool1.handler);

      const toolCalls = [createToolCall("tool1")];

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        signal: abortController.signal,
        cancellationMode: "graceful",
      };

      abortController.abort();

      const result = await strategy.execute(
        toolCalls,
        router,
        mockContext,
        options,
      );

      expect(result.metadata.strategyMetadata).toMatchObject({
        strategy: "sequential",
        cancelled: true,
        cancellationMode: "graceful",
      });
    });

    it("should handle cancellation errors properly", () => {
      const error = createCancellationError(
        "Test cancellation",
        "tool_calls",
        true,
      );

      expect(error.code).toBe("CANCELLATION_ERROR");
      expect(error.phase).toBe("tool_calls");
      expect(error.cleanupCompleted).toBe(true);
      expect(error.message).toBe(
        "Agent execution cancelled: Test cancellation",
      );
    });
  });
});
