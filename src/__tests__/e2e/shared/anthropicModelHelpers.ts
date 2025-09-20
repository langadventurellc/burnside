import { BridgeClient } from "../../../client/bridgeClient";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { AnthropicMessagesV1Provider } from "../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider";
import { loadAnthropicTestConfig } from "./anthropicTestConfig";

export function createAnthropicTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadAnthropicTestConfig();

  const config: BridgeConfig = {
    defaultProvider: "anthropic",
    providers: {
      anthropic: { apiKey: testConfig.anthropicApiKey },
    },
    modelSeed: "builtin", // Explicitly use builtin seed to populate registry
    tools: {
      enabled: true,
      builtinTools: ["echo"], // Required when tools enabled per schema
    },
    options: {
      logging: {
        enabled: true,
        // level: "debug",
      },
    },
    ...overrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(new AnthropicMessagesV1Provider());
  return client;
}
