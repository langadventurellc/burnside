/**
 * Tool Translator Tests
 *
 * Comprehensive unit tests for xAI tool translation logic covering
 * schema conversion, error handling, and provider hints functionality.
 * xAI uses OpenAI-compatible tool format.
 */

import { z } from "zod";
import { translateToolDefinitionToXAI } from "../toolTranslator";
import { ValidationError } from "../../../core/errors/validationError";
import {
  simpleEchoToolDefinition,
  complexWeatherToolDefinition,
  toolWithHintsDefinition,
  expectedXAIEchoTool,
  expectedXAIWeatherTool,
  expectedXAIHintsTool,
} from "./fixtures/toolExamples";

describe("translateToolDefinitionToXAI", () => {
  describe("Schema Translation", () => {
    it("should convert simple string schema to xAI format", () => {
      const result = translateToolDefinitionToXAI(simpleEchoToolDefinition);

      expect(result).toEqual(expectedXAIEchoTool);
      expect(result.type).toBe("function");
      expect(result.function.name).toBe("echo_tool");
      expect(result.function.parameters.type).toBe("object");
      expect(result.function.parameters.required).toContain("data");
    });

    it("should convert complex object schema with optional fields", () => {
      const result = translateToolDefinitionToXAI(complexWeatherToolDefinition);

      expect(result).toEqual(expectedXAIWeatherTool);
      expect(result.function.parameters.properties).toHaveProperty("location");
      expect(result.function.parameters.properties).toHaveProperty("units");
      expect(result.function.parameters.properties).toHaveProperty("days");
      expect(result.function.parameters.required).toEqual(["location"]);
    });

    it("should handle provider hints with custom xAI function", () => {
      const result = translateToolDefinitionToXAI(toolWithHintsDefinition);

      expect(result).toEqual(expectedXAIHintsTool);
      expect(result.function.name).toBe("calculate_math_expression");
      expect(result.function.description).toBe(
        "Execute a mathematical expression and return the result",
      );
    });

    it("should add default description when none provided", () => {
      const toolWithoutDescription = {
        name: "test_tool",
        inputSchema: z.object({ input: z.string() }),
      };

      const result = translateToolDefinitionToXAI(toolWithoutDescription);

      expect(result.function.description).toBe("Execute test_tool tool");
    });
  });

  describe("Zod Schema Types", () => {
    it("should convert ZodString with validation message", () => {
      const tool = {
        name: "string_tool",
        inputSchema: z.object({
          text: z.string().min(1, "Text is required"),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        text: {
          type: "string",
          description: "Text is required",
        },
      });
      expect(result.function.parameters.required).toEqual(["text"]);
    });

    it("should convert ZodNumber with min/max constraints", () => {
      const tool = {
        name: "number_tool",
        inputSchema: z.object({
          count: z.number().min(1).max(100),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        count: {
          type: "number",
          minimum: 1,
          maximum: 100,
        },
      });
    });

    it("should convert ZodBoolean", () => {
      const tool = {
        name: "boolean_tool",
        inputSchema: z.object({
          enabled: z.boolean(),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        enabled: {
          type: "boolean",
        },
      });
    });

    it("should convert ZodEnum", () => {
      const tool = {
        name: "enum_tool",
        inputSchema: z.object({
          status: z.enum(["active", "inactive", "pending"]),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        status: {
          type: "string",
          enum: ["active", "inactive", "pending"],
        },
      });
    });

    it("should convert ZodArray", () => {
      const tool = {
        name: "array_tool",
        inputSchema: z.object({
          items: z.array(z.string()),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        items: {
          type: "array",
          items: {
            type: "string",
          },
        },
      });
    });

    it("should handle ZodOptional fields correctly", () => {
      const tool = {
        name: "optional_tool",
        inputSchema: z.object({
          required: z.string(),
          optional: z.string().optional(),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.required).toEqual(["required"]);
      expect(result.function.parameters.properties).toHaveProperty("optional");
    });

    it("should handle ZodDefault with default values", () => {
      const tool = {
        name: "default_tool",
        inputSchema: z.object({
          timeout: z.number().default(30),
        }),
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        timeout: {
          type: "number",
          default: 30,
        },
      });
      expect(result.function.parameters.required).toEqual([]);
    });
  });

  describe("JSON Schema Input", () => {
    it("should handle existing JSON Schema objects", () => {
      const tool = {
        name: "json_schema_tool",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
        },
      };

      const result = translateToolDefinitionToXAI(tool);

      expect(result.function.parameters.properties).toEqual({
        name: { type: "string" },
        age: { type: "number" },
      });
      expect(result.function.parameters.required).toEqual(["name"]);
    });
  });

  describe("Error Handling", () => {
    it("should throw ValidationError for unsupported Zod schema types", () => {
      const tool = {
        name: "unsupported_tool",
        inputSchema: z.object({
          // Using ZodUnion which isn't supported
          value: z.union([z.string(), z.number()]),
        }),
      };

      expect(() => translateToolDefinitionToXAI(tool)).toThrow(ValidationError);
      expect(() => translateToolDefinitionToXAI(tool)).toThrow(
        "Failed to convert Zod schema to JSON Schema",
      );
    });

    it("should throw ValidationError for invalid hint-based tools", () => {
      const tool = {
        name: "invalid_hints_tool",
        inputSchema: z.object({ input: z.string() }),
        hints: {
          xai: {
            function: {
              // Missing required name field
              description: "Test function",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
        },
      };

      expect(() => translateToolDefinitionToXAI(tool)).toThrow(ValidationError);
      expect(() => translateToolDefinitionToXAI(tool)).toThrow(
        "Invalid xAI function hint",
      );
    });
  });

  describe("Type Inference", () => {
    it("should return correctly typed XAITool object", () => {
      const result = translateToolDefinitionToXAI(simpleEchoToolDefinition);

      // TypeScript type checking - these should compile without errors
      expect(result.type).toBe("function");
      expect(typeof result.function.name).toBe("string");
      expect(typeof result.function.description).toBe("string");
      expect(result.function.parameters.type).toBe("object");
      expect(Array.isArray(result.function.parameters.required)).toBe(true);
    });
  });
});
