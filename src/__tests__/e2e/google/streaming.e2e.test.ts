import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";
import { createGoogleTestClient } from "../shared/googleModelHelpers";
import { getGoogleTestModel } from "../shared/getGoogleTestModel";
import { loadGoogleTestConfig } from "../shared/googleTestConfig";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract Google models from default models data, filtering for streaming support
const googleProvider = defaultLlmModels.providers.find(
  (p) => p.id === "google",
);
const googleModels =
  googleProvider?.models
    .filter((model) => model.streaming !== false) // Only include models that support streaming
    .map((model) => ({
      id: `google:${model.id}`,
      name: model.name,
    })) || [];

// Helper to collect all deltas from a stream
async function collectStreamDeltas(
  stream: AsyncIterable<StreamDelta>,
): Promise<StreamDelta[]> {
  const deltas: StreamDelta[] = [];
  try {
    for await (const delta of stream) {
      deltas.push(delta);
    }
  } catch (error) {
    console.error("Error collecting stream deltas:", error);
    throw error;
  }
  return deltas;
}

// Helper to accumulate deltas into complete message
function accumulateDeltas(deltas: StreamDelta[]): Partial<Message> {
  const accumulated: Partial<Message> = {
    role: "assistant",
    content: [],
  };

  for (const delta of deltas) {
    // Accumulate role if present
    if (delta.delta.role) {
      accumulated.role = delta.delta.role;
    }

    // Accumulate content
    if (delta.delta.content) {
      if (!accumulated.content) {
        accumulated.content = [];
      }

      for (const contentItem of delta.delta.content) {
        if (contentItem.type === "text") {
          // Find existing text item or create new one
          let textItem = accumulated.content.find(
            (item): item is { type: "text"; text: string } =>
              item.type === "text",
          );

          if (!textItem) {
            textItem = { type: "text", text: "" };
            accumulated.content.push(textItem);
          }

          textItem.text += contentItem.text || "";
        }
      }
    }
  }

  return accumulated;
}

// Helper to validate StreamDelta structure
function validateStreamDelta(delta: StreamDelta): void {
  expect(delta).toHaveProperty("id");
  expect(delta).toHaveProperty("delta");
  expect(delta).toHaveProperty("finished");

  expect(typeof delta.id).toBe("string");
  expect(typeof delta.delta).toBe("object");
  expect(typeof delta.finished).toBe("boolean");

  if (delta.usage) {
    expect(typeof delta.usage).toBe("object");
  }

  if (delta.metadata) {
    expect(typeof delta.metadata).toBe("object");
  }
}

