/**
 * Tool Router Tests
 *
 * Comprehensive unit tests for the ToolRouter class that handles tool registration,
 * discovery, and execution orchestration with the ExecutionPipeline.
 */

import { z } from "zod";
import { ToolRouter } from "../toolRouter";
import { InMemoryToolRegistry } from "../inMemoryToolRegistry";
import type { ToolCall } from "../toolCall";
import type { ToolDefinition } from "../toolDefinition";
import type { ToolExecutionContext } from "../toolExecutionContext";
import type { ToolHandler } from "../toolHandler";
import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";

describe("ToolRouter", () => {
  let router: ToolRouter;
  let registry: InMemoryToolRegistry;
  let mockToolCall: ToolCall;
  let mockToolDefinition: ToolDefinition;
  let mockToolHandler: ToolHandler;
  let mockContext: ToolExecutionContext;
  let mockRuntimeAdapter: RuntimeAdapter;

  beforeEach(() => {
    registry = new InMemoryToolRegistry();

    // Create mock runtime adapter that works with Jest fake timers
    mockRuntimeAdapter = {
      setTimeout: jest.fn((callback: () => void, timeout: number) => {
        return setTimeout(callback, timeout);
      }),
      clearTimeout: jest.fn((handle: unknown) => {
        if (handle) {
          clearTimeout(handle as NodeJS.Timeout);
        }
      }),
      fetch: jest.fn(),
      stream: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      fileExists: jest.fn(),
    } as unknown as RuntimeAdapter;

    router = new ToolRouter(registry, 5000, mockRuntimeAdapter);

    mockToolCall = {
      id: "call_123",
      name: "test_tool",
      parameters: { param1: "value1" },
    };

    mockToolDefinition = {
      name: "test_tool",
      description: "Test tool",
      inputSchema: z.object({
        param1: z.string(),
      }),
    };

    mockToolHandler = jest.fn().mockResolvedValue({ result: "success" });

    mockContext = {
      environment: "test",
      userId: "test_user",
    };
  });

  describe("execute", () => {
    it("should execute tool successfully when tool is registered", async () => {
      // Register the tool
      registry.register("test_tool", mockToolDefinition, mockToolHandler);

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.callId).toBe("call_123");
      expect(result.data).toEqual({ result: "success" });
      expect(mockToolHandler).toHaveBeenCalledWith(
        mockToolCall.parameters,
        mockContext,
      );
    });

    it("should return error when tool is not found", async () => {
      // Don't register the tool - it should not be found
      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("tool_not_found");
      expect(result.error?.message).toBe("Tool 'test_tool' not found");
      expect(result.error?.details).toEqual({
        toolName: "test_tool",
        availableTools: [],
      });
    });

    it("should handle execution pipeline errors", async () => {
      // Register tool with handler that throws error
      const errorHandler = jest
        .fn()
        .mockRejectedValue(new Error("Handler failed"));
      registry.register("test_tool", mockToolDefinition, errorHandler);

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("execution_error");
      expect(result.error?.message).toBe("Tool handler execution failed");
    });

    it("should return tool not found for unregistered tools", async () => {
      // Register tool but pass call for different tool
      registry.register("test_tool", mockToolDefinition, mockToolHandler);

      const invalidCall: ToolCall = {
        id: "call_456",
        name: "different_tool", // Different tool name
        parameters: { param1: "value1" },
      };

      const result = await router.execute(invalidCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("tool_not_found");
      expect(result.error?.message).toBe("Tool 'different_tool' not found");
    });

    it("should respect custom timeout settings", async () => {
      jest.useFakeTimers();

      // Register tool with slow handler
      const slowHandler = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 200)),
        );
      registry.register("test_tool", mockToolDefinition, slowHandler);

      const executePromise = router.execute(mockToolCall, mockContext, 100); // 100ms timeout

      // Fast-forward timers to trigger timeout
      jest.advanceTimersByTime(100);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("timeout_error");
      expect(result.error?.message).toContain("timed out after 100ms");

      jest.useRealTimers();
    }, 10000);

    it("should handle router-level errors gracefully", async () => {
      // Force router error by corrupting registry
      jest.spyOn(registry, "get").mockImplementation(() => {
        throw new Error("Registry corruption");
      });

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("router_error");
      expect(result.error?.message).toBe("Tool router execution failed");
      expect((result.error?.details as any)?.originalError).toBe(
        "Registry corruption",
      );
      expect((result.error?.details as any)?.toolCall).toEqual(mockToolCall);
      expect((result.error?.details as any)?.stack).toContain(
        "Registry corruption",
      );
    });

    it("should include available tools in tool not found error", async () => {
      // Register some other tools
      const otherDef1 = { ...mockToolDefinition, name: "other_tool_1" };
      const otherDef2 = { ...mockToolDefinition, name: "other_tool_2" };
      registry.register("other_tool_1", otherDef1, mockToolHandler);
      registry.register("other_tool_2", otherDef2, mockToolHandler);

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("tool_not_found");
      expect(result.error?.details).toEqual({
        toolName: "test_tool",
        availableTools: ["other_tool_1", "other_tool_2"],
      });
    });

    it("should work with tools that have minimal input schema", async () => {
      const schemalessDefinition: ToolDefinition = {
        name: "test_tool",
        description: "Test tool without complex schema",
        inputSchema: z.object({}), // Empty schema
      };

      registry.register("test_tool", schemalessDefinition, mockToolHandler);

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(true);
      expect(mockToolHandler).toHaveBeenCalledWith(
        mockToolCall.parameters,
        mockContext,
      );
    });

    it("should work with tools that have JSON Schema input definitions", async () => {
      const jsonSchemaDefinition: ToolDefinition = {
        name: "test_tool",
        description: "Test tool with JSON schema",
        inputSchema: {
          type: "object",
          properties: {
            param1: { type: "string" },
          },
          required: ["param1"],
        },
      };

      registry.register("test_tool", jsonSchemaDefinition, mockToolHandler);

      const result = await router.execute(mockToolCall, mockContext);

      expect(result.success).toBe(true);
      expect(mockToolHandler).toHaveBeenCalledWith(
        mockToolCall.parameters,
        mockContext,
      );
    });
  });

  describe("integration with registry", () => {
    it("should access registry tools correctly", () => {
      registry.register("test_tool", mockToolDefinition, mockToolHandler);

      const registryEntry = registry.get("test_tool");
      expect(registryEntry).toBeDefined();
      expect(registryEntry?.definition.name).toBe("test_tool");
      expect(registryEntry?.handler).toBe(mockToolHandler);
    });

    it("should handle registry list operations", () => {
      registry.register("test_tool", mockToolDefinition, mockToolHandler);
      const otherDef = { ...mockToolDefinition, name: "other_tool" };
      registry.register("other_tool", otherDef, mockToolHandler);

      const allTools = router.getRegisteredTools();
      expect(allTools).toHaveLength(2);
      expect(allTools.map((def: ToolDefinition) => def.name)).toContain(
        "test_tool",
      );
      expect(allTools.map((def: ToolDefinition) => def.name)).toContain(
        "other_tool",
      );
    });
  });

  describe("error handling edge cases", () => {
    it("should handle null/undefined tool calls gracefully", async () => {
      const result = await router.execute(
        null as unknown as ToolCall,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("router_error");
      expect(result.error?.message).toBe("Tool router execution failed");
    });

    it("should handle null/undefined context gracefully", async () => {
      registry.register("test_tool", mockToolDefinition, mockToolHandler);

      const result = await router.execute(
        mockToolCall,
        null as unknown as ToolExecutionContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("preparation_error");
      expect(result.error?.message).toBe("Failed to prepare execution context");
    });
  });
});
