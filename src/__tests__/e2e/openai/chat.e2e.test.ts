import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { Message } from "../../../core/messages/message.js";
import { createTestClient } from "../shared/modelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getTestModel } from "../shared/getTestModel.js";
import { loadTestConfig } from "../shared/testConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";

// Helper to create multi-message conversations
function createConversation(texts: string[]): Message[] {
  return texts.map((text, index) => ({
    id: `test-msg-${Date.now()}-${index}`,
    role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: [{ type: "text", text }],
    timestamp: new Date().toISOString(),
  }));
}

describe("OpenAI Chat Completion E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadTestConfig(); // Validate environment configuration
    client = createTestClient();
    testModel = getTestModel();
    ensureModelRegistered(client, testModel);
  });

  describe("Basic Chat Functionality", () => {
    test("should complete simple chat request", async () => {
      const messages = createTestMessages("What is 2 + 2?");

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      expect(response).toBeDefined();
      expect(validateMessageSchema(response)).toBe(true);
      expect(response.role).toBe("assistant");
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe("text");
      if (response.content[0].type === "text") {
        expect(typeof response.content[0].text).toBe("string");
        expect(response.content[0].text.length).toBeGreaterThan(0);
      }
      expect(response.timestamp).toBeDefined();
      expect(response.id).toBeDefined();
    });

    test("should handle conversation context", async () => {
      const messages = createConversation([
        "My name is Alice.",
        "Hello Alice! Nice to meet you.",
        "What is my name?",
      ]);

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      expect(response).toBeDefined();
      expect(validateMessageSchema(response)).toBe(true);
      expect(response.role).toBe("assistant");
      if (response.content[0].type === "text") {
        expect(response.content[0].text.toLowerCase()).toContain("alice");
      }
    });

    test("should handle multiple consecutive requests", async () => {
      const firstMessages = createTestMessages("Count to 3.");

      const firstResponse = await withTimeout(
        client.chat({ messages: firstMessages, model: testModel }),
        30000,
      );

      expect(validateMessageSchema(firstResponse)).toBe(true);
      expect(firstResponse.role).toBe("assistant");

      const secondMessages = createTestMessages("What color is the sky?");

      const secondResponse = await withTimeout(
        client.chat({ messages: secondMessages, model: testModel }),
        30000,
      );

      expect(validateMessageSchema(secondResponse)).toBe(true);
      expect(secondResponse.role).toBe("assistant");
      if (firstResponse.id && secondResponse.id) {
        expect(secondResponse.id).not.toBe(firstResponse.id);
      }
    });
  });

  describe("Response Validation", () => {
    test("should return unified message schema", async () => {
      const messages = createTestMessages("Say hello.");

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      // Validate Message structure
      if (response.id) {
        expect(typeof response.id).toBe("string");
        expect(response.id.length).toBeGreaterThan(0);
      }
      expect(response.role).toBe("assistant");
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      if (response.timestamp) {
        expect(typeof response.timestamp).toBe("string");
        expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
      }

      // Validate ContentPart structure
      const contentPart = response.content[0];
      expect(contentPart.type).toBe("text");
      if (contentPart.type === "text") {
        expect(typeof contentPart.text).toBe("string");
        expect(contentPart.text.length).toBeGreaterThan(0);
      }
    });

    test("should include proper metadata", async () => {
      const messages = createTestMessages("Brief response please.");

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      expect(response.metadata).toBeDefined();
      expect(typeof response.metadata).toBe("object");
      // Metadata should contain provider-specific information
      expect(response.metadata).toHaveProperty("provider");
    });

    test("should have valid timestamp format", async () => {
      const messages = createTestMessages("Quick test.");

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      // Validate ISO string format
      if (response.timestamp) {
        const timestamp = new Date(response.timestamp);
        expect(timestamp.toISOString()).toBe(response.timestamp);
        expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
      }
    });
  });

  describe("Model Integration", () => {
    test("should work with default model", async () => {
      const messages = createTestMessages("Testing default model.");

      // Use default model from getTestModel()
      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      expect(validateMessageSchema(response)).toBe(true);
      expect(response.role).toBe("assistant");
    });

    test("should handle model registry integration", async () => {
      // Verify model is registered
      const modelRegistry = client.getModelRegistry();
      const registeredModel = modelRegistry.get(testModel);

      expect(registeredModel).toBeDefined();
      expect(registeredModel?.id).toBe(testModel);

      const messages = createTestMessages("Test registry integration.");

      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );

      expect(validateMessageSchema(response)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle authentication errors", async () => {
      // Create client with invalid API key
      const invalidClient = createTestClient({
        providers: {
          openai: { apiKey: "invalid-key" },
        },
      });

      const messages = createTestMessages("This should fail.");

      await expect(
        withTimeout(invalidClient.chat({ messages, model: testModel }), 30000),
      ).rejects.toThrow();
    });

    test("should handle invalid model requests", async () => {
      const messages = createTestMessages("Test invalid model.");

      await expect(
        withTimeout(client.chat({ messages, model: "invalid:model" }), 30000),
      ).rejects.toThrow();
    });

    test("should handle malformed requests", async () => {
      // Empty messages array should be handled gracefully
      await expect(
        withTimeout(client.chat({ messages: [], model: testModel }), 30000),
      ).rejects.toThrow();
    });

    test("should handle network timeouts gracefully", async () => {
      const messages = createTestMessages("Test timeout handling.");

      // Test with very short timeout to trigger timeout error
      await expect(
        withTimeout(
          client.chat({ messages, model: testModel }),
          1, // 1ms timeout should fail
        ),
      ).rejects.toThrow("Operation timed out after 1ms");
    });
  });

  describe("Performance Validation", () => {
    test("should complete within reasonable time", async () => {
      const messages = createTestMessages("Quick response test.");

      const startTime = Date.now();
      const response = await withTimeout(
        client.chat({ messages, model: testModel }),
        30000,
      );
      const endTime = Date.now();

      expect(validateMessageSchema(response)).toBe(true);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30s
    });

    test("should handle concurrent requests", async () => {
      const messages1 = createTestMessages("Concurrent test 1.");
      const messages2 = createTestMessages("Concurrent test 2.");

      const [response1, response2] = await Promise.all([
        withTimeout(
          client.chat({ messages: messages1, model: testModel }),
          30000,
        ),
        withTimeout(
          client.chat({ messages: messages2, model: testModel }),
          30000,
        ),
      ]);

      expect(validateMessageSchema(response1)).toBe(true);
      expect(validateMessageSchema(response2)).toBe(true);
      if (response1.id && response2.id) {
        expect(response2.id).not.toBe(response1.id);
      }
    });
  });
});
