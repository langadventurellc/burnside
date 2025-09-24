/**
 * ToolResult Schema Tests
 *
 * Comprehensive test suite for ToolResult Zod schema validation covering
 * discriminated union behavior, success/error state exclusivity, and all
 * validation rules and edge cases.
 */

import { describe, it, expect } from "@jest/globals";
import { ZodError } from "zod";
import { ToolResultSchema } from "../toolResultSchema";

describe("ToolResultSchema", () => {
  describe("Success Results", () => {
    it("should validate minimal success result", () => {
      const successResult = {
        callId: "call_abc123",
        success: true,
      };

      const result = ToolResultSchema.parse(successResult);
      expect(result).toEqual(successResult);
      expect(result.success).toBe(true);
    });

    it("should validate success result with data", () => {
      const successResult = {
        callId: "call_abc123",
        success: true,
        data: { sum: 8, operation: "addition" },
      };

      const result = ToolResultSchema.parse(successResult);
      expect(result).toEqual(successResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sum: 8, operation: "addition" });
      }
    });

    it("should validate success result with metadata", () => {
      const successResult = {
        callId: "call_abc123",
        success: true,
        data: "Hello, World!",
        metadata: {
          executionTime: 150,
          memoryUsage: 1024,
          retryCount: 0,
        },
      };

      const result = ToolResultSchema.parse(successResult);
      expect(result).toEqual(successResult);
      expect(result.metadata?.executionTime).toBe(150);
    });

    it("should validate success result with complex data types", () => {
      const successResult = {
        callId: "call_abc123",
        success: true,
        data: {
          results: [1, 2, 3],
          metadata: { processed: true },
          callback: null,
          nested: { deep: { value: "test" } },
        },
      };

      const result = ToolResultSchema.parse(successResult);
      expect(result).toEqual(successResult);
    });

    it("should reject success result with error field", () => {
      const invalidResult = {
        callId: "call_abc123",
        success: true,
        data: "success data",
        error: {
          code: "should_not_exist",
          message: "This should not be allowed",
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        /Unrecognized key/,
      );
    });
  });

  describe("Error Results", () => {
    it("should validate minimal error result", () => {
      const errorResult = {
        callId: "call_abc123",
        success: false,
        error: {
          code: "execution_error",
          message: "Tool execution failed",
        },
      };

      const result = ToolResultSchema.parse(errorResult);
      expect(result).toEqual(errorResult);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe("execution_error");
      }
    });

    it("should validate error result with details", () => {
      const errorResult = {
        callId: "call_abc123",
        success: false,
        error: {
          code: "validation_error",
          message: "Parameter validation failed",
          details: {
            field: "input",
            expected: "number",
            received: "string",
          },
        },
      };

      const result = ToolResultSchema.parse(errorResult);
      expect(result).toEqual(errorResult);
      if (!result.success) {
        expect(result.error?.details).toEqual({
          field: "input",
          expected: "number",
          received: "string",
        });
      }
    });

    it("should validate error result with metadata", () => {
      const errorResult = {
        callId: "call_abc123",
        success: false,
        error: {
          code: "timeout_error",
          message: "Tool execution timed out",
        },
        metadata: {
          executionTime: 5000,
          retryCount: 3,
        },
      };

      const result = ToolResultSchema.parse(errorResult);
      expect(result).toEqual(errorResult);
      expect(result.metadata?.retryCount).toBe(3);
    });

    it("should reject error result with data field", () => {
      const invalidResult = {
        callId: "call_abc123",
        success: false,
        data: "should not exist",
        error: {
          code: "execution_error",
          message: "Tool execution failed",
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        /Unrecognized key/,
      );
    });
  });

  describe("Call ID Validation", () => {
    it("should reject empty call ID", () => {
      const invalidResult = {
        callId: "",
        success: true,
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        "Call ID cannot be empty",
      );
    });

    it("should reject excessively long call ID", () => {
      const invalidResult = {
        callId: "a".repeat(256),
        success: true,
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        "Call ID cannot exceed 255 characters",
      );
    });

    it("should accept valid call IDs", () => {
      const validCallIds = [
        "call_123",
        "tool-result-456",
        "tr_abc_def_789",
        "a".repeat(255),
      ];

      validCallIds.forEach((callId) => {
        const result = {
          callId,
          success: true,
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });
  });

  describe("Error Schema Validation", () => {
    it("should reject empty error code", () => {
      const invalidResult = {
        callId: "call_123",
        success: false,
        error: {
          code: "",
          message: "Error message",
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        "Error code cannot be empty",
      );
    });

    it("should reject invalid error code format", () => {
      const invalidCodes = [
        "Error Code",
        "error@code",
        "error/code",
        "ERROR_CODE",
      ];

      invalidCodes.forEach((code) => {
        const invalidResult = {
          callId: "call_123",
          success: false,
          error: {
            code,
            message: "Error message",
          },
        };
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
          "Error code must contain only lowercase letters, numbers, underscores, and hyphens",
        );
      });
    });

    it("should accept valid error codes", () => {
      const validCodes = [
        "validation_error",
        "execution-error",
        "timeout_error",
        "network-failure",
        "error123",
      ];

      validCodes.forEach((code) => {
        const result = {
          callId: "call_123",
          success: false,
          error: {
            code,
            message: "Error message",
          },
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });

    it("should reject empty error message", () => {
      const invalidResult = {
        callId: "call_123",
        success: false,
        error: {
          code: "validation_error",
          message: "",
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        "Error message cannot be empty",
      );
    });

    it("should reject excessively long error message", () => {
      const invalidResult = {
        callId: "call_123",
        success: false,
        error: {
          code: "validation_error",
          message: "a".repeat(1001),
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        "Error message cannot exceed 1000 characters",
      );
    });

    it("should accept various error detail types", () => {
      const errorDetails = [
        null,
        undefined,
        "string detail",
        { field: "input", type: "validation" },
        [1, 2, 3],
        { nested: { deep: { error: "info" } } },
      ];

      errorDetails.forEach((details) => {
        const result = {
          callId: "call_123",
          success: false,
          error: {
            code: "validation_error",
            message: "Error message",
            details,
          },
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });
  });

  describe("Metadata Validation", () => {
    it("should validate execution time constraints", () => {
      const invalidExecutionTimes = [-1, 3600001, 1.5];

      invalidExecutionTimes.forEach((executionTime) => {
        const invalidResult = {
          callId: "call_123",
          success: true,
          metadata: { executionTime },
        };
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      });
    });

    it("should accept valid execution times", () => {
      const validExecutionTimes = [0, 1, 1000, 3600000];

      validExecutionTimes.forEach((executionTime) => {
        const result = {
          callId: "call_123",
          success: true,
          metadata: { executionTime },
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });

    it("should validate memory usage constraints", () => {
      const invalidMemoryUsages = [-1, 1073741825, 1.5];

      invalidMemoryUsages.forEach((memoryUsage) => {
        const invalidResult = {
          callId: "call_123",
          success: true,
          metadata: { memoryUsage },
        };
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      });
    });

    it("should accept valid memory usage values", () => {
      const validMemoryUsages = [0, 1024, 1048576, 1073741824];

      validMemoryUsages.forEach((memoryUsage) => {
        const result = {
          callId: "call_123",
          success: true,
          metadata: { memoryUsage },
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });

    it("should validate retry count constraints", () => {
      const invalidRetryCounts = [-1, 11, 1.5];

      invalidRetryCounts.forEach((retryCount) => {
        const invalidResult = {
          callId: "call_123",
          success: true,
          metadata: { retryCount },
        };
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      });
    });

    it("should accept valid retry counts", () => {
      const validRetryCounts = [0, 1, 5, 10];

      validRetryCounts.forEach((retryCount) => {
        const result = {
          callId: "call_123",
          success: true,
          metadata: { retryCount },
        };
        expect(() => ToolResultSchema.parse(result)).not.toThrow();
      });
    });

    it("should reject extra metadata fields", () => {
      const invalidResult = {
        callId: "call_123",
        success: true,
        metadata: {
          executionTime: 100,
          extraField: "not_allowed",
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
    });
  });

  describe("Discriminated Union Behavior", () => {
    it("should properly discriminate on success field", () => {
      const successResult = ToolResultSchema.parse({
        callId: "call_123",
        success: true,
        data: "success data",
      });

      const errorResult = ToolResultSchema.parse({
        callId: "call_123",
        success: false,
        error: {
          code: "test_error",
          message: "Test error message",
        },
      });

      expect(successResult.success).toBe(true);
      expect("data" in successResult).toBe(true);
      expect("error" in successResult).toBe(false);

      expect(errorResult.success).toBe(false);
      expect("error" in errorResult).toBe(true);
      expect("data" in errorResult).toBe(false);
    });

    it("should reject invalid success values", () => {
      const invalidSuccessValues = ["true", "false", 1, 0, null, undefined];

      invalidSuccessValues.forEach((success) => {
        const invalidResult = {
          callId: "call_123",
          success: success as any,
        };
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      });
    });
  });

  describe("Schema Structure Validation", () => {
    it("should reject missing required fields", () => {
      const invalidResults = [
        { success: true }, // missing callId
        { callId: "call_123" }, // missing success
        { callId: "call_123", success: false }, // missing error for failure
      ];

      invalidResults.forEach((invalidResult) => {
        expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      });
    });

    it("should reject extra top-level fields", () => {
      const invalidResult = {
        callId: "call_123",
        success: true,
        extraField: "not_allowed",
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
    });
  });

  describe("Error Messages", () => {
    it("should provide clear error messages for discriminated union failures", () => {
      const invalidResult = {
        callId: "call_123",
        success: "invalid" as any,
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);
      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(
        /No matching discriminator/,
      );
    });

    it("should provide detailed validation error messages", () => {
      const invalidResult = {
        callId: "",
        success: false,
        error: {
          code: "INVALID_CODE",
          message: "",
        },
        metadata: {
          executionTime: -1,
          memoryUsage: 1073741825,
          retryCount: 11,
        },
      };

      expect(() => ToolResultSchema.parse(invalidResult)).toThrow(ZodError);

      try {
        ToolResultSchema.parse(invalidResult);
      } catch (error) {
        if (error instanceof ZodError) {
          const errorMessages = error.issues.map((issue) => issue.message);
          expect(errorMessages).toContain("Call ID cannot be empty");
          expect(errorMessages).toContain("Error message cannot be empty");
        }
      }
    });
  });
});
