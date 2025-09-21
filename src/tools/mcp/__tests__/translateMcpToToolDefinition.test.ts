/**
 * Tests for MCP to ToolDefinition translation
 */

import { describe, it, expect } from "@jest/globals";
import { translateMcpToToolDefinition } from "../translateMcpToToolDefinition";
import { ValidationError } from "../../../core/errors/validationError";
import type { McpToolDefinition } from "../mcpToolDefinition";

describe("translateMcpToToolDefinition", () => {
  describe("valid translations", () => {
    it("should translate basic MCP tool to ToolDefinition", () => {
      const mcpTool: McpToolDefinition = {
        name: "calculator",
        description: "Perform arithmetic calculations",
        inputSchema: {
          type: "object",
          properties: {
            operation: { type: "string" },
            a: { type: "number" },
            b: { type: "number" },
          },
          required: ["operation", "a", "b"],
        },
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.name).toBe("calculator");
      expect(result.description).toBe("Perform arithmetic calculations");
      expect(result.inputSchema).toEqual(mcpTool.inputSchema);
      expect(result.outputSchema).toBeUndefined();
    });

    it("should handle MCP tool without description", () => {
      const mcpTool: McpToolDefinition = {
        name: "simple_tool",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.name).toBe("simple_tool");
      expect(result.description).toBeUndefined();
      expect(result.inputSchema).toEqual(mcpTool.inputSchema);
    });

    it("should handle MCP tool without inputSchema", () => {
      const mcpTool: McpToolDefinition = {
        name: "no_input_tool",
        description: "Tool with no input parameters",
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.name).toBe("no_input_tool");
      expect(result.description).toBe("Tool with no input parameters");
      expect(result.inputSchema).toEqual({
        type: "object",
        properties: {},
        required: [],
      });
    });

    it("should handle MCP tool with outputSchema", () => {
      const mcpTool: McpToolDefinition = {
        name: "weather_tool",
        description: "Get weather information",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            temperature: { type: "number" },
            condition: { type: "string" },
          },
        },
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.name).toBe("weather_tool");
      expect(result.outputSchema).toEqual(mcpTool.outputSchema);
    });

    it("should handle complex JSON schema with nested properties", () => {
      const mcpTool: McpToolDefinition = {
        name: "complex_tool",
        description: "Tool with complex schema",
        inputSchema: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
              },
              required: ["name"],
            },
            preferences: {
              type: "array",
              items: { type: "string" },
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
            },
          },
          required: ["user"],
        },
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.inputSchema).toEqual(mcpTool.inputSchema);
      expect(result.name).toBe("complex_tool");
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError for empty name", () => {
      expect(() => {
        translateMcpToToolDefinition({
          name: "",
          description: "Tool with empty name",
          inputSchema: { type: "object" },
        });
      }).toThrow(ValidationError);
    });

    it("should include error context in ValidationError", () => {
      try {
        translateMcpToToolDefinition({
          name: "",
          description: "Invalid tool",
        });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain("required");
      }
    });

    it("should validate against ToolDefinitionSchema", () => {
      // Test that the function properly validates the result
      const validTool: McpToolDefinition = {
        name: "valid_tool",
        description: "A valid tool for testing",
      };

      const result = translateMcpToToolDefinition(validTool);
      expect(result.name).toBe("valid_tool");
      expect(result.description).toBe("A valid tool for testing");
    });
  });

  describe("edge cases", () => {
    it("should handle tool with minimal valid structure", () => {
      const mcpTool: McpToolDefinition = {
        name: "minimal_tool",
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.name).toBe("minimal_tool");
      expect(result.description).toBeUndefined();
      expect(result.inputSchema).toEqual({
        type: "object",
        properties: {},
        required: [],
      });
    });

    it("should preserve additional JSON schema properties", () => {
      const mcpTool: McpToolDefinition = {
        name: "extended_tool",
        inputSchema: {
          type: "object",
          properties: {
            value: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "A percentage value",
            },
          },
          additionalProperties: false,
          title: "Extended Schema",
        },
      };

      const result = translateMcpToToolDefinition(mcpTool);

      expect(result.inputSchema).toEqual(mcpTool.inputSchema);
    });

    it("should handle tools with very long names", () => {
      const longName = "a".repeat(50); // Test with 50 character name
      const mcpTool: McpToolDefinition = {
        name: longName,
        description: "Tool with long name",
      };

      const result = translateMcpToToolDefinition(mcpTool);
      expect(result.name).toBe(longName);
    });
  });
});
