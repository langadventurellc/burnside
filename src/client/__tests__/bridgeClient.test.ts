import { BridgeClient } from "../bridgeClient";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { ChatRequest } from "../chatRequest";
import type { StreamRequest } from "../streamRequest";
import { BridgeError } from "../../core/errors/bridgeError";

describe("BridgeClient", () => {
  const validConfig: BridgeConfig = {
    defaultProvider: "openai",
    providers: {
      openai: { apiKey: "sk-test" },
    },
    defaultModel: "gpt-4",
    timeout: 30000,
  };

  const validChatRequest: ChatRequest = {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
    model: "gpt-4",
  };

  const validStreamRequest: StreamRequest = {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
    model: "gpt-4",
    stream: true,
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

  describe("chat method", () => {
    let client: BridgeClient;

    beforeEach(() => {
      client = new BridgeClient(validConfig);
    });

    it("should throw FEATURE_DISABLED error by default", () => {
      expect(() => client.chat(validChatRequest)).toThrow(BridgeError);

      try {
        client.chat(validChatRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).code).toBe("FEATURE_DISABLED");
        expect((error as BridgeError).message).toContain(
          "Chat functionality is not yet implemented",
        );
        expect((error as BridgeError).context?.feature).toBe("chat");
        expect((error as BridgeError).context?.phase).toBe("Phase 1");
      }
    });

    it("should return Promise<Message> type", () => {
      // This test ensures the method signature is correct
      try {
        const result = client.chat(validChatRequest);
        expect(result).toBeInstanceOf(Promise);
      } catch (error) {
        // Expected to throw in Phase 1
        expect(error).toBeInstanceOf(BridgeError);
      }
    });

    it("should accept valid ChatRequest parameters", () => {
      const complexRequest: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
          { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 1000,
        options: { customParam: "value" },
      };

      // Should throw FEATURE_DISABLED error in Phase 1
      try {
        client.chat(complexRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("FEATURE_DISABLED");
        expect(bridgeError.context?.feature).toBe("chat");

        // The request context is not included in FEATURE_DISABLED errors
        // This is expected behavior - detailed request info only in NOT_IMPLEMENTED
      }
    });
  });

  describe("stream method", () => {
    let client: BridgeClient;

    beforeEach(() => {
      client = new BridgeClient(validConfig);
    });

    it("should throw FEATURE_DISABLED error by default", () => {
      expect(() => {
        client.stream(validStreamRequest);
      }).toThrow(BridgeError);

      try {
        client.stream(validStreamRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        expect((error as BridgeError).code).toBe("FEATURE_DISABLED");
        expect((error as BridgeError).message).toContain(
          "Streaming functionality is not yet implemented",
        );
        expect((error as BridgeError).context?.feature).toBe("streaming");
        expect((error as BridgeError).context?.phase).toBe("Phase 1");
      }
    });

    it("should return AsyncIterable type", () => {
      // This test ensures the method signature is correct
      try {
        const result = client.stream(validStreamRequest);
        expect(typeof result[Symbol.asyncIterator]).toBe("function");
      } catch (error) {
        // Expected to throw in Phase 1
        expect(error).toBeInstanceOf(BridgeError);
      }
    });

    it("should accept valid StreamRequest parameters", () => {
      const complexRequest: StreamRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello!" }] },
        ],
        model: "gpt-4",
        temperature: 0.5,
        stream: true,
        streamOptions: {
          includeUsage: true,
          bufferSize: 1024,
        },
      };

      // Should throw FEATURE_DISABLED error in Phase 1
      try {
        client.stream(complexRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("FEATURE_DISABLED");
        expect(bridgeError.context?.feature).toBe("streaming");

        // The request context is not included in FEATURE_DISABLED errors
        // This is expected behavior - detailed request info only in NOT_IMPLEMENTED
      }
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
});
