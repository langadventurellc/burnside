import { BridgeClient } from "../../../client/bridgeClient";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { XAIV1Provider } from "../../../providers/xai-v1/xaiV1Provider";
import { loadXaiTestConfig } from "./xaiTestConfig";

export function createTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadXaiTestConfig();

  const config: BridgeConfig = {
    defaultProvider: "xai",
    providers: {
      xai: { apiKey: testConfig.xaiApiKey },
    },
    modelSeed: "builtin", // Use builtin seed to populate registry with Grok models
    tools: {
      enabled: true,
      builtinTools: ["echo"], // Required when tools enabled per schema
    },
    ...overrides,
  };

  const client = new BridgeClient(config);
  client.registerProvider(new XAIV1Provider());
  return client;
}
