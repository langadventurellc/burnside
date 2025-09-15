/**
 * ValidationResult Type Tests
 *
 * Tests for the ValidationResult type and its usage patterns.
 */

import { z } from "zod";
import type { ValidationResult } from "../validationResult.js";

describe("ValidationResult", () => {
  describe("success result", () => {
    it("should have correct structure for success case", () => {
      const result: ValidationResult<string> = {
        success: true,
        data: "test data",
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test data");
        expect(typeof result.data).toBe("string");
      }
    });

    it("should work with complex data types", () => {
      interface TestData {
        id: number;
        name: string;
        tags: string[];
      }

      const testData: TestData = {
        id: 1,
        name: "Test",
        tags: ["tag1", "tag2"],
      };

      const result: ValidationResult<TestData> = {
        success: true,
        data: testData,
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(testData);
        expect(result.data.id).toBe(1);
        expect(result.data.tags).toHaveLength(2);
      }
    });
  });

  describe("error result", () => {
    it("should have correct structure for error case", () => {
      const issues: z.ZodIssue[] = [
        {
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
      ];

      const result: ValidationResult<string> = {
        success: false,
        error: {
          message: "Validation failed: Expected string, received number",
          issues,
        },
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Validation failed");
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].code).toBe(z.ZodIssueCode.invalid_type);
      }
    });

    it("should handle multiple validation issues", () => {
      const issues: z.ZodIssue[] = [
        {
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
        {
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          path: ["email"],
          message: "String must contain at least 1 character(s)",
        },
      ];

      const result: ValidationResult<Record<string, unknown>> = {
        success: false,
        error: {
          message: "Multiple validation errors",
          issues,
        },
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
        expect(result.error.issues[0].path).toEqual(["name"]);
        expect(result.error.issues[1].path).toEqual(["email"]);
      }
    });
  });

  describe("type discrimination", () => {
    it("should properly discriminate between success and error cases", () => {
      function processResult(result: ValidationResult<string>): string {
        if (result.success) {
          // TypeScript should know this is the success case
          return result.data.toUpperCase();
        } else {
          // TypeScript should know this is the error case
          return `Error: ${result.error.message}`;
        }
      }

      const successResult: ValidationResult<string> = {
        success: true,
        data: "hello",
      };

      const errorResult: ValidationResult<string> = {
        success: false,
        error: {
          message: "Validation failed",
          issues: [],
        },
      };

      expect(processResult(successResult)).toBe("HELLO");
      expect(processResult(errorResult)).toBe("Error: Validation failed");
    });
  });
});
