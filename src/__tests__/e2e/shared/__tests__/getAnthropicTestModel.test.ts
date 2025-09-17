import { getAnthropicTestModel } from "../getAnthropicTestModel.js";

describe("getAnthropicTestModel", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return default model when E2E_ANTHROPIC_MODEL is not set", () => {
    delete process.env.E2E_ANTHROPIC_MODEL;

    const model = getAnthropicTestModel();

    expect(model).toBe("anthropic:claude-3-5-haiku-latest");
  });

  it("should return custom model from environment variable", () => {
    process.env.E2E_ANTHROPIC_MODEL = "anthropic:claude-3-5-sonnet-20241022";

    const model = getAnthropicTestModel();

    expect(model).toBe("anthropic:claude-3-5-sonnet-20241022");
  });

  it("should return environment model even if it's an unusual format", () => {
    process.env.E2E_ANTHROPIC_MODEL = "custom:anthropic-model";

    const model = getAnthropicTestModel();

    expect(model).toBe("custom:anthropic-model");
  });

  it("should handle empty environment variable", () => {
    process.env.E2E_ANTHROPIC_MODEL = "";

    const model = getAnthropicTestModel();

    expect(model).toBe("anthropic:claude-3-5-haiku-latest");
  });
});
