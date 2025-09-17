/**
 * Tool Execution Pipeline Tests
 *
 * Comprehensive unit tests for the ExecutionPipeline and individual pipeline stages.
 * Tests validation, preparation, execution, normalization, and error handling.
 */

import { z } from "zod";
import { ExecutionPipeline } from "../toolExecutionPipeline";
import { validateToolCall } from "../pipelineValidation";
import { prepareExecution } from "../pipelinePreparation";
import { executeToolHandler } from "../pipelineExecution";
import { normalizeResult } from "../pipelineNormalization";
import type { ToolCall } from "../toolCall";
import type { ToolDefinition } from "../toolDefinition";
import type { ToolExecutionContext } from "../toolExecutionContext";
import type { ToolHandler } from "../toolHandler";
import type { ToolResult } from "../toolResult";

describe("ExecutionPipeline", () => {
  let pipeline: ExecutionPipeline;
  let mockToolCall: ToolCall;
  let mockToolDefinition: ToolDefinition;
  let mockHandler: ToolHandler;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    pipeline = new ExecutionPipeline();

    mockToolCall = {
      id: "call_123",
      name: "test_tool",
      parameters: { input: "test" },
      metadata: {
        providerId: "test",
        timestamp: "2024-01-01T00:00:00.000Z",
      },
    };

    mockToolDefinition = {
      name: "test_tool",
      description: "A test tool",
      inputSchema: z.object({
        input: z.string(),
      }),
    };

    mockHandler = jest.fn().mockResolvedValue({ output: "success" });

    mockContext = {
      userId: "user_123",
      sessionId: "session_456",
      metadata: {},
    };
  });

  describe("execute", () => {
    it("should execute tool successfully with valid inputs", async () => {
      const result = await pipeline.execute(
        mockToolCall,
        mockToolDefinition,
        mockHandler,
        mockContext,
        5000,
      );

      expect(result.success).toBe(true);
      expect(result.callId).toBe("call_123");
      expect(result.data).toEqual({ output: "success" });
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(mockHandler).toHaveBeenCalledWith(
        mockToolCall.parameters,
        mockContext,
      );
    });

    it("should return validation error for invalid tool call", async () => {
      const invalidToolCall = {
        ...mockToolCall,
        name: "different_tool", // Name mismatch
      };

      const result = await pipeline.execute(
        invalidToolCall,
        mockToolDefinition,
        mockHandler,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("validation_error");
      expect(result.error?.message).toBe("Tool name mismatch");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid parameters", async () => {
      const invalidToolCall = {
        ...mockToolCall,
        parameters: { input: 123 }, // Should be string
      };

      const result = await pipeline.execute(
        invalidToolCall,
        mockToolDefinition,
        mockHandler,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("validation_error");
      expect(result.error?.message).toBe("Invalid tool parameters");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle handler execution errors", async () => {
      const errorHandler = jest
        .fn()
        .mockRejectedValue(new Error("Handler failed"));

      const result = await pipeline.execute(
        mockToolCall,
        mockToolDefinition,
        errorHandler,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("execution_error");
      expect(result.error?.message).toBe("Tool handler execution failed");
      expect(result.error?.details).toMatchObject({
        originalError: "Handler failed",
        toolName: "test_tool",
      });
    });

    it("should handle timeout errors", async () => {
      jest.useFakeTimers();

      const slowHandler = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 1000)),
        );

      const executePromise = pipeline.execute(
        mockToolCall,
        mockToolDefinition,
        slowHandler,
        mockContext,
        100, // Short timeout
      );

      // Fast-forward timers to trigger timeout
      jest.advanceTimersByTime(100);

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("timeout_error");
      expect(result.error?.message).toContain("timed out after 100ms");

      jest.useRealTimers();
    });

    it("should handle pipeline-level errors", async () => {
      // Force pipeline error by passing undefined handler
      const result = await pipeline.execute(
        mockToolCall,
        mockToolDefinition,
        undefined as unknown as ToolHandler,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("pipeline_error");
      expect(result.error?.message).toBe("Tool execution pipeline failed");
    });

    it("should work with JSON Schema input definitions", async () => {
      const jsonSchemaDefinition = {
        ...mockToolDefinition,
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
          required: ["input"],
        },
      };

      const result = await pipeline.execute(
        mockToolCall,
        jsonSchemaDefinition,
        mockHandler,
        mockContext,
      );

      // Should succeed even with JSON Schema (validation is skipped for now)
      expect(result.success).toBe(true);
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});

describe("validateToolCall", () => {
  let mockToolCall: ToolCall;
  let mockToolDefinition: ToolDefinition;

  beforeEach(() => {
    mockToolCall = {
      id: "call_123",
      name: "test_tool",
      parameters: { input: "test" },
    };

    mockToolDefinition = {
      name: "test_tool",
      description: "A test tool",
      inputSchema: z.object({
        input: z.string(),
      }),
    };
  });

  it("should return null for valid tool call", () => {
    const result = validateToolCall(mockToolCall, mockToolDefinition);
    expect(result).toBeNull();
  });

  it("should return error for tool name mismatch", () => {
    const invalidCall = { ...mockToolCall, name: "different_tool" };
    const result = validateToolCall(invalidCall, mockToolDefinition);

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.error?.code).toBe("validation_error");
    expect(result?.error?.message).toBe("Tool name mismatch");
  });

  it("should return error for invalid parameters", () => {
    const invalidCall = { ...mockToolCall, parameters: { input: 123 } };
    const result = validateToolCall(invalidCall, mockToolDefinition);

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.error?.code).toBe("validation_error");
    expect(result?.error?.message).toBe("Invalid tool parameters");
  });

  it("should handle validation stage errors", () => {
    // Pass invalid tool call structure
    const invalidCall = { name: "test" } as ToolCall;
    const result = validateToolCall(invalidCall, mockToolDefinition);

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.error?.code).toBe("validation_error");
  });
});

