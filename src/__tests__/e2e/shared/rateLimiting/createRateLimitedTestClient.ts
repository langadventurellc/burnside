import { BridgeClient } from "../../../../client/bridgeClient";
import type { BridgeConfig } from "../../../../core/config/bridgeConfig";
import type { RateLimitConfig } from "../../../../core/transport/rateLimiting/rateLimitConfig";
import { AnthropicMessagesV1Provider } from "../../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider";
import { OpenAIResponsesV1Provider } from "../../../../providers/openai-responses-v1/openAIResponsesV1Provider";
import { GoogleGeminiV1Provider } from "../../../../providers/google-gemini-v1/index";
import { XAIV1Provider } from "../../../../providers/xai-v1/xaiV1Provider";
import { loadAnthropicTestConfig } from "../anthropicTestConfig";
import { loadTestConfig as loadOpenAITestConfig } from "../openAITestConfig";
import { loadGoogleTestConfig } from "../googleTestConfig";
import { loadXaiTestConfig } from "../xaiTestConfig";
import type { RateLimitingProvider } from "./rateLimitingProvider";

/**
 * Creates a BridgeClient configured for rate limiting tests
 *
 * @param provider - The provider to configure for testing
 * @param rateLimitConfig - Rate limiting configuration to apply
 * @param providerOverrides - Additional provider-specific config overrides
 * @returns Configured BridgeClient with rate limiting enabled
 *
 * @example
 * ```typescript
 * const client = createRateLimitedTestClient("openai", {
 *   enabled: true,
 *   maxRps: 2,
 *   scope: "provider"
 * });
 * ```
 */
export function createRateLimitedTestClient(
  provider: RateLimitingProvider,
  rateLimitConfig: RateLimitConfig,
  providerOverrides?: Partial<BridgeConfig>,
): BridgeClient {
  let baseConfig: BridgeConfig;
  let providerInstance;

  switch (provider) {
    case "openai": {
      const testConfig = loadOpenAITestConfig();
      baseConfig = {
        defaultProvider: "openai",
        providers: {
          openai: {
            default: { apiKey: testConfig.openaiApiKey },
          },
        },
        options: {
          logging: {
            enabled: false,
            // level: "debug",
          },
        },
      };
      providerInstance = new OpenAIResponsesV1Provider();
      break;
    }
    case "anthropic": {
      const testConfig = loadAnthropicTestConfig();
      baseConfig = {
        defaultProvider: "anthropic",
        providers: {
          anthropic: {
            default: { apiKey: testConfig.anthropicApiKey },
          },
        },
        options: {
          logging: {
            enabled: false,
            // level: "debug",
          },
        },
      };
      providerInstance = new AnthropicMessagesV1Provider();
      break;
    }
    case "google": {
      const testConfig = loadGoogleTestConfig();
      baseConfig = {
        defaultProvider: "google",
        providers: {
          google: {
            default: { apiKey: testConfig.googleApiKey },
          },
        },
        options: {
          logging: {
            enabled: false,
            // level: "debug",
          },
        },
      };
      providerInstance = new GoogleGeminiV1Provider();
      break;
    }
    case "xai": {
      const testConfig = loadXaiTestConfig();
      baseConfig = {
        defaultProvider: "xai",
        providers: {
          xai: {
            default: { apiKey: testConfig.xaiApiKey },
          },
        },
        options: {
          logging: {
            enabled: false,
            // level: "debug",
          },
        },
      };
      providerInstance = new XAIV1Provider();
      break;
    }
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported provider: ${String(exhaustiveCheck)}`);
    }
  }

  const config: BridgeConfig = {
    ...baseConfig,
    modelSeed: "builtin",
    tools: {
      enabled: true,
      builtinTools: ["echo"],
    },
    rateLimitPolicy: {
      enabled: rateLimitConfig.enabled,
      maxRps: rateLimitConfig.maxRps,
      burst: rateLimitConfig.burst,
      scope: rateLimitConfig.scope,
    },
    ...providerOverrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(providerInstance);
  return client;
}
