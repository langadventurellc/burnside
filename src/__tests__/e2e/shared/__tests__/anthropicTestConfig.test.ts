import { ValidationError } from "../../../../core/errors/validationError.js";
import { loadAnthropicTestConfig } from "../anthropicTestConfig.js";

// Mock the validateApiKey function
jest.mock("../validateApiKey.js", () => ({
  validateApiKey: jest.fn(),
}));

import { validateApiKey } from "../validateApiKey.js";
const mockValidateApiKey = validateApiKey as jest.MockedFunction<
  typeof validateApiKey
>;

describe("loadAnthropicTestConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("successful configuration loading", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-valid-key-12345";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(true);
    });

    it("should load config with valid environment variables", () => {
      const config = loadAnthropicTestConfig();

      expect(config).toEqual({
        anthropicApiKey: "sk-ant-valid-key-12345",
        testEnabled: true,
        testModel: "anthropic:claude-3-5-haiku-latest",
        timeout: 30000,
      });
    });

    it("should use custom model from environment", () => {
      process.env.E2E_ANTHROPIC_MODEL = "anthropic:claude-3-5-sonnet-20241022";

      const config = loadAnthropicTestConfig();

      expect(config.testModel).toBe("anthropic:claude-3-5-sonnet-20241022");
    });

    it("should call validateApiKey with correct parameters", () => {
      loadAnthropicTestConfig();

      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-valid-key-12345",
        "anthropic",
      );
    });
  });

  describe("missing ANTHROPIC_API_KEY", () => {
    beforeEach(() => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.E2E_TEST_ENABLED = "true";
    });

    it("should throw ValidationError when ANTHROPIC_API_KEY is missing", () => {
      expect(() => loadAnthropicTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message", () => {
      expect(() => loadAnthropicTestConfig()).toThrow(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
      );
    });
  });

  describe("invalid ANTHROPIC_API_KEY", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "invalid-key";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(false);
    });

    it("should throw ValidationError when API key is invalid", () => {
      expect(() => loadAnthropicTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message for invalid key", () => {
      expect(() => loadAnthropicTestConfig()).toThrow(
        "ANTHROPIC_API_KEY must be a valid Anthropic API key format",
      );
    });
  });

  describe("E2E_TEST_ENABLED validation", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-valid-key-12345";
      mockValidateApiKey.mockReturnValue(true);
    });

    it("should throw ValidationError when E2E_TEST_ENABLED is not 'true'", () => {
      process.env.E2E_TEST_ENABLED = "false";

      expect(() => loadAnthropicTestConfig()).toThrow(ValidationError);
    });

    it("should throw ValidationError when E2E_TEST_ENABLED is missing", () => {
      delete process.env.E2E_TEST_ENABLED;

      expect(() => loadAnthropicTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message for test not enabled", () => {
      process.env.E2E_TEST_ENABLED = "false";

      expect(() => loadAnthropicTestConfig()).toThrow(
        'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
      );
    });
  });

  describe("default values", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-valid-key-12345";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(true);
      delete process.env.E2E_ANTHROPIC_MODEL;
    });

    it("should use default model when E2E_ANTHROPIC_MODEL is not set", () => {
      const config = loadAnthropicTestConfig();

      expect(config.testModel).toBe("anthropic:claude-3-5-haiku-latest");
    });

    it("should have default timeout of 30000", () => {
      const config = loadAnthropicTestConfig();

      expect(config.timeout).toBe(30000);
    });
  });
});
