import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import type { Message } from "../../../core/messages/message.js";
import { createTestClient } from "../shared/openAIModelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getTestModel } from "../shared/getTestModel.js";
import { loadTestConfig } from "../shared/openAITestConfig.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

// Extract OpenAI models from default models data, filtering for streaming support
const openaiProvider = defaultLlmModels.providers.find(
  (p) => p.id === "openai",
);
const openaiModels =
  openaiProvider?.models
    .filter((model) => model.streaming !== false) // Only include models that support streaming
    .map((model) => ({
      id: `openai:${model.id}`,
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
  expect(delta.id.length).toBeGreaterThan(0);
}

describe("OpenAI Streaming E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadTestConfig(); // Validate environment configuration
    client = createTestClient();
    testModel = getTestModel();
    ensureModelRegistered(client, testModel);
  });

  describe("Basic Streaming", () => {
    test.each(openaiModels)(
      "should stream chat completion deltas with $name ($id)",
      async ({ id: modelId }) => {
        // Ensure the model is registered
        ensureModelRegistered(client, modelId);

        const messages = createTestMessages("Hello! Please respond briefly.");

        const streamPromise = client.stream({
          model: modelId,
          messages,
          temperature: 0.1, // Low temperature for more predictable responses
        });

        const stream = await withTimeout(streamPromise, 15000);
        expect(stream).toBeDefined();

        const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

        // Basic stream validation
        expect(deltas.length).toBeGreaterThan(0);

        // Validate each delta structure
        deltas.forEach(validateStreamDelta);

        // Check that final delta is marked as finished
        const finalDelta = deltas[deltas.length - 1];
        expect(finalDelta.finished).toBe(true);

        // Ensure we have at least some content
        const hasContent = deltas.some(
          (delta) => delta.delta.content && delta.delta.content.length > 0,
        );
        expect(hasContent).toBe(true);
      },
      45000, // Extended timeout for streaming
    );

    test("should produce multiple deltas before completion", async () => {
      const messages = createTestMessages(
        "Please write a short paragraph about artificial intelligence.",
      );

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
          temperature: 0.1,
        }),
        15000,
      );

      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

      // Should have multiple deltas for a paragraph response
      expect(deltas.length).toBeGreaterThan(1);

      // Not all deltas should be finished (only the last one)
      const finishedCount = deltas.filter((delta) => delta.finished).length;
      expect(finishedCount).toBe(1); // Only the last delta should be finished
    });
  });

  describe("Delta Accumulation", () => {
    test("should accumulate deltas correctly into complete response", async () => {
      const messages = createTestMessages("Say exactly: 'Hello, World!'");

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
          temperature: 0, // Deterministic for exact text
        }),
        15000,
      );

      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);
      const accumulated = accumulateDeltas(deltas);

      // Should have assistant role
      expect(accumulated.role).toBe("assistant");

      // Should have content
      expect(accumulated.content).toBeDefined();
      expect(Array.isArray(accumulated.content)).toBe(true);
      expect(accumulated.content!.length).toBeGreaterThan(0);

      // Should have text content
      const textContent = accumulated.content!.find(
        (item): item is { type: "text"; text: string } => item.type === "text",
      );
      expect(textContent).toBeDefined();
      expect(textContent!.text.trim().length).toBeGreaterThan(0);
    });

    test("should preserve content ordering in accumulated message", async () => {
      const messages = createTestMessages(
        "Count from 1 to 3, separated by spaces.",
      );

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
          temperature: 0,
        }),
        15000,
      );

      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);
      const accumulated = accumulateDeltas(deltas);

      const textContent = accumulated.content!.find(
        (item): item is { type: "text"; text: string } => item.type === "text",
      );

      // Should contain ordered numbers
      expect(textContent!.text).toMatch(/1.*2.*3/);
    });
  });

  describe("Stream Lifecycle", () => {
    test("should handle stream start and end", async () => {
      const messages = createTestMessages("Hello");

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
        }),
        15000,
      );

      let deltaCount = 0;
      let firstDelta: StreamDelta | null = null;
      let lastDelta: StreamDelta | null = null;

      for await (const delta of stream) {
        if (deltaCount === 0) {
          firstDelta = delta;
        }
        lastDelta = delta;
        deltaCount++;
      }

      expect(deltaCount).toBeGreaterThan(0);
      expect(firstDelta).not.toBeNull();
      expect(lastDelta).not.toBeNull();
      expect(firstDelta!.finished).toBe(false);
      expect(lastDelta!.finished).toBe(true);
    });

    test("should handle stream cancellation", async () => {
      const messages = createTestMessages(
        "Please write a very long story about space exploration with many details.",
      );

      const streamPromise = client.stream({
        model: testModel,
        messages,
      });

      const stream = await withTimeout(streamPromise, 15000);

      let deltaCount = 0;
      try {
        for await (const delta of stream) {
          deltaCount++;
          validateStreamDelta(delta);

          // Stop after receiving a few deltas to simulate early termination
          if (deltaCount >= 2) {
            break;
          }
        }
      } catch {
        // Handle any potential errors during iteration
      }

      expect(deltaCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Format Validation", () => {
    test("should validate StreamDelta schema compliance", async () => {
      const messages = createTestMessages("Test response");

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
        }),
        15000,
      );

      for await (const delta of stream) {
        // Required fields
        expect(delta).toHaveProperty("id");
        expect(delta).toHaveProperty("delta");
        expect(delta).toHaveProperty("finished");

        // Type validation
        expect(typeof delta.id).toBe("string");
        expect(typeof delta.delta).toBe("object");
        expect(typeof delta.finished).toBe("boolean");

        // Delta should be Partial<Message>
        if (delta.delta.role) {
          expect(["user", "assistant", "system"]).toContain(delta.delta.role);
        }

        if (delta.delta.content) {
          expect(Array.isArray(delta.delta.content)).toBe(true);
        }

        // Optional fields type validation
        if (delta.usage) {
          expect(typeof delta.usage).toBe("object");
          expect(typeof delta.usage.promptTokens).toBe("number");
          expect(typeof delta.usage.completionTokens).toBe("number");
        }

        if (delta.metadata) {
          expect(typeof delta.metadata).toBe("object");
        }
      }
    });

    test("should include usage information in final delta when available", async () => {
      const messages = createTestMessages("Brief response");

      const stream = await withTimeout(
        client.stream({
          model: testModel,
          messages,
        }),
        15000,
      );

      const deltas = await withTimeout(collectStreamDeltas(stream), 30000);
      const finalDelta = deltas[deltas.length - 1];

      expect(finalDelta.finished).toBe(true);

      // Usage information may or may not be present depending on provider
      if (finalDelta.usage) {
        expect(typeof finalDelta.usage.promptTokens).toBe("number");
        expect(typeof finalDelta.usage.completionTokens).toBe("number");
        expect(finalDelta.usage.promptTokens).toBeGreaterThan(0);
        expect(finalDelta.usage.completionTokens).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling", () => {
    test("should handle streaming with invalid model gracefully", async () => {
      const messages = createTestMessages("Test");

      await expect(
        withTimeout(
          client.stream({
            model: "openai:invalid-model-that-does-not-exist",
            messages,
          }),
          10000,
        ),
      ).rejects.toThrow();
    });

    test("should handle network timeout scenarios", async () => {
      const messages = createTestMessages("Test");

      // Very short timeout to simulate network issues
      await expect(
        withTimeout(
          client.stream({
            model: testModel,
            messages,
          }),
          1, // 1ms timeout - should fail
        ),
      ).rejects.toThrow();
    });

    test("should handle empty messages array", async () => {
      await expect(
        withTimeout(
          client.stream({
            model: testModel,
            messages: [],
          }),
          10000,
        ),
      ).rejects.toThrow();
    });
  });
});
