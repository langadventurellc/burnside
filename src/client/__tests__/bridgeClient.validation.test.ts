import { BridgeClient } from "../bridgeClient";
import { BridgeError } from "../../core/errors/bridgeError";
import type { BridgeConfig } from "../../core/config/bridgeConfig";

describe("BridgeClient - Provider Configuration Validation", () => {
  describe("validateProviderConfigRequirement", () => {
    it("should pass validation when single configuration exists and providerConfig is omitted", () => {
      // Single configuration setup
      const config: BridgeConfig = {
        providers: {
          anthropic: {
            default: { apiKey: "sk-ant-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("anthropic", "default")).not.toThrow();
    });

    it("should pass validation when single configuration exists and providerConfig is provided", () => {
      const config: BridgeConfig = {
        providers: {
          anthropic: {
            default: { apiKey: "sk-ant-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("anthropic", "default")).not.toThrow();
    });

    it("should throw PROVIDER_CONFIG_MISSING error when no configurations exist for provider", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("nonexistent", "default")).toThrow(BridgeError);
      expect(() => validate("nonexistent", "default")).toThrow(
        /No configurations found for provider/,
      );

      try {
        validate("nonexistent", "default");
      } catch (error) {
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("PROVIDER_CONFIG_MISSING");
        expect(bridgeError.context).toEqual({
          providerId: "nonexistent",
          availableProviders: ["openai"],
        });
      }
    });

    it("should pass validation when multiple configurations exist and valid providerConfig is provided", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("openai", "prod")).not.toThrow();
      expect(() => validate("openai", "dev")).not.toThrow();
    });

    it("should throw INVALID_PROVIDER_CONFIG error when invalid providerConfig is provided", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("openai", "invalid")).toThrow(BridgeError);
      expect(() => validate("openai", "invalid")).toThrow(
        /Invalid provider configuration 'invalid'/,
      );

      try {
        validate("openai", "invalid");
      } catch (error) {
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("INVALID_PROVIDER_CONFIG");
        expect(bridgeError.context).toEqual({
          providerId: "openai",
          requestedConfig: "invalid",
          availableConfigs: ["prod", "dev"],
        });
        expect(bridgeError.message).toContain("prod, dev");
      }
    });

    it("should throw INVALID_PROVIDER_CONFIG error for single configuration with wrong name", () => {
      const config: BridgeConfig = {
        providers: {
          anthropic: {
            default: { apiKey: "sk-ant-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const validate = (client as any).validateProviderConfig.bind(client);

      expect(() => validate("anthropic", "wrong")).toThrow(BridgeError);
      expect(() => validate("anthropic", "wrong")).toThrow(
        /Invalid provider configuration 'wrong'/,
      );

      try {
        validate("anthropic", "wrong");
      } catch (error) {
        const bridgeError = error as BridgeError;
        expect(bridgeError.code).toBe("INVALID_PROVIDER_CONFIG");
        expect(bridgeError.context).toEqual({
          providerId: "anthropic",
          requestedConfig: "wrong",
          availableConfigs: ["default"],
        });
      }
    });
  });

  describe("getConfigurationsForProvider", () => {
    it("should return configuration names for provider with multiple configs", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            prod: { apiKey: "sk-prod-key" },
            dev: { apiKey: "sk-dev-key" },
            staging: { apiKey: "sk-staging-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const getConfigs = (client as any).getConfigurationsForProvider.bind(
        client,
      );

      const configs = getConfigs("openai");
      expect(configs).toEqual(
        expect.arrayContaining(["prod", "dev", "staging"]),
      );
      expect(configs).toHaveLength(3);
    });

    it("should return single configuration name for provider with one config", () => {
      const config: BridgeConfig = {
        providers: {
          anthropic: {
            default: { apiKey: "sk-ant-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const getConfigs = (client as any).getConfigurationsForProvider.bind(
        client,
      );

      const configs = getConfigs("anthropic");
      expect(configs).toEqual(["default"]);
    });

    it("should return empty array for non-existent provider", () => {
      const config: BridgeConfig = {
        providers: {
          openai: {
            default: { apiKey: "sk-key" },
          },
        },
      };

      const client = new BridgeClient(config);
      const getConfigs = (client as any).getConfigurationsForProvider.bind(
        client,
      );

      const configs = getConfigs("nonexistent");
      expect(configs).toEqual([]);
    });
  });
});
