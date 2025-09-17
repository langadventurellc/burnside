import { ValidationError } from "../../../../core/errors/validationError";
import { loadGoogleTestConfig } from "../googleTestConfig";

// Mock the validateApiKey function
jest.mock("../validateApiKey", () => ({
  validateApiKey: jest.fn(),
}));

import { validateApiKey } from "../validateApiKey";
const mockValidateApiKey = validateApiKey as jest.MockedFunction<
  typeof validateApiKey
>;

describe("loadGoogleTestConfig", () => {
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
      process.env.GOOGLE_API_KEY = "AIza-valid-google-key-12345";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(true);
    });

    it("should load config with valid environment variables", () => {
      const config = loadGoogleTestConfig();

      expect(config).toEqual({
        googleApiKey: "AIza-valid-google-key-12345",
        testEnabled: true,
        testModel: "google:gemini-2.5-flash",
        timeout: 30000,
      });
    });

    it("should use custom model from environment", () => {
      process.env.E2E_GOOGLE_MODEL = "google:gemini-2.5-pro";

      const config = loadGoogleTestConfig();

      expect(config.testModel).toBe("google:gemini-2.5-pro");
    });

    it("should call validateApiKey with correct parameters", () => {
      loadGoogleTestConfig();

      expect(mockValidateApiKey).toHaveBeenCalledWith(
        "AIza-valid-google-key-12345",
        "google",
      );
    });
  });

  describe("missing GOOGLE_API_KEY", () => {
    beforeEach(() => {
      delete process.env.GOOGLE_API_KEY;
      process.env.E2E_TEST_ENABLED = "true";
    });

    it("should throw ValidationError when GOOGLE_API_KEY is missing", () => {
      expect(() => loadGoogleTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message", () => {
      expect(() => loadGoogleTestConfig()).toThrow(
        "GOOGLE_API_KEY environment variable is required for Google E2E tests",
      );
    });
  });

  describe("invalid GOOGLE_API_KEY", () => {
    beforeEach(() => {
      process.env.GOOGLE_API_KEY = "invalid-key";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(false);
    });

    it("should throw ValidationError when API key is invalid", () => {
      expect(() => loadGoogleTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message for invalid key", () => {
      expect(() => loadGoogleTestConfig()).toThrow(
        "GOOGLE_API_KEY must be a valid Google API key format",
      );
    });
  });

  describe("E2E_TEST_ENABLED validation", () => {
    beforeEach(() => {
      process.env.GOOGLE_API_KEY = "AIza-valid-google-key-12345";
      mockValidateApiKey.mockReturnValue(true);
    });

    it("should throw ValidationError when E2E_TEST_ENABLED is not 'true'", () => {
      process.env.E2E_TEST_ENABLED = "false";

      expect(() => loadGoogleTestConfig()).toThrow(ValidationError);
    });

    it("should throw ValidationError when E2E_TEST_ENABLED is missing", () => {
      delete process.env.E2E_TEST_ENABLED;

      expect(() => loadGoogleTestConfig()).toThrow(ValidationError);
    });

    it("should have correct error message for test not enabled", () => {
      process.env.E2E_TEST_ENABLED = "false";

      expect(() => loadGoogleTestConfig()).toThrow(
        'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
      );
    });
  });

  describe("default values", () => {
    beforeEach(() => {
      process.env.GOOGLE_API_KEY = "AIza-valid-google-key-12345";
      process.env.E2E_TEST_ENABLED = "true";
      mockValidateApiKey.mockReturnValue(true);
      delete process.env.E2E_GOOGLE_MODEL;
    });

    it("should use default model when E2E_GOOGLE_MODEL is not set", () => {
      const config = loadGoogleTestConfig();

      expect(config.testModel).toBe("google:gemini-2.5-flash");
    });

    it("should have default timeout of 30000", () => {
      const config = loadGoogleTestConfig();

      expect(config.timeout).toBe(30000);
    });
  });
});
