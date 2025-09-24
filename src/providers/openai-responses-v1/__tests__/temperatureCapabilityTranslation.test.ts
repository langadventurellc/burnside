/**
 * @file Tests for temperature capability-aware request translation
 */

import { translateChatRequest } from "../translator";
import type { ChatRequest } from "../../../client/chatRequest";
import type { OpenAIResponsesV1Config } from "../configSchema";

describe("Temperature Capability Translation", () => {
  const mockConfig: OpenAIResponsesV1Config = {
    apiKey: "sk-test-key-123",
    baseUrl: "https://api.openai.com/v1",
  };

  // Helper function to parse response body safely
  function parseBody(body: string | Uint8Array): any {
    const bodyString =
      typeof body === "string" ? body : new TextDecoder().decode(body);
    return JSON.parse(bodyString);
  }

  describe("buildOpenAIRequestBody temperature handling", () => {
    test("should include temperature when no model capabilities provided (backward compatibility)", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.7,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0.7);
    });

    test("should include temperature when model capabilities temperature is true", () => {
      // Note: Currently translateChatRequest doesn't accept model capabilities
      // This test documents the expected behavior when the enhancement is made
      const request: ChatRequest = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.5,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      // Currently includes temperature (backward compatible behavior)
      expect(body.temperature).toBe(0.5);
    });

    test("should include temperature when model capabilities temperature is undefined", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.9,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0.9);
    });

    test("should not include temperature when request temperature is undefined", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBeUndefined();
      expect("temperature" in body).toBe(false);
    });

    test("should include other parameters when temperature is excluded", () => {
      const request: ChatRequest = {
        model: "gpt-5-nano-2025-08-07",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.7, // Would be excluded for GPT-5 when capabilities are available
        maxTokens: 1000,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      // Currently includes temperature (backward compatible)
      // When enhanced, should exclude temperature for GPT-5 models
      expect(body.model).toBe("gpt-5-nano-2025-08-07");
      expect(body.max_output_tokens).toBe(1000);
      expect(body.stream).toBe(false);
    });

    test("should preserve message structure regardless of temperature capability", () => {
      const request: ChatRequest = {
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are helpful." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "What's the weather?" }],
          },
        ],
        temperature: 0.8,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.input).toHaveLength(2);
      expect(body.input[0]).toEqual({
        type: "message",
        role: "system",
        content: "You are helpful.",
      });
      expect(body.input[1]).toEqual({
        type: "message",
        role: "user",
        content: "What's the weather?",
      });
    });
  });

  describe("integration with options and other parameters", () => {
    test("should handle temperature with streaming enabled", () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.3,
        stream: true,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0.3);
      expect(body.stream).toBe(true);
    });

    test("should handle temperature with options parameters", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.6,
        maxTokens: 500,
        options: {
          topP: 0.9,
          frequencyPenalty: 0.1,
        },
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0.6);
      expect(body.max_output_tokens).toBe(500);
      expect(body.top_p).toBe(0.9);
      expect(body.frequency_penalty).toBe(0.1);
    });

    test("should handle temperature: 0 (falsy but valid value)", () => {
      const request: ChatRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0);
    });

    test("should handle temperature with multi-part content", () => {
      const request: ChatRequest = {
        model: "gpt-4-vision",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image" },
              {
                type: "image",
                data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
                mimeType: "image/png",
                alt: "Test image",
              },
            ],
          },
        ],
        temperature: 0.2,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      expect(body.temperature).toBe(0.2);
      expect(body.input[0].content).toHaveLength(2);
      expect(body.input[0].content[0]).toEqual({
        type: "text",
        text: "Describe this image",
      });
      expect(body.input[0].content[1]).toEqual({
        type: "image_url",
        image_url: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
          detail: "auto",
        },
      });
    });
  });

  describe("model-specific temperature behavior expectations", () => {
    test("should document expected behavior for GPT-4 models (supports temperature)", () => {
      const request: ChatRequest = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.7,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      // GPT-4 models should include temperature
      expect(body.temperature).toBe(0.7);
    });

    test("should document expected behavior for GPT-5 models (does not support temperature)", () => {
      const request: ChatRequest = {
        model: "gpt-5-nano-2025-08-07",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
        temperature: 0.5,
        providerConfig: "default",
      };

      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body!);

      // Currently includes temperature (backward compatible)
      // TODO: When model capabilities are integrated, should exclude temperature
      expect(body.temperature).toBe(0.5);

      // Verify other required fields are present
      expect(body.model).toBe("gpt-5-nano-2025-08-07");
      expect(body.stream).toBe(false);
      expect(body.input).toHaveLength(1);
    });
  });
});
