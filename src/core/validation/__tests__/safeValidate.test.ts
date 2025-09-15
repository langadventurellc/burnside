/**
 * Safe Validate Tests
 *
 * Tests for the safeValidate utility function.
 */

import { z } from "zod";
import { safeValidate } from "../safeValidate.js";

describe("safeValidate", () => {
  const stringSchema = z.string();
  const objectSchema = z.object({
    name: z.string(),
    age: z.number().positive(),
    email: z.string().email(),
  });

  describe("successful validation", () => {
    it("should return success result for valid string input", () => {
      const result = safeValidate(stringSchema, "hello");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("hello");
      }
    });

    it("should return success result for valid object input", () => {
      const input = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const result = safeValidate(objectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
        expect(result.data.name).toBe("John Doe");
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe("failed validation", () => {
    it("should return error result for invalid string input", () => {
      const result = safeValidate(stringSchema, 123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Validation failed");
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].code).toBe(z.ZodIssueCode.invalid_type);
      }
    });

    it("should return error result for invalid object input", () => {
      const input = {
        name: "John Doe",
        age: -5, // Invalid: must be positive
        email: "invalid-email",
      };

      const result = safeValidate(objectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.message).toContain("Validation failed");
      }
    });

    it("should handle missing required fields", () => {
      const result = safeValidate(objectSchema, { name: "John" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        const issuePaths = result.error.issues.map((issue) =>
          issue.path.join("."),
        );
        expect(issuePaths).toContain("age");
        expect(issuePaths).toContain("email");
      }
    });
  });

  describe("validation options", () => {
    it("should respect maxIssues option", () => {
      const input = {
        name: 123, // Invalid type
        age: "not a number", // Invalid type
        email: "invalid-email", // Invalid format
      };

      const result = safeValidate(objectSchema, input, { maxIssues: 2 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });

    it("should respect includePath option", () => {
      const result = safeValidate(
        objectSchema,
        { name: 123 },
        { includePath: false },
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).not.toContain("at name:");
      }
    });

    it("should respect errorPrefix option", () => {
      const result = safeValidate(stringSchema, 123, {
        errorPrefix: "Custom error",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Custom error:");
      }
    });
  });

  describe("complex schemas", () => {
    it("should handle nested object schemas", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            settings: z.object({
              theme: z.enum(["light", "dark"]),
            }),
          }),
        }),
      });

      const validInput = {
        user: {
          profile: {
            name: "John",
            settings: {
              theme: "dark" as const,
            },
          },
        },
      };

      const result = safeValidate(nestedSchema, validInput);
      expect(result.success).toBe(true);
    });

    it("should handle array schemas", () => {
      const arraySchema = z.array(z.string());

      const result = safeValidate(arraySchema, ["a", "b", "c"]);
      expect(result.success).toBe(true);

      const invalidResult = safeValidate(arraySchema, ["a", 123, "c"]);
      expect(invalidResult.success).toBe(false);
    });

    it("should handle union schemas", () => {
      const unionSchema = z.union([z.string(), z.number()]);

      expect(safeValidate(unionSchema, "hello").success).toBe(true);
      expect(safeValidate(unionSchema, 42).success).toBe(true);
      expect(safeValidate(unionSchema, true).success).toBe(false);
    });
  });
});
