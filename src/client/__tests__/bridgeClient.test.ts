import { BridgeClient } from "../bridgeClient";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import { BridgeError } from "../../core/errors/bridgeError";
import type { ProviderPlugin } from "../../core/providers/providerPlugin";
import type { ProviderRegistry } from "../../core/providers/providerRegistry";
import type { ModelRegistry } from "../../core/models/modelRegistry";
import type { HttpTransport } from "../../core/transport/index";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse";
import { InMemoryProviderRegistry } from "../../core/providers/inMemoryProviderRegistry";
import { InMemoryModelRegistry } from "../../core/models/inMemoryModelRegistry";
import { TransportError } from "../../core/errors/transportError";
import { AuthError } from "../../core/errors/authError";

describe("BridgeClient", () => {
  const validConfig: BridgeConfig = {
    defaultProvider: "openai",
    providers: {
      openai: { apiKey: "sk-test" },
    },
    defaultModel: "gpt-4",
    timeout: 30000,
  };

  describe("constructor", () => {
    it("should create instance with valid configuration", () => {
      expect(() => new BridgeClient(validConfig)).not.toThrow();
    });

    it("should create instance with minimal configuration", () => {
      const minimalConfig: BridgeConfig = {
        defaultProvider: "test",
        providers: {
          test: { apiKey: "test-key" },
        },
      };

      expect(() => new BridgeClient(minimalConfig)).not.toThrow();
    });

    it("should throw error when no provider specified", () => {
      const invalidConfig: BridgeConfig = {};

      expect(() => new BridgeClient(invalidConfig)).toThrow(BridgeError);
      expect(() => new BridgeClient(invalidConfig)).toThrow(
        "Configuration must specify either defaultProvider or providers",
      );
    });

    it("should throw error when defaultProvider not found in providers", () => {
      const invalidConfig: BridgeConfig = {
        defaultProvider: "nonexistent",
        providers: {
          openai: { apiKey: "test" },
        },
      };

      expect(() => new BridgeClient(invalidConfig)).toThrow(BridgeError);
    });

    it("should throw error for invalid timeout", () => {
      const invalidConfig: BridgeConfig = {
        ...validConfig,
        timeout: 500, // Too low
      };

      expect(() => new BridgeClient(invalidConfig)).toThrow(BridgeError);
      expect(() => new BridgeClient(invalidConfig)).toThrow(
        "Timeout must be between 1000ms and 300000ms",
      );
    });

    it("should throw error for excessive timeout", () => {
      const invalidConfig: BridgeConfig = {
        ...validConfig,
        timeout: 400000, // Too high
      };

      expect(() => new BridgeClient(invalidConfig)).toThrow(BridgeError);
      expect(() => new BridgeClient(invalidConfig)).toThrow(
        "Timeout must be between 1000ms and 300000ms",
      );
    });

    it("should use providers as default when no defaultProvider specified", () => {
      const config: BridgeConfig = {
        providers: {
          openai: { apiKey: "test" },
          anthropic: { apiKey: "test" },
        },
      };

      const client = new BridgeClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.defaultProvider).toBeTruthy();
      expect(["openai", "anthropic"]).toContain(clientConfig.defaultProvider);
    });
  });

  describe("getConfig method", () => {
    it("should return readonly configuration", () => {
      const client = new BridgeClient(validConfig);
      const config = client.getConfig();

      expect(config.defaultProvider).toBe("openai");
      expect(config.defaultModel).toBe("gpt-4");
      expect(config.timeout).toBe(30000);
      expect(config.validated).toBe(true);
    });

    it("should return frozen configuration object", () => {
      const client = new BridgeClient(validConfig);
      const config = client.getConfig();

      expect(Object.isFrozen(config)).toBe(true);
    });

    it("should transform providers to Map", () => {
      const client = new BridgeClient(validConfig);
      const config = client.getConfig();

      expect(config.providers).toBeInstanceOf(Map);
      expect(config.providers.has("openai")).toBe(true);
      expect(config.providers.get("openai")).toEqual({ apiKey: "sk-test" });
    });

    it("should set default model when not provided", () => {
      const configWithoutModel: BridgeConfig = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "test" },
        },
      };

      const client = new BridgeClient(configWithoutModel);
      const config = client.getConfig();

      expect(config.defaultModel).toBe("gpt-3.5-turbo"); // Default fallback
    });

    it("should set default timeout when not provided", () => {
      const configWithoutTimeout: BridgeConfig = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "test" },
        },
      };

      const client = new BridgeClient(configWithoutTimeout);
      const config = client.getConfig();

      expect(config.timeout).toBe(30000); // Default 30 seconds
    });
  });

  describe("configuration validation", () => {
    it("should validate and transform complex configuration", () => {
      const complexConfig: BridgeConfig = {
        defaultProvider: "openai",
        providers: {
          openai: {
            apiKey: "sk-openai-test",
            baseURL: "https://api.openai.com",
            organization: "org-test",
          },
          anthropic: {
            apiKey: "sk-ant-test",
            baseURL: "https://api.anthropic.com",
          },
        },
        defaultModel: "gpt-4-turbo",
        timeout: 45000,
        options: {
          retries: 3,
          logging: { level: "debug" },
        },
      };

      const client = new BridgeClient(complexConfig);
      const config = client.getConfig();

      expect(config.defaultProvider).toBe("openai");
      expect(config.defaultModel).toBe("gpt-4-turbo");
      expect(config.timeout).toBe(45000);
      expect(config.providers.size).toBe(2);
      expect(config.options.retries).toBe(3);
      expect((config.options.logging as any).level).toBe("debug");
    });

    it("should handle empty options gracefully", () => {
      const configWithoutOptions: BridgeConfig = {
        defaultProvider: "test",
        providers: {
          test: { apiKey: "test" },
        },
      };

      const client = new BridgeClient(configWithoutOptions);
      const config = client.getConfig();

      expect(config.options).toEqual({});
    });

    it("should include default registry options when not provided", () => {
      const client = new BridgeClient(validConfig);
      const config = client.getConfig();

      expect(config.registryOptions).toBeDefined();
      expect(config.registryOptions.providers).toEqual({});
      expect(config.registryOptions.models).toEqual({});
    });

    it("should include provided registry options", () => {
      const configWithRegistryOptions: BridgeConfig = {
        ...validConfig,
        registryOptions: {
          providers: { customProvider: "config" },
          models: { customModel: "config" },
        },
      };

      const client = new BridgeClient(configWithRegistryOptions);
      const config = client.getConfig();

      expect(config.registryOptions.providers).toEqual({
        customProvider: "config",
      });
      expect(config.registryOptions.models).toEqual({
        customModel: "config",
      });
    });

    it("should handle partial registry options", () => {
      const configWithPartialRegistryOptions: BridgeConfig = {
        ...validConfig,
        registryOptions: {
          providers: { test: "value" },
          // models omitted
        },
      };

      const client = new BridgeClient(configWithPartialRegistryOptions);
      const config = client.getConfig();

      expect(config.registryOptions.providers).toEqual({ test: "value" });
      expect(config.registryOptions.models).toEqual({});
    });
  });

  describe("error handling", () => {
    it("should include proper context in validation errors", () => {
      const invalidConfig: BridgeConfig = {
        timeout: 500, // Invalid
      };

      try {
        new BridgeClient(invalidConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).code).toBe("INVALID_CONFIG");
        expect((error as BridgeError).context).toBeDefined();
      }
    });

    it("should provide helpful error messages", () => {
      const invalidConfig: BridgeConfig = {};

      try {
        new BridgeClient(invalidConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).message).toContain(
          "Configuration must specify",
        );
      }
    });
  });

  describe("chat() method", () => {
    let fakePlugin: jest.Mocked<ProviderPlugin>;
    let fakeTransport: jest.Mocked<HttpTransport>;
    let providerRegistry: ProviderRegistry;
    let modelRegistry: ModelRegistry;
    let client: BridgeClient;

    beforeEach(() => {
      // Create fake plugin
      fakePlugin = {
        id: "openai",
        name: "OpenAI Provider",
        version: "responses-v1",
        initialize: jest.fn().mockResolvedValue(undefined),
        translateRequest: jest.fn().mockReturnValue({
          url: "https://api.openai.com/v1/responses",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "test-model", messages: [] }),
        }),
        parseResponse: jest.fn().mockResolvedValue({
          message: {
            role: "assistant",
            content: [{ type: "text", text: "ok" }],
          },
          model: "gpt-x",
        }),
        isTerminal: jest.fn(),
        normalizeError: jest.fn((e) => new TransportError(String(e))),
      } as jest.Mocked<ProviderPlugin>;

      // Create fake transport
      fakeTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: {},
          body: new ReadableStream(),
        } as ProviderHttpResponse),
        stream: jest.fn().mockResolvedValue(
          (function* () {
            yield new Uint8Array([]);
          })(),
        ),
      } as unknown as jest.Mocked<HttpTransport>;

      // Create registries and register test data
      providerRegistry = new InMemoryProviderRegistry();
      modelRegistry = new InMemoryModelRegistry();

      providerRegistry.register(fakePlugin);
      modelRegistry.register("openai:test-model", {
        id: "openai:test-model",
        name: "Test Model",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: false,
          images: false,
          documents: false,
          maxTokens: 4096,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      // Create client with injected dependencies
      client = new BridgeClient(validConfig, {
        transport: fakeTransport,
        providerRegistry,
        modelRegistry,
      });
    });

    it("should successfully complete a chat request", async () => {
      // Act
      const result = await client.chat({
        model: "openai:test-model",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      // Assert
      expect(result).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "ok" }],
      });

      // Verify call sequence
      expect(fakePlugin.translateRequest).toHaveBeenCalledWith({
        model: "test-model",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        stream: false,
      });

      expect(fakeTransport.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://api.openai.com/v1/responses",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: expect.any(AbortSignal),
        }),
      );

      expect(fakePlugin.parseResponse).toHaveBeenCalledWith(
        expect.objectContaining({ status: 200 }),
        false,
      );
    });

    it("should qualify model ID with default provider", async () => {
      // Act
      await client.chat({
        model: "test-model", // No provider prefix
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      // Assert - should call with qualified model
      expect(fakePlugin.translateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "test-model", // Provider prefix stripped for translation
        }),
      );
    });

    it("should initialize provider only once", async () => {
      // Act - make two requests
      await client.chat({
        model: "openai:test-model",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      await client.chat({
        model: "openai:test-model",
        messages: [
          { role: "user", content: [{ type: "text", text: "hello" }] },
        ],
      });

      // Assert - initialize called only once
      expect(fakePlugin.initialize).toHaveBeenCalledTimes(1);
      expect(fakePlugin.initialize).toHaveBeenCalledWith({ apiKey: "sk-test" });
    });

    it("should normalize network errors via plugin", async () => {
      // Arrange
      const networkError = new Error("network down");
      fakeTransport.fetch.mockRejectedValue(networkError);
      fakePlugin.normalizeError.mockReturnValue(
        new TransportError("Network connection failed"),
      );

      // Act & Assert
      await expect(
        client.chat({
          model: "openai:test-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(TransportError);

      // Verify normalization was called
      expect(fakePlugin.normalizeError).toHaveBeenCalledWith(networkError);
      expect(fakePlugin.parseResponse).not.toHaveBeenCalled();
    });

    it("should handle provider errors from parsing", async () => {
      // Arrange
      const providerHttpResponse = {
        status: 401,
        statusText: "Unauthorized",
        headers: { "content-type": "application/json" },
        body: new ReadableStream(),
      };
      fakeTransport.fetch.mockResolvedValue(providerHttpResponse);
      const parseError = new AuthError("Invalid API key");
      fakePlugin.parseResponse.mockRejectedValue(parseError);
      fakePlugin.normalizeError.mockReturnValue(parseError); // Return the same error

      // Act & Assert
      await expect(
        client.chat({
          model: "openai:test-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(AuthError);

      // Verify parseResponse was called and normalizeError was called
      expect(fakePlugin.parseResponse).toHaveBeenCalledWith(
        providerHttpResponse,
        false,
      );
      expect(fakePlugin.normalizeError).toHaveBeenCalledWith(parseError);
    });

    it("should throw error for unregistered model", async () => {
      // Act & Assert
      await expect(
        client.chat({
          model: "openai:unknown-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(BridgeError);

      // Verify no provider calls were made
      expect(fakePlugin.translateRequest).not.toHaveBeenCalled();
      expect(fakeTransport.fetch).not.toHaveBeenCalled();
    });
  });

  describe("stream() method", () => {
    let fakePlugin: jest.Mocked<ProviderPlugin>;
    let fakeTransport: jest.Mocked<HttpTransport>;
    let providerRegistry: ProviderRegistry;
    let modelRegistry: ModelRegistry;
    let client: BridgeClient;

    beforeEach(() => {
      // Create fake plugin
      fakePlugin = {
        id: "openai",
        name: "OpenAI Provider",
        version: "responses-v1",
        initialize: jest.fn().mockResolvedValue(undefined),
        translateRequest: jest.fn().mockReturnValue({
          url: "https://api.openai.com/v1/responses",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "test-model",
            messages: [],
            stream: true,
          }),
        }),
        parseResponse: jest.fn().mockReturnValue(
          (function* () {
            yield {
              id: "chunk-1",
              delta: { content: [{ type: "text", text: "Hello" }] },
              finished: false,
            };
            yield {
              id: "chunk-2",
              delta: { content: [{ type: "text", text: " world" }] },
              finished: true,
            };
          })(),
        ),
        isTerminal: jest.fn(),
        normalizeError: jest.fn((e) => new TransportError(String(e))),
      } as unknown as jest.Mocked<ProviderPlugin>;

      // Create fake transport
      fakeTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: {},
          body: new ReadableStream(),
        } as ProviderHttpResponse),
        stream: jest.fn().mockResolvedValue(
          (function* () {
            yield new Uint8Array([]);
          })(),
        ),
      } as unknown as jest.Mocked<HttpTransport>;

      // Create registries and register test data
      providerRegistry = new InMemoryProviderRegistry();
      modelRegistry = new InMemoryModelRegistry();

      providerRegistry.register(fakePlugin);
      modelRegistry.register("openai:test-model", {
        id: "openai:test-model",
        name: "Test Model",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: false,
          images: false,
          documents: false,
          maxTokens: 4096,
          supportedContentTypes: ["text"],
        },
        metadata: {
          providerPlugin: "openai-responses-v1",
        },
      });

      // Create client with injected dependencies
      client = new BridgeClient(validConfig, {
        transport: fakeTransport,
        providerRegistry,
        modelRegistry,
      });
    });

    it("should successfully stream chat completion", async () => {
      // Act
      const stream = await client.stream({
        model: "openai:test-model",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      // Consume the stream
      const chunks = [];
      for await (const delta of stream) {
        chunks.push(delta);
      }

      // Assert
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({
        id: "chunk-1",
        delta: { content: [{ type: "text", text: "Hello" }] },
        finished: false,
      });
      expect(chunks[1]).toEqual({
        id: "chunk-2",
        delta: { content: [{ type: "text", text: " world" }] },
        finished: true,
      });

      // Verify call sequence
      expect(fakePlugin.translateRequest).toHaveBeenCalledWith(
        {
          model: "test-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
          stream: true,
        },
        { temperature: undefined },
      );

      expect(fakeTransport.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://api.openai.com/v1/responses",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: expect.any(AbortSignal),
        }),
      );

      expect(fakePlugin.parseResponse).toHaveBeenCalledWith(
        expect.objectContaining({ status: 200 }),
        true,
      );
    });

    it("should handle network errors during streaming", async () => {
      // Arrange
      const networkError = new Error("network down");
      fakeTransport.fetch.mockRejectedValue(networkError);
      fakePlugin.normalizeError.mockReturnValue(
        new TransportError("Network connection failed"),
      );

      // Act & Assert
      await expect(
        client.stream({
          model: "openai:test-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(TransportError);

      // Verify normalization was called
      expect(fakePlugin.normalizeError).toHaveBeenCalledWith(networkError);
      expect(fakePlugin.parseResponse).not.toHaveBeenCalled();
    });

    it("should handle provider errors from parse response", async () => {
      // Arrange
      const providerHttpResponse = {
        status: 401,
        statusText: "Unauthorized",
        headers: { "content-type": "application/json" },
        body: new ReadableStream(),
      };
      fakeTransport.fetch.mockResolvedValue(providerHttpResponse);
      const parseError = new AuthError("Invalid API key");
      fakePlugin.parseResponse.mockImplementation(() => {
        throw parseError;
      });
      fakePlugin.normalizeError.mockReturnValue(parseError); // Return the same error

      // Act & Assert
      await expect(
        client.stream({
          model: "openai:test-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(AuthError);

      // Verify parseResponse was called and normalizeError was called
      expect(fakePlugin.parseResponse).toHaveBeenCalledWith(
        providerHttpResponse,
        true,
      );
      expect(fakePlugin.normalizeError).toHaveBeenCalledWith(parseError);
    });

    it("should throw error for unregistered model", async () => {
      // Act & Assert
      await expect(
        client.stream({
          model: "openai:unknown-model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(BridgeError);

      // Verify no provider calls were made
      expect(fakePlugin.translateRequest).not.toHaveBeenCalled();
      expect(fakeTransport.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Provider Plugin Mapping", () => {
    let fakeOpenAIPlugin: jest.Mocked<ProviderPlugin>;
    let fakeAnthropicPlugin: jest.Mocked<ProviderPlugin>;
    let fakeTransport: jest.Mocked<HttpTransport>;
    let providerRegistry: ProviderRegistry;
    let modelRegistry: ModelRegistry;
    let client: BridgeClient;

    const testConfig: BridgeConfig = {
      defaultProvider: "openai",
      providers: {
        openai: { apiKey: "sk-test" },
        anthropic: { apiKey: "sk-ant-test" },
      },
      defaultModel: "gpt-4",
      timeout: 30000,
    };

    beforeEach(() => {
      // Create fake OpenAI plugin
      fakeOpenAIPlugin = {
        id: "openai",
        version: "responses-v1",
        name: "OpenAI Responses V1 Provider",
        initialize: jest.fn().mockResolvedValue(undefined),
        supportsModel: jest.fn().mockReturnValue(true),
        translateRequest: jest.fn().mockReturnValue({
          url: "https://api.openai.com/v1/chat/completions",
          method: "POST",
          headers: { Authorization: "Bearer sk-test" },
          body: '{"model":"gpt-4","messages":[]}',
        }),
        parseResponse: jest.fn(),
        isTerminal: jest.fn().mockReturnValue(true),
        normalizeError: jest.fn(),
      };

      // Create fake Anthropic plugin
      fakeAnthropicPlugin = {
        id: "anthropic",
        version: "2023-06-01",
        name: "Anthropic Messages Provider",
        initialize: jest.fn().mockResolvedValue(undefined),
        supportsModel: jest.fn().mockReturnValue(true),
        translateRequest: jest.fn().mockReturnValue({
          url: "https://api.anthropic.com/v1/messages",
          method: "POST",
          headers: {
            "x-api-key": "sk-ant-test",
            "anthropic-version": "2023-06-01",
          },
          body: '{"model":"claude-sonnet-4-20250514","messages":[]}',
        }),
        parseResponse: jest.fn(),
        isTerminal: jest.fn().mockReturnValue(true),
        normalizeError: jest.fn(),
      };

      // Create fake transport
      fakeTransport = {
        fetch: jest.fn().mockResolvedValue({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: new ReadableStream(),
        } as ProviderHttpResponse),
        stream: jest.fn().mockResolvedValue(
          (function* () {
            yield new Uint8Array([]);
          })(),
        ),
      } as unknown as jest.Mocked<HttpTransport>;

      // Create registries and register test data
      providerRegistry = new InMemoryProviderRegistry();
      modelRegistry = new InMemoryModelRegistry();

      providerRegistry.register(fakeOpenAIPlugin);
      providerRegistry.register(fakeAnthropicPlugin);

      // Register models with provider plugin metadata
      modelRegistry.register("openai:gpt-4", {
        id: "openai:gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: true,
          documents: false,
          temperature: true,
          maxTokens: 128000,
          supportedContentTypes: ["text", "image"],
        },
        metadata: { providerPlugin: "openai-responses-v1" },
      });

      modelRegistry.register("anthropic:claude-sonnet", {
        id: "anthropic:claude-sonnet",
        name: "Claude Sonnet",
        provider: "anthropic",
        capabilities: {
          streaming: true,
          toolCalls: true,
          images: true,
          documents: true,
          temperature: true,
          maxTokens: 200000,
          supportedContentTypes: ["text", "image"],
        },
        metadata: { providerPlugin: "anthropic-2023-06-01" },
      });

      // Create client with custom registries
      client = new BridgeClient(testConfig, {
        transport: fakeTransport,
        providerRegistry,
        modelRegistry,
      });
    });

    it("should map 'openai-responses-v1' to OpenAI provider", async () => {
      // Arrange
      fakeOpenAIPlugin.parseResponse.mockResolvedValue({
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello from OpenAI!" }],
        },
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "gpt-4",
      });

      // Act
      await client.chat({
        model: "openai:gpt-4",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      // Assert
      expect(fakeOpenAIPlugin.translateRequest).toHaveBeenCalled();
      expect(fakeAnthropicPlugin.translateRequest).not.toHaveBeenCalled();
    });

    it("should map 'anthropic-2023-06-01' to Anthropic provider", async () => {
      // Arrange
      fakeAnthropicPlugin.parseResponse.mockResolvedValue({
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hello from Claude!" }],
        },
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: "claude-sonnet-4-20250514",
      });

      // Act
      await client.chat({
        model: "anthropic:claude-sonnet",
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      });

      // Assert
      expect(fakeAnthropicPlugin.translateRequest).toHaveBeenCalled();
      expect(fakeOpenAIPlugin.translateRequest).not.toHaveBeenCalled();
    });

    it("should throw error for unknown provider plugin", async () => {
      // Arrange
      modelRegistry.register("unknown:model", {
        id: "unknown:model",
        name: "Unknown Model",
        provider: "unknown",
        capabilities: {
          streaming: false,
          toolCalls: false,
          images: false,
          documents: false,
          supportedContentTypes: ["text"],
        },
        metadata: { providerPlugin: "unknown-provider-v1" },
      });

      // Act & Assert
      await expect(
        client.chat({
          model: "unknown:model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(BridgeError);
    });

    it("should throw error for model without provider plugin metadata", async () => {
      // Arrange
      modelRegistry.register("no-plugin:model", {
        id: "no-plugin:model",
        name: "No Plugin Model",
        provider: "unknown",
        capabilities: {
          streaming: false,
          toolCalls: false,
          images: false,
          documents: false,
          supportedContentTypes: ["text"],
        },
        // Missing metadata.providerPlugin
      });

      // Act & Assert
      await expect(
        client.chat({
          model: "no-plugin:model",
          messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        }),
      ).rejects.toThrow(BridgeError);
    });
  });
});
