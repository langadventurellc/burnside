/**
 * xAI v1 Request Translator Tests
 *
 * Comprehensive unit tests for the xAI request translator covering all
 * translation scenarios, edge cases, and error conditions.
 */

import { z } from "zod";
import { translateChatRequest } from "../translator";
import type { ChatRequest } from "../../../client/chatRequest";
import type { XAIV1Config } from "../configSchema";
import type { ToolDefinition } from "../../../core/tools/toolDefinition";
import { ValidationError } from "../../../core/errors/validationError";

// Mock the createHttpRequest function
jest.mock("../../../core/providers/createHttpRequest", () => ({
  createHttpRequest: jest.fn((params) => ({
    url: params.url,
    method: params.method,
    headers: params.headers,
    body: JSON.stringify(params.body),
    timeout: undefined,
  })),
}));

// Helper function to parse response body safely
function parseBody(body: string | Uint8Array | undefined): any {
  if (!body) return {};
  const bodyString =
    typeof body === "string" ? body : new TextDecoder().decode(body);
  return JSON.parse(bodyString);
}

describe("xAI v1 Request Translator", () => {
  const mockConfig: XAIV1Config = {
    apiKey: "xai-test-key-123",
    baseUrl: "https://api.x.ai/v1",
    timeout: 30000,
    maxRetries: 3,
  };

  const basicChatRequest: ChatRequest = {
    model: "xai:grok-3",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Hello, how are you?" }],
      },
    ],
    temperature: 0.7,
    maxTokens: 1000,
  };

  describe("Model ID Mapping", () => {
    it("should strip xai: prefix from model ID", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.model).toBe("grok-3");
    });

    it("should handle model ID without prefix", () => {
      const request = { ...basicChatRequest, model: "grok-3-mini" };
      const result = translateChatRequest(request, mockConfig);
      const body = parseBody(result.body);

      expect(body.model).toBe("grok-3-mini");
    });

    it("should handle empty model ID gracefully", () => {
      const request = { ...basicChatRequest, model: "" };

      expect(() => translateChatRequest(request, mockConfig)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Message Translation", () => {
    it("should translate simple text message", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.input).toEqual([
        {
          type: "message",
          role: "user",
          content: "Hello, how are you?",
        },
      ]);
    });

    it("should translate multimodal message with text and image", () => {
      const multimodalRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image",
                data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                mimeType: "image/png",
              },
            ],
          },
        ],
      };

      const result = translateChatRequest(multimodalRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.input).toEqual([
        {
          type: "message",
          role: "user",
          content: [
            { type: "text", text: "What's in this image?" },
            {
              type: "image_url",
              image_url: {
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                detail: "auto",
              },
            },
          ],
        },
      ]);
    });

    it("should translate code content as text", () => {
      const codeRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "user",
            content: [{ type: "code", text: "console.log('hello');" }],
          },
        ],
      };

      const result = translateChatRequest(codeRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.input).toEqual([
        {
          type: "message",
          role: "user",
          content: "console.log('hello');",
        },
      ]);
    });

    it("should handle multiple messages", () => {
      const multiMessageRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: "You are a helpful assistant." }],
          },
          {
            role: "user",
            content: [{ type: "text", text: "Hello!" }],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: "Hi there!" }],
          },
        ],
      };

      const result = translateChatRequest(multiMessageRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.input).toHaveLength(3);
      expect(body.input[0].role).toBe("system");
      expect(body.input[1].role).toBe("user");
      expect(body.input[2].role).toBe("assistant");
    });

    it("should throw error for document content type", () => {
      const documentRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document" as any,
                data: "document-data",
                mimeType: "application/pdf",
              },
            ],
          },
        ],
      };

      expect(() => translateChatRequest(documentRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });

    it("should throw error for unsupported content type", () => {
      const invalidRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "user",
            content: [{ type: "unknown" as any, text: "test" }],
          },
        ],
      };

      expect(() => translateChatRequest(invalidRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Tool Translation", () => {
    const jsonSchemaTool: ToolDefinition = {
      name: "get_weather",
      description: "Get weather information",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
          units: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
      },
    };

    const zodSchemaTool: ToolDefinition = {
      name: "calculate",
      description: "Perform calculation",
      inputSchema: z.object({
        operation: z.enum(["add", "subtract", "multiply", "divide"]),
        a: z.number(),
        b: z.number(),
      }),
    };

    it("should translate JSON schema tools", () => {
      const toolsRequest: ChatRequest = {
        ...basicChatRequest,
        tools: [jsonSchemaTool],
      };

      const result = translateChatRequest(toolsRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools).toEqual([
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get weather information",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string", description: "City name" },
                units: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
              additionalProperties: false,
            },
          },
        },
      ]);
    });

    it("should translate Zod schema tools with basic structure", () => {
      const toolsRequest: ChatRequest = {
        ...basicChatRequest,
        tools: [zodSchemaTool],
      };

      const result = translateChatRequest(toolsRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools).toEqual([
        {
          type: "function",
          function: {
            name: "calculate",
            description: "Perform calculation",
            parameters: {
              type: "object",
              properties: {},
              required: [],
              additionalProperties: false,
            },
          },
        },
      ]);
    });

    it("should handle tool without description", () => {
      const toolWithoutDesc: ToolDefinition = {
        name: "simple_tool",
        inputSchema: { type: "object", properties: {} },
      };

      const toolsRequest: ChatRequest = {
        ...basicChatRequest,
        tools: [toolWithoutDesc],
      };

      const result = translateChatRequest(toolsRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools[0].function.description).toBe(
        "Execute simple_tool tool",
      );
    });

    it("should handle multiple tools", () => {
      const toolsRequest: ChatRequest = {
        ...basicChatRequest,
        tools: [jsonSchemaTool, zodSchemaTool],
      };

      const result = translateChatRequest(toolsRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools).toHaveLength(2);
      expect(body.tools[0].function.name).toBe("get_weather");
      expect(body.tools[1].function.name).toBe("calculate");
    });

    it("should handle empty tools array", () => {
      const toolsRequest: ChatRequest = {
        ...basicChatRequest,
        tools: [],
      };

      const result = translateChatRequest(toolsRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.tools).toBeUndefined();
    });
  });

  describe("Parameter Translation", () => {
    it("should translate temperature parameter", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.temperature).toBe(0.7);
    });

    it("should translate maxTokens to max_output_tokens", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.max_output_tokens).toBe(1000);
    });

    it("should respect model capabilities for temperature", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig, {
        temperature: false,
      });
      const body = parseBody(result.body);

      expect(body.temperature).toBeUndefined();
    });

    it("should handle undefined optional parameters", () => {
      const minimalRequest: ChatRequest = {
        model: "xai:grok-3",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello!" }],
          },
        ],
      };

      const result = translateChatRequest(minimalRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.temperature).toBeUndefined();
      expect(body.max_output_tokens).toBeUndefined();
    });

    it("should set stream parameter correctly", () => {
      const streamingRequest = { ...basicChatRequest, stream: true };
      const result = translateChatRequest(streamingRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.stream).toBe(true);
    });

    it("should default stream to false", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);
      const body = parseBody(result.body);

      expect(body.stream).toBe(false);
    });

    it("should handle options with camelCase to snake_case conversion", () => {
      const requestWithOptions: ChatRequest = {
        ...basicChatRequest,
        options: {
          topP: 0.9,
          parallelToolCalls: true,
          topLogprobs: 5,
        },
      };

      const result = translateChatRequest(requestWithOptions, mockConfig);
      const body = parseBody(result.body);

      expect(body.top_p).toBe(0.9);
      expect(body.parallel_tool_calls).toBe(true);
      expect(body.top_logprobs).toBe(5);
    });

    it("should handle maxTokens in options", () => {
      const requestWithOptions: ChatRequest = {
        ...basicChatRequest,
        options: {
          maxTokens: 2000,
        },
      };

      const result = translateChatRequest(requestWithOptions, mockConfig);
      const body = parseBody(result.body);

      expect(body.max_output_tokens).toBe(2000);
    });
  });

  describe("Header Construction", () => {
    it("should build basic headers with authorization", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);

      expect(result.headers?.Authorization).toBe("Bearer xai-test-key-123");
    });

    it("should include organization header if provided", () => {
      const configWithOrg: XAIV1Config = {
        ...mockConfig,
        organization: "org-123",
      };

      const result = translateChatRequest(basicChatRequest, configWithOrg);

      expect(result.headers?.["OpenAI-Organization"]).toBe("org-123");
    });

    it("should include project header if provided", () => {
      const configWithProject: XAIV1Config = {
        ...mockConfig,
        project: "proj-456",
      };

      const result = translateChatRequest(basicChatRequest, configWithProject);

      expect(result.headers?.["OpenAI-Project"]).toBe("proj-456");
    });

    it("should include custom headers if provided", () => {
      const configWithHeaders: XAIV1Config = {
        ...mockConfig,
        headers: {
          "Custom-Header": "custom-value",
          "Another-Header": "another-value",
        },
      };

      const result = translateChatRequest(basicChatRequest, configWithHeaders);

      expect(result.headers?.["Custom-Header"]).toBe("custom-value");
      expect(result.headers?.["Another-Header"]).toBe("another-value");
    });
  });

  describe("URL Construction", () => {
    it("should construct correct URL with /responses endpoint", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);

      expect(result.url).toBe("https://api.x.ai/v1/responses");
    });

    it("should handle base URL with trailing slash", () => {
      const configWithSlash: XAIV1Config = {
        ...mockConfig,
        baseUrl: "https://api.x.ai/v1/",
      };

      const result = translateChatRequest(basicChatRequest, configWithSlash);

      expect(result.url).toBe("https://api.x.ai/v1/responses");
    });

    it("should use POST method", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);

      expect(result.method).toBe("POST");
    });
  });

  describe("Error Handling", () => {
    it("should throw ValidationError for invalid request", () => {
      const invalidRequest: ChatRequest = {
        model: "",
        messages: [],
      };

      expect(() => translateChatRequest(invalidRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });

    it("should wrap non-ValidationError exceptions", () => {
      // Mock a scenario that throws a non-ValidationError
      const malformedRequest = {
        model: "xai:grok-3",
        messages: null as any,
      };

      expect(() => translateChatRequest(malformedRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });

    it("should preserve original ValidationError", () => {
      const invalidRequest: ChatRequest = {
        model: "invalid-model",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello!" }],
          },
        ],
      };

      expect(() => translateChatRequest(invalidRequest, mockConfig)).toThrow(
        ValidationError,
      );
    });
  });

  describe("Schema Validation", () => {
    it("should validate request against xAI schema", () => {
      const result = translateChatRequest(basicChatRequest, mockConfig);

      // Verify the request structure matches expected xAI format
      const body = parseBody(result.body);
      expect(body).toHaveProperty("model");
      expect(body).toHaveProperty("input");
      expect(body).toHaveProperty("stream");
      expect(Array.isArray(body.input)).toBe(true);
    });

    it("should reject invalid model names", () => {
      const requestWithInvalidModel: ChatRequest = {
        ...basicChatRequest,
        model: "invalid-model-name",
      };

      expect(() =>
        translateChatRequest(requestWithInvalidModel, mockConfig),
      ).toThrow(ValidationError);
    });
  });
});
