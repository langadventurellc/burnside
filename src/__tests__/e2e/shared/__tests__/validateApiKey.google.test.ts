import { ValidationError } from "../../../../core/errors/validationError";
import { validateApiKey } from "../validateApiKey";

describe("validateApiKey - Google provider", () => {
  describe("valid Google API keys", () => {
    it("should validate valid AIza prefix key with exact 39 character length", () => {
      const validKey = "AIza" + "a".repeat(35); // 39 chars total
      expect(validateApiKey(validKey, "google")).toBe(true);
    });

    it("should validate typical Google API key format", () => {
      const validKey = "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567";
      expect(validateApiKey(validKey, "google")).toBe(true);
    });

    it("should validate Google API key with mixed case and numbers", () => {
      const validKey = "AIzaBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789";
      expect(validateApiKey(validKey, "google")).toBe(true);
    });

    it("should validate Google API key with special characters", () => {
      const validKey = "AIza_-SyAbCdEfGhIjKlMnOpQrStUvWxYz12345";
      expect(validateApiKey(validKey, "google")).toBe(true);
    });
  });

  describe("invalid Google API keys", () => {
    it("should reject key with wrong prefix", () => {
      const invalidKey = "sk-" + "a".repeat(36);
      expect(validateApiKey(invalidKey, "google")).toBe(false);
    });

    it("should reject key with partial AIza prefix", () => {
      const invalidKey = "AIz" + "b".repeat(36); // 39 chars but wrong prefix (AIzb...)
      expect(validateApiKey(invalidKey, "google")).toBe(false);
    });

    it("should reject key with case mismatch in prefix", () => {
      const invalidKey = "aiza" + "a".repeat(35);
      expect(validateApiKey(invalidKey, "google")).toBe(false);
    });

    it("should reject key with AIZA uppercase prefix", () => {
      const invalidKey = "AIZA" + "a".repeat(35);
      expect(validateApiKey(invalidKey, "google")).toBe(false);
    });

    it("should reject key too short (38 characters)", () => {
      const shortKey = "AIza" + "a".repeat(34);
      expect(validateApiKey(shortKey, "google")).toBe(false);
    });

    it("should reject key too long (40 characters)", () => {
      const longKey = "AIza" + "a".repeat(36);
      expect(validateApiKey(longKey, "google")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(validateApiKey("", "google")).toBe(false);
    });

    it("should reject key with only AIza prefix", () => {
      const invalidKey = "AIza";
      expect(validateApiKey(invalidKey, "google")).toBe(false);
    });

    it("should reject very long key", () => {
      const longKey = "AIza" + "a".repeat(100);
      expect(validateApiKey(longKey, "google")).toBe(false);
    });

    it("should reject very short key", () => {
      const shortKey = "AI";
      expect(validateApiKey(shortKey, "google")).toBe(false);
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

  describe("existing Anthropic functionality", () => {
    it("should still validate Anthropic keys correctly", () => {
      const validAnthropicKey = "sk-ant-" + "a".repeat(16);
      expect(validateApiKey(validAnthropicKey, "anthropic")).toBe(true);
    });

    it("should reject invalid Anthropic keys", () => {
      const invalidAnthropicKey = "sk-ant-short";
      expect(validateApiKey(invalidAnthropicKey, "anthropic")).toBe(false);
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
