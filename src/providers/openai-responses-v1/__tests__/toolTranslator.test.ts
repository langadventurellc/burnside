/**
 * Tool Translator Tests
 *
 * Comprehensive unit tests for OpenAI tool translation logic covering
 * schema conversion, error handling, and provider hints functionality.
 */

import { z } from "zod";
import { translateToolDefinitionToOpenAI } from "../toolTranslator.js";
import { translateToolsForOpenAI } from "../toolsTranslator.js";
import { ValidationError } from "../../../core/errors/validationError.js";
import {
  simpleEchoToolDefinition,
  complexWeatherToolDefinition,
  toolWithHintsDefinition,
  expectedOpenAIEchoTool,
  expectedOpenAIWeatherTool,
  expectedOpenAIHintsTool,
} from "./fixtures/toolExamples.js";

// Type definition for tests - matches the one in translators
type ToolDefinition = {
  name: string;
  description?: string;
  inputSchema: z.ZodTypeAny | object;
  outputSchema?: z.ZodTypeAny | object;
  hints?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

describe("translateToolDefinitionToOpenAI", () => {
  describe("Schema Translation", () => {
    it("should convert simple string schema to OpenAI format", () => {
      const result = translateToolDefinitionToOpenAI(simpleEchoToolDefinition);

      expect(result).toEqual(expectedOpenAIEchoTool);
      expect(result.type).toBe("function");
      expect(result.function.name).toBe("echo_tool");
      expect(result.function.parameters.type).toBe("object");
      expect(result.function.parameters.required).toContain("data");
    });

    it("should convert complex object schema with optional fields", () => {
      const result = translateToolDefinitionToOpenAI(
        complexWeatherToolDefinition,
      );

      expect(result).toEqual(expectedOpenAIWeatherTool);
      expect(result.function.parameters.properties).toHaveProperty("location");
      expect(result.function.parameters.properties).toHaveProperty("units");
      expect(result.function.parameters.required).toContain("location");
      expect(result.function.parameters.required).not.toContain("days"); // days has default value
    });

    it("should handle Zod enum types correctly", () => {
      const toolDef = {
        name: "enum_test",
        description: "Test enum handling",
        inputSchema: z.object({
          priority: z.enum(["low", "medium", "high"]),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.priority).toEqual({
        type: "string",
        enum: ["low", "medium", "high"],
      });
    });

    it("should handle Zod number constraints", () => {
      const toolDef = {
        name: "number_test",
        description: "Test number constraints",
        inputSchema: z.object({
          count: z.number().min(1).max(100),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.count).toEqual({
        type: "number",
        minimum: 1,
        maximum: 100,
      });
    });

    it("should handle Zod boolean types", () => {
      const toolDef = {
        name: "boolean_test",
        description: "Test boolean handling",
        inputSchema: z.object({
          enabled: z.boolean(),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.enabled).toEqual({
        type: "boolean",
      });
    });

    it("should handle Zod array types", () => {
      const toolDef = {
        name: "array_test",
        description: "Test array handling",
        inputSchema: z.object({
          tags: z.array(z.string()),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.tags).toEqual({
        type: "array",
        items: { type: "string" },
      });
    });

    it("should handle Zod default values", () => {
      const toolDef = {
        name: "default_test",
        description: "Test default values",
        inputSchema: z.object({
          retries: z.number().default(3),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.retries).toEqual({
        type: "number",
        default: 3,
      });
    });

    it("should handle nested objects", () => {
      const toolDef = {
        name: "nested_test",
        description: "Test nested objects",
        inputSchema: z.object({
          config: z.object({
            timeout: z.number(),
            debug: z.boolean(),
          }),
        }),
      };

      const result = translateToolDefinitionToOpenAI(toolDef);

      expect(result.function.parameters.properties?.config).toEqual({
        type: "object",
        properties: {
          timeout: { type: "number" },
          debug: { type: "boolean" },
        },
        required: ["timeout", "debug"],
        additionalProperties: false,
      });
    });
  });

  describe("Provider Hints", () => {
    it("should use OpenAI function hints when provided", () => {
      const result = translateToolDefinitionToOpenAI(toolWithHintsDefinition);

      expect(result).toEqual(expectedOpenAIHintsTool);
      expect(result.function.name).toBe("calculate_math_expression");
    });

    it("should validate hint-based functions against OpenAI schema", () => {
      const invalidHintTool = {
        name: "invalid_hint",
        description: "Tool with invalid hints",
        inputSchema: z.object({}),
        hints: {
          openai: {
            function: {
              // Missing required 'name' field
              description: "Invalid function",
              parameters: { type: "object" },
            },
          },
        },
      };

      expect(() => translateToolDefinitionToOpenAI(invalidHintTool)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw ValidationError for unsupported Zod types", () => {
      const unsupportedTool = {
        name: "unsupported_test",
        description: "Test unsupported schema",
        inputSchema: z.object({
          value: z.bigint(), // Unsupported type
        }),
      };

      expect(() => translateToolDefinitionToOpenAI(unsupportedTool)).toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError for invalid tool names", () => {
      const invalidNameTool = {
        name: "invalid-name-with-dashes",
        description: "Tool with invalid name",
        inputSchema: z.object({}),
      };

      expect(() => translateToolDefinitionToOpenAI(invalidNameTool)).toThrow(
        ValidationError,
      );
    });

    it("should provide detailed error context", () => {
      const badTool = {
        name: "bad_tool",
        description: "Tool that will fail",
        inputSchema: z.object({
          value: z.bigint(),
        }),
      };

      try {
        translateToolDefinitionToOpenAI(badTool);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toHaveProperty("zodSchema");
      }
    });
  });

  describe("JSON Schema Input", () => {
    it("should accept existing JSON Schema objects", () => {
      const jsonSchemaTool = {
        name: "json_schema_tool",
        description: "Tool with JSON Schema input",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
      };

      const result = translateToolDefinitionToOpenAI(jsonSchemaTool);

      expect(result.function.parameters.properties).toHaveProperty("message");
      expect(result.function.parameters.required).toContain("message");
    });
  });
});

describe("translateToolsForOpenAI", () => {
  it("should convert array of tools successfully", () => {
    const tools = [simpleEchoToolDefinition, complexWeatherToolDefinition];

    const result = translateToolsForOpenAI(tools);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expectedOpenAIEchoTool);
    expect(result[1]).toEqual(expectedOpenAIWeatherTool);
  });

  it("should handle empty array", () => {
    const result = translateToolsForOpenAI([]);

    expect(result).toEqual([]);
  });

  it("should throw ValidationError for non-array input", () => {
    expect(() =>
      translateToolsForOpenAI("not an array" as unknown as ToolDefinition[]),
    ).toThrow(ValidationError);
  });

  it("should provide detailed error context for failed tool conversion", () => {
    const tools = [
      simpleEchoToolDefinition,
      {
        name: "bad_tool",
        description: "This will fail",
        inputSchema: z.object({
          value: z.bigint(), // Unsupported
        }),
      },
    ];

    try {
      translateToolsForOpenAI(tools);
      fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.context).toHaveProperty("toolIndex", 1);
      expect(validationError.context).toHaveProperty("toolName", "bad_tool");
    }
  });
});

describe("Integration Tests", () => {
  it("should generate valid OpenAI tools for all example definitions", () => {
    const tools = [
      simpleEchoToolDefinition,
      complexWeatherToolDefinition,
      toolWithHintsDefinition,
    ];

    const result = translateToolsForOpenAI(tools);

    expect(result).toHaveLength(3);

    // Verify all results have correct structure
    result.forEach((tool) => {
      expect(tool.type).toBe("function");
      expect(tool.function).toHaveProperty("name");
      expect(tool.function).toHaveProperty("parameters");
      expect(tool.function.parameters.type).toBe("object");
    });
  });

  it("should handle large arrays of tools efficiently", () => {
    const largeTool: ToolDefinition = {
      name: "large_tool",
      description: "Tool for performance testing",
      inputSchema: z.object({
        data: z.string(),
      }),
    };

    const tools: ToolDefinition[] = Array(10).fill(
      largeTool,
    ) as ToolDefinition[];

    const start = Date.now();
    const result = translateToolsForOpenAI(tools);
    const duration = Date.now() - start;

    expect(result).toHaveLength(10);
    expect(duration).toBeLessThan(100); // Should complete quickly
  });
});
