import { BridgeClient } from "../../../client/bridgeClient";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { GoogleGeminiV1Provider } from "../../../providers/google-gemini-v1/index";
import { loadGoogleTestConfig } from "./googleTestConfig";

export function createGoogleTestClient(
  overrides?: Partial<BridgeConfig>,
): BridgeClient {
  const testConfig = loadGoogleTestConfig();

  const config: BridgeConfig = {
    defaultProvider: "google",
    providers: {
      google: { apiKey: testConfig.googleApiKey },
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
  client.registerProvider(new GoogleGeminiV1Provider());
  return client;
}
