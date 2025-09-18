/**
 * @fileoverview Test xAI provider registration in global provider registry
 */

import { XAIV1Provider, XAI_PROVIDER_INFO, xaiV1Provider } from "../index";

describe("xAI Provider Registration", () => {
  test("exports XAIV1Provider from global registry", () => {
    expect(XAIV1Provider).toBeDefined();
    expect(typeof XAIV1Provider).toBe("function");
  });

  test("exports XAI_PROVIDER_INFO from global registry", () => {
    expect(XAI_PROVIDER_INFO).toBeDefined();
    expect(XAI_PROVIDER_INFO.id).toBe("xai");
    expect(XAI_PROVIDER_INFO.version).toBe("v1");
  });

  test("exports xaiV1Provider default export from global registry", () => {
    expect(xaiV1Provider).toBeDefined();
    expect(xaiV1Provider).toBe(XAIV1Provider);
  });

  test("provider metadata contains expected information", () => {
    expect(XAI_PROVIDER_INFO).toEqual({
      id: "xai",
      version: "v1",
      name: "xAI Grok Provider",
      description:
        "Provider for xAI's Grok models with streaming and tool calling support",
      supportedModels: [
        "grok-3-mini",
        "grok-3",
        "grok-4-0709",
        "grok-2",
        "grok-2-mini",
        "grok-2-vision-1212",
      ],
      capabilities: {
        streaming: true,
        toolCalls: true,
        images: true,
        documents: true,
        maxTokens: 8192,
        supportedContentTypes: ["text", "image", "document"],
        temperature: true,
        topP: true,
        promptCaching: false,
      },
    });
  });
});
