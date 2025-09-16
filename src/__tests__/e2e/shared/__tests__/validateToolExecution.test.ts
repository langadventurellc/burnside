/**
 * Unit tests for validateToolExecution helper
 */

import { validateToolExecution } from "../validateToolExecution.js";

describe("validateToolExecution", () => {
  describe("valid results", () => {
    it("should return true for valid test tool result", () => {
      const validResult = {
        echoed: "test message",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(validResult)).toBe(true);
    });

    it("should return true for result with extra properties", () => {
      const resultWithExtra = {
        echoed: "test message",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
        extraProperty: "should be ignored",
        metadata: { additional: "data" },
      };

      expect(validateToolExecution(resultWithExtra)).toBe(true);
    });

    it("should return true for empty string echoed value", () => {
      const result = {
        echoed: "",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(true);
    });

    it("should return true for any valid timestamp string", () => {
      const result = {
        echoed: "test",
        timestamp: "not-a-real-timestamp",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(true);
    });
  });

  describe("invalid results", () => {
    it("should return false for null", () => {
      expect(validateToolExecution(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(validateToolExecution(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(validateToolExecution("string")).toBe(false);
      expect(validateToolExecution(123)).toBe(false);
      expect(validateToolExecution(true)).toBe(false);
      expect(validateToolExecution([])).toBe(false);
    });

    it("should return false when testSuccess is missing", () => {
      const result = {
        echoed: "test message",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when testSuccess is false", () => {
      const result = {
        echoed: "test message",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: false,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when testSuccess is not boolean", () => {
      const result = {
        echoed: "test message",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: "true", // string instead of boolean
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when echoed is missing", () => {
      const result = {
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when echoed is not string", () => {
      const result = {
        echoed: 123, // number instead of string
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when timestamp is missing", () => {
      const result = {
        echoed: "test message",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when timestamp is not string", () => {
      const result = {
        echoed: "test message",
        timestamp: new Date(), // Date object instead of string
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false when all required fields are wrong types", () => {
      const result = {
        echoed: 123,
        timestamp: false,
        testSuccess: "true",
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should return false for empty object", () => {
      const result = {};

      expect(validateToolExecution(result)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle objects with null prototype", () => {
      const result = Object.create(null);
      result.echoed = "test";
      result.timestamp = "2024-01-01T00:00:00.000Z";
      result.testSuccess = true;

      expect(validateToolExecution(result)).toBe(true);
    });

    it("should handle objects with undefined values", () => {
      const result = {
        echoed: undefined,
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should handle objects with null values", () => {
      const result = {
        echoed: null,
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };

      expect(validateToolExecution(result)).toBe(false);
    });

    it("should not validate based on timestamp format", () => {
      const result = {
        echoed: "test",
        timestamp: "invalid-date-format",
        testSuccess: true,
      };

      // Should still be valid - we only check if it's a string
      expect(validateToolExecution(result)).toBe(true);
    });
  });

  describe("type safety", () => {
    it("should safely handle circular references", () => {
      const result: any = {
        echoed: "test",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
      };
      result.circular = result;

      expect(validateToolExecution(result)).toBe(true);
    });

    it("should handle nested objects", () => {
      const result = {
        echoed: "test",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
        nested: {
          deep: {
            property: "value",
          },
        },
      };

      expect(validateToolExecution(result)).toBe(true);
    });

    it("should handle functions in object", () => {
      const result = {
        echoed: "test",
        timestamp: "2024-01-01T00:00:00.000Z",
        testSuccess: true,
        someFunction: () => "hello",
      };

      expect(validateToolExecution(result)).toBe(true);
    });
  });
});
