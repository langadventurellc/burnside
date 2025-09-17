/**
 * ToolCall Schema Tests
 *
 * Comprehensive test suite for ToolCall Zod schema validation covering
 * all validation rules, edge cases, and error conditions.
 */

import { describe, it, expect } from "@jest/globals";
import { ZodError } from "zod";
import { ToolCallSchema } from "../toolCallSchema";
import type { ToolCall } from "../toolCall";

describe("ToolCallSchema", () => {
  describe("Valid ToolCall Objects", () => {
    it("should validate minimal valid ToolCall", () => {
      const validToolCall = {
        id: "call_abc123",
        name: "test_tool",
        parameters: {},
      };

      const result = ToolCallSchema.parse(validToolCall);
      expect(result).toEqual(validToolCall);
    });

    it("should validate complete ToolCall with all fields", () => {
      const completeToolCall = {
        id: "call_abc123",
        name: "calculate_sum",
        parameters: { a: 5, b: 3, operation: "add" },
        metadata: {
          providerId: "openai",
          timestamp: "2024-01-15T10:30:00.000Z",
          contextId: "conversation_456",
        },
      };

      const result = ToolCallSchema.parse(completeToolCall);
      expect(result).toEqual(completeToolCall);
    });

    it("should validate ToolCall with complex parameters", () => {
      const toolCallWithComplexParams = {
        id: "call_xyz789",
        name: "process_data",
        parameters: {
          data: [1, 2, 3],
          options: { format: "json", validate: true },
          callback: null,
          nested: { deep: { value: "test" } },
        },
      };

      const result = ToolCallSchema.parse(toolCallWithComplexParams);
      expect(result).toEqual(toolCallWithComplexParams);
    });

    it("should validate ToolCall with partial metadata", () => {
      const toolCallWithPartialMetadata = {
        id: "call_partial",
        name: "echo_tool",
        parameters: { message: "hello" },
        metadata: {
          timestamp: "2024-01-15T10:30:00.000Z",
        },
      };

      const result = ToolCallSchema.parse(toolCallWithPartialMetadata);
      expect(result).toEqual(toolCallWithPartialMetadata);
    });
  });

  describe("ID Validation", () => {
    it("should reject empty tool call ID", () => {
      const invalidToolCall = {
        id: "",
        name: "test_tool",
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(
        "Tool call ID cannot be empty",
      );
    });

    it("should reject excessively long tool call ID", () => {
      const invalidToolCall = {
        id: "a".repeat(256),
        name: "test_tool",
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(
        "Tool call ID cannot exceed 255 characters",
      );
    });

    it("should accept valid tool call IDs", () => {
      const validIds = [
        "call_123",
        "tool-call-456",
        "tc_abc_def_789",
        "a".repeat(255),
      ];

      validIds.forEach((id) => {
        const toolCall = {
          id,
          name: "test_tool",
          parameters: {},
        };
        expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
      });
    });
  });

  describe("Name Validation", () => {
    it("should reject empty tool name", () => {
      const invalidToolCall = {
        id: "call_123",
        name: "",
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(
        "Tool name is required",
      );
    });

    it("should reject tool name with invalid characters", () => {
      const invalidNames = ["tool@name", "tool name", "tool/name", "tool.name"];

      invalidNames.forEach((name) => {
        const invalidToolCall = {
          id: "call_123",
          name,
          parameters: {},
        };
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(
          "Tool name must contain only alphanumeric characters, underscores, and hyphens",
        );
      });
    });

    it("should accept valid tool names", () => {
      const validNames = [
        "tool",
        "tool_name",
        "tool-name",
        "Tool123",
        "calculate_sum",
        "process-data",
      ];

      validNames.forEach((name) => {
        const toolCall = {
          id: "call_123",
          name,
          parameters: {},
        };
        expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
      });
    });

    it("should reject excessively long tool name", () => {
      const invalidToolCall = {
        id: "call_123",
        name: "a".repeat(51),
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(
        "Tool name must be 50 characters or less",
      );
    });
  });

  describe("Parameters Validation", () => {
    it("should accept empty parameters object", () => {
      const toolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
    });

    it("should accept parameters with various data types", () => {
      const toolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: {
          string: "value",
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: "value" },
        },
      };

      expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
    });

    it("should reject non-object parameters", () => {
      const invalidParameters = [
        "string",
        123,
        true,
        null,
        undefined,
        [1, 2, 3],
      ];

      invalidParameters.forEach((parameters) => {
        const invalidToolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: parameters as any,
        };
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      });
    });
  });

  describe("Metadata Validation", () => {
    it("should accept undefined metadata", () => {
      const toolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: {},
      };

      expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
    });

    it("should validate providerId format", () => {
      const invalidProviderIds = [
        "",
        "provider@id",
        "provider id",
        "a".repeat(51),
      ];

      invalidProviderIds.forEach((providerId) => {
        const invalidToolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: {},
          metadata: { providerId },
        };
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      });
    });

    it("should accept valid providerId values", () => {
      const validProviderIds = [
        "openai",
        "anthropic",
        "local",
        "provider-1",
        "provider_2",
      ];

      validProviderIds.forEach((providerId) => {
        const toolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: {},
          metadata: { providerId },
        };
        expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
      });
    });

    it("should validate timestamp format", () => {
      const invalidTimestamps = [
        "invalid",
        "2024-01-15",
        "2024-01-15T10:30:00",
        "2024-01-15 10:30:00.000Z",
      ];

      invalidTimestamps.forEach((timestamp) => {
        const invalidToolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: {},
          metadata: { timestamp },
        };
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      });
    });

    it("should accept valid ISO 8601 timestamps", () => {
      const validTimestamps = [
        "2024-01-15T10:30:00.000Z",
        "2024-01-15T10:30:00Z",
        "2024-01-15T10:30:00.123Z",
      ];

      validTimestamps.forEach((timestamp) => {
        const toolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: {},
          metadata: { timestamp },
        };
        expect(() => ToolCallSchema.parse(toolCall)).not.toThrow();
      });
    });

    it("should validate contextId format", () => {
      const invalidContextIds = ["", "a".repeat(256)];

      invalidContextIds.forEach((contextId) => {
        const invalidToolCall = {
          id: "call_123",
          name: "test_tool",
          parameters: {},
          metadata: { contextId },
        };
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      });
    });

    it("should reject extra metadata fields", () => {
      const invalidToolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: {},
        metadata: {
          providerId: "openai",
          extraField: "not_allowed",
        },
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
    });
  });

  describe("Schema Structure Validation", () => {
    it("should reject missing required fields", () => {
      const invalidToolCalls = [
        { name: "test_tool", parameters: {} }, // missing id
        { id: "call_123", parameters: {} }, // missing name
        { id: "call_123", name: "test_tool" }, // missing parameters
      ];

      invalidToolCalls.forEach((invalidToolCall) => {
        expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
      });
    });

    it("should reject extra top-level fields", () => {
      const invalidToolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: {},
        extraField: "not_allowed",
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);
    });
  });

  describe("Type Inference", () => {
    it("should infer correct TypeScript types", () => {
      const validToolCall = {
        id: "call_123",
        name: "test_tool",
        parameters: { test: "value" },
        metadata: {
          providerId: "openai",
          timestamp: "2024-01-15T10:30:00.000Z",
          contextId: "context_456",
        },
      };

      const result = ToolCallSchema.parse(validToolCall);

      // Type assertions to verify TypeScript inference
      const typedResult: ToolCall = result;
      expect(typedResult.id).toBe("call_123");
      expect(typedResult.name).toBe("test_tool");
      expect(typedResult.parameters).toEqual({ test: "value" });
      expect(typedResult.metadata?.providerId).toBe("openai");
    });
  });

  describe("Error Messages", () => {
    it("should provide clear error messages for validation failures", () => {
      const invalidToolCall = {
        id: "",
        name: "invalid@name",
        parameters: "not_an_object",
        metadata: {
          providerId: "invalid provider",
          timestamp: "invalid_timestamp",
          contextId: "",
        },
      };

      expect(() => ToolCallSchema.parse(invalidToolCall)).toThrow(ZodError);

      try {
        ToolCallSchema.parse(invalidToolCall);
      } catch (error) {
        if (error instanceof ZodError) {
          const errorMessages = error.errors.map((e) => e.message);
          expect(errorMessages).toContain("Tool call ID cannot be empty");
          expect(errorMessages).toContain(
            "Tool name must contain only alphanumeric characters, underscores, and hyphens",
          );
        }
      }
    });
  });
});
