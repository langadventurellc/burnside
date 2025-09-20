/**
 * Tool Execution Strategy Integration Tests
 *
 * Integration tests for strategy pattern and ToolRouter integration,
 * strategy selection, configuration validation, and end-to-end behavior.
 */

import { ToolRouter } from "../toolRouter";
import { SequentialExecutionStrategy } from "../sequentialExecutionStrategy";
import { ParallelExecutionStrategy } from "../parallelExecutionStrategy";
import { InMemoryToolRegistry } from "../inMemoryToolRegistry";
import type { ToolCall } from "../toolCall";
import type { ToolExecutionContext } from "../toolExecutionContext";
import type { ToolExecutionOptions } from "../toolExecutionOptions";
import type { ToolDefinition } from "../toolDefinition";
import type { ToolHandler } from "../toolHandler";
import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";

// Helper to create mock tool registration
const setupMockTool = (registry: InMemoryToolRegistry) => {
  const mockDefinition: ToolDefinition = {
    name: "test-tool",
    description: "A test tool",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  };

  const mockHandler: ToolHandler = () =>
    Promise.resolve({
      success: true,
      data: { result: "test-success" },
    });

  registry.register("test-tool", mockDefinition, mockHandler);
};

// Helper to create broken registry for error testing
const createBrokenRegistry = () => {
  const brokenRegistry = new InMemoryToolRegistry();
  // Override the get method to throw an error
  (brokenRegistry as any).get = () => {
    throw new Error("Registry error");
  };
  return brokenRegistry;
};

describe("Tool Execution Strategy Integration", () => {
  let registry: InMemoryToolRegistry;
  let router: ToolRouter;
  let mockContext: ToolExecutionContext;
  let mockRuntimeAdapter: RuntimeAdapter;

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
    mockContext = {
      userId: "test-user",
      sessionId: "test-session",
      metadata: {},
    };
  });

  describe("strategy instantiation", () => {
    it("should create sequential strategy instances", () => {
      const strategy = new SequentialExecutionStrategy();
      expect(strategy).toBeInstanceOf(SequentialExecutionStrategy);
    });

    it("should create parallel strategy instances", () => {
      const strategy = new ParallelExecutionStrategy();
      expect(strategy).toBeInstanceOf(ParallelExecutionStrategy);
    });
  });

  describe("ToolRouter integration", () => {
    beforeEach(() => {
      setupMockTool(registry);
    });

    it("should have executeMultiple method", () => {
      expect(typeof router.executeMultiple).toBe("function");
    });

    it("should validate execution options", async () => {
      const toolCalls: ToolCall[] = [
        { id: "1", name: "test-tool", parameters: {} },
      ];

      const invalidOptions: ToolExecutionOptions = {
        errorHandling: "invalid-mode" as any,
        maxConcurrentTools: -1,
      };

      await expect(
        router.executeMultiple(toolCalls, mockContext, invalidOptions),
      ).rejects.toThrow();
    });

    it("should accept valid execution options", async () => {
      const toolCalls: ToolCall[] = [
        { id: "1", name: "test-tool", parameters: {} },
      ];

      const validOptions: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 2,
        toolTimeoutMs: 5000,
      };

      const result = await router.executeMultiple(
        toolCalls,
        mockContext,
        validOptions,
      );
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });

    it("should handle tool not found errors", async () => {
      const toolCalls: ToolCall[] = [
        { id: "1", name: "nonexistent-tool", parameters: {} },
      ];

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const result = await router.executeMultiple(
        toolCalls,
        mockContext,
        options,
      );
      expect(result.success).toBe(true); // continue-on-error mode
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error?.code).toBe("tool_not_found");
    });
  });

  describe("strategy selection", () => {
    beforeEach(() => {
      setupMockTool(registry);
    });

    it("should use sequential strategy for single concurrency", async () => {
      const toolCalls: ToolCall[] = [
        { id: "1", name: "test-tool", parameters: {} },
        { id: "2", name: "test-tool", parameters: {} },
      ];

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 1,
      };

      const result = await router.executeMultiple(
        toolCalls,
        mockContext,
        options,
      );
      expect(result.metadata.strategyMetadata?.strategy).toBe("sequential");
    });

    it("should use parallel strategy for multiple concurrency", async () => {
      const toolCalls: ToolCall[] = [
        { id: "1", name: "test-tool", parameters: {} },
        { id: "2", name: "test-tool", parameters: {} },
      ];

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 2,
      };

      const result = await router.executeMultiple(
        toolCalls,
        mockContext,
        options,
      );
      expect(result.metadata.strategyMetadata?.strategy).toBe("parallel");
    });
  });

  describe("error boundary", () => {
    it("should handle router-level execution errors", async () => {
      // Create a router with a broken registry that throws
      const brokenRouter = new ToolRouter(
        createBrokenRegistry(),
        5000,
        mockRuntimeAdapter,
      );

      const toolCalls: ToolCall[] = [
        { id: "1", name: "test-tool", parameters: {} },
      ];

      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
      };

      const result = await brokenRouter.executeMultiple(
        toolCalls,
        mockContext,
        options,
      );
      expect(result.success).toBe(true); // continue-on-error mode reports success
      expect(result.firstError?.error?.code).toBe("router_error");
    });
  });

  describe("configuration validation", () => {
    it("should reject negative concurrency", async () => {
      const toolCalls: ToolCall[] = [];
      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: -1,
      };

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow("maxConcurrentTools must be at least 1");
    });

    it("should reject negative timeout", async () => {
      const toolCalls: ToolCall[] = [];
      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        toolTimeoutMs: -1,
      };

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow("toolTimeoutMs must be non-negative");
    });

    it("should reject invalid error handling mode", async () => {
      const toolCalls: ToolCall[] = [];
      const options: ToolExecutionOptions = {
        errorHandling: "invalid" as any,
      };

      await expect(
        router.executeMultiple(toolCalls, mockContext, options),
      ).rejects.toThrow(
        "errorHandling must be 'fail-fast' or 'continue-on-error'",
      );
    });

    it("should accept valid configurations", async () => {
      const toolCalls: ToolCall[] = [];
      const options: ToolExecutionOptions = {
        errorHandling: "continue-on-error",
        maxConcurrentTools: 3,
        toolTimeoutMs: 5000,
      };

      // Should not throw
      const result = await router.executeMultiple(
        toolCalls,
        mockContext,
        options,
      );
      expect(result.success).toBe(true);
    });
  });

  describe("backward compatibility", () => {
    it("should maintain existing single tool execution", async () => {
      setupMockTool(registry);

      const toolCall: ToolCall = {
        id: "1",
        name: "test-tool",
        parameters: {},
      };

      // Original execute method should still work
      const result = await router.execute(toolCall, mockContext);
      expect(result.success).toBe(true);
      expect(result.callId).toBe("1");
    });

    it("should maintain registry operations", () => {
      setupMockTool(registry);
      expect(router.hasTool("test-tool")).toBe(true);
      expect(router.getRegisteredTools()).toHaveLength(1);
    });
  });
});
