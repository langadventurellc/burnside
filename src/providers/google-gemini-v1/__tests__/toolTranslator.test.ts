/**
 * Google Gemini v1 Tool Translator Tests
 *
 * Comprehensive unit test suite covering all tool translation scenarios
 * including schema conversion, function call parsing, error handling,
 * and integration with provider hints.
 */

import { z } from "zod";
import { ValidationError } from "../../../core/errors/validationError";
import { toolTranslator } from "../toolTranslator";
import type { ToolDefinition } from "../../../core/tools/toolDefinition";

describe("Google Gemini v1 Tool Translator", () => {
  describe("translateToolDefinitions", () => {
    describe("Basic Schema Conversion", () => {
      it("should convert simple string parameter", () => {
        const tools: ToolDefinition[] = [
          {
            name: "simple_tool",
            description: "A simple tool",
            inputSchema: z.object({
              message: z.string(),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result).toEqual([
          {
            name: "simple_tool",
            description: "A simple tool",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
              required: ["message"],
            },
          },
        ]);
      });

      it("should convert number parameter with constraints", () => {
        const tools: ToolDefinition[] = [
          {
            name: "math_tool",
            description: "A math tool",
            inputSchema: z.object({
              value: z.number().min(0).max(100),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.value).toEqual({
          type: "number",
          minimum: 0,
          maximum: 100,
        });
      });

      it("should convert boolean parameter", () => {
        const tools: ToolDefinition[] = [
          {
            name: "flag_tool",
            description: "A flag tool",
            inputSchema: z.object({
              enabled: z.boolean(),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.enabled).toEqual({
          type: "boolean",
        });
      });

      it("should convert enum parameter", () => {
        const tools: ToolDefinition[] = [
          {
            name: "choice_tool",
            description: "A choice tool",
            inputSchema: z.object({
              mode: z.enum(["read", "write", "append"]),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.mode).toEqual({
          type: "string",
          enum: ["read", "write", "append"],
        });
      });

      it("should convert array parameter", () => {
        const tools: ToolDefinition[] = [
          {
            name: "list_tool",
            description: "A list tool",
            inputSchema: z.object({
              items: z.array(z.string()),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.items).toEqual({
          type: "array",
          items: { type: "string" },
        });
      });
    });

    describe("Complex Schema Conversion", () => {
      it("should convert nested object schema", () => {
        const tools: ToolDefinition[] = [
          {
            name: "complex_tool",
            description: "A complex tool",
            inputSchema: z.object({
              user: z.object({
                name: z.string(),
                age: z.number(),
                active: z.boolean(),
              }),
              tags: z.array(z.string()),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.user).toEqual({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            active: { type: "boolean" },
          },
          required: ["name", "age", "active"],
        });
      });

      it("should handle optional and default values", () => {
        const tools: ToolDefinition[] = [
          {
            name: "optional_tool",
            description: "Tool with optional fields",
            inputSchema: z.object({
              required: z.string(),
              optional: z.string().optional(),
              withDefault: z.string().default("default_value"),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.required).toEqual(["required"]);
        expect(result[0].parameters?.properties?.withDefault).toEqual({
          type: "string",
          default: "default_value",
        });
      });

      it("should convert literal values", () => {
        const tools: ToolDefinition[] = [
          {
            name: "literal_tool",
            description: "Tool with literal values",
            inputSchema: z.object({
              mode: z.literal("specific"),
              count: z.literal(42),
              flag: z.literal(true),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters?.properties?.mode).toEqual({
          type: "string",
          enum: ["specific"],
        });
        expect(result[0].parameters?.properties?.count).toEqual({
          type: "number",
          enum: [42],
        });
        expect(result[0].parameters?.properties?.flag).toEqual({
          type: "boolean",
          enum: [true],
        });
      });
    });

    describe("Provider Hints", () => {
      it("should use Gemini function hints when provided", () => {
        const tools: ToolDefinition[] = [
          {
            name: "hint_tool",
            description: "Tool with hints",
            inputSchema: z.object({
              param: z.string(),
            }),
            hints: {
              gemini: {
                function: {
                  name: "custom_function_name",
                  description: "Custom description from hint",
                  parameters: {
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

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0]).toEqual({
          name: "custom_function_name",
          description: "Custom description from hint",
          parameters: {
            type: "object",
            properties: {
              custom_param: { type: "string" },
            },
            required: ["custom_param"],
          },
        });
      });

      it("should validate hint structure", () => {
        const tools: ToolDefinition[] = [
          {
            name: "invalid_hint_tool",
            description: "Tool with invalid hints",
            inputSchema: z.object({
              param: z.string(),
            }),
            hints: {
              gemini: {
                function: {
                  // Missing required name field
                  description: "Invalid hint",
                },
              },
            },
          },
        ];

        expect(() => toolTranslator.translateToolDefinitions(tools)).toThrow(
          ValidationError,
        );
      });
    });

    describe("JSON Schema Input", () => {
      it("should handle existing JSON Schema input", () => {
        const tools: ToolDefinition[] = [
          {
            name: "json_schema_tool",
            description: "Tool with JSON Schema",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string" },
                count: { type: "number", minimum: 1 },
              },
              required: ["name"],
            },
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].parameters).toEqual({
          type: "object",
          properties: {
            name: { type: "string" },
            count: { type: "number", minimum: 1 },
          },
          required: ["name"],
        });
      });
    });

    describe("Edge Cases", () => {
      it("should handle tools with no parameters", () => {
        const tools: ToolDefinition[] = [
          {
            name: "no_params_tool",
            description: "Tool without parameters",
            inputSchema: z.object({}),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0]).toEqual({
          name: "no_params_tool",
          description: "Tool without parameters",
        });
      });

      it("should handle tools without description", () => {
        const tools: ToolDefinition[] = [
          {
            name: "no_desc_tool",
            inputSchema: z.object({
              param: z.string(),
            }),
          },
        ];

        const result = toolTranslator.translateToolDefinitions(tools);

        expect(result[0].description).toBe("Execute no_desc_tool tool");
      });

      it("should handle empty tools array", () => {
        const result = toolTranslator.translateToolDefinitions([]);
        expect(result).toEqual([]);
      });
    });

    describe("Error Handling", () => {
      it("should throw ValidationError for non-array input", () => {
        expect(() =>
          toolTranslator.translateToolDefinitions(
            "not an array" as unknown as ToolDefinition[],
          ),
        ).toThrow(ValidationError);
      });

      it("should throw ValidationError for unsupported Zod schema", () => {
        const tools = [
          {
            name: "unsupported_tool",
            description: "Tool with unsupported schema",
            inputSchema: z.function(), // Unsupported schema type
          },
        ] as ToolDefinition[];

        expect(() => toolTranslator.translateToolDefinitions(tools)).toThrow(
          ValidationError,
        );
      });
    });
  });

  describe("parseFunctionCall", () => {
    describe("Valid Function Calls", () => {
      it("should parse basic function call", () => {
        const functionCall = {
          name: "test_function",
          args: {
            param1: "value1",
            param2: 42,
          },
        };

        const result = toolTranslator.parseFunctionCall(functionCall);

        expect(result.name).toBe("test_function");
        expect(result.arguments).toEqual({
          param1: "value1",
          param2: 42,
        });
        expect(result.id).toMatch(/^gemini-\d+-[a-z0-9]+$/);
      });

      it("should handle function call with no arguments", () => {
        const functionCall = {
          name: "no_args_function",
          args: {},
        };

        const result = toolTranslator.parseFunctionCall(functionCall);

        expect(result.name).toBe("no_args_function");
        expect(result.arguments).toEqual({});
      });

      it("should handle function call with missing args property", () => {
        // Test the actual case where args property is missing from the object
        const functionCallWithoutArgs = { name: "missing_args_function" };
        const functionCall = functionCallWithoutArgs as unknown as {
          name: string;
          args: Record<string, unknown>;
        };

        const result = toolTranslator.parseFunctionCall(functionCall);

        expect(result.name).toBe("missing_args_function");
        expect(result.arguments).toEqual({});
      });

      it("should generate unique IDs for each call", () => {
        const functionCall = {
          name: "test_function",
          args: {},
        };

        const result1 = toolTranslator.parseFunctionCall(functionCall);
        const result2 = toolTranslator.parseFunctionCall(functionCall);

        expect(result1.id).not.toBe(result2.id);
      });
    });

    describe("Error Handling", () => {
      it("should throw ValidationError for null input", () => {
        expect(() =>
          toolTranslator.parseFunctionCall(
            null as unknown as { name: string; args: Record<string, unknown> },
          ),
        ).toThrow(ValidationError);
      });

      it("should throw ValidationError for non-object input", () => {
        expect(() =>
          toolTranslator.parseFunctionCall(
            "string" as unknown as {
              name: string;
              args: Record<string, unknown>;
            },
          ),
        ).toThrow(ValidationError);
      });

      it("should throw ValidationError for missing function name", () => {
        const functionCall = {
          args: { param: "value" },
        } as { args: Record<string, unknown> };

        expect(() =>
          toolTranslator.parseFunctionCall(
            functionCall as unknown as {
              name: string;
              args: Record<string, unknown>;
            },
          ),
        ).toThrow(ValidationError);
      });

      it("should throw ValidationError for invalid function name", () => {
        const functionCall = {
          name: 123,
          args: {},
        } as { name: number; args: Record<string, unknown> };

        expect(() =>
          toolTranslator.parseFunctionCall(
            functionCall as unknown as {
              name: string;
              args: Record<string, unknown>;
            },
          ),
        ).toThrow(ValidationError);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should handle round-trip conversion consistency", () => {
      const tools: ToolDefinition[] = [
        {
          name: "roundtrip_tool",
          description: "Test round-trip conversion",
          inputSchema: z.object({
            name: z.string(),
            age: z.number().min(0),
            active: z.boolean().default(true),
            tags: z.array(z.string()).optional(),
          }),
        },
      ];

      const geminiTools = toolTranslator.translateToolDefinitions(tools);
      expect(geminiTools).toHaveLength(1);

      const geminiTool = geminiTools[0];
      expect(geminiTool.name).toBe("roundtrip_tool");
      expect(geminiTool.description).toBe("Test round-trip conversion");
      expect(geminiTool.parameters?.type).toBe("object");
      expect(geminiTool.parameters?.required).toEqual(["name", "age"]);

      // Simulate function call response
      const functionCall = {
        name: geminiTool.name,
        args: {
          name: "John",
          age: 30,
          tags: ["developer", "tester"],
        },
      };

      const parsedCall = toolTranslator.parseFunctionCall(functionCall);
      expect(parsedCall.name).toBe("roundtrip_tool");
      expect(parsedCall.arguments).toEqual({
        name: "John",
        age: 30,
        tags: ["developer", "tester"],
      });
    });

    it("should handle multiple tools with various schema types", () => {
      const tools: ToolDefinition[] = [
        {
          name: "string_tool",
          inputSchema: z.object({ text: z.string() }),
        },
        {
          name: "number_tool",
          inputSchema: z.object({ value: z.number() }),
        },
        {
          name: "complex_tool",
          inputSchema: z.object({
            user: z.object({
              name: z.string(),
              settings: z.object({
                theme: z.enum(["light", "dark"]),
                notifications: z.boolean(),
              }),
            }),
          }),
        },
      ];

      const result = toolTranslator.translateToolDefinitions(tools);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("string_tool");
      expect(result[1].name).toBe("number_tool");
      expect(result[2].name).toBe("complex_tool");

      // Verify complex nested structure
      const complexTool = result[2];
      expect(complexTool.parameters?.properties?.user).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          settings: {
            type: "object",
            properties: {
              theme: { type: "string", enum: ["light", "dark"] },
              notifications: { type: "boolean" },
            },
            required: ["theme", "notifications"],
          },
        },
        required: ["name", "settings"],
      });
    });
  });
});
