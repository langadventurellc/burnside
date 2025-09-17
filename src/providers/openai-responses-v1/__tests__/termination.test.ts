/**
 * Termination Detection Tests
 *
 * Unit tests for the isTerminal method in OpenAI Responses v1 provider plugin.
 */

import { OpenAIResponsesV1Provider } from "../openAIResponsesV1Provider";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";

describe("OpenAIResponsesV1Provider.isTerminal", () => {
  let provider: OpenAIResponsesV1Provider;

  beforeEach(() => {
    provider = new OpenAIResponsesV1Provider();
  });

  describe("StreamDelta termination detection", () => {
    it("should return true for StreamDelta with finished: true", () => {
      const delta: StreamDelta = {
        id: "test-delta-1",
        delta: { role: "assistant", content: [{ type: "text", text: "Done" }] },
        finished: true,
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should return true for StreamDelta with response.completed event type", () => {
      const delta: StreamDelta = {
        id: "test-delta-2",
        delta: { role: "assistant", content: [] },
        finished: false,
        metadata: { eventType: "response.completed" },
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should return true for StreamDelta with both finished: true and completed event", () => {
      const delta: StreamDelta = {
        id: "test-delta-4",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Final" }],
        },
        finished: true,
        metadata: { eventType: "response.completed" },
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should return false for non-terminal StreamDelta with finished: false", () => {
      const delta: StreamDelta = {
        id: "test-delta-5",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Partial" }],
        },
        finished: false,
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should return false for StreamDelta with response.output_text.delta event type", () => {
      const delta: StreamDelta = {
        id: "test-delta-6",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Partial" }],
        },
        finished: false,
        metadata: { eventType: "response.output_text.delta" },
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should return false for StreamDelta with response.created event type", () => {
      const delta: StreamDelta = {
        id: "test-delta-7",
        delta: { role: "assistant", content: [] },
        finished: false,
        metadata: { eventType: "response.created" },
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should return false for StreamDelta with unknown event type", () => {
      const delta: StreamDelta = {
        id: "test-delta-8",
        delta: { role: "assistant", content: [{ type: "text", text: "Text" }] },
        finished: false,
        metadata: { eventType: "unknown.event" },
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });
  });

  describe("Non-streaming response termination detection", () => {
    it("should return true for UnifiedResponse with message", () => {
      const message: Message = {
        role: "assistant",
        content: [{ type: "text", text: "Complete response" }],
      };

      const response = {
        message,
        model: "gpt-4",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should return true for UnifiedResponse without usage", () => {
      const message: Message = {
        role: "assistant",
        content: [{ type: "text", text: "Response without usage" }],
      };

      const response = {
        message,
        model: "gpt-4",
      };

      expect(provider.isTerminal(response)).toBe(true);
    });

    it("should return true for UnifiedResponse with metadata", () => {
      const message: Message = {
        role: "assistant",
        content: [{ type: "text", text: "Response with metadata" }],
      };

      const response = {
        message,
        model: "gpt-4",
        metadata: { requestId: "req-123", custom: "value" },
      };

      expect(provider.isTerminal(response)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle StreamDelta with missing metadata gracefully", () => {
      const delta: StreamDelta = {
        id: "test-delta-9",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "No metadata" }],
        },
        finished: false,
        // metadata is undefined
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should handle StreamDelta with null metadata gracefully", () => {
      const delta: StreamDelta = {
        id: "test-delta-10",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Null metadata" }],
        },
        finished: false,
        metadata: null as unknown as Record<string, unknown>,
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should handle StreamDelta with metadata missing eventType", () => {
      const delta: StreamDelta = {
        id: "test-delta-11",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "No event type" }],
        },
        finished: false,
        metadata: { someOtherField: "value" },
      };

      expect(provider.isTerminal(delta)).toBe(false);
    });

    it("should return consistent results for same input", () => {
      const delta: StreamDelta = {
        id: "test-delta-12",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Consistent" }],
        },
        finished: true,
        metadata: { eventType: "response.completed" },
      };

      const result1 = provider.isTerminal(delta);
      const result2 = provider.isTerminal(delta);
      const result3 = provider.isTerminal(delta);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should handle empty content arrays", () => {
      const delta: StreamDelta = {
        id: "test-delta-13",
        delta: { role: "assistant", content: [] },
        finished: true,
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should prioritize finished flag over event type", () => {
      // finished: true should return true even with non-terminal event type
      const delta: StreamDelta = {
        id: "test-delta-14",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Priority test" }],
        },
        finished: true,
        metadata: { eventType: "response.output_text.delta" }, // Non-terminal event
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });

    it("should handle conflicting indicators correctly", () => {
      // finished: false but terminal event type should return true
      const delta: StreamDelta = {
        id: "test-delta-15",
        delta: { role: "assistant", content: [] },
        finished: false,
        metadata: { eventType: "response.completed" }, // Terminal event
      };

      expect(provider.isTerminal(delta)).toBe(true);
    });
  });
});
