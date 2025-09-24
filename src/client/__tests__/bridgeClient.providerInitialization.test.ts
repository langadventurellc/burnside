import { BridgeClient } from "../bridgeClient";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { Message } from "../../core/messages/message";
import type { ChatRequest } from "../chatRequest";
import type { StreamRequest } from "../streamRequest";

describe("BridgeClient - Provider Initialization with Configuration Names", () => {
  let mockProviderPlugin: ProviderPlugin;
  let initializeSpy: jest.Mock<Promise<void>, [Record<string, unknown>]>;

  beforeEach(() => {
    initializeSpy = jest.fn().mockResolvedValue(undefined);

    mockProviderPlugin = {
      id: "openai",
      version: "responses-v1",
      name: "OpenAI Provider",
      initialize: initializeSpy,
      translateRequest: jest.fn().mockReturnValue({
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        headers: {},
        body: "{}",
      }),
      parseResponse: jest.fn().mockResolvedValue({
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello!" }],
        } as Message,
      }),
      normalizeError: jest.fn().mockImplementation((error) => error),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Provider Initialization Tracking", () => {
    it("should track provider initialization separately per configuration", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      client.registerProvider(mockProviderPlugin);

      // Register a test model manually to avoid model seeding issues
      client.getModelRegistry().register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: false,
          documents: false,
          temperature: true,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      // Mock transport to avoid actual HTTP calls
      const mockTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          body: new ReadableStream(),
        }),
        stream: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          stream: (function* () {
            yield new Uint8Array();
          })(),
        }),
      };

      // Create client with mocked transport
      const clientWithTransport = new BridgeClient(config, {
        transport: mockTransport,
      });
      clientWithTransport.registerProvider(mockProviderPlugin);
      clientWithTransport.getModelRegistry().register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: false,
          documents: false,
          temperature: true,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      // First request with "prod" configuration
      const request1: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "openai:gpt-4",
        providerConfig: "prod",
      };

      await clientWithTransport.chat(request1);

      // Second request with "dev" configuration
      const request2: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "openai:gpt-4",
        providerConfig: "dev",
      };

      await clientWithTransport.chat(request2);

      // Provider should be initialized twice with different configurations
      expect(initializeSpy).toHaveBeenCalledTimes(2);
      expect(initializeSpy).toHaveBeenNthCalledWith(1, {
        apiKey: "sk-prod-key",
      });
      expect(initializeSpy).toHaveBeenNthCalledWith(2, {
        apiKey: "sk-dev-key",
      });
    });

    it("should not reinitialize same configuration on subsequent requests", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
          },
        },
      };

      const mockTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          body: new ReadableStream(),
        }),
        stream: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          stream: (function* () {
            yield new Uint8Array();
          })(),
        }),
      };

      const client = new BridgeClient(config, { transport: mockTransport });
      client.registerProvider(mockProviderPlugin);
      client.getModelRegistry().register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: false,
          documents: false,
          temperature: true,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      const request: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "openai:gpt-4",
        providerConfig: "prod",
      };

      // Make multiple requests with same configuration
      await client.chat(request);
      await client.chat(request);
      await client.chat(request);

      // Provider should only be initialized once
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      expect(initializeSpy).toHaveBeenCalledWith({
        apiKey: "sk-prod-key",
      });
    });

    it("should pass configuration name to provider initialization in stream method", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
          },
        },
      };

      const mockTransport = {
        fetch: jest.fn(),
        stream: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          stream: (function* () {
            yield new Uint8Array();
          })(),
        }),
      };

      // Mock streaming response
      const streamMockProvider: ProviderPlugin = {
        ...mockProviderPlugin,
        parseResponse: jest.fn().mockReturnValue(
          (function* () {
            yield { delta: { role: "assistant", content: "Hello" } };
          })(),
        ),
      };

      const client = new BridgeClient(config, { transport: mockTransport });
      client.registerProvider(streamMockProvider);
      client.getModelRegistry().register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: false,
          documents: false,
          temperature: true,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      const request: StreamRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "openai:gpt-4",
        providerConfig: "prod",
      };

      await client.stream(request);

      // Verify provider was initialized with "prod" configuration for streaming
      expect(initializeSpy).toHaveBeenCalledWith({
        apiKey: "sk-prod-key",
      });
      expect(initializeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Configuration Name Resolution", () => {
    it("should handle provider without configuration name (backward compatibility)", async () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "sk-key" },
          },
        },
      };

      const mockTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          body: new ReadableStream(),
        }),
        stream: jest.fn(),
      };

      const client = new BridgeClient(config, { transport: mockTransport });
      client.registerProvider(mockProviderPlugin);
      client.getModelRegistry().register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: false,
          documents: false,
          temperature: true,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      const request: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "openai:gpt-4",
        providerConfig: "default",
      };

      await client.chat(request);

      // Provider should be initialized without configuration name in tracking key
      expect(initializeSpy).toHaveBeenCalledWith({
        apiKey: "sk-key",
      });
      expect(initializeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
