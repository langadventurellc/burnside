/**
 * Tools Array Translator Tests
 *
 * Unit tests for xAI tools array translation functionality,
 * covering array processing, error handling, and validation.
 */

import { z } from "zod";
import { translateToolsForXAI } from "../toolsTranslator";
import { ValidationError } from "../../../core/errors/validationError";
import {
  simpleEchoToolDefinition,
  complexWeatherToolDefinition,
  expectedXAIEchoTool,
  expectedXAIWeatherTool,
  toolDefinitionExamples,
} from "./fixtures/toolExamples";

describe("translateToolsForXAI", () => {
  describe("Array Translation", () => {
    it("should translate empty array", () => {
      const result = translateToolsForXAI([]);
      expect(result).toEqual([]);
    });

    it("should translate single tool", () => {
      const result = translateToolsForXAI([simpleEchoToolDefinition]);
      expect(result).toEqual([expectedXAIEchoTool]);
    });

    it("should translate multiple tools", () => {
      const result = translateToolsForXAI([
        simpleEchoToolDefinition,
        complexWeatherToolDefinition,
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedXAIEchoTool);
      expect(result[1]).toEqual(expectedXAIWeatherTool);
    });

    it("should translate all example tools", () => {
      const result = translateToolsForXAI(toolDefinitionExamples);

      expect(result).toHaveLength(toolDefinitionExamples.length);
      expect(result.every((tool) => tool.type === "function")).toBe(true);
      expect(
        result.every((tool) => typeof tool.function.name === "string"),
      ).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw ValidationError for non-array input", () => {
      // Use type assertion to bypass TypeScript checking for this error test
      const nonArray = "not an array" as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => translateToolsForXAI(nonArray)).toThrow(ValidationError);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => translateToolsForXAI(nonArray)).toThrow(
        "Tools must be an array",
      );
    });

    it("should throw ValidationError for invalid tool in array", () => {
      const invalidTool = {
        name: "invalid_tool",
        inputSchema: z.object({
          // Using unsupported schema type
          value: z.union([z.string(), z.number()]),
        }),
      } as any;

      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        translateToolsForXAI([simpleEchoToolDefinition, invalidTool]),
      ).toThrow(ValidationError);

      // Should provide detailed error context
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        translateToolsForXAI([simpleEchoToolDefinition, invalidTool]);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          "Failed to convert 1 tool(s)",
        );
        expect((error as ValidationError).message).toContain("invalid_tool");
        expect((error as ValidationError).context).toEqual({
          totalTools: 2,
          failedTools: 1,
          errors: [
            {
              index: 1,
              name: "invalid_tool",
              error: expect.stringContaining("Failed to convert Zod schema"),
            },
          ],
        });
      }
    });

    it("should collect all errors for multiple invalid tools", () => {
      const invalidTool1 = {
        name: "invalid_tool_1",
        inputSchema: z.object({
          value: z.union([z.string(), z.number()]),
        }),
      };

      const invalidTool2 = {
        name: "invalid_tool_2",
        inputSchema: z.object({
          value: z.union([z.boolean(), z.array(z.string())]),
        }),
      };

      try {
        translateToolsForXAI([invalidTool1, invalidTool2]);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          "Failed to convert 2 tool(s)",
        );
        expect((error as ValidationError).context).toEqual({
          totalTools: 2,
          failedTools: 2,
          errors: [
            {
              index: 0,
              name: "invalid_tool_1",
              error: expect.stringContaining("Failed to convert Zod schema"),
            },
            {
              index: 1,
              name: "invalid_tool_2",
              error: expect.stringContaining("Failed to convert Zod schema"),
            },
          ],
        });
      }
    });

    it("should handle tools without names gracefully", () => {
      const toolWithoutName = {
        inputSchema: z.object({ input: z.string() }),
      } as any;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        translateToolsForXAI([toolWithoutName]);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context?.errors).toBeDefined();
        expect((validationError.context?.errors as any)?.[0]?.name).toBe(
          "tool-0",
        );
      }
    });
  });

  describe("Performance", () => {
    it("should handle large arrays efficiently", () => {
      const manyTools = Array(100)
        .fill(null)
        .map((_, index) => ({
          name: `tool_${index}`,
          description: `Tool number ${index}`,
          inputSchema: z.object({
            value: z.string(),
            index: z.number().default(index),
          }),
        }));

      const start = Date.now();
      const result = translateToolsForXAI(manyTools);
      const duration = Date.now() - start;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.every((tool) => tool.type === "function")).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should return correctly typed XAITool array", () => {
      const result = translateToolsForXAI([simpleEchoToolDefinition]);

      // TypeScript type checking - these should compile without errors
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].type).toBe("function");
      expect(typeof result[0].function.name).toBe("string");
    });
  });
});
