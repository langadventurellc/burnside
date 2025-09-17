/**
 * Message Schema Tests
 *
 * Comprehensive test suite for MessageSchema validation covering all validation
 * rules, error cases, and edge conditions.
 */

import { MessageSchema } from "../messageSchema";
import { validateMessage } from "../messageValidation";

describe("MessageSchema", () => {
  describe("valid message validation", () => {
    it("validates minimal valid user message", () => {
      const validMessage = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(validMessage)).not.toThrow();
      const result = MessageSchema.parse(validMessage);
      expect(result.role).toBe("user");
      expect(result.content).toHaveLength(1);
    });

    it("validates complete message with all optional fields", () => {
      const completeMessage = {
        id: "12345678-1234-4234-8234-123456789012",
        role: "assistant",
        content: [
          { type: "text", text: "Here's the answer" },
          {
            type: "code",
            text: "console.log('hello')",
            language: "javascript",
          },
        ],
        timestamp: "2023-12-07T10:30:00.000Z",
        sources: [
          {
            id: "source-1",
            url: "https://example.com/doc",
            title: "Reference Document",
            metadata: { type: "documentation" },
          },
        ],
        metadata: { confidence: 0.95, tokens: 150 },
      };

      expect(() => MessageSchema.parse(completeMessage)).not.toThrow();
      const result = MessageSchema.parse(completeMessage);
      expect(result.id).toBe(completeMessage.id);
      expect(result.sources).toHaveLength(1);
      expect(result.metadata?.confidence).toBe(0.95);
    });

    it("validates all role types", () => {
      const roles = ["system", "user", "assistant", "tool"] as const;

      roles.forEach((role) => {
        const message = {
          role,
          content: [{ type: "text", text: "Test message" }],
        };

        expect(() => MessageSchema.parse(message)).not.toThrow();
        const result = MessageSchema.parse(message);
        expect(result.role).toBe(role);
      });
    });

    it("validates multiple content parts", () => {
      const messageWithMultipleContent = {
        role: "user",
        content: [
          { type: "text", text: "Look at this image:" },
          {
            type: "image",
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            alt: "Test image",
          },
          { type: "text", text: "What do you see?" },
        ],
      };

      expect(() =>
        MessageSchema.parse(messageWithMultipleContent),
      ).not.toThrow();
      const result = MessageSchema.parse(messageWithMultipleContent);
      expect(result.content).toHaveLength(3);
    });
  });

  describe("role validation", () => {
    it("rejects invalid role", () => {
      const invalidMessage = {
        role: "invalid-role",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(invalidMessage)).toThrow();
      expect(() => MessageSchema.parse(invalidMessage)).toThrow(
        /Role must be one of: system, user, assistant, tool/,
      );
    });

    it("rejects missing role", () => {
      const messageWithoutRole = {
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithoutRole)).toThrow();
    });

    it("rejects null role", () => {
      const messageWithNullRole = {
        role: null,
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithNullRole)).toThrow();
    });
  });

  describe("content validation", () => {
    it("rejects empty content array", () => {
      const messageWithEmptyContent = {
        role: "user",
        content: [],
      };

      expect(() => MessageSchema.parse(messageWithEmptyContent)).toThrow();
      expect(() => MessageSchema.parse(messageWithEmptyContent)).toThrow(
        /Message content cannot be empty/,
      );
    });

    it("rejects missing content", () => {
      const messageWithoutContent = {
        role: "user",
      };

      expect(() => MessageSchema.parse(messageWithoutContent)).toThrow();
    });

    it("rejects null content", () => {
      const messageWithNullContent = {
        role: "user",
        content: null,
      };

      expect(() => MessageSchema.parse(messageWithNullContent)).toThrow();
    });

    it("rejects content with null elements", () => {
      const messageWithNullElements = {
        role: "user",
        content: [{ type: "text", text: "Hello" }, null],
      };

      expect(() => MessageSchema.parse(messageWithNullElements)).toThrow();
    });

    it("rejects invalid content part", () => {
      const messageWithInvalidContent = {
        role: "user",
        content: [{ type: "invalid", data: "test" }],
      };

      expect(() => MessageSchema.parse(messageWithInvalidContent)).toThrow();
    });
  });

  describe("ID validation", () => {
    it("accepts valid UUID v4", () => {
      const messageWithValidUuid = {
        id: "12345678-1234-4234-8234-123456789012",
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithValidUuid)).not.toThrow();
    });

    it("rejects invalid UUID format", () => {
      const messageWithInvalidUuid = {
        id: "invalid-uuid",
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithInvalidUuid)).toThrow();
      expect(() => MessageSchema.parse(messageWithInvalidUuid)).toThrow(
        /Must be a valid UUID v4 format/,
      );
    });

    it("rejects UUID v1 format", () => {
      const messageWithUuidV1 = {
        id: "12345678-1234-1234-8234-123456789012", // version 1
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithUuidV1)).toThrow();
    });

    it("accepts message without ID", () => {
      const messageWithoutId = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      };

      expect(() => MessageSchema.parse(messageWithoutId)).not.toThrow();
    });
  });

  describe("timestamp validation", () => {
    it("accepts valid ISO 8601 timestamp", () => {
      const messageWithValidTimestamp = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        timestamp: "2023-12-07T10:30:00.000Z",
      };

      expect(() =>
        MessageSchema.parse(messageWithValidTimestamp),
      ).not.toThrow();
    });

    it("accepts ISO timestamp without milliseconds", () => {
      const messageWithSimpleTimestamp = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        timestamp: "2023-12-07T10:30:00Z",
      };

      expect(() =>
        MessageSchema.parse(messageWithSimpleTimestamp),
      ).not.toThrow();
    });

    it("rejects invalid timestamp format", () => {
      const messageWithInvalidTimestamp = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        timestamp: "2023/12/07 10:30:00",
      };

      expect(() => MessageSchema.parse(messageWithInvalidTimestamp)).toThrow();
      expect(() => MessageSchema.parse(messageWithInvalidTimestamp)).toThrow(
        /Invalid ISO 8601 timestamp format/,
      );
    });

    it("rejects non-string timestamp", () => {
      const messageWithNumberTimestamp = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        timestamp: 1701944200000,
      };

      expect(() => MessageSchema.parse(messageWithNumberTimestamp)).toThrow();
    });
  });

  describe("sources validation", () => {
    it("accepts valid sources array", () => {
      const messageWithSources = {
        role: "assistant",
        content: [{ type: "text", text: "Based on the documentation..." }],
        sources: [
          {
            id: "doc-1",
            url: "https://example.com/doc1",
            title: "Documentation",
          },
          {
            id: "doc-2",
            metadata: { type: "reference" },
          },
        ],
      };

      expect(() => MessageSchema.parse(messageWithSources)).not.toThrow();
      const result = MessageSchema.parse(messageWithSources);
      expect(result.sources).toHaveLength(2);
    });

    it("rejects source without ID", () => {
      const messageWithInvalidSource = {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        sources: [
          {
            url: "https://example.com/doc",
            title: "Documentation",
          },
        ],
      };

      expect(() => MessageSchema.parse(messageWithInvalidSource)).toThrow();
    });

    it("rejects source with empty ID", () => {
      const messageWithEmptySourceId = {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        sources: [
          {
            id: "",
            url: "https://example.com/doc",
          },
        ],
      };

      expect(() => MessageSchema.parse(messageWithEmptySourceId)).toThrow();
      expect(() => MessageSchema.parse(messageWithEmptySourceId)).toThrow(
        /Source reference ID cannot be empty/,
      );
    });

    it("rejects source with invalid URL", () => {
      const messageWithInvalidSourceUrl = {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        sources: [
          {
            id: "doc-1",
            url: "invalid-url",
          },
        ],
      };

      expect(() => MessageSchema.parse(messageWithInvalidSourceUrl)).toThrow();
    });

    it("accepts empty sources array", () => {
      const messageWithEmptySources = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        sources: [],
      };

      expect(() => MessageSchema.parse(messageWithEmptySources)).not.toThrow();
    });
  });

  describe("metadata validation", () => {
    it("accepts valid metadata object", () => {
      const messageWithMetadata = {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        metadata: {
          confidence: 0.95,
          tokens: 150,
          model: "gpt-4",
          processing_time: 1.5,
        },
      };

      expect(() => MessageSchema.parse(messageWithMetadata)).not.toThrow();
      const result = MessageSchema.parse(messageWithMetadata);
      expect(result.metadata?.confidence).toBe(0.95);
    });

    it("accepts nested metadata objects", () => {
      const messageWithNestedMetadata = {
        role: "assistant",
        content: [{ type: "text", text: "Hello" }],
        metadata: {
          performance: {
            tokens: 150,
            time: 1.5,
          },
          model_info: {
            name: "gpt-4",
            version: "0613",
          },
        },
      };

      expect(() =>
        MessageSchema.parse(messageWithNestedMetadata),
      ).not.toThrow();
    });

    it("accepts empty metadata object", () => {
      const messageWithEmptyMetadata = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        metadata: {},
      };

      expect(() => MessageSchema.parse(messageWithEmptyMetadata)).not.toThrow();
    });

    it("rejects non-object metadata", () => {
      const messageWithStringMetadata = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        metadata: "invalid metadata",
      };

      expect(() => MessageSchema.parse(messageWithStringMetadata)).toThrow();
    });
  });

  describe("strict mode validation", () => {
    it("rejects unknown fields", () => {
      const messageWithUnknownField = {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        unknownField: "should be rejected",
      };

      expect(() => MessageSchema.parse(messageWithUnknownField)).toThrow();
    });
  });

  describe("type inference", () => {
    it("infers correct TypeScript types", () => {
      const validMessage = {
        role: "user" as const,
        content: [{ type: "text" as const, text: "Hello" }],
        timestamp: "2023-12-07T10:30:00.000Z",
      };

      const result = MessageSchema.parse(validMessage);

      // TypeScript should infer these types correctly
      const role: string = result.role;
      const content: Array<any> = result.content;
      const timestamp: string | undefined = result.timestamp;

      expect(role).toBe("user");
      expect(content).toHaveLength(1);
      expect(timestamp).toBe("2023-12-07T10:30:00.000Z");
    });
  });
});

describe("validateMessage", () => {
  it("validates and returns typed message", () => {
    const input = {
      role: "user",
      content: [{ type: "text", text: "Hello" }],
    };

    const result = validateMessage(input);
    expect(result.role).toBe("user");
    expect(result.content).toHaveLength(1);
  });

  it("throws ValidationError with detailed message on failure", () => {
    const invalidInput = {
      role: "invalid-role",
      content: [{ type: "text", text: "Hello" }],
    };

    expect(() => validateMessage(invalidInput)).toThrow();
    expect(() => validateMessage(invalidInput)).toThrow(
      /Message validation failed/,
    );
  });

  it("throws ValidationError for null input", () => {
    expect(() => validateMessage(null)).toThrow();
  });

  it("throws ValidationError for undefined input", () => {
    expect(() => validateMessage(undefined)).toThrow();
  });

  it("throws ValidationError for primitive input", () => {
    expect(() => validateMessage("not an object")).toThrow();
  });
});
