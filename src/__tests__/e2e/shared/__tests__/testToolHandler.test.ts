/**
 * Unit tests for testToolHandler helper
 */

import { testToolHandler } from "../testToolHandler";

describe("testToolHandler", () => {
  const mockContext = {}; // Mock execution context

  describe("successful execution", () => {
    it("should return expected result structure", async () => {
      const parameters = { message: "test message" };
      const result = await testToolHandler(parameters, mockContext);

      expect(result).toMatchObject({
        echoed: "test message",
        timestamp: expect.any(String),
        testSuccess: true,
      });
    });

    it("should echo the provided message", async () => {
      const testMessage = "Hello, World!";
      const parameters = { message: testMessage };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe(testMessage);
    });

    it("should always return testSuccess as true", async () => {
      const parameters = { message: "any message" };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.testSuccess).toBe(true);
    });

    it("should return valid ISO timestamp", async () => {
      const parameters = { message: "test" };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      const timestamp = result.timestamp as string;
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Should be a valid date
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);
    });

    it("should handle special characters in message", async () => {
      const specialMessage = 'Hello "world"! 🚀\n\tSpecial chars: àáâ';
      const parameters = { message: specialMessage };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe(specialMessage);
      expect(result.testSuccess).toBe(true);
    });

    it("should handle empty string message", async () => {
      const parameters = { message: "" };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe("");
      expect(result.testSuccess).toBe(true);
    });

    it("should handle very long messages", async () => {
      const longMessage = "a".repeat(10000);
      const parameters = { message: longMessage };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe(longMessage);
      expect(result.testSuccess).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should throw error when message parameter is missing", async () => {
      const parameters = {};

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });

    it("should throw error when message is not a string", async () => {
      const parameters = { message: 123 };

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });

    it("should throw error when message is null", async () => {
      const parameters = { message: null };

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });

    it("should throw error when message is undefined", async () => {
      const parameters = { message: undefined };

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });

    it("should throw error when message is an object", async () => {
      const parameters = { message: { text: "hello" } };

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });

    it("should throw error when message is an array", async () => {
      const parameters = { message: ["hello", "world"] };

      await expect(testToolHandler(parameters, mockContext)).rejects.toThrow(
        "Test tool requires 'message' parameter of type string",
      );
    });
  });

  describe("parameter handling", () => {
    it("should ignore extra parameters", async () => {
      const parameters = {
        message: "test",
        extraParam: "ignored",
        anotherParam: 123,
      };

      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe("test");
      expect(result.testSuccess).toBe(true);
      expect(result).not.toHaveProperty("extraParam");
      expect(result).not.toHaveProperty("anotherParam");
    });

    it("should handle parameters with message as only property", async () => {
      const parameters = { message: "only message" };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;

      expect(result.echoed).toBe("only message");
      expect(result.testSuccess).toBe(true);
    });
  });

  describe("timing", () => {
    it("should complete within reasonable time", async () => {
      const start = Date.now();
      const parameters = { message: "timing test" };

      await testToolHandler(parameters, mockContext);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it("should generate timestamps close to current time", async () => {
      const beforeCall = new Date().toISOString();
      const parameters = { message: "timestamp test" };
      const result = (await testToolHandler(parameters, mockContext)) as Record<
        string,
        unknown
      >;
      const afterCall = new Date().toISOString();

      const resultTimestamp = result.timestamp as string;
      expect(resultTimestamp >= beforeCall).toBe(true);
      expect(resultTimestamp <= afterCall).toBe(true);
    });
  });
});
