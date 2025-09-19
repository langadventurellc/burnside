/**
 * OpenAI Responses v1 Provider Integration Tests
 *
 * Comprehensive integration tests using fixtures to validate provider behavior
 * against recorded OpenAI API responses. Tests complete request → response pipeline.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import type { ChatRequest } from "../../../client/chatRequest";
import type { ProviderHttpResponse } from "../../../core/transport/providerHttpResponse";
import type { StreamDelta } from "../../../client/streamDelta";
import { OpenAIResponsesV1Provider } from "../index";
import {
  nonStreamingResponses,
  streamingEvents,
  errorResponses,
  requestExamples,
} from "./fixtures/index";

/**
 * Helper to create mock HTTP response from fixture
 */
function createMockResponse(
  fixture: any,
  status = 200,
  headers: Record<string, string> = {},
): ProviderHttpResponse {
  const body = typeof fixture === "string" ? fixture : JSON.stringify(fixture);

  return {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    }),
  };
}

/**
 * Helper to create mock streaming response from SSE events
 */
function createMockStreamResponse(
  events: readonly { data: string }[],
): ProviderHttpResponse {
  return {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "text/event-stream",
    },
    body: new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${event.data}\n\n`));
        }
        controller.close();
      },
    }),
  };
}

/**
 * Helper to collect all deltas from async iterable
 */
async function collectDeltas(
  stream: AsyncIterable<StreamDelta>,
): Promise<StreamDelta[]> {
  const deltas: StreamDelta[] = [];
  for await (const delta of stream) {
    deltas.push(delta);
  }
  return deltas;
}

describe("OpenAI Responses v1 Provider Integration", () => {
  let provider: OpenAIResponsesV1Provider;

  beforeEach(async () => {
    provider = new OpenAIResponsesV1Provider();
    await provider.initialize({
      apiKey: "sk-test-integration-key",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  describe("Non-streaming responses", () => {
    test("should handle successful chat completion", async () => {
      const _request: ChatRequest = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, how are you?" }],
          },
        ],
      };

      const mockResponse = createMockResponse(
        nonStreamingResponses.chatCompletionSuccess,
      );

      const result = (await provider.parseResponse(mockResponse, false)) as {
        message: {
          role: string;
          content: Array<{ type: string; text: string }>;
        };
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      };

      expect(result).toBeDefined();
      expect(result.message.role).toBe("assistant");
      expect(result.message.content).toHaveLength(1);
      expect(result.message.content[0].type).toBe("text");
      expect(result.message.content[0].text).toBe(
        "Hello! I'm Claude, an AI assistant created by Anthropic. How can I help you today?",
      );
      expect(result.usage).toBeDefined();
      expect(result.usage?.promptTokens).toBe(12);
      expect(result.usage?.completionTokens).toBe(19);
      expect(result.usage?.totalTokens).toBe(31);
    });

    test("should handle empty content response", async () => {
      const mockResponse = createMockResponse(
        nonStreamingResponses.chatCompletionEmpty,
      );

      const result = (await provider.parseResponse(mockResponse, false)) as {
        message: { content: Array<{ text: string }> };
        usage?: { completionTokens: number };
      };

      expect(result.message.content).toHaveLength(1);
      expect(result.message.content[0].text).toBe("");
      expect(result.usage?.completionTokens).toBe(0);
    });

    test("should handle content filter response", async () => {
      const mockResponse = createMockResponse(
        nonStreamingResponses.chatCompletionContentFilter,
      );

      const result = (await provider.parseResponse(mockResponse, false)) as {
        message: { content: Array<{ text: string }> };
        metadata?: { finishReason: string | null };
      };

      expect(result.message.content[0].text).toContain(
        "can't provide information",
      );
      expect(result.metadata?.finishReason).toBeNull();
    });

    test("should handle length limit response", async () => {
      const mockResponse = createMockResponse(
        nonStreamingResponses.chatCompletionLengthLimit,
      );

      const result = (await provider.parseResponse(mockResponse, false)) as {
        metadata?: { finishReason: string | null };
        usage?: { completionTokens: number };
      };

      expect(result.metadata?.finishReason).toBeNull();
      expect(result.usage?.completionTokens).toBe(50);
    });
  });

  describe("Streaming responses", () => {
    test("should process complete event stream", async () => {
      const mockResponse = createMockStreamResponse(
        streamingEvents.streamEventsComplete,
      );

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      expect(deltas.length).toBeGreaterThan(0);

      // Check that we get the expected accumulation
      const textDeltas = deltas
        .filter(
          (delta) => delta.delta.content && delta.delta.content.length > 0,
        )
        .map((delta) => {
          const content = delta.delta.content![0];
          return content.type === "text" ? content.text : "";
        })
        .join("");

      expect(textDeltas).toBe(streamingEvents.streamEventsCompleteExpectedText);

      // Check termination
      const finalDelta = deltas[deltas.length - 1];
      expect(finalDelta.finished).toBe(true);
      expect(provider.isTerminal(finalDelta)).toBe(true);
    });

    test("should handle streaming with usage information", async () => {
      const mockResponse = createMockStreamResponse(
        streamingEvents.streamEventsPartialUsage,
      );

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      const finalDelta = deltas.find((delta) => delta.finished);
      expect(finalDelta).toBeDefined();
      expect(finalDelta!.usage).toBeDefined();
      expect(finalDelta!.usage!.promptTokens).toBe(8);
      expect(finalDelta!.usage!.completionTokens).toBe(2);
      expect(finalDelta!.usage!.totalTokens).toBe(10);
    });

    test("should handle streaming errors gracefully", async () => {
      const mockResponse = createMockStreamResponse(
        streamingEvents.streamEventsError,
      );

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;

      await expect(async () => {
        for await (const _ of stream) {
          // Should throw error during iteration
        }
      }).rejects.toThrow();
    });

    test("should handle malformed events gracefully", async () => {
      const eventsWithMalformed = [
        streamingEvents.streamEventsIndividual.responseCreated,
        streamingEvents.streamEventsMalformed.invalidJson,
        streamingEvents.streamEventsIndividual.textDelta,
        streamingEvents.streamEventsIndividual.done,
      ];

      const mockResponse = createMockStreamResponse(eventsWithMalformed);

      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;
      const deltas = await collectDeltas(stream);

      // Should skip malformed event but process valid ones
      expect(deltas.length).toBeGreaterThan(0);
      const validDeltas = deltas.filter(
        (delta) => delta.delta.content && delta.delta.content.length > 0,
      );
      expect(validDeltas.length).toBe(1);
    });
  });

  describe("Error handling", () => {
    test("should handle 401 authentication error", async () => {
      const mockResponse = createMockResponse(
        errorResponses.error401Auth.body,
        errorResponses.error401Auth.status,
      );

      await expect(
        provider.parseResponse(mockResponse, false),
      ).rejects.toThrow();
    });

    test("should handle 429 rate limit error", async () => {
      const mockResponse = createMockResponse(
        errorResponses.error429RateLimit.body,
        errorResponses.error429RateLimit.status,
      );

      await expect(
        provider.parseResponse(mockResponse, false),
      ).rejects.toThrow();
    });

    test("should handle 400 validation error", async () => {
      const mockResponse = createMockResponse(
        errorResponses.error400InvalidModel.body,
        errorResponses.error400InvalidModel.status,
      );

      await expect(
        provider.parseResponse(mockResponse, false),
      ).rejects.toThrow();
    });

    test("should handle 500 server error", async () => {
      const mockResponse = createMockResponse(
        errorResponses.error500Server.body,
        errorResponses.error500Server.status,
      );

      await expect(
        provider.parseResponse(mockResponse, false),
      ).rejects.toThrow();
    });

    test("should handle malformed error responses", async () => {
      const mockResponse = createMockResponse(
        errorResponses.errorMalformedMissingError.body,
        errorResponses.errorMalformedMissingError.status,
      );

      await expect(
        provider.parseResponse(mockResponse, false),
      ).rejects.toThrow();
    });
  });

  describe("Request translation", () => {
    test("should translate basic text request correctly", () => {
      const result = provider.translateRequest(
        requestExamples.requestBasicText,
      );

      expect(result.url).toBe("https://api.openai.com/v1/responses");
      expect(result.method).toBe("POST");
      expect(result.headers?.Authorization).toBe(
        "Bearer sk-test-integration-key",
      );
      expect(result.headers?.["Content-Type"]).toBe("application/json");
      expect(result.body).toBeDefined();

      const bodyString =
        typeof result.body === "string"
          ? result.body
          : new TextDecoder().decode(result.body as Uint8Array);
      const parsedBody = JSON.parse(bodyString);

      expect(parsedBody.model).toBe("gpt-4o-2024-08-06");
      expect(parsedBody.input).toHaveLength(1);
      expect(parsedBody.stream).toBe(false);
    });

    test("should translate streaming request correctly", () => {
      const result = provider.translateRequest(
        requestExamples.requestWithStreaming,
      );

      const bodyString =
        typeof result.body === "string"
          ? result.body
          : new TextDecoder().decode(result.body as Uint8Array);
      const parsedBody = JSON.parse(bodyString);

      expect(parsedBody.stream).toBe(true);
      expect(parsedBody.model).toBe("gpt-5-2025-08-07");
    });

    test("should translate parameters correctly", () => {
      const result = provider.translateRequest(
        requestExamples.requestWithParameters,
      );

      const bodyString =
        typeof result.body === "string"
          ? result.body
          : new TextDecoder().decode(result.body as Uint8Array);
      const parsedBody = JSON.parse(bodyString);

      expect(parsedBody.temperature).toBe(0.8);
      expect(parsedBody.max_output_tokens).toBe(150);
    });
  });

  describe("Provider initialization and configuration", () => {
    test("should initialize with valid configuration", async () => {
      const newProvider = new OpenAIResponsesV1Provider();
      await expect(
        newProvider.initialize({
          apiKey: "sk-test-key",
          baseUrl: "https://custom.openai.com/v1",
        }),
      ).resolves.toBeUndefined();
    });

    test("should support all models (model support determined by registry)", () => {
      expect(provider.supportsModel("gpt-4o-2024-08-06")).toBe(true);
      expect(provider.supportsModel("gpt-5-2025-08-07")).toBe(true);
      expect(provider.supportsModel("gpt-5-nano-2025-08-07")).toBe(true);
    });

    test("should have correct provider metadata", () => {
      expect(provider.id).toBe("openai");
      expect(provider.version).toBe("responses-v1");
      expect(provider.name).toBe("OpenAI Responses Provider");
    });
  });

  describe("End-to-end pipeline validation", () => {
    test("should complete full non-streaming pipeline", async () => {
      const request: ChatRequest = {
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello!" }],
          },
        ],
      };

      // 1. Translate request
      const translatedRequest = provider.translateRequest(request);
      expect(translatedRequest.url).toContain("/responses");

      // 2. Mock response parsing
      const mockResponse = createMockResponse(
        nonStreamingResponses.chatCompletionSuccess,
      );
      const result = (await provider.parseResponse(mockResponse, false)) as {
        message: { role: string };
        usage?: { promptTokens: number };
      };

      // 3. Validate final result
      expect(result.message).toBeDefined();
      expect(result.message.role).toBe("assistant");
      expect(result.usage).toBeDefined();
    });

    test("should complete full streaming pipeline", async () => {
      const request: ChatRequest & { stream: boolean } = {
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Tell me a story." }],
          },
        ],
        stream: true,
      };

      // 1. Translate request
      const translatedRequest = provider.translateRequest(request);
      const bodyString =
        typeof translatedRequest.body === "string"
          ? translatedRequest.body
          : new TextDecoder().decode(translatedRequest.body as Uint8Array);
      const parsedBody = JSON.parse(bodyString);
      expect(parsedBody.stream).toBe(true);

      // 2. Mock streaming response
      const mockResponse = createMockStreamResponse(
        streamingEvents.streamEventsComplete,
      );
      const stream = provider.parseResponse(
        mockResponse,
        true,
      ) as AsyncIterable<StreamDelta>;

      // 3. Process stream and validate
      const deltas = await collectDeltas(stream);
      expect(deltas.length).toBeGreaterThan(0);

      const finalDelta = deltas[deltas.length - 1];
      expect(provider.isTerminal(finalDelta)).toBe(true);
    });
  });
});
