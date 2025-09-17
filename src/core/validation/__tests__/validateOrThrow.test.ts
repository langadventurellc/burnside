/**
 * Validate Or Throw Tests
 *
 * Tests for the validateOrThrow utility function.
 */

import { z } from "zod";
import { validateOrThrow } from "../validateOrThrow";
import { ValidationError } from "../../errors/validationError";

describe("validateOrThrow", () => {
  const stringSchema = z.string();
  const objectSchema = z.object({
    name: z.string(),
    age: z.number().positive(),
    email: z.string().email(),
  });

  describe("successful validation", () => {
    it("should return validated data for valid string input", () => {
      const result = validateOrThrow(stringSchema, "hello");
      expect(result).toBe("hello");
    });

    it("should return validated data for valid object input", () => {
      const input = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const result = validateOrThrow(objectSchema, input);
      expect(result).toEqual(input);
      expect(result.name).toBe("John Doe");
      expect(result.age).toBe(30);
    });

    it("should preserve type information", () => {
      const result = validateOrThrow(objectSchema, {
        name: "John",
        age: 25,
        email: "john@test.com",
      });

      // TypeScript should infer the correct type
      expect(typeof result.name).toBe("string");
      expect(typeof result.age).toBe("number");
      expect(typeof result.email).toBe("string");
    });
  });

  describe("failed validation", () => {
    it("should throw ValidationError for invalid input", () => {
      expect(() => {
        validateOrThrow(stringSchema, 123);
      }).toThrow(ValidationError);
    });

    it("should throw ValidationError with descriptive message", () => {
      try {
        validateOrThrow(stringSchema, 123);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          "Validation failed",
        );
      }
    });

    it("should include validation issues in error context", () => {
      try {
        validateOrThrow(objectSchema, { name: 123, age: -5 });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context).toBeDefined();
        expect(validationError.context?.issues).toBeDefined();
        expect(Array.isArray(validationError.context?.issues)).toBe(true);
      }
    });

    it("should include input context in error for debugging", () => {
      try {
        validateOrThrow(stringSchema, 123);
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context?.input).toBe(123);
      }
    });

    it("should handle object input in error context safely", () => {
      try {
        validateOrThrow(stringSchema, { complex: "object" });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.context?.input).toBe("[object]");
      }
    });
  });

  describe("validation options", () => {
    it("should respect errorPrefix option in error message", () => {
      try {
        validateOrThrow(stringSchema, 123, {
          errorPrefix: "Custom validation error",
        });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect((error as ValidationError).message).toContain(
          "Custom validation error",
        );
      }
    });

    it("should respect maxIssues option", () => {
      const input = {
        name: 123,
        age: "invalid",
        email: "also-invalid",
      };

      try {
        validateOrThrow(objectSchema, input, { maxIssues: 1 });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        const validationError = error as ValidationError;
        expect(Array.isArray(validationError.context?.issues)).toBe(true);
        expect((validationError.context?.issues as unknown[]).length).toBe(1);
      }
    });

    it("should respect includePath option", () => {
      try {
        validateOrThrow(objectSchema, { name: 123 }, { includePath: false });
        fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect((error as ValidationError).message).not.toContain("at name:");
      }
    });
  });

  describe("complex validation scenarios", () => {
    it("should handle nested object validation errors", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      expect(() => {
        validateOrThrow(nestedSchema, {
          user: {
            profile: {
              name: 123,
            },
          },
        });
      }).toThrow(ValidationError);
    });

    it("should handle array validation errors", () => {
      const arraySchema = z.array(z.string());

      expect(() => {
        validateOrThrow(arraySchema, ["valid", 123, "also valid"]);
      }).toThrow(ValidationError);
    });

    it("should work with custom Zod refinements", () => {
      const customSchema = z
        .string()
        .refine(
          (val) => val.length >= 5,
          "String must be at least 5 characters long",
        );

      expect(validateOrThrow(customSchema, "hello world")).toBe("hello world");

      expect(() => {
        validateOrThrow(customSchema, "hi");
      }).toThrow(ValidationError);
    });
  });
});
