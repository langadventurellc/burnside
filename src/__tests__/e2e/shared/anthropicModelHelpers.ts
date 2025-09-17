import { BridgeClient } from "../../../client/bridgeClient.js";
import type { BridgeConfig } from "../../../core/config/bridgeConfig.js";
import { AnthropicMessagesV1Provider } from "../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider.js";
import { loadAnthropicTestConfig } from "./anthropicTestConfig.js";

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
    ...overrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(new AnthropicMessagesV1Provider());
  return client;
}
