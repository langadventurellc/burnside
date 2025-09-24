/**
 * Create Type Guard Tests
 *
 * Tests for the createTypeGuard utility function.
 */

import { z } from "zod";
import { createTypeGuard } from "../createTypeGuard";

describe("createTypeGuard", () => {
  describe("basic type guards", () => {
    it("should create type guard for string schema", () => {
      const stringSchema = z.string();
      const isString = createTypeGuard(stringSchema);

      expect(isString("hello")).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
    });

    it("should create type guard for number schema", () => {
      const numberSchema = z.number();
      const isNumber = createTypeGuard(numberSchema);

      expect(isNumber(42)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber("123")).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(null)).toBe(false);
    });

    it("should create type guard for boolean schema", () => {
      const booleanSchema = z.boolean();
      const isBoolean = createTypeGuard(booleanSchema);

      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean("true")).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
    });
  });

  describe("complex type guards", () => {
    it("should create type guard for object schema", () => {
      const userSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.email(),
      });

      const isUser = createTypeGuard(userSchema);

      const validUser = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const invalidUser = {
        name: "John Doe",
        age: "30", // Wrong type
        email: "john@example.com",
      };

      expect(isUser(validUser)).toBe(true);
      expect(isUser(invalidUser)).toBe(false);
      expect(isUser({})).toBe(false);
      expect(isUser(null)).toBe(false);
    });

    it("should create type guard for array schema", () => {
      const stringArraySchema = z.array(z.string());
      const isStringArray = createTypeGuard(stringArraySchema);

      expect(isStringArray(["a", "b", "c"])).toBe(true);
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(["a", 123, "c"])).toBe(false);
      expect(isStringArray("not an array")).toBe(false);
      expect(isStringArray(null)).toBe(false);
    });

    it("should create type guard for union schema", () => {
      const stringOrNumberSchema = z.union([z.string(), z.number()]);
      const isStringOrNumber = createTypeGuard(stringOrNumberSchema);

      expect(isStringOrNumber("hello")).toBe(true);
      expect(isStringOrNumber(42)).toBe(true);
      expect(isStringOrNumber(true)).toBe(false);
      expect(isStringOrNumber({})).toBe(false);
      expect(isStringOrNumber(null)).toBe(false);
    });

    it("should create type guard for optional schema", () => {
      const optionalStringSchema = z.string().optional();
      const isOptionalString = createTypeGuard(optionalStringSchema);

      expect(isOptionalString("hello")).toBe(true);
      expect(isOptionalString(undefined)).toBe(true);
      expect(isOptionalString(123)).toBe(false);
      expect(isOptionalString(null)).toBe(false);
    });

    it("should create type guard for nullable schema", () => {
      const nullableStringSchema = z.string().nullable();
      const isNullableString = createTypeGuard(nullableStringSchema);

      expect(isNullableString("hello")).toBe(true);
      expect(isNullableString(null)).toBe(true);
      expect(isNullableString(123)).toBe(false);
      expect(isNullableString(undefined)).toBe(false);
    });
  });

  describe("type narrowing", () => {
    it("should properly narrow types in conditional blocks", () => {
      const userSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const isUser = createTypeGuard(userSchema);

      function processValue(value: unknown): string {
        if (isUser(value)) {
          // TypeScript should know value is { name: string; age: number }
          return `User: ${value.name}, Age: ${value.age}`;
        }
        return "Not a user";
      }

      const validUser = { name: "John", age: 30 };
      const invalidValue = "not a user";

      expect(processValue(validUser)).toBe("User: John, Age: 30");
      expect(processValue(invalidValue)).toBe("Not a user");
    });
  });

  describe("performance", () => {
    it("should efficiently validate simple types", () => {
      const stringSchema = z.string();
      const isString = createTypeGuard(stringSchema);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        isString("test string");
      }
      const end = performance.now();

      // Should complete quickly (less than 100ms for 1000 validations)
      expect(end - start).toBeLessThan(100);
    });

    it("should handle multiple calls efficiently", () => {
      const objectSchema = z.object({
        id: z.number(),
        name: z.string(),
      });

      const isValidObject = createTypeGuard(objectSchema);

      const testCases = [
        { id: 1, name: "test" },
        { id: "invalid", name: "test" },
        { id: 2, name: "another" },
        "not an object",
        { id: 3, name: "third" },
      ];

      const results = testCases.map(isValidObject);
      expect(results).toEqual([true, false, true, false, true]);
    });
  });
});
