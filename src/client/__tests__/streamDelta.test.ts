import type { StreamDelta } from "../streamDelta";
import type { Message } from "../../core/messages/message";

describe("StreamDelta", () => {
  describe("interface structure", () => {
    it("should accept valid stream delta with required fields", () => {
      const delta: StreamDelta = {
        id: "chunk-123",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
        },
        finished: false,
      };

      expect(delta.id).toBe("chunk-123");
      expect(delta.delta.role).toBe("assistant");
      expect(delta.finished).toBe(false);
    });

    it("should accept partial message delta", () => {
      const delta: StreamDelta = {
        id: "chunk-456",
        delta: {
          content: [{ type: "text", text: " world" }],
        },
        finished: false,
      };

      expect(delta.delta.content).toEqual([{ type: "text", text: " world" }]);
      expect(delta.delta.role).toBeUndefined();
    });

    it("should accept optional usage information", () => {
      const delta: StreamDelta = {
        id: "chunk-789",
        delta: {},
        finished: true,
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25,
        },
      };

      expect(delta.usage?.promptTokens).toBe(10);
      expect(delta.usage?.completionTokens).toBe(15);
      expect(delta.usage?.totalTokens).toBe(25);
    });

    it("should accept usage without totalTokens", () => {
      const delta: StreamDelta = {
        id: "chunk-abc",
        delta: {},
        finished: false,
        usage: {
          promptTokens: 5,
          completionTokens: 8,
        },
      };

      expect(delta.usage?.promptTokens).toBe(5);
      expect(delta.usage?.completionTokens).toBe(8);
      expect(delta.usage?.totalTokens).toBeUndefined();
    });

    it("should accept optional metadata", () => {
      const metadata = { provider: "openai", model: "gpt-4" };
      const delta: StreamDelta = {
        id: "chunk-def",
        delta: {},
        finished: false,
        metadata,
      };

      expect(delta.metadata).toEqual(metadata);
    });

    it("should accept all optional fields together", () => {
      const delta: StreamDelta = {
        id: "chunk-full",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Complete response" }],
        },
        finished: true,
        usage: {
          promptTokens: 20,
          completionTokens: 30,
          totalTokens: 50,
        },
        metadata: {
          provider: "anthropic",
          model: "claude-3",
          temperature: 0.7,
        },
      };

      expect(delta.id).toBe("chunk-full");
      expect(delta.finished).toBe(true);
      expect(delta.usage?.totalTokens).toBe(50);
      expect(delta.metadata?.provider).toBe("anthropic");
    });
  });

  describe("delta field behavior", () => {
    it("should accept empty delta object", () => {
      const delta: StreamDelta = {
        id: "chunk-empty",
        delta: {},
        finished: false,
      };

      expect(delta.delta).toEqual({});
    });

    it("should accept delta with only role", () => {
      const delta: StreamDelta = {
        id: "chunk-role",
        delta: { role: "assistant" },
        finished: false,
      };

      expect(delta.delta.role).toBe("assistant");
      expect(delta.delta.content).toBeUndefined();
    });

    it("should accept delta with only content", () => {
      const delta: StreamDelta = {
        id: "chunk-content",
        delta: {
          content: [{ type: "text", text: "Partial text" }],
        },
        finished: false,
      };

      expect(delta.delta.content).toHaveLength(1);
      expect(delta.delta.role).toBeUndefined();
    });

    it("should maintain type safety with Partial<Message>", () => {
      const fullMessage: Message = {
        role: "user",
        content: [{ type: "text", text: "Full message" }],
        timestamp: "2023-01-01T00:00:00Z",
      };

      // Should be able to use any subset of Message properties
      const delta: StreamDelta = {
        id: "chunk-partial",
        delta: {
          role: fullMessage.role,
          timestamp: fullMessage.timestamp,
        },
        finished: false,
      };

      expect(delta.delta.role).toBe("user");
      expect(delta.delta.timestamp).toBe("2023-01-01T00:00:00Z");
    });
  });

  describe("TypeScript compilation", () => {
    it("should enforce required fields", () => {
      // These should cause TypeScript compilation errors if uncommented:
      // const invalid1: StreamDelta = { delta: {}, finished: false }; // missing id
      // const invalid2: StreamDelta = { id: "test", finished: false }; // missing delta
      // const invalid3: StreamDelta = { id: "test", delta: {} }; // missing finished

      const valid: StreamDelta = {
        id: "test",
        delta: {},
        finished: false,
      };

      expect(valid).toBeDefined();
    });

    it("should allow proper type inference", () => {
      const delta: StreamDelta = {
        id: "chunk-infer",
        delta: {
          role: "assistant",
          content: [{ type: "text", text: "Test" }],
        },
        finished: true,
        usage: { promptTokens: 1, completionTokens: 2 },
      };

      // TypeScript should infer correct types
      const id: string = delta.id;
      const partialMessage: Partial<Message> = delta.delta;
      const finished: boolean = delta.finished;
      const usage: StreamDelta["usage"] = delta.usage;

      expect(id).toBe("chunk-infer");
      expect(partialMessage.role).toBe("assistant");
      expect(finished).toBe(true);
      expect(usage?.promptTokens).toBe(1);
    });

    it("should handle metadata type safety", () => {
      const delta: StreamDelta = {
        id: "chunk-meta",
        delta: {},
        finished: false,
        metadata: {
          stringValue: "test",
          numberValue: 42,
          booleanValue: true,
          objectValue: { nested: "value" },
        },
      };

      expect(delta.metadata?.stringValue).toBe("test");
      expect(delta.metadata?.numberValue).toBe(42);
      expect(delta.metadata?.booleanValue).toBe(true);
      expect((delta.metadata?.objectValue as any)?.nested).toBe("value");
    });
  });
});
