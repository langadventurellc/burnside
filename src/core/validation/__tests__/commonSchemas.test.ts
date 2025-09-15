/**
 * Common Schemas Tests
 *
 * Tests for common validation schemas including email, URL, and timestamp validation.
 */

import { commonSchemas } from "../commonSchemas.js";

describe("commonSchemas", () => {
  describe("email schema", () => {
    it("should validate correct email addresses", () => {
      const validEmails = [
        "user@example.com",
        "test.email+tag@example.co.uk",
        "user123@test-domain.org",
        "firstname.lastname@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        expect(() => commonSchemas.email.parse(email)).not.toThrow();
        expect(commonSchemas.email.safeParse(email).success).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@@example.com",
        "user@.com",
        "",
        "user@example.",
        "user name@example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(() => commonSchemas.email.parse(email)).toThrow();
        expect(commonSchemas.email.safeParse(email).success).toBe(false);
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.email.safeParse("invalid-email");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email format");
      }
    });
  });

  describe("url schema", () => {
    it("should validate correct URLs", () => {
      const validUrls = [
        "https://example.com",
        "http://test.org",
        "https://subdomain.example.com/path?param=value",
        "http://localhost:3000",
        "https://api.example.com/v1/users/123",
      ];

      validUrls.forEach((url) => {
        expect(() => commonSchemas.url.parse(url)).not.toThrow();
        expect(commonSchemas.url.safeParse(url).success).toBe(true);
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = [
        "invalid-url",
        "//example.com",
        "example.com",
        "",
        "http://",
        "https://",
      ];

      invalidUrls.forEach((url) => {
        expect(() => commonSchemas.url.parse(url)).toThrow();
        expect(commonSchemas.url.safeParse(url).success).toBe(false);
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.url.safeParse("invalid-url");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid URL format");
      }
    });
  });

  describe("timestamp schema", () => {
    it("should validate correct ISO 8601 timestamps", () => {
      const validTimestamps = [
        "2023-12-25T10:30:00Z",
        "2023-12-25T10:30:00.123Z",
        new Date().toISOString(),
      ];

      validTimestamps.forEach((timestamp) => {
        expect(() => commonSchemas.timestamp.parse(timestamp)).not.toThrow();
        expect(commonSchemas.timestamp.safeParse(timestamp).success).toBe(true);
      });
    });

    it("should reject invalid timestamp formats", () => {
      const invalidTimestamps = [
        "2023-12-25",
        "10:30:00",
        "2023/12/25 10:30:00",
        "invalid-date",
        "",
        "2023-12-25T10:30:00+00:00", // Timezone offset not supported by Zod
        "2023-12-25T10:30:00-05:00", // Timezone offset not supported by Zod
        "2023-13-01T10:30:00Z", // Invalid month
        "2023-12-32T10:30:00Z", // Invalid day
      ];

      invalidTimestamps.forEach((timestamp) => {
        expect(() => commonSchemas.timestamp.parse(timestamp)).toThrow();
        expect(commonSchemas.timestamp.safeParse(timestamp).success).toBe(
          false,
        );
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.timestamp.safeParse("invalid-date");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Invalid ISO 8601 timestamp format",
        );
      }
    });
  });

  describe("unixTimestamp schema", () => {
    it("should validate correct Unix timestamps", () => {
      const validTimestamps = [
        0,
        1234567890,
        Math.floor(Date.now() / 1000),
        2147483647, // Max 32-bit signed integer
      ];

      validTimestamps.forEach((timestamp) => {
        expect(() =>
          commonSchemas.unixTimestamp.parse(timestamp),
        ).not.toThrow();
        expect(commonSchemas.unixTimestamp.safeParse(timestamp).success).toBe(
          true,
        );
      });
    });

    it("should reject invalid Unix timestamps", () => {
      const invalidTimestamps = [
        -1,
        1234567890.5, // Decimal
        "1234567890", // String
        null,
        undefined,
        NaN,
        Infinity,
      ];

      invalidTimestamps.forEach((timestamp) => {
        expect(() => commonSchemas.unixTimestamp.parse(timestamp)).toThrow();
        expect(commonSchemas.unixTimestamp.safeParse(timestamp).success).toBe(
          false,
        );
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.unixTimestamp.safeParse(-1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Unix timestamp must be non-negative",
        );
      }
    });
  });

  describe("schema composition", () => {
    it("should allow chaining with other Zod methods", () => {
      const optionalEmail = commonSchemas.email.optional();
      const nullableUrl = commonSchemas.url.nullable();

      expect(optionalEmail.safeParse(undefined).success).toBe(true);
      expect(optionalEmail.safeParse("user@example.com").success).toBe(true);
      expect(optionalEmail.safeParse("invalid").success).toBe(false);

      expect(nullableUrl.safeParse(null).success).toBe(true);
      expect(nullableUrl.safeParse("https://example.com").success).toBe(true);
      expect(nullableUrl.safeParse("invalid").success).toBe(false);
    });
  });
});
