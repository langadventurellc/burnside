import { ValidationError } from "../../../../core/errors/validationError.js";
import { validateApiKey } from "../validateApiKey.js";

describe("validateApiKey - Anthropic provider", () => {
  describe("valid Anthropic API keys", () => {
    it("should validate valid sk-ant- prefix key with minimum length", () => {
      const validKey = "sk-ant-" + "a".repeat(16); // 20 chars total
      expect(validateApiKey(validKey, "anthropic")).toBe(true);
    });

    it("should validate valid sk-ant- prefix key with longer length", () => {
      const validKey = "sk-ant-" + "a".repeat(50); // 57 chars total
      expect(validateApiKey(validKey, "anthropic")).toBe(true);
    });

    it("should validate typical Anthropic API key format", () => {
      const validKey = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789";
      expect(validateApiKey(validKey, "anthropic")).toBe(true);
    });
  });

  describe("invalid Anthropic API keys", () => {
    it("should reject key with wrong prefix", () => {
      const invalidKey = "sk-" + "a".repeat(20);
      expect(validateApiKey(invalidKey, "anthropic")).toBe(false);
    });

    it("should reject key too short", () => {
      const shortKey = "sk-ant-short";
      expect(validateApiKey(shortKey, "anthropic")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(validateApiKey("", "anthropic")).toBe(false);
    });

    it("should reject key with partial sk-ant prefix", () => {
      const invalidKey = "sk-an-" + "a".repeat(20);
      expect(validateApiKey(invalidKey, "anthropic")).toBe(false);
    });

    it("should reject key with case mismatch", () => {
      const invalidKey = "SK-ANT-" + "a".repeat(20);
      expect(validateApiKey(invalidKey, "anthropic")).toBe(false);
    });
  });

  describe("existing OpenAI functionality", () => {
    it("should still validate OpenAI keys correctly", () => {
      const validOpenAIKey = "sk-" + "a".repeat(18);
      expect(validateApiKey(validOpenAIKey, "openai")).toBe(true);
    });

    it("should reject invalid OpenAI keys", () => {
      const invalidOpenAIKey = "sk-short";
      expect(validateApiKey(invalidOpenAIKey, "openai")).toBe(false);
    });
  });

  describe("unsupported providers", () => {
    it("should throw ValidationError for unsupported provider", () => {
      expect(() => {
        validateApiKey("any-key", "unsupported");
      }).toThrow(ValidationError);
    });

    it("should include provider name in error message", () => {
      expect(() => {
        validateApiKey("any-key", "unsupported");
      }).toThrow("Unsupported provider for API key validation: unsupported");
    });
  });
});
