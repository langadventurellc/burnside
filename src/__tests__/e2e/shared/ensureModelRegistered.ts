import type { BridgeClient } from "../../../client/bridgeClient";

export function ensureModelRegistered(
  client: BridgeClient,
  modelId: string,
): void {
  if (!client.getModelRegistry().get(modelId)) {
    // Register custom model if E2E_OPENAI_MODEL specifies non-seeded model
    const [provider, model] = modelId.split(":");
    client.getModelRegistry().register(modelId, {
      id: modelId,
      name: model,
      provider,
      capabilities: {
        streaming: true,
        toolCalls: true,
        images: false,
        documents: false,
        supportedContentTypes: ["text"],
      },
      metadata: { providerPlugin: "openai-responses-v1" },
    });
  }
}
