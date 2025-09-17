/**
 * Echo Tool Tests
 *
 * Comprehensive test suite for the Echo built-in tool covering functionality,
 * validation, integration, and error handling scenarios.
 */

import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import {
  echoToolDefinition,
  echoToolHandler,
  EchoInputSchema,
  EchoOutputSchema,
} from "../index";
import type { EchoOutput } from "../index";
import type { ToolExecutionContext } from "../../../../core/tools/toolExecutionContext";
import { InMemoryToolRegistry } from "../../../../core/tools/inMemoryToolRegistry";

describe("Echo Tool", () => {
  describe("echoToolDefinition", () => {
    it("has correct name", () => {
      expect(echoToolDefinition.name).toBe("echo");
    });

    it("has descriptive description", () => {
      expect(echoToolDefinition.description).toBe(
        "Echo back the input parameters for testing and validation",
      );
    });

    it("includes input schema", () => {
      expect(echoToolDefinition.inputSchema).toBe(EchoInputSchema);
    });

    it("includes output schema", () => {
      expect(echoToolDefinition.outputSchema).toBe(EchoOutputSchema);
    });

    it("includes OpenAI function hints", () => {
      expect(echoToolDefinition.hints).toBeDefined();
      expect(echoToolDefinition.hints?.openai).toBeDefined();
      if (
        echoToolDefinition.hints?.openai &&
        typeof echoToolDefinition.hints.openai === "object" &&
        "function" in echoToolDefinition.hints.openai
      ) {
        const openaiHints = echoToolDefinition.hints.openai as {
          function: { name: string };
        };
        expect(openaiHints.function.name).toBe("echo");
      }
    });
  });

  describe("EchoInputSchema validation", () => {
    it("accepts simple string parameters", () => {
      const input = { message: "hello" };
      expect(() => EchoInputSchema.parse(input)).not.toThrow();
    });

    it("accepts numeric parameters", () => {
      const input = { count: 42, score: 99.5 };
      expect(() => EchoInputSchema.parse(input)).not.toThrow();
    });

    it("accepts boolean parameters", () => {
      const input = { enabled: true, active: false };
      expect(() => EchoInputSchema.parse(input)).not.toThrow();
    });

    it("accepts complex object parameters", () => {
      const input = {
        user: { name: "John", age: 30 },
        settings: { theme: "dark", notifications: true },
        tags: ["important", "urgent"],
      };
      expect(() => EchoInputSchema.parse(input)).not.toThrow();
    });

    it("accepts empty object", () => {
      const input = {};
      expect(() => EchoInputSchema.parse(input)).not.toThrow();
    });

    it("rejects null input", () => {
      expect(() => EchoInputSchema.parse(null)).toThrow();
    });

    it("rejects array input", () => {
      expect(() => EchoInputSchema.parse(["item1", "item2"])).toThrow();
    });

    it("rejects primitive input", () => {
      expect(() => EchoInputSchema.parse("string")).toThrow();
      expect(() => EchoInputSchema.parse(42)).toThrow();
      expect(() => EchoInputSchema.parse(true)).toThrow();
    });
  });

  describe("EchoOutputSchema validation", () => {
    it("validates correct output structure", () => {
      const output: EchoOutput = {
        echoed: { message: "test" },
        metadata: {
          timestamp: "2024-03-15T10:30:00.000Z",
          contextId: "test-context",
        },
      };
      expect(() => EchoOutputSchema.parse(output)).not.toThrow();
    });

    it("rejects output without echoed field", () => {
      const output = {
        metadata: {
          timestamp: "2024-03-15T10:30:00.000Z",
          contextId: "test-context",
        },
      };
      expect(() => EchoOutputSchema.parse(output)).toThrow();
    });

    it("rejects output without metadata", () => {
      const output = {
        echoed: { message: "test" },
      };
      expect(() => EchoOutputSchema.parse(output)).toThrow();
    });

    it("rejects invalid timestamp format", () => {
      const output = {
        echoed: { message: "test" },
        metadata: {
          timestamp: "invalid-date",
          contextId: "test-context",
        },
      };
      expect(() => EchoOutputSchema.parse(output)).toThrow();
    });

    it("rejects empty contextId", () => {
      const output = {
        echoed: { message: "test" },
        metadata: {
          timestamp: "2024-03-15T10:30:00.000Z",
          contextId: "",
        },
      };
      expect(() => EchoOutputSchema.parse(output)).toThrow();
    });
  });

  describe("echoToolHandler execution", () => {
    it("echoes simple input parameters", async () => {
      const input = { message: "hello", count: 42 };
      const context: ToolExecutionContext = { sessionId: "test-session" };

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.echoed).toEqual(input);
      expect(result.metadata.contextId).toBe("test-session");
      expect(result.metadata.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("echoes complex nested objects", async () => {
      const input = {
        user: { name: "Alice", preferences: { theme: "dark" } },
        items: [1, 2, 3],
        metadata: { version: "1.0" },
      };
      const context: ToolExecutionContext = { userId: "user-123" };

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.echoed).toEqual(input);
      expect(result.metadata.contextId).toBe("user-123");
    });

    it("handles empty input object", async () => {
      const input = {};
      const context: ToolExecutionContext = {};

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.echoed).toEqual({});
      expect(result.metadata.contextId).toBe("unknown");
    });

    it("uses sessionId for contextId when available", async () => {
      const input = { test: "value" };
      const context: ToolExecutionContext = {
        userId: "user-123",
        sessionId: "session-456",
      };

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.metadata.contextId).toBe("session-456");
    });

    it("falls back to userId for contextId", async () => {
      const input = { test: "value" };
      const context: ToolExecutionContext = { userId: "user-123" };

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.metadata.contextId).toBe("user-123");
    });

    it("uses 'unknown' contextId when no context available", async () => {
      const input = { test: "value" };
      const context = null;

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(result.metadata.contextId).toBe("unknown");
    });

    it("generates valid ISO timestamp", async () => {
      const input = { test: "value" };
      const context: ToolExecutionContext = {};
      const beforeTime = new Date();

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      const afterTime = new Date();
      const resultTime = new Date(result.metadata.timestamp);

      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("throws validation error for invalid input", async () => {
      const invalidInput = "not an object" as unknown as Record<
        string,
        unknown
      >;
      const context: ToolExecutionContext = {};

      await expect(echoToolHandler(invalidInput, context)).rejects.toThrow(
        z.ZodError,
      );
    });

    it("output conforms to EchoOutputSchema", async () => {
      const input = { message: "test", value: 123 };
      const context: ToolExecutionContext = { sessionId: "test" };

      const result = (await echoToolHandler(input, context)) as EchoOutput;

      expect(() => EchoOutputSchema.parse(result)).not.toThrow();
    });
  });

  describe("Tool Registry Integration", () => {
    let registry: InMemoryToolRegistry;

    beforeEach(() => {
      registry = new InMemoryToolRegistry();
    });

    it("registers successfully with ToolRegistry", () => {
      expect(() => {
        registry.register(
          echoToolDefinition.name,
          echoToolDefinition,
          echoToolHandler,
        );
      }).not.toThrow();
    });

    it("can be discovered after registration", () => {
      registry.register(
        echoToolDefinition.name,
        echoToolDefinition,
        echoToolHandler,
      );

      expect(registry.has("echo")).toBe(true);
      const entry = registry.get("echo");
      expect(entry?.definition).toBe(echoToolDefinition);
    });

    it("executes through registry", async () => {
      registry.register(
        echoToolDefinition.name,
        echoToolDefinition,
        echoToolHandler,
      );

      const input = { message: "registry test" };
      const context: ToolExecutionContext = { sessionId: "registry-session" };

      const entry = registry.get("echo");
      if (!entry) throw new Error("Tool not found");
      const result = (await entry.handler(input, context)) as EchoOutput;

      expect(result.echoed).toEqual(input);
      expect(result.metadata.contextId).toBe("registry-session");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles large input objects", async () => {
      const largeInput = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          value: Math.random(),
        })),
      };
      const context: ToolExecutionContext = { sessionId: "large-test" };

      const result = (await echoToolHandler(largeInput, context)) as EchoOutput;

      expect(result.echoed).toEqual(largeInput);
      expect(result.metadata.contextId).toBe("large-test");
    });

    it("handles deeply nested objects", async () => {
      const deepInput = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: "deep nesting test",
                },
              },
            },
          },
        },
      };
      const context: ToolExecutionContext = {};

      const result = (await echoToolHandler(deepInput, context)) as EchoOutput;

      expect(result.echoed).toEqual(deepInput);
    });

    it("preserves input object immutability", async () => {
      const input = { mutable: { value: "original" } };
      const context: ToolExecutionContext = {};

      await echoToolHandler(input, context);

      expect(input.mutable.value).toBe("original");
    });
  });
});
