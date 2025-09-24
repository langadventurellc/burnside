import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import type { Message } from "../../../core/messages/message";
import { createTestClient } from "../shared/xaiModelHelpers";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract xAI models from default models data
const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
const xaiModels =
  xaiProvider?.models.map((model) => ({
    id: `xai:${model.id}`,
    name: model.name,
  })) || [];

// Helper to create multi-message conversations
function createConversation(texts: string[]): Message[] {
  return texts.map((text, index) => ({
    id: `test-msg-${Date.now()}-${index}`,
    role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: [{ type: "text", text }],
    timestamp: new Date().toISOString(),
  }));
}

describe("xAI Chat Completion E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadXaiTestConfig(); // Validate environment configuration
    client = createTestClient();
    testModel = getXaiTestModel();
  });

  describe("Basic Chat Functionality", () => {
    // Parameterized test for all xAI models
    test.each(xaiModels)(
      "should complete simple chat request with $name ($id)",
      async ({ id: modelId }) => {
        const messages = createTestMessages("Say hello.");

        const response = await withTimeout(
          client.chat({ messages, model: modelId }),
          15000,
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
      },
    );

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
      const firstMessages = createTestMessages("Say hello.");

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
      const messages = createTestMessages("Say hello..");

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
      const messages = createTestMessages("Say hello.");

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
      const messages = createTestMessages("Say hello.");

      // Use default model from getXaiTestModel()
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

      const messages = createTestMessages("Say hello.");

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
          xai: {
            default: { apiKey: "invalid-key" },
          },
        },
      });

      const messages = createTestMessages("Say hello.");

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
      const messages = createTestMessages("Say hello.");

      // Test with very short timeout to trigger timeout error
      await expect(
        withTimeout(
          client.chat({ messages, model: testModel }),
          1, // 1ms timeout should fail
        ),
      ).rejects.toThrow("Operation timed out after 1ms");
    });
  });
});
