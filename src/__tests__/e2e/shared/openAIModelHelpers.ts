import { BridgeClient } from "../../../client/bridgeClient";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { OpenAIResponsesV1Provider } from "../../../providers/openai-responses-v1/openAIResponsesV1Provider";
import { loadTestConfig } from "./openAITestConfig";

export function createTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadTestConfig();

  const config: BridgeConfig = {
    defaultProvider: "openai",
    providers: {
      openai: {
        default: { apiKey: testConfig.openaiApiKey },
      },
    },
    modelSeed: "builtin", // Explicitly use builtin seed to populate registry
    tools: {
      enabled: true,
      builtinTools: ["echo"], // Required when tools enabled per schema
    },
    options: {
      logging: {
        enabled: false,
        // level: "debug",
      },
    },
    ...overrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(new OpenAIResponsesV1Provider());
  return client;
}
