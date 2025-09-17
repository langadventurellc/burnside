import { createModelId } from "../createModelId";
import type { ModelId } from "../modelId";

describe("createModelId", () => {
  it("creates valid model ID from provider and model name", () => {
    const result = createModelId("openai", "gpt-4");
    expect(result).toBe("openai:gpt-4");
    expect(typeof result).toBe("string");
  });

  it("creates model ID with valid characters and hyphens", () => {
    const result = createModelId("anthropic", "claude-3-5-sonnet");
    expect(result).toBe("anthropic:claude-3-5-sonnet");
  });

  it("creates model ID with underscores and dots", () => {
    const result = createModelId("provider_name", "model.name_v1");
    expect(result).toBe("provider_name:model.name_v1");
  });

  it("throws error for empty provider", () => {
    expect(() => createModelId("", "gpt-4")).toThrow(
      "Provider and model name are required",
    );
  });

  it("throws error for empty model", () => {
    expect(() => createModelId("openai", "")).toThrow(
      "Provider and model name are required",
    );
  });

  it("throws error for provider with invalid characters", () => {
    expect(() => createModelId("provider@invalid", "gpt-4")).toThrow(
      "Invalid model ID format",
    );
  });

  it("throws error for model with invalid characters", () => {
    expect(() => createModelId("openai", "gpt@4")).toThrow(
      "Invalid model ID format",
    );
  });

  it("throws error for too short model ID", () => {
    expect(() => createModelId("", "b")).toThrow(
      "Provider and model name are required",
    );
  });

  it("throws error for extremely long model ID", () => {
    const longProvider = "a".repeat(50);
    const longModel = "b".repeat(50);
    expect(() => createModelId(longProvider, longModel)).toThrow(
      "Invalid model ID format",
    );
  });

  it("returns typed ModelId", () => {
    const result = createModelId("openai", "gpt-4");
    // TypeScript compile-time test: this should not cause a type error
    const modelId: ModelId = result;
    expect(modelId).toBe("openai:gpt-4");
  });
});
