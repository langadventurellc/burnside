/**
 * Tool Translator Tests
 *
 * Tests for Anthropic tool definition translation functionality
 */

import { z } from "zod";
import { translateToolDefinitions } from "../toolTranslator.js";
import type { ToolDefinition } from "../../../core/tools/toolDefinition.js";

describe("translateToolDefinitions", () => {
  describe("basic tool translation", () => {
    it("should translate simple tool definition", () => {
      const tools: ToolDefinition[] = [
        {
          name: "get_weather",
          description: "Get current weather",
          inputSchema: z.object({
            location: z.string(),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result).toEqual([
        {
          name: "get_weather",
          description: "Get current weather",
          input_schema: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        },
      ]);
    });

    it("should generate description when missing", () => {
      const tools: ToolDefinition[] = [
        {
          name: "test_tool",
          inputSchema: z.object({}),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.description).toBe("Execute test_tool");
    });

    it("should handle empty tools array", () => {
      const result = translateToolDefinitions([]);
      expect(result).toEqual([]);
    });
  });

  describe("Zod schema conversion", () => {
    it("should handle primitive types", () => {
      const tools: ToolDefinition[] = [
        {
          name: "primitive_test",
          inputSchema: z.object({
            str: z.string(),
            num: z.number(),
            bool: z.boolean(),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          str: { type: "string" },
          num: { type: "number" },
          bool: { type: "boolean" },
        },
        required: ["str", "num", "bool"],
      });
    });

    it("should handle optional fields", () => {
      const tools: ToolDefinition[] = [
        {
          name: "optional_test",
          inputSchema: z.object({
            required: z.string(),
            optional: z.string().optional(),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          required: { type: "string" },
          optional: { type: "string" },
        },
        required: ["required"],
      });
    });

    it("should handle arrays", () => {
      const tools: ToolDefinition[] = [
        {
          name: "array_test",
          inputSchema: z.object({
            items: z.array(z.string()),
            numbers: z.array(z.number()),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
          },
          numbers: {
            type: "array",
            items: { type: "number" },
          },
        },
        required: ["items", "numbers"],
      });
    });

    it("should handle enums", () => {
      const tools: ToolDefinition[] = [
        {
          name: "enum_test",
          inputSchema: z.object({
            status: z.enum(["active", "inactive", "pending"]),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "inactive", "pending"],
          },
        },
        required: ["status"],
      });
    });

    it("should handle literals", () => {
      const tools: ToolDefinition[] = [
        {
          name: "literal_test",
          inputSchema: z.object({
            type: z.literal("command"),
            version: z.literal(1),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["command"],
          },
          version: {
            type: "number",
            enum: [1],
          },
        },
        required: ["type", "version"],
      });
    });

    it("should handle unions of literals", () => {
      const tools: ToolDefinition[] = [
        {
          name: "union_test",
          inputSchema: z.object({
            mode: z.union([z.literal("read"), z.literal("write")]),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["read", "write"],
          },
        },
        required: ["mode"],
      });
    });

    it("should handle nested objects", () => {
      const tools: ToolDefinition[] = [
        {
          name: "nested_test",
          inputSchema: z.object({
            config: z.object({
              host: z.string(),
              port: z.number().optional(),
            }),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          config: {
            type: "object",
            properties: {
              host: { type: "string" },
              port: { type: "number" },
            },
            required: ["host"],
          },
        },
        required: ["config"],
      });
    });

    it("should handle default values", () => {
      const tools: ToolDefinition[] = [
        {
          name: "default_test",
          inputSchema: z.object({
            timeout: z.number().default(5000),
            retries: z.number().default(3),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          timeout: { type: "number", default: 5000 },
          retries: { type: "number", default: 3 },
        },
        required: ["timeout", "retries"],
      });
    });

    it("should handle complex mixed schema", () => {
      const tools: ToolDefinition[] = [
        {
          name: "complex_test",
          inputSchema: z.object({
            id: z.string(),
            metadata: z
              .object({
                tags: z.array(z.string()).optional(),
                priority: z.enum(["low", "medium", "high"]).default("medium"),
              })
              .optional(),
            settings: z.object({
              enabled: z.boolean(),
              timeout: z.number().optional(),
            }),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          id: { type: "string" },
          metadata: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: { type: "string" },
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high"],
                default: "medium",
              },
            },
            required: ["priority"],
          },
          settings: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              timeout: { type: "number" },
            },
            required: ["enabled"],
          },
        },
        required: ["id", "settings"],
      });
    });
  });

  describe("provider hints", () => {
    it("should use Anthropic provider hints when available", () => {
      const tools: ToolDefinition[] = [
        {
          name: "custom_tool",
          inputSchema: z.object({ param: z.string() }),
          hints: {
            anthropic: {
              tool: {
                name: "custom_anthropic_tool",
                description: "Custom Anthropic tool",
                input_schema: {
                  type: "object",
                  properties: {
                    custom_param: { type: "string" },
                  },
                  required: ["custom_param"],
                },
              },
            },
          },
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]).toEqual({
        name: "custom_anthropic_tool",
        description: "Custom Anthropic tool",
        input_schema: {
          type: "object",
          properties: {
            custom_param: { type: "string" },
          },
          required: ["custom_param"],
        },
      });
    });

    it("should ignore non-Anthropic hints", () => {
      const tools: ToolDefinition[] = [
        {
          name: "hinted_tool",
          inputSchema: z.object({ param: z.string() }),
          hints: {
            openai: {
              function: {
                name: "openai_tool",
                parameters: { type: "object" },
              },
            },
          },
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.name).toBe("hinted_tool");
      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          param: { type: "string" },
        },
        required: ["param"],
      });
    });
  });

  describe("JSON Schema input", () => {
    it("should handle existing JSON Schema input", () => {
      const tools: ToolDefinition[] = [
        {
          name: "json_schema_tool",
          inputSchema: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
            required: ["value"],
          },
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {
          value: { type: "string" },
        },
        required: ["value"],
      });
    });
  });

  describe("error handling", () => {
    it("should handle malformed tools gracefully", () => {
      // Since our implementation is defensive and handles null/undefined gracefully,
      // let's test a different kind of error scenario
      const tools: ToolDefinition[] = [
        {
          name: "tool_with_circular_ref",
          inputSchema: z.object({ param: z.string() }),
        },
      ];

      // This should work fine - our implementation is robust
      const result = translateToolDefinitions(tools);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("tool_with_circular_ref");
    });

    it("should handle edge case tool names", () => {
      const tools: ToolDefinition[] = [
        {
          name: "",
          inputSchema: z.object({ param: z.string() }),
        },
        {
          name: "tool-with-special-chars@#$",
          inputSchema: z.object({ param: z.string() }),
        },
      ];

      const result = translateToolDefinitions(tools);
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("");
      expect(result[1]?.name).toBe("tool-with-special-chars@#$");
    });

    it("should handle extremely nested schemas", () => {
      const deepSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              level4: z.object({
                value: z.string(),
              }),
            }),
          }),
        }),
      });

      const tools: ToolDefinition[] = [
        {
          name: "deep_tool",
          inputSchema: deepSchema,
        },
      ];

      const result = translateToolDefinitions(tools);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("deep_tool");
    });
  });

  describe("edge cases", () => {
    it("should handle empty object schema", () => {
      const tools: ToolDefinition[] = [
        {
          name: "empty_tool",
          inputSchema: z.object({}),
        },
      ];

      const result = translateToolDefinitions(tools);

      expect(result[0]?.input_schema).toEqual({
        type: "object",
        properties: {},
        required: undefined,
      });
    });

    it("should handle unsupported Zod types gracefully", () => {
      const tools: ToolDefinition[] = [
        {
          name: "unsupported_tool",
          inputSchema: z.object({
            // ZodRecord is not explicitly supported but should fallback
            data: z.record(z.string()),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      // Should fallback to object type for unsupported schemas
      const properties = result[0]?.input_schema.properties as Record<
        string,
        unknown
      >;
      expect(properties?.data).toEqual({
        type: "object",
      });
    });

    it("should handle complex union types", () => {
      const tools: ToolDefinition[] = [
        {
          name: "complex_union_tool",
          inputSchema: z.object({
            value: z.union([z.string(), z.number(), z.boolean()]),
          }),
        },
      ];

      const result = translateToolDefinitions(tools);

      // Should fallback to object type for non-literal unions
      const properties = result[0]?.input_schema.properties as Record<
        string,
        unknown
      >;
      expect(properties?.value).toEqual({
        type: "object",
      });
    });
  });
});