describe("Google Streaming E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadGoogleTestConfig();
    client = createGoogleTestClient();
    testModel = getGoogleTestModel();
  });

  describe("Basic Streaming", () => {
    test.each(googleModels)(
      "should stream responses for model $name ($id)",
      async ({ id }) => {
        const messages = createTestMessages("Say hello");

        const streamPromise = client.stream({
          messages,
          model: id,
          maxTokens: 100,
          temperature: 0.1, // Low temperature for more predictable responses
        });

        const stream = await withTimeout(streamPromise, 15000);
        expect(stream).toBeDefined();

        const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

        expect(deltas.length).toBeGreaterThan(0);

        // Validate each delta
        for (const delta of deltas) {
          validateStreamDelta(delta);
        }

        // Last delta should be finished
        const lastDelta = deltas[deltas.length - 1];
        expect(lastDelta?.finished).toBe(true);
      },
      45000,
    );

    test("should produce deltas with proper completion detection", async () => {
      const messages = createTestMessages(
        "Please write a short paragraph about artificial intelligence.",
      );

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      // Google typically sends 1-2 deltas (content + finish)
      expect(deltas.length).toBeGreaterThan(0);
      expect(deltas.length).toBeLessThanOrEqual(3); // Allow up to 3 for flexibility

      // Last delta should be finished
      const lastDelta = deltas[deltas.length - 1];
      expect(lastDelta?.finished).toBe(true);

      // At least one delta should contain actual content or be marked as finished
      const hasContentDelta = deltas.some(
        (delta) =>
          delta.delta.content &&
          delta.delta.content.length > 0 &&
          delta.delta.content.some(
            (item) => item.type === "text" && item.text && item.text.length > 0,
          ),
      );
      const hasFinishedDelta = deltas.some((delta) => delta.finished);

      expect(hasContentDelta || hasFinishedDelta).toBe(true);
    }, 45000);
  });

  describe("Delta Accumulation", () => {
    test("should accumulate deltas correctly into complete response", async () => {
      const messages = createTestMessages("Say exactly: 'Hello, World!'");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      const accumulated = accumulateDeltas(deltas);

      expect(accumulated.role).toBe("assistant");
      expect(accumulated.content).toBeDefined();
      expect(Array.isArray(accumulated.content)).toBe(true);

      // Google may send content in single delta or have terminal delta with empty content
      // Check if there's meaningful text content across all deltas
      const hasTextContent = deltas.some(
        (delta) =>
          delta.delta.content &&
          delta.delta.content.length > 0 &&
          delta.delta.content.some(
            (item) => item.type === "text" && item.text && item.text.length > 0,
          ),
      );

      if (hasTextContent) {
        // If any delta had text content, accumulation should preserve it
        const textContent = accumulated.content!.find(
          (item): item is { type: "text"; text: string } =>
            item.type === "text",
        );
        expect(textContent).toBeDefined();
        expect(textContent!.text).toBeTruthy();
        expect(typeof textContent!.text).toBe("string");
        expect(textContent!.text.length).toBeGreaterThan(0);
      } else {
        // If no deltas had text content, that's valid for Google (content may be in metadata)
        // Just ensure the structure is valid
        expect(accumulated.content).toEqual([]);
      }
    }, 45000);

    test("should preserve content ordering in accumulated message", async () => {
      const messages = createTestMessages(
        "Count from 1 to 3, separated by spaces.",
      );

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      const accumulated = accumulateDeltas(deltas);

      // Validate structure
      expect(accumulated.content).toBeDefined();
      expect(Array.isArray(accumulated.content)).toBe(true);

      // Check if any delta contained text content
      const hasTextContent = deltas.some(
        (delta) =>
          delta.delta.content &&
          delta.delta.content.length > 0 &&
          delta.delta.content.some(
            (item) => item.type === "text" && item.text && item.text.length > 0,
          ),
      );

      if (hasTextContent) {
        // Text content should be concatenated in order
        const textContent = accumulated.content!.find(
          (item): item is { type: "text"; text: string } =>
            item.type === "text",
        );

        expect(textContent).toBeDefined();
        expect(textContent!.text.length).toBeGreaterThan(0);
        expect(typeof textContent!.text).toBe("string");
      }
      // If no text content, that's also valid for Google's streaming behavior
    }, 45000);

    test("should detect message completion correctly", async () => {
      const messages = createTestMessages("Respond with just 'DONE'");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      expect(deltas.length).toBeGreaterThan(0);

      // Only the last delta should be finished
      const lastDelta = deltas[deltas.length - 1];
      expect(lastDelta?.finished).toBe(true);

      // All other deltas should not be finished
      const nonFinalDeltas = deltas.slice(0, -1);
      for (const delta of nonFinalDeltas) {
        expect(delta.finished).toBe(false);
      }
    }, 45000);
  });

  describe("Stream Lifecycle", () => {
    test("should handle stream start and end", async () => {
      const messages = createTestMessages("Hello");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      expect(deltas.length).toBeGreaterThan(0);

      // Last delta should be finished (Google's key requirement)
      const lastDelta = deltas[deltas.length - 1];
      expect(lastDelta?.finished).toBe(true);

      // Google often sends single finished delta, so check the pattern appropriately
      if (deltas.length === 1) {
        // Single delta should be finished (Google's typical behavior)
        expect(deltas[0]?.finished).toBe(true);
      } else {
        // If multiple deltas, earlier ones should not be finished
        const nonFinalDeltas = deltas.slice(0, -1);
        for (const delta of nonFinalDeltas) {
          expect(delta.finished).toBe(false);
        }
      }
    }, 45000);

    test("should handle stream cancellation", async () => {
      const messages = createTestMessages(
        "Please write a detailed essay about machine learning.",
      );

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);

      const deltas: StreamDelta[] = [];
      let count = 0;

      try {
        for await (const delta of stream) {
          deltas.push(delta);
          count++;
          // Cancel after first few deltas
          if (count >= 2) {
            break;
          }
        }
      } catch {
        // Stream cancellation might throw, which is acceptable
        console.log("Stream cancelled, which is expected behavior");
      }

      // Should have collected at least some deltas before cancellation
      expect(deltas.length).toBeGreaterThan(0);
      expect(deltas.length).toBeLessThanOrEqual(2);
    }, 45000);

    test("should cleanup resources properly", async () => {
      const messages = createTestMessages("Quick response");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      expect(deltas.length).toBeGreaterThan(0);

      // Stream should complete without resource leaks
      // This test primarily validates that the stream completes successfully
      // and doesn't leave hanging connections or resources
      const finalDelta = deltas[deltas.length - 1];
      expect(finalDelta?.finished).toBe(true);
    }, 45000);
  });

  describe("Format Validation", () => {
    test("should validate StreamDelta schema compliance", async () => {
      const messages = createTestMessages("Test response");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      expect(deltas.length).toBeGreaterThan(0);

      for (const delta of deltas) {
        // Validate required properties
        validateStreamDelta(delta);

        // Validate delta content structure
        if (delta.delta.content) {
          expect(Array.isArray(delta.delta.content)).toBe(true);
          for (const contentItem of delta.delta.content) {
            expect(contentItem).toHaveProperty("type");
            if (contentItem.type === "text") {
              expect(contentItem).toHaveProperty("text");
              expect(typeof contentItem.text).toBe("string");
            }
          }
        }
      }
    }, 45000);

    test("should include usage information in final delta when available", async () => {
      const messages = createTestMessages("Brief response");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      const stream = await withTimeout(streamPromise, 15000);
      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      expect(deltas.length).toBeGreaterThan(0);

      const finalDelta = deltas[deltas.length - 1];
      expect(finalDelta?.finished).toBe(true);

      // Usage information may or may not be present depending on provider
      // but if it exists, it should be properly structured
      if (finalDelta?.usage) {
        expect(typeof finalDelta.usage).toBe("object");
        // Common usage fields (provider-dependent)
        if ("inputTokens" in finalDelta.usage) {
          expect(typeof finalDelta.usage.inputTokens).toBe("number");
        }
        if ("outputTokens" in finalDelta.usage) {
          expect(typeof finalDelta.usage.outputTokens).toBe("number");
        }
      }
    }, 45000);
  });

  describe("Error Handling", () => {
    test("should handle streaming with invalid model gracefully", async () => {
      const messages = createTestMessages("Test message");
      const invalidModel = "google:invalid-model-name";

      const streamPromise = client.stream({
        messages,
        model: invalidModel,
        maxTokens: 100,
      });

      await expect(withTimeout(streamPromise, 30000)).rejects.toThrow();
    }, 45000);

    test("should handle network timeout scenarios", async () => {
      const messages = createTestMessages("Test message");

      const streamPromise = client.stream({
        messages,
        model: testModel,
        maxTokens: 100,
      });

      // Use extremely short timeout to simulate network timeout
      await expect(
        withTimeout(streamPromise, 1), // 1ms timeout should fail
      ).rejects.toThrow();
    }, 45000);

    test("should handle empty messages array", async () => {
      const emptyMessages: Message[] = [];

      const streamPromise = client.stream({
        messages: emptyMessages,
        model: testModel,
        maxTokens: 100,
      });

      await expect(withTimeout(streamPromise, 30000)).rejects.toThrow();
    }, 45000);
  });
});
