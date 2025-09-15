import { parseModelId } from "../parseModelId.js";
import { createModelId } from "../createModelId.js";

describe("parseModelId", () => {
  it("parses valid model ID correctly", () => {
    const modelId = createModelId("openai", "gpt-4");
    const result = parseModelId(modelId);

    expect(result).toEqual({
      provider: "openai",
      model: "gpt-4",
    });
  });

  it("parses model ID with hyphens and underscores", () => {
    const modelId = createModelId("anthropic", "claude-3-5-sonnet");
    const result = parseModelId(modelId);

    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-3-5-sonnet",
    });
  });

  it("parses model ID with dots and underscores", () => {
    const modelId = createModelId("provider_name", "model.name_v1");
    const result = parseModelId(modelId);

    expect(result).toEqual({
      provider: "provider_name",
      model: "model.name_v1",
    });
  });

  it("throws error for malformed model ID without colon", () => {
    // We need to cast to ModelId for testing invalid format
    const invalidId =
      "openaigpt-4" as unknown as import("../modelId.js").ModelId;
    expect(() => parseModelId(invalidId)).toThrow("Invalid model ID format");
  });

  it("throws error for model ID with too many colons", () => {
    // We need to cast to ModelId for testing invalid format
    const invalidId =
      "openai:gpt:4" as unknown as import("../modelId.js").ModelId;
    expect(() => parseModelId(invalidId)).toThrow("Invalid model ID format");
  });

  it("throws error for empty model ID", () => {
    const invalidId = "" as unknown as import("../modelId.js").ModelId;
    expect(() => parseModelId(invalidId)).toThrow("Invalid model ID format");
  });

  it("handles edge case with empty provider", () => {
    // This would be caught by createModelId, but testing parser directly
    const invalidId = ":gpt-4" as unknown as import("../modelId.js").ModelId;
    const result = parseModelId(invalidId);

    expect(result).toEqual({
      provider: "",
      model: "gpt-4",
    });
  });

  it("handles edge case with empty model", () => {
    // This would be caught by createModelId, but testing parser directly
    const invalidId = "openai:" as unknown as import("../modelId.js").ModelId;
    const result = parseModelId(invalidId);

    expect(result).toEqual({
      provider: "openai",
      model: "",
    });
  });
});
