import { BridgeClient } from "../bridgeClient";
import { BridgeError } from "../../core/errors/bridgeError";
import type { BridgeConfig } from "../../core/config/bridgeConfig";

describe("BridgeClient - Nested Configuration Validation", () => {
  describe("validateAndTransformConfig with nested provider structure", () => {
    it("should transform nested provider configurations to flattened keys", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
          anthropic: {
            main: { apiKey: "sk-ant-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.providers.has("openai.prod")).toBe(true);
      expect(clientConfig.providers.has("openai.dev")).toBe(true);
      expect(clientConfig.providers.has("anthropic.main")).toBe(true);
      expect(clientConfig.providers.get("openai.prod")).toEqual({
        apiKey: "sk-prod-key",
      });
      expect(clientConfig.providers.get("openai.dev")).toEqual({
        apiKey: "sk-dev-key",
      });
      expect(clientConfig.providers.get("anthropic.main")).toEqual({
        apiKey: "sk-ant-key",
      });
    });

    it("should validate nested configuration structure", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: null as any, // Invalid config object
          },
        },
      };

      expect(() => new BridgeClient(config)).toThrow(BridgeError);
      expect(() => new BridgeClient(config)).toThrow(/must be an object/);
    });

    it("should handle empty named configurations", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {}, // No named configurations
        },
      };

      expect(() => new BridgeClient(config)).toThrow(BridgeError);
      expect(() => new BridgeClient(config)).toThrow(
        /has no configurations defined/,
      );
    });

    it("should validate that provider configurations are objects", () => {
      const config: BridgeConfig = {
        providers: {
          openai: "invalid" as any, // Should be object with named configs
        },
      };

      expect(() => new BridgeClient(config)).toThrow(BridgeError);
      expect(() => new BridgeClient(config)).toThrow(
        /must be an object with named configurations/,
      );
    });
  });

  describe("provider resolution with flattened keys", () => {
    let client: BridgeClient;

    beforeEach(() => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
          anthropic: {
            main: { apiKey: "sk-ant-key" },
          },
        },
      };
      client = new BridgeClient(config);
    });

    it("should resolve provider config without providerConfig parameter for single config", () => {
      // Access the private method for testing purposes
      const getProviderConfig = (client as any).getProviderConfigOrThrow.bind(
        client,
      );

      const config = getProviderConfig("anthropic");
      expect(config).toEqual({ apiKey: "sk-ant-key" });
    });

    it("should throw error for multiple configs without providerConfig parameter", () => {
      const getProviderConfig = (client as any).getProviderConfigOrThrow.bind(
        client,
      );

      expect(() => getProviderConfig("openai")).toThrow(BridgeError);
      expect(() => getProviderConfig("openai")).toThrow(
        /Provider configuration name required/,
      );
    });

    it("should resolve specific config with providerConfig parameter", () => {
      const getProviderConfig = (client as any).getProviderConfigOrThrow.bind(
        client,
      );

      const prodConfig = getProviderConfig("openai", "prod");
      const devConfig = getProviderConfig("openai", "dev");

      expect(prodConfig).toEqual({ apiKey: "sk-prod-key" });
      expect(devConfig).toEqual({ apiKey: "sk-dev-key" });
    });

    it("should throw error for non-existent provider", () => {
      const getProviderConfig = (client as any).getProviderConfigOrThrow.bind(
        client,
      );

      expect(() => getProviderConfig("nonexistent")).toThrow(BridgeError);
      expect(() => getProviderConfig("nonexistent")).toThrow(
        /No configurations found/,
      );
    });

    it("should throw error for non-existent provider config", () => {
      const getProviderConfig = (client as any).getProviderConfigOrThrow.bind(
        client,
      );

      expect(() => getProviderConfig("openai", "nonexistent")).toThrow(
        BridgeError,
      );
      expect(() => getProviderConfig("openai", "nonexistent")).toThrow(
        /Configuration.*not found/,
      );
    });
  });

  describe("error messages", () => {
    it("should provide helpful error for invalid nested structure", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: "invalid" as any,
          },
        },
      };

      expect(() => new BridgeClient(config)).toThrow(BridgeError);

      try {
        new BridgeClient(config);
      } catch (error) {
        expect(error).toBeInstanceOf(BridgeError);
        const bridgeError = error as BridgeError;
        expect(bridgeError.context).toEqual({
          providerType: "openai",
          configName: "prod",
          providedValue: "invalid",
        });
      }
    });
  });
});
