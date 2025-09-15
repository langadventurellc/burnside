/**
 * ToolDefinition Schema Tests
 *
 * Comprehensive test suite for ToolDefinition Zod schema validation
 * covering all validation rules, error cases, and edge conditions.
 */

import { z } from "zod";
import { ToolDefinitionSchema } from "../toolDefinitionSchema";

describe("ToolDefinitionSchema", () => {
  describe("tool name validation", () => {
    it("accepts valid tool names", () => {
      const validTool = {
        name: "weather_forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("accepts tool names with hyphens", () => {
      const validTool = {
        name: "weather-forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("accepts alphanumeric tool names", () => {
      const validTool = {
        name: "tool123",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("rejects tool names with spaces", () => {
      const invalidTool = {
        name: "weather forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow(
        "Tool name must contain only alphanumeric characters, underscores, and hyphens",
      );
    });

    it("rejects tool names with special characters", () => {
      const invalidTool = {
        name: "weather@forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow();
    });

    it("rejects empty tool names", () => {
      const invalidTool = {
        name: "",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow(
        "Tool name is required",
      );
    });

    it("rejects tool names longer than 50 characters", () => {
      const invalidTool = {
        name: "a".repeat(51),
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow(
        "Tool name must be 50 characters or less",
      );
    });

    it("accepts tool names at 50 character limit", () => {
      const validTool = {
        name: "a".repeat(50),
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });
  });

  describe("description validation", () => {
    it("accepts valid descriptions", () => {
      const validTool = {
        name: "test_tool",
        description: "This is a test tool",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("accepts undefined description", () => {
      const validTool = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("rejects descriptions longer than 500 characters", () => {
      const invalidTool = {
        name: "test_tool",
        description: "a".repeat(501),
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow(
        "Tool description cannot exceed 500 characters",
      );
    });

    it("accepts descriptions at 500 character limit", () => {
      const validTool = {
        name: "test_tool",
        description: "a".repeat(500),
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });
  });

  describe("input schema validation", () => {
    it("accepts valid Zod input schema", () => {
      const toolWithZodSchema = {
        name: "test_tool",
        inputSchema: z.object({
          param1: z.string(),
          param2: z.number().optional(),
        }),
      };
      expect(() => ToolDefinitionSchema.parse(toolWithZodSchema)).not.toThrow();
    });

    it("accepts complex Zod input schema", () => {
      const toolWithComplexSchema = {
        name: "test_tool",
        inputSchema: z.object({
          location: z.string().min(1),
          options: z
            .object({
              units: z.enum(["celsius", "fahrenheit"]),
              includeHourly: z.boolean().optional(),
            })
            .optional(),
          filters: z.array(z.string()).optional(),
        }),
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithComplexSchema),
      ).not.toThrow();
    });

    it("accepts JSON Schema input", () => {
      const toolWithJsonSchema = {
        name: "test_tool",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name" },
            units: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithJsonSchema),
      ).not.toThrow();
    });

    it("accepts simple JSON Schema types", () => {
      const simpleSchemas = [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "array" },
      ];

      for (const schema of simpleSchemas) {
        const tool = {
          name: "test_tool",
          inputSchema: schema,
        };
        expect(() => ToolDefinitionSchema.parse(tool)).not.toThrow();
      }
    });

    it("rejects invalid JSON Schema types", () => {
      const invalidTool = {
        name: "test_tool",
        inputSchema: {
          type: "invalidType",
          properties: {},
        },
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow(
        "JSON Schema type must be a valid primitive or object type",
      );
    });

    it("rejects non-schema objects as input schema", () => {
      const invalidTool = {
        name: "test_tool",
        inputSchema: { notASchema: true },
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow();
    });

    it("rejects missing input schema", () => {
      const invalidTool = {
        name: "test_tool",
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow();
    });
  });

  describe("output schema validation", () => {
    it("accepts valid Zod output schema", () => {
      const toolWithOutputSchema = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        outputSchema: z.object({
          result: z.string(),
          confidence: z.number(),
        }),
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithOutputSchema),
      ).not.toThrow();
    });

    it("accepts JSON Schema output", () => {
      const toolWithJsonOutput = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        outputSchema: {
          type: "object",
          properties: {
            result: { type: "string" },
            confidence: { type: "number" },
          },
        },
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithJsonOutput),
      ).not.toThrow();
    });

    it("accepts undefined output schema", () => {
      const toolWithoutOutput = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(toolWithoutOutput)).not.toThrow();
    });

    it("rejects invalid output schema objects", () => {
      const invalidTool = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        outputSchema: { notASchema: true },
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow();
    });
  });

  describe("hints validation", () => {
    it("accepts valid hints object", () => {
      const toolWithHints = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        hints: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
        },
      };
      expect(() => ToolDefinitionSchema.parse(toolWithHints)).not.toThrow();
    });

    it("accepts empty hints object", () => {
      const toolWithEmptyHints = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        hints: {},
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithEmptyHints),
      ).not.toThrow();
    });

    it("accepts undefined hints", () => {
      const toolWithoutHints = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(toolWithoutHints)).not.toThrow();
    });

    it("accepts complex nested hints", () => {
      const toolWithComplexHints = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        hints: {
          provider: {
            openai: { model: "gpt-4", temperature: 0.7 },
            anthropic: { model: "claude-3", maxTokens: 1000 },
          },
          caching: true,
          retries: 3,
        },
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithComplexHints),
      ).not.toThrow();
    });
  });

  describe("metadata validation", () => {
    it("accepts valid metadata object", () => {
      const toolWithMetadata = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        metadata: {
          version: "1.0.0",
          author: "Test Author",
          category: "utility",
        },
      };
      expect(() => ToolDefinitionSchema.parse(toolWithMetadata)).not.toThrow();
    });

    it("accepts empty metadata object", () => {
      const toolWithEmptyMetadata = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        metadata: {},
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithEmptyMetadata),
      ).not.toThrow();
    });

    it("accepts undefined metadata", () => {
      const toolWithoutMetadata = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithoutMetadata),
      ).not.toThrow();
    });

    it("accepts metadata with all valid property types", () => {
      const toolWithVariousMetadata = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        metadata: {
          version: "1.0.0",
          isProduction: true,
          priority: 10,
          tags: ["utility", "api"],
          config: { timeout: 5000, retries: 3 },
        },
      };
      expect(() =>
        ToolDefinitionSchema.parse(toolWithVariousMetadata),
      ).not.toThrow();
    });
  });

  describe("complete tool validation", () => {
    it("validates complete tool with all fields", () => {
      const completeTool = {
        name: "weather_forecast",
        description: "Get detailed weather forecast for any location",
        inputSchema: z.object({
          location: z.string().min(1, "Location is required"),
          units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
          includeHourly: z.boolean().optional(),
        }),
        outputSchema: z.object({
          current: z.object({
            temperature: z.number(),
            humidity: z.number(),
            description: z.string(),
          }),
          forecast: z
            .array(
              z.object({
                date: z.string(),
                high: z.number(),
                low: z.number(),
              }),
            )
            .optional(),
        }),
        hints: {
          provider: "openweather",
          apiVersion: "v2.5",
          cacheTimeout: 3600,
        },
        metadata: {
          version: "2.1.0",
          author: "Weather Team",
          category: "data",
          tags: ["weather", "forecast", "api"],
        },
      };

      const result = ToolDefinitionSchema.parse(completeTool);
      expect(result).toEqual(completeTool);
    });

    it("validates minimal tool with only required fields", () => {
      const minimalTool = {
        name: "simple_tool",
        inputSchema: z.string(),
      };

      const result = ToolDefinitionSchema.parse(minimalTool);
      expect(result.name).toBe("simple_tool");
      expect(result.inputSchema).toBe(minimalTool.inputSchema);
      expect(result.description).toBeUndefined();
      expect(result.outputSchema).toBeUndefined();
      expect(result.hints).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });

    it("rejects tools with extra properties", () => {
      const toolWithExtraProps = {
        name: "test_tool",
        inputSchema: z.object({ param: z.string() }),
        extraProperty: "not allowed",
      };
      expect(() => ToolDefinitionSchema.parse(toolWithExtraProps)).toThrow();
    });
  });

  describe("error message validation", () => {
    it("provides clear error messages for invalid tool names", () => {
      const invalidTool = {
        name: "invalid tool name",
        inputSchema: z.object({ param: z.string() }),
      };

      try {
        ToolDefinitionSchema.parse(invalidTool);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues[0].message).toContain("alphanumeric characters");
      }
    });

    it("provides field-level error information", () => {
      const invalidTool = {
        name: "",
        description: "a".repeat(501),
        inputSchema: { notASchema: true },
      };

      try {
        ToolDefinitionSchema.parse(invalidTool);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues.length).toBeGreaterThan(1);
      }
    });
  });

  describe("type inference", () => {
    it("properly infers types from schema", () => {
      const tool = {
        name: "test_tool",
        description: "Test description",
        inputSchema: z.object({ param: z.string() }),
        outputSchema: z.object({ result: z.number() }),
        hints: { provider: "test" },
        metadata: { version: "1.0" },
      };

      const parsed = ToolDefinitionSchema.parse(tool);

      // Type assertions to ensure proper inference
      const name: string = parsed.name;
      const description: string | undefined = parsed.description;
      const hints: Record<string, unknown> | undefined = parsed.hints;
      const metadata: Record<string, unknown> | undefined = parsed.metadata;

      expect(name).toBe("test_tool");
      expect(description).toBe("Test description");
      expect(hints).toEqual({ provider: "test" });
      expect(metadata).toEqual({ version: "1.0" });
    });
  });
});
