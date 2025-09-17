/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, beforeEach } from "@jest/globals";
import { z } from "zod";
import { InMemoryToolRegistry } from "../inMemoryToolRegistry";
import type { ToolRegistry, ToolDefinition, ToolHandler } from "../index";
import { ToolError } from "../../errors/toolError";

/**
 * Creates a mock ToolDefinition for testing purposes
 */
function createMockToolDefinition(
  name: string,
  description?: string,
): ToolDefinition {
  return {
    name,
    description: description || `${name} tool for testing`,
    inputSchema: z.object({
      message: z.string(),
    }),
    outputSchema: z
      .object({
        result: z.string(),
      })
      .optional(),
  };
}

/**
 * Creates a mock ToolHandler for testing purposes
 */
function createMockToolHandler(returnValue?: unknown): ToolHandler {
  return (params: Record<string, unknown>, _context: unknown) => {
    return Promise.resolve({
      success: true,
      result: returnValue || params,
    });
  };
}

describe("InMemoryToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new InMemoryToolRegistry();
  });

  describe("register()", () => {
    it("registers valid tool successfully", () => {
      const definition = createMockToolDefinition("echo");
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("echo", definition, handler),
      ).not.toThrow();
      expect(registry.has("echo")).toBe(true);
    });

    it("allows multiple tools to be registered", () => {
      const echoDefinition = createMockToolDefinition("echo");
      const calcDefinition = createMockToolDefinition("calculator");
      const echoHandler = createMockToolHandler();
      const calcHandler = createMockToolHandler();

      registry.register("echo", echoDefinition, echoHandler);
      registry.register("calculator", calcDefinition, calcHandler);

      expect(registry.has("echo")).toBe(true);
      expect(registry.has("calculator")).toBe(true);
      expect(registry.size()).toBe(2);
    });

    it("overwrites existing tool registration with warning", () => {
      const definition1 = createMockToolDefinition(
        "echo",
        "Original echo tool",
      );
      const definition2 = createMockToolDefinition("echo", "Updated echo tool");
      const handler = createMockToolHandler();

      // Mock console.warn to capture warning
      const originalWarn = console.warn;
      const warnSpy = jest.fn();
      console.warn = warnSpy;

      try {
        registry.register("echo", definition1, handler);
        registry.register("echo", definition2, handler);

        const retrieved = registry.get("echo");
        expect(retrieved?.definition.description).toBe("Updated echo tool");
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "Overwriting existing tool registration: echo",
          ),
        );
      } finally {
        console.warn = originalWarn;
      }
    });

    it("throws ToolError for null/undefined tool name", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      expect(() => registry.register(null as any, definition, handler)).toThrow(
        ToolError,
      );
      expect(() =>
        registry.register(undefined as any, definition, handler),
      ).toThrow(ToolError);
      expect(() => registry.register("", definition, handler)).toThrow(
        ToolError,
      );
    });

    it("throws ToolError for null/undefined tool definition", () => {
      const handler = createMockToolHandler();

      expect(() => registry.register("test", null as any, handler)).toThrow(
        ToolError,
      );
      expect(() =>
        registry.register("test", undefined as any, handler),
      ).toThrow(ToolError);
    });

    it("throws ToolError for invalid tool name characters", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      expect(() => registry.register("test tool", definition, handler)).toThrow(
        ToolError,
      );
      expect(() => registry.register("test@tool", definition, handler)).toThrow(
        ToolError,
      );
      expect(() => registry.register("test/tool", definition, handler)).toThrow(
        ToolError,
      );
      expect(() => registry.register("test.tool", definition, handler)).toThrow(
        ToolError,
      );
    });

    it("accepts valid tool name characters", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("test_tool", definition, handler),
      ).not.toThrow();
      expect(() =>
        registry.register("test-tool", definition, handler),
      ).not.toThrow();
      expect(() =>
        registry.register("testTool123", definition, handler),
      ).not.toThrow();
    });

    it("throws ToolError for tool definition with invalid name field", () => {
      const invalidDefinition = {
        ...createMockToolDefinition("valid"),
        name: "", // Invalid empty name
      };
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("valid", invalidDefinition, handler),
      ).toThrow(ToolError);
    });

    it("throws ToolError for invalid tool handler", () => {
      const definition = createMockToolDefinition("test");

      expect(() => registry.register("test", definition, null as any)).toThrow(
        ToolError,
      );
      expect(() =>
        registry.register("test", definition, undefined as any),
      ).toThrow(ToolError);
      expect(() =>
        registry.register("test", definition, "not a function" as any),
      ).toThrow(ToolError);
      expect(() => registry.register("test", definition, 123 as any)).toThrow(
        ToolError,
      );
    });

    it("accepts tool definition with minimal required fields", () => {
      const minimalDefinition: ToolDefinition = {
        name: "minimal",
        inputSchema: z.object({}),
      };
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("minimal", minimalDefinition, handler),
      ).not.toThrow();
      expect(registry.has("minimal")).toBe(true);
    });

    it("validates tool definition schema properly", () => {
      const invalidDefinition = {
        name: "test",
        // Missing required inputSchema
      } as ToolDefinition;
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("test", invalidDefinition, handler),
      ).toThrow(ToolError);
    });
  });

  describe("unregister()", () => {
    beforeEach(() => {
      const definition = createMockToolDefinition("echo");
      const handler = createMockToolHandler();
      registry.register("echo", definition, handler);
    });

    it("unregisters existing tool successfully", () => {
      expect(registry.has("echo")).toBe(true);
      const result = registry.unregister("echo");

      expect(result).toBe(true);
      expect(registry.has("echo")).toBe(false);
      expect(registry.size()).toBe(0);
    });

    it("returns false for non-existent tool", () => {
      const result = registry.unregister("nonexistent");
      expect(result).toBe(false);
    });

    it("returns false for invalid tool name", () => {
      expect(registry.unregister(null as any)).toBe(false);
      expect(registry.unregister(undefined as any)).toBe(false);
      expect(registry.unregister("")).toBe(false);
    });
  });

  describe("has()", () => {
    beforeEach(() => {
      const definition = createMockToolDefinition("echo");
      const handler = createMockToolHandler();
      registry.register("echo", definition, handler);
    });

    it("returns true for existing tool", () => {
      expect(registry.has("echo")).toBe(true);
    });

    it("returns false for non-existent tool", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("returns false for invalid tool name", () => {
      expect(registry.has(null as any)).toBe(false);
      expect(registry.has(undefined as any)).toBe(false);
      expect(registry.has("")).toBe(false);
    });

    it("is case-sensitive", () => {
      expect(registry.has("ECHO")).toBe(false);
      expect(registry.has("Echo")).toBe(false);
    });
  });

  describe("get()", () => {
    beforeEach(() => {
      const echoDefinition = createMockToolDefinition("echo");
      const calcDefinition = createMockToolDefinition("calculator");
      const echoHandler = createMockToolHandler("echo result");
      const calcHandler = createMockToolHandler("calc result");

      registry.register("echo", echoDefinition, echoHandler);
      registry.register("calculator", calcDefinition, calcHandler);
    });

    it("retrieves existing tool with definition and handler", () => {
      const tool = registry.get("echo");

      expect(tool).toBeDefined();
      expect(tool?.definition.name).toBe("echo");
      expect(typeof tool?.handler).toBe("function");
    });

    it("returns undefined for non-existent tool", () => {
      const tool = registry.get("nonexistent");
      expect(tool).toBeUndefined();
    });

    it("returns undefined for invalid tool name", () => {
      expect(registry.get(null as any)).toBeUndefined();
      expect(registry.get(undefined as any)).toBeUndefined();
      expect(registry.get("")).toBeUndefined();
    });

    it("returns tool with working handler", async () => {
      const tool = registry.get("echo");
      expect(tool).toBeDefined();

      if (tool) {
        const result = await tool.handler({ message: "test" }, {});
        expect(result).toEqual({
          success: true,
          result: "echo result",
        });
      }
    });
  });

  describe("getAll()", () => {
    it("returns empty map for empty registry", () => {
      const allTools = registry.getAll();
      expect(allTools).toBeInstanceOf(Map);
      expect(allTools.size).toBe(0);
    });

    it("returns all registered tools", () => {
      const echoDefinition = createMockToolDefinition("echo");
      const calcDefinition = createMockToolDefinition("calculator");
      const echoHandler = createMockToolHandler();
      const calcHandler = createMockToolHandler();

      registry.register("echo", echoDefinition, echoHandler);
      registry.register("calculator", calcDefinition, calcHandler);

      const allTools = registry.getAll();
      expect(allTools.size).toBe(2);
      expect(allTools.has("echo")).toBe(true);
      expect(allTools.has("calculator")).toBe(true);
      expect(allTools.get("echo")?.definition.name).toBe("echo");
      expect(allTools.get("calculator")?.definition.name).toBe("calculator");
    });

    it("returns independent copy of tools map", () => {
      const definition = createMockToolDefinition("echo");
      const handler = createMockToolHandler();
      registry.register("echo", definition, handler);

      const allTools = registry.getAll();
      allTools.clear();

      // Original registry should be unchanged
      expect(registry.size()).toBe(1);
      expect(registry.has("echo")).toBe(true);
    });
  });

  describe("getNames()", () => {
    it("returns empty array for empty registry", () => {
      const names = registry.getNames();
      expect(names).toEqual([]);
    });

    it("returns sorted array of tool names", () => {
      const definitions = [
        createMockToolDefinition("zebra"),
        createMockToolDefinition("alpha"),
        createMockToolDefinition("beta"),
      ];
      const handler = createMockToolHandler();

      definitions.forEach((def) => {
        registry.register(def.name, def, handler);
      });

      const names = registry.getNames();
      expect(names).toEqual(["alpha", "beta", "zebra"]);
    });
  });

  describe("size()", () => {
    it("returns 0 for empty registry", () => {
      expect(registry.size()).toBe(0);
    });

    it("returns correct count after registrations", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      expect(registry.size()).toBe(0);

      registry.register("tool1", definition, handler);
      expect(registry.size()).toBe(1);

      registry.register("tool2", definition, handler);
      expect(registry.size()).toBe(2);
    });

    it("returns correct count after unregistrations", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      registry.register("tool1", definition, handler);
      registry.register("tool2", definition, handler);
      expect(registry.size()).toBe(2);

      registry.unregister("tool1");
      expect(registry.size()).toBe(1);

      registry.unregister("tool2");
      expect(registry.size()).toBe(0);
    });
  });

  describe("clear()", () => {
    beforeEach(() => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      registry.register("tool1", definition, handler);
      registry.register("tool2", definition, handler);
      registry.register("tool3", definition, handler);
    });

    it("removes all registered tools", () => {
      expect(registry.size()).toBe(3);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has("tool1")).toBe(false);
      expect(registry.has("tool2")).toBe(false);
      expect(registry.has("tool3")).toBe(false);
    });

    it("allows new registrations after clear", () => {
      registry.clear();

      const definition = createMockToolDefinition("newTool");
      const handler = createMockToolHandler();

      expect(() =>
        registry.register("newTool", definition, handler),
      ).not.toThrow();
      expect(registry.has("newTool")).toBe(true);
      expect(registry.size()).toBe(1);
    });
  });

  describe("error handling", () => {
    it("includes context in ToolError for invalid tool name", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      try {
        registry.register("invalid@name", definition, handler);
        fail("Expected ToolError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        if (error instanceof ToolError) {
          expect(error.context).toEqual(
            expect.objectContaining({
              toolName: "invalid@name",
            }),
          );
        }
      }
    });

    it("includes context in ToolError for invalid definition", () => {
      const invalidDefinition = {
        name: "test",
        // Missing inputSchema
      } as ToolDefinition;
      const handler = createMockToolHandler();

      try {
        registry.register("test", invalidDefinition, handler);
        fail("Expected ToolError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        if (error instanceof ToolError) {
          expect(error.context).toEqual(
            expect.objectContaining({
              toolName: "test",
              definition: invalidDefinition,
            }),
          );
        }
      }
    });

    it("includes context in ToolError for invalid handler", () => {
      const definition = createMockToolDefinition("test");

      try {
        registry.register("test", definition, "not a function" as any);
        fail("Expected ToolError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        if (error instanceof ToolError) {
          expect(error.context).toEqual(
            expect.objectContaining({
              toolName: "test",
              handlerType: "string",
            }),
          );
        }
      }
    });
  });

  describe("performance requirements", () => {
    it("maintains O(1) lookup performance", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      // Register many tools
      for (let i = 0; i < 1000; i++) {
        registry.register(`tool${i}`, definition, handler);
      }

      // Lookup should be fast regardless of registry size
      const startTime = performance.now();
      const result = registry.get("tool500");
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1); // Should be under 1ms
    });

    it("scales memory linearly with registered tools", () => {
      const definition = createMockToolDefinition("test");
      const handler = createMockToolHandler();

      const initialSize = registry.size();

      // Register tools and verify size increases linearly
      for (let i = 0; i < 100; i++) {
        registry.register(`tool${i}`, definition, handler);
        expect(registry.size()).toBe(initialSize + i + 1);
      }
    });
  });
});
