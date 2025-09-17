import { getGoogleTestModel } from "../getGoogleTestModel";

describe("getGoogleTestModel", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return default model when E2E_GOOGLE_MODEL is not set", () => {
    delete process.env.E2E_GOOGLE_MODEL;

    const model = getGoogleTestModel();

    expect(model).toBe("google:gemini-2.5-flash");
  });

  it("should return custom model from environment variable", () => {
    process.env.E2E_GOOGLE_MODEL = "google:gemini-2.5-pro";

    const model = getGoogleTestModel();

    expect(model).toBe("google:gemini-2.5-pro");
  });

  it("should return environment model even if it's an unusual format", () => {
    process.env.E2E_GOOGLE_MODEL = "custom:google-model";

    const model = getGoogleTestModel();

    expect(model).toBe("custom:google-model");
  });

  it("should handle empty environment variable", () => {
    process.env.E2E_GOOGLE_MODEL = "";

    const model = getGoogleTestModel();

    expect(model).toBe("google:gemini-2.5-flash");
  });
});
