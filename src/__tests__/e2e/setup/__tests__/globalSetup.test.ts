import globalSetup from "../globalSetup";
import * as validateApiKeyModule from "../../shared/validateApiKey";

// Mock the validateApiKey function
jest.mock("../../shared/validateApiKey");
const mockValidateApiKey = jest.mocked(validateApiKeyModule.validateApiKey);

// Mock console.log to avoid output during tests
jest.spyOn(console, "log").mockImplementation(() => {});

describe("globalSetup", () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    mockValidateApiKey.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe("E2E_TEST_ENABLED validation", () => {
    it("should throw error when E2E_TEST_ENABLED is not set", () => {
      delete process.env.E2E_TEST_ENABLED;
      process.argv = ["node", "jest", "openai"];

      expect(() => globalSetup()).toThrow(
        'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
      );
    });

    it("should throw error when E2E_TEST_ENABLED is not 'true'", () => {
      process.env.E2E_TEST_ENABLED = "false";
      process.argv = ["node", "jest", "openai"];

      expect(() => globalSetup()).toThrow(
        'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
      );
    });
  });

  describe("OpenAI tests", () => {
    beforeEach(() => {
      process.env.E2E_TEST_ENABLED = "true";
      process.argv = ["node", "jest", "openai"];
    });

    it("should validate OpenAI API key when running OpenAI tests", () => {
      process.env.OPENAI_API_KEY = "sk-test-key";

      globalSetup();

      expect(mockValidateApiKey).toHaveBeenCalledWith("sk-test-key", "openai");
    });

    it("should throw error when OPENAI_API_KEY is missing for OpenAI tests", () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => globalSetup()).toThrow(
        "OPENAI_API_KEY environment variable is required for OpenAI E2E tests",
      );
    });

    it("should throw error when OPENAI_API_KEY is invalid for OpenAI tests", () => {
      process.env.OPENAI_API_KEY = "invalid-key";
      mockValidateApiKey.mockReturnValue(false);

      expect(() => globalSetup()).toThrow(
        "OPENAI_API_KEY must be a valid OpenAI API key",
      );
    });

    it("should succeed with valid OpenAI credentials", () => {
      process.env.OPENAI_API_KEY = "sk-valid-openai-key";

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-valid-openai-key",
        "openai",
      );
    });
  });

  describe("Anthropic tests", () => {
    beforeEach(() => {
      process.env.E2E_TEST_ENABLED = "true";
      process.argv = ["node", "jest", "anthropic"];
    });

    it("should validate Anthropic API key when running Anthropic tests", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      globalSetup();

      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-test-key",
        "anthropic",
      );
    });

    it("should throw error when ANTHROPIC_API_KEY is missing for Anthropic tests", () => {
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => globalSetup()).toThrow(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
      );
    });

    it("should throw error when ANTHROPIC_API_KEY is invalid for Anthropic tests", () => {
      process.env.ANTHROPIC_API_KEY = "invalid-key";
      mockValidateApiKey.mockReturnValue(false);

      expect(() => globalSetup()).toThrow(
        "ANTHROPIC_API_KEY must be a valid Anthropic API key",
      );
    });

    it("should succeed with valid Anthropic credentials", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-valid-anthropic-key";

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-valid-anthropic-key",
        "anthropic",
      );
    });
  });

  describe("test pattern detection", () => {
    beforeEach(() => {
      process.env.E2E_TEST_ENABLED = "true";
    });

    it("should use JEST_TEST_PATH_PATTERN when available", () => {
      process.env.JEST_TEST_PATH_PATTERN = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      process.argv = ["node", "jest"];

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-test-key",
        "anthropic",
      );
    });

    it("should fall back to process.argv when JEST_TEST_PATH_PATTERN is not set", () => {
      delete process.env.JEST_TEST_PATH_PATTERN;
      process.argv = ["node", "jest", "--testPathPattern=anthropic"];
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-test-key",
        "anthropic",
      );
    });

    it("should default to OpenAI when no specific pattern is detected", () => {
      delete process.env.JEST_TEST_PATH_PATTERN;
      process.argv = ["node", "jest"];
      process.env.OPENAI_API_KEY = "sk-test-key";

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith("sk-test-key", "openai");
    });
  });

  describe("provider credential isolation", () => {
    beforeEach(() => {
      process.env.E2E_TEST_ENABLED = "true";
    });

    it("should not require Anthropic credentials when running OpenAI tests", () => {
      process.argv = ["node", "jest", "openai"];
      process.env.OPENAI_API_KEY = "sk-valid-openai-key";
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-valid-openai-key",
        "openai",
      );
      expect(mockValidateApiKey).not.toHaveBeenCalledWith(
        expect.anything(),
        "anthropic",
      );
    });

    it("should not require OpenAI credentials when running Anthropic tests", () => {
      process.argv = ["node", "jest", "anthropic"];
      process.env.ANTHROPIC_API_KEY = "sk-ant-valid-anthropic-key";
      delete process.env.OPENAI_API_KEY;

      expect(() => globalSetup()).not.toThrow();
      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "sk-ant-valid-anthropic-key",
        "anthropic",
      );
      expect(mockValidateApiKey).not.toHaveBeenCalledWith(
        expect.anything(),
        "openai",
      );
    });
  });
});
