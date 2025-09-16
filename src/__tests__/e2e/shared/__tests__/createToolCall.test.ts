/**
 * Unit tests for createToolCall helper
 */

import { createToolCall } from "../createToolCall.js";

describe("createToolCall", () => {
  describe("basic functionality", () => {
    it("should create a ToolCall with expected structure", () => {
      const message = "test message";
      const toolCall = createToolCall(message);

      expect(toolCall).toMatchObject({
        id: expect.stringMatching(/^test_call_\d+$/),
        name: "e2e_echo_tool",
        parameters: { message: "test message" },
        metadata: {
          providerId: "test",
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
        },
      });
    });

    it("should use the provided message in parameters", () => {
      const testMessage = "Hello, World!";
      const toolCall = createToolCall(testMessage);

      expect(toolCall.parameters.message).toBe(testMessage);
    });

    it("should always use e2e_echo_tool as name", () => {
      const toolCall = createToolCall("any message");
      expect(toolCall.name).toBe("e2e_echo_tool");
    });

    it("should always use test as providerId", () => {
      const toolCall = createToolCall("any message");
      expect(toolCall.metadata?.providerId).toBe("test");
    });
  });

  describe("ID generation", () => {
    it("should generate unique IDs", () => {
      const toolCall1 = createToolCall("message 1");
      // Small delay to ensure different timestamps
      const start = Date.now();
      while (Date.now() === start) {
        // Wait for next millisecond
      }
      const toolCall2 = createToolCall("message 2");

      expect(toolCall1.id).not.toBe(toolCall2.id);
    });

    it("should have IDs starting with test_call_", () => {
      const toolCall = createToolCall("test");
      expect(toolCall.id).toMatch(/^test_call_/);
    });

    it("should have IDs ending with timestamp", () => {
      const toolCall = createToolCall("test");
      const idParts = toolCall.id.split("_");
      const timestamp = parseInt(idParts[2]);

      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should generate IDs close to current timestamp", () => {
      const beforeCall = Date.now();
      const toolCall = createToolCall("test");
      const afterCall = Date.now();

      const idTimestamp = parseInt(toolCall.id.split("_")[2]);
      expect(idTimestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(idTimestamp).toBeLessThanOrEqual(afterCall);
    });
  });

  describe("timestamp generation", () => {
    it("should generate valid ISO timestamps", () => {
      const toolCall = createToolCall("test");
      const timestamp = toolCall.metadata?.timestamp as string;

      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Should be a valid date
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);
    });

    it("should generate timestamps close to current time", () => {
      const beforeCall = new Date().toISOString();
      const toolCall = createToolCall("test");
      const afterCall = new Date().toISOString();

      const timestamp = toolCall.metadata?.timestamp as string;
      expect(timestamp >= beforeCall).toBe(true);
      expect(timestamp <= afterCall).toBe(true);
    });
  });

  describe("message handling", () => {
    it("should handle empty string messages", () => {
      const toolCall = createToolCall("");
      expect(toolCall.parameters.message).toBe("");
    });

    it("should handle long messages", () => {
      const longMessage = "a".repeat(10000);
      const toolCall = createToolCall(longMessage);
      expect(toolCall.parameters.message).toBe(longMessage);
    });

    it("should handle special characters", () => {
      const specialMessage = 'Hello "world"! 🚀\n\tSpecial chars: àáâ';
      const toolCall = createToolCall(specialMessage);
      expect(toolCall.parameters.message).toBe(specialMessage);
    });

    it("should handle unicode characters", () => {
      const unicodeMessage = "こんにちは 世界! 🌍";
      const toolCall = createToolCall(unicodeMessage);
      expect(toolCall.parameters.message).toBe(unicodeMessage);
    });

    it("should handle newlines and tabs", () => {
      const messageWithWhitespace = "Line 1\nLine 2\t\tTabbed";
      const toolCall = createToolCall(messageWithWhitespace);
      expect(toolCall.parameters.message).toBe(messageWithWhitespace);
    });
  });

  describe("metadata properties", () => {
    it("should include all expected metadata", () => {
      const toolCall = createToolCall("test");

      expect(toolCall.metadata).toBeDefined();
      expect(toolCall.metadata?.providerId).toBe("test");
      expect(toolCall.metadata?.timestamp).toBeDefined();
      expect(typeof toolCall.metadata?.timestamp).toBe("string");
    });

    it("should not include extra metadata", () => {
      const toolCall = createToolCall("test");
      const metadataKeys = Object.keys(toolCall.metadata || {});

      expect(metadataKeys).toEqual(["providerId", "timestamp"]);
    });
  });

  describe("parameters structure", () => {
    it("should only include message parameter", () => {
      const toolCall = createToolCall("test");
      const parameterKeys = Object.keys(toolCall.parameters);

      expect(parameterKeys).toEqual(["message"]);
    });

    it("should have parameters as an object", () => {
      const toolCall = createToolCall("test");

      expect(typeof toolCall.parameters).toBe("object");
      expect(toolCall.parameters).not.toBeNull();
      expect(Array.isArray(toolCall.parameters)).toBe(false);
    });
  });

  describe("consistency", () => {
    it("should create consistent structure across calls", () => {
      const toolCall1 = createToolCall("message 1");
      // Small delay to ensure different timestamps
      const start = Date.now();
      while (Date.now() === start) {
        // Wait for next millisecond
      }
      const toolCall2 = createToolCall("message 2");

      // Same structure, different values
      expect(Object.keys(toolCall1)).toEqual(Object.keys(toolCall2));
      expect(Object.keys(toolCall1.parameters)).toEqual(
        Object.keys(toolCall2.parameters),
      );
      expect(Object.keys(toolCall1.metadata || {})).toEqual(
        Object.keys(toolCall2.metadata || {}),
      );

      // Different IDs and messages
      expect(toolCall1.id).not.toBe(toolCall2.id);
      expect(toolCall1.parameters.message).not.toBe(
        toolCall2.parameters.message,
      );
    });

    it("should maintain same name and providerId across calls", () => {
      const toolCall1 = createToolCall("message 1");
      const toolCall2 = createToolCall("message 2");

      expect(toolCall1.name).toBe(toolCall2.name);
      expect(toolCall1.metadata?.providerId).toBe(
        toolCall2.metadata?.providerId,
      );
    });
  });

  describe("performance", () => {
    it("should create tool calls quickly", () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        createToolCall(`message ${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete 1000 calls in less than 100ms
    });
  });
});