describe("prepareExecution", () => {
  let mockToolCall: ToolCall;
  let mockToolDefinition: ToolDefinition;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    mockToolCall = {
      id: "call_123",
      name: "test_tool",
      parameters: { input: "test" },
    };

    mockToolDefinition = {
      name: "test_tool",
      description: "A test tool",
      inputSchema: z.object({ input: z.string() }),
    };

    mockContext = {
      userId: "user_123",
      sessionId: "session_456",
      metadata: {},
    };
  });

  it("should prepare execution context successfully", () => {
    const result = prepareExecution(
      mockToolCall,
      mockToolDefinition,
      mockContext,
    );

    expect("success" in result).toBe(false); // Not a ToolResult
    expect(result).toMatchObject({
      toolCall: mockToolCall,
      toolDefinition: mockToolDefinition,
      executionContext: mockContext,
      startTime: expect.any(Number),
    });
  });

  it("should handle preparation errors", () => {
    // Force an error by passing undefined context
    const result = prepareExecution(
      mockToolCall,
      mockToolDefinition,
      undefined as unknown as ToolExecutionContext,
    );

    expect("success" in result).toBe(true); // Is a ToolResult
    expect((result as ToolResult).success).toBe(false);
    expect((result as ToolResult).error?.code).toBe("preparation_error");
  });
});

describe("executeToolHandler", () => {
  let mockExecutionContext: {
    toolCall: ToolCall;
    toolHandler: ToolHandler;
    executionContext: ToolExecutionContext;
    timeoutMs: number;
    startTime: number;
  };

  beforeEach(() => {
    mockExecutionContext = {
      toolCall: {
        id: "call_123",
        name: "test_tool",
        parameters: { input: "test" },
      },
      toolHandler: jest.fn().mockResolvedValue({ output: "success" }),
      executionContext: { userId: "user_123" },
      timeoutMs: 5000,
      startTime: Date.now(),
    };
  });

  it("should execute handler successfully", async () => {
    const result = await executeToolHandler(
      mockExecutionContext as import("../executionContext").ExecutionContext,
    );

    expect(result.success).toBe(true);
    expect(result.callId).toBe("call_123");
    expect(result.data).toEqual({ output: "success" });
    expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
  });

  it("should handle handler errors", async () => {
    mockExecutionContext.toolHandler = jest
      .fn()
      .mockRejectedValue(new Error("Handler error"));

    const result = await executeToolHandler(
      mockExecutionContext as import("../executionContext").ExecutionContext,
    );

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("execution_error");
    expect(result.error?.message).toBe("Tool handler execution failed");
  });

  it("should handle timeout errors", async () => {
    jest.useFakeTimers();

    mockExecutionContext.toolHandler = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );
    mockExecutionContext.timeoutMs = 100;

    const executePromise = executeToolHandler(
      mockExecutionContext as import("../executionContext").ExecutionContext,
    );

    // Fast-forward timers to trigger timeout
    jest.advanceTimersByTime(100);

    const result = await executePromise;

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("timeout_error");
    expect(result.error?.message).toContain("timed out after 100ms");

    jest.useRealTimers();
  });
});

describe("normalizeResult", () => {
  it("should normalize successful result", () => {
    const input: ToolResult = {
      callId: "call_123",
      success: true,
      data: { output: "test" },
    };

    const result = normalizeResult(input);

    expect(result.callId).toBe("call_123");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ output: "test" });
    expect(result.metadata?.executionTime).toBe(0);
  });

  it("should normalize error result", () => {
    const input: ToolResult = {
      callId: "call_123",
      success: false,
      error: {
        code: "test_error",
        message: "Test error",
      },
    };

    const result = normalizeResult(input);

    expect(result.callId).toBe("call_123");
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("test_error");
    expect(result.metadata?.executionTime).toBe(0);
  });

  it("should handle normalization errors", () => {
    // Force normalization error with circular reference
    const circularObj: any = { prop: "value" };
    circularObj.circular = circularObj;

    const input: ToolResult = {
      callId: "call_123",
      success: true,
      data: circularObj,
    };

    // Mock JSON.stringify to throw error
    const originalStringify = JSON.stringify;
    jest.spyOn(JSON, "stringify").mockImplementation(() => {
      throw new Error("Circular reference");
    });

    const result = normalizeResult(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("normalization_error");

    // Restore original stringify
    JSON.stringify = originalStringify;
  });
});
