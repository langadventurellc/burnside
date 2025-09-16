/**
 * OpenAI Request Schema Tests
 *
 * Unit tests for the OpenAI Responses v1 request schema validation.
 */

import { OpenAIResponsesV1RequestSchema } from "../requestSchema.js";

describe("OpenAIResponsesV1RequestSchema", () => {
  describe("valid requests", () => {
    it("should validate minimal valid request", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        input: [
          {
            type: "message",
            role: "user",
            content: "Hello, world!",
          },
        ],
      };

      const result = OpenAIResponsesV1RequestSchema.parse(request);

      expect(result.model).toBe("gpt-4o-2024-08-06");
      expect(result.input).toHaveLength(1);
      expect(result.input[0].type).toBe("message");
      expect(result.input[0].role).toBe("user");
      expect(result.input[0].content).toBe("Hello, world!");
    });

    it("should validate request with all optional parameters", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        input: [
          {
            type: "message",
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            type: "message",
            role: "user",
            content: "Hello!",
          },
        ],
        stream: true,
        temperature: 0.7,
        max_output_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.2,
        stop: ["END"],
        seed: 42,
        user: "user-123",
      };

      const result = OpenAIResponsesV1RequestSchema.parse(request);

      expect(result.model).toBe("gpt-4o-2024-08-06");
      expect(result.input).toHaveLength(2);
      expect(result.input[0].type).toBe("message");
      expect(result.input[1].type).toBe("message");
      expect(result.stream).toBe(true);
      expect(result.temperature).toBe(0.7);
      expect(result.max_output_tokens).toBe(1000);
      expect(result.top_p).toBe(0.9);
      expect(result.frequency_penalty).toBe(0.5);
      expect(result.presence_penalty).toBe(0.2);
      expect(result.stop).toEqual(["END"]);
      expect(result.seed).toBe(42);
      expect(result.user).toBe("user-123");
    });

    it("should validate message with image content", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        input: [
          {
            type: "message",
            role: "user",
            content: [
              {
                type: "text",
                text: "What do you see in this image?",
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://example.com/image.jpg",
                  detail: "high",
                },
              },
            ],
          },
        ],
      };

      const result = OpenAIResponsesV1RequestSchema.parse(request);

      expect(result.input[0].content).toHaveLength(2);
      const imageContent = result.input[0].content as Array<any>;
      expect(imageContent[1].type).toBe("image_url");
      expect(imageContent[1].image_url.url).toBe(
        "https://example.com/image.jpg",
      );
      expect(imageContent[1].image_url.detail).toBe("high");
    });
  });

  describe("invalid requests", () => {
    it("should reject missing model", () => {
      const request = {
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject empty model", () => {
      const request = {
        model: "",
        messages: [
          {
            role: "user",
            content: "Hello!",
          },
        ],
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject missing messages", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject empty messages array", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [],
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject invalid message role", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "invalid-role",
            content: "Hello!",
          },
        ],
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject temperature out of range", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [{ role: "user", content: "Hello!" }],
        temperature: 3.0, // Exceeds maximum of 2
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject negative max_tokens", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [{ role: "user", content: "Hello!" }],
        max_tokens: -100,
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject top_p out of range", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [{ role: "user", content: "Hello!" }],
        top_p: 1.5, // Exceeds maximum of 1
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });

    it("should reject frequency_penalty out of range", () => {
      const request = {
        model: "gpt-4o-2024-08-06",
        messages: [{ role: "user", content: "Hello!" }],
        frequency_penalty: -3.0, // Below minimum of -2
      };

      expect(() => OpenAIResponsesV1RequestSchema.parse(request)).toThrow();
    });
  });
});
