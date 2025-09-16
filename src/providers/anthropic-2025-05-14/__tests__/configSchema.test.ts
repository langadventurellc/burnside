/**
 * Anthropic Configuration Schema Tests
 *
 * Comprehensive unit tests for the Anthropic Messages API configuration schema
 * validation, testing both valid and invalid configurations across all fields
 * and edge cases to achieve >90% code coverage.
 */

import { ZodError } from "zod";
import {
  AnthropicMessagesConfigSchema,
  type AnthropicMessagesConfig,
  isValidAnthropicApiKey,
  validateAnthropicConfig,
  ANTHROPIC_DEFAULT_CONFIG,
} from "../index.js";

describe("AnthropicMessagesConfigSchema", () => {
  describe("valid configurations", () => {
    it("should validate minimal valid configuration", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-ant-test123");
      expect(result.baseUrl).toBe("https://api.anthropic.com");
      expect(result.version).toBe("2025-05-14");
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should validate complete configuration", () => {
      const config = {
        apiKey: "sk-ant-api123456789",
        baseUrl: "https://custom-api.example.com",
        version: "2024-01-01",
        timeout: 60000,
        maxRetries: 2,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.apiKey).toBe("sk-ant-api123456789");
      expect(result.baseUrl).toBe("https://custom-api.example.com");
      expect(result.version).toBe("2024-01-01");
      expect(result.timeout).toBe(60000);
      expect(result.maxRetries).toBe(2);
    });

    it("should apply default values when optional fields are not provided", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.baseUrl).toBe(ANTHROPIC_DEFAULT_CONFIG.baseUrl);
      expect(result.version).toBe(ANTHROPIC_DEFAULT_CONFIG.version);
      expect(result.timeout).toBe(ANTHROPIC_DEFAULT_CONFIG.timeout);
      expect(result.maxRetries).toBe(ANTHROPIC_DEFAULT_CONFIG.maxRetries);
    });

    it("should handle maximum allowed timeout", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 300000,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.timeout).toBe(300000);
    });

    it("should handle maximum allowed retries", () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: 5,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.maxRetries).toBe(5);
    });

    it("should handle minimum allowed retries", () => {
      const config = {
        apiKey: "sk-ant-test123",
        maxRetries: 0,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.maxRetries).toBe(0);
    });
  });

  describe("invalid configurations", () => {
    describe("API key validation", () => {
      it("should reject missing apiKey", () => {
        const config = {};

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject empty apiKey", () => {
        const config = {
          apiKey: "",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject apiKey without sk-ant- prefix", () => {
        const config = {
          apiKey: "sk-test123",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject apiKey with wrong prefix format", () => {
        const config = {
          apiKey: "ant-sk-test123",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-string apiKey", () => {
        const config = {
          apiKey: 123,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });
    });

    describe("base URL validation", () => {
      it("should reject HTTP base URL (enforce HTTPS)", () => {
        const config = {
          apiKey: "sk-ant-test123",
          baseUrl: "http://api.anthropic.com",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject malformed base URL", () => {
        const config = {
          apiKey: "sk-ant-test123",
          baseUrl: "not-a-url",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-string base URL", () => {
        const config = {
          apiKey: "sk-ant-test123",
          baseUrl: 123,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject base URL with invalid scheme", () => {
        const config = {
          apiKey: "sk-ant-test123",
          baseUrl: "ftp://api.anthropic.com",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });
    });

    describe("version validation", () => {
      it("should reject invalid version format", () => {
        const config = {
          apiKey: "sk-ant-test123",
          version: "2024-1-1",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject version without proper date format", () => {
        const config = {
          apiKey: "sk-ant-test123",
          version: "v2024-01-01",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-string version", () => {
        const config = {
          apiKey: "sk-ant-test123",
          version: 20250514,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });
    });

    describe("timeout validation", () => {
      it("should reject timeout exceeding maximum", () => {
        const config = {
          apiKey: "sk-ant-test123",
          timeout: 300001,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject negative timeout", () => {
        const config = {
          apiKey: "sk-ant-test123",
          timeout: -1000,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject zero timeout", () => {
        const config = {
          apiKey: "sk-ant-test123",
          timeout: 0,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-integer timeout", () => {
        const config = {
          apiKey: "sk-ant-test123",
          timeout: 30.5,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-number timeout", () => {
        const config = {
          apiKey: "sk-ant-test123",
          timeout: "30000",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });
    });

    describe("maxRetries validation", () => {
      it("should reject maxRetries exceeding maximum", () => {
        const config = {
          apiKey: "sk-ant-test123",
          maxRetries: 6,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject negative maxRetries", () => {
        const config = {
          apiKey: "sk-ant-test123",
          maxRetries: -1,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-integer maxRetries", () => {
        const config = {
          apiKey: "sk-ant-test123",
          maxRetries: 2.5,
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });

      it("should reject non-number maxRetries", () => {
        const config = {
          apiKey: "sk-ant-test123",
          maxRetries: "3",
        };

        expect(() => AnthropicMessagesConfigSchema.parse(config)).toThrow(
          ZodError,
        );
      });
    });
  });

  describe("optional fields handling", () => {
    it("should handle missing optional fields", () => {
      const config = {
        apiKey: "sk-ant-test123",
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });

    it("should preserve provided optional fields", () => {
      const config = {
        apiKey: "sk-ant-test123",
        timeout: 45000,
      };

      const result = AnthropicMessagesConfigSchema.parse(config);

      expect(result.timeout).toBe(45000);
      expect(result.maxRetries).toBe(3); // default
    });
  });
});

describe("isValidAnthropicApiKey", () => {
  it("should return true for valid API key", () => {
    expect(isValidAnthropicApiKey("sk-ant-test123")).toBe(true);
    expect(isValidAnthropicApiKey("sk-ant-api123456789")).toBe(true);
  });

  it("should return false for invalid API key formats", () => {
    expect(isValidAnthropicApiKey("")).toBe(false);
    expect(isValidAnthropicApiKey("sk-test123")).toBe(false);
    expect(isValidAnthropicApiKey("ant-sk-test123")).toBe(false);
    expect(isValidAnthropicApiKey("sk-openai-test123")).toBe(false);
  });

  it("should return false for non-string inputs", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(isValidAnthropicApiKey(123 as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(isValidAnthropicApiKey(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(isValidAnthropicApiKey(undefined as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(isValidAnthropicApiKey({} as any)).toBe(false);
  });
});

describe("validateAnthropicConfig", () => {
  it("should successfully validate valid configuration", () => {
    const config = {
      apiKey: "sk-ant-test123",
      timeout: 45000,
    };

    const result = validateAnthropicConfig(config);

    expect(result.apiKey).toBe("sk-ant-test123");
    expect(result.timeout).toBe(45000);
    expect(result.baseUrl).toBe("https://api.anthropic.com");
  });

  it("should throw error for invalid configuration", () => {
    const config = {
      apiKey: "invalid-key",
    };

    expect(() => validateAnthropicConfig(config)).toThrow(ZodError);
  });

  it("should handle unknown input types", () => {
    expect(() => validateAnthropicConfig("not-an-object")).toThrow(ZodError);
    expect(() => validateAnthropicConfig(null)).toThrow(ZodError);
    expect(() => validateAnthropicConfig(123)).toThrow(ZodError);
  });
});

describe("ANTHROPIC_DEFAULT_CONFIG", () => {
  it("should contain expected default values", () => {
    expect(ANTHROPIC_DEFAULT_CONFIG.baseUrl).toBe("https://api.anthropic.com");
    expect(ANTHROPIC_DEFAULT_CONFIG.version).toBe("2025-05-14");
    expect(ANTHROPIC_DEFAULT_CONFIG.timeout).toBe(30000);
    expect(ANTHROPIC_DEFAULT_CONFIG.maxRetries).toBe(3);
  });

  it("should pass schema validation", () => {
    const config = {
      apiKey: "sk-ant-test123",
      ...ANTHROPIC_DEFAULT_CONFIG,
    };

    expect(() => AnthropicMessagesConfigSchema.parse(config)).not.toThrow();
  });
});

describe("type inference", () => {
  it("should properly infer types from schema", () => {
    const config: AnthropicMessagesConfig = {
      apiKey: "sk-ant-test123",
      baseUrl: "https://api.anthropic.com",
      version: "2025-05-14",
      timeout: 30000,
      maxRetries: 3,
    };

    const result = AnthropicMessagesConfigSchema.parse(config);

    // Type check - should compile without errors
    const apiKey: string = result.apiKey;
    const baseUrl: string = result.baseUrl;
    const version: string = result.version;
    const timeout: number = result.timeout;
    const maxRetries: number = result.maxRetries;

    expect(apiKey).toBeDefined();
    expect(baseUrl).toBeDefined();
    expect(version).toBeDefined();
    expect(timeout).toBeDefined();
    expect(maxRetries).toBeDefined();
  });
});
