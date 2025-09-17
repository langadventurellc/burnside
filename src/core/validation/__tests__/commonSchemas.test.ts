/**
 * Common Schemas Tests
 *
 * Tests for common validation schemas including email, URL, and timestamp validation.
 */

import { commonSchemas } from "../commonSchemas";

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

  describe("base64 schema", () => {
    it("should validate correct base64 data", () => {
      const validBase64 = [
        "SGVsbG8gd29ybGQ=", // "Hello world"
        "VGVzdA==", // "Test"
        "YWJjZGVmZ2hpams=", // "abcdefghijk"
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 PNG
      ];

      validBase64.forEach((data) => {
        expect(() => commonSchemas.base64.parse(data)).not.toThrow();
        expect(commonSchemas.base64.safeParse(data).success).toBe(true);
      });
    });

    it("should reject invalid base64 data", () => {
      const invalidBase64 = [
        "", // Empty string
        "Hello world", // Plain text
        "SGVsbG8gd29ybGQ", // Missing padding
        "SGVsbG8=gd29ybGQ", // Invalid character placement
        "SGVsbG8@d29ybGQ=", // Invalid character (@)
        "SGVsbG8 d29ybGQ=", // Space character
      ];

      invalidBase64.forEach((data) => {
        expect(() => commonSchemas.base64.parse(data)).toThrow();
        expect(commonSchemas.base64.safeParse(data).success).toBe(false);
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.base64.safeParse("Hello world");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Must be valid base64 data",
        );
      }
    });
  });

  describe("imageMimeType schema", () => {
    it("should validate supported image MIME types", () => {
      const validMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      validMimeTypes.forEach((mimeType) => {
        expect(() => commonSchemas.imageMimeType.parse(mimeType)).not.toThrow();
        expect(commonSchemas.imageMimeType.safeParse(mimeType).success).toBe(
          true,
        );
      });
    });

    it("should reject unsupported image MIME types", () => {
      const invalidMimeTypes = [
        "image/bmp",
        "image/tiff",
        "image/x-icon",
        "text/plain",
        "application/pdf",
        "",
        "invalid",
      ];

      invalidMimeTypes.forEach((mimeType) => {
        expect(() => commonSchemas.imageMimeType.parse(mimeType)).toThrow();
        expect(commonSchemas.imageMimeType.safeParse(mimeType).success).toBe(
          false,
        );
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.imageMimeType.safeParse("image/bmp");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Must be a supported image MIME type (jpeg, png, gif, webp, svg+xml)",
        );
      }
    });
  });

  describe("documentMimeType schema", () => {
    it("should validate supported document MIME types", () => {
      const validMimeTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/json",
        "text/csv",
        "application/xml",
        "text/xml",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      validMimeTypes.forEach((mimeType) => {
        expect(() =>
          commonSchemas.documentMimeType.parse(mimeType),
        ).not.toThrow();
        expect(commonSchemas.documentMimeType.safeParse(mimeType).success).toBe(
          true,
        );
      });
    });

    it("should reject unsupported document MIME types", () => {
      const invalidMimeTypes = [
        "image/jpeg",
        "video/mp4",
        "audio/mpeg",
        "application/unknown",
        "",
        "invalid",
      ];

      invalidMimeTypes.forEach((mimeType) => {
        expect(() => commonSchemas.documentMimeType.parse(mimeType)).toThrow();
        expect(commonSchemas.documentMimeType.safeParse(mimeType).success).toBe(
          false,
        );
      });
    });

    it("should provide descriptive error messages", () => {
      const result = commonSchemas.documentMimeType.safeParse("image/jpeg");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Must be a supported document MIME type",
        );
      }
    });
  });

  describe("filename schema", () => {
    it("should validate correct filenames", () => {
      const validFilenames = [
        "document.pdf",
        "image_file.png",
        "test-file.txt",
        "file123on",
        "simple.md",
        "file.name.with.dots.txt",
        "underscore_file.csv",
        "hyphen-file.xml",
      ];

      validFilenames.forEach((filename) => {
        expect(() => commonSchemas.filename.parse(filename)).not.toThrow();
        expect(commonSchemas.filename.safeParse(filename).success).toBe(true);
      });
    });

    it("should reject invalid filenames", () => {
      const invalidFilenames = [
        "",
        "file with spaces.txt",
        "file@symbol.txt",
        "file#hash.txt",
        "file%percent.txt",
        "file&ampersand.txt",
        "file*asterisk.txt",
        "file+plus.txt",
        "file=equals.txt",
        "a".repeat(256), // Too long
      ];

      invalidFilenames.forEach((filename) => {
        expect(() => commonSchemas.filename.parse(filename)).toThrow();
        expect(commonSchemas.filename.safeParse(filename).success).toBe(false);
      });
    });

    it("should provide descriptive error messages for different failures", () => {
      const emptyResult = commonSchemas.filename.safeParse("");
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).toBe(
          "Filename cannot be empty",
        );
      }

      const invalidCharResult = commonSchemas.filename.safeParse(
        "file with spaces.txt",
      );
      expect(invalidCharResult.success).toBe(false);
      if (!invalidCharResult.success) {
        expect(invalidCharResult.error.issues[0].message).toBe(
          "Filename can only contain letters, numbers, dots, underscores, and hyphens",
        );
      }

      const tooLongResult = commonSchemas.filename.safeParse("a".repeat(256));
      expect(tooLongResult.success).toBe(false);
      if (!tooLongResult.success) {
        expect(tooLongResult.error.issues[0].message).toBe(
          "Filename cannot exceed 255 characters",
        );
      }
    });
  });

  describe("languageIdentifier schema", () => {
    it("should validate correct language identifiers", () => {
      const validLanguages = [
        "javascript",
        "typescript",
        "python",
        "c++",
        "c#",
        "go",
        "rust",
        "java",
        "kotlin",
        "swift",
        "ruby",
        "php",
        "html",
        "css",
        "scss",
        "less",
        "json",
        "yaml",
        "xml",
        "sql",
        "bash",
        "shell",
        "powershell",
        "dockerfile",
        "markdown",
        "tex",
        "r",
        "matlab",
        "objective-c",
        "f#",
      ];

      validLanguages.forEach((language) => {
        expect(() =>
          commonSchemas.languageIdentifier.parse(language),
        ).not.toThrow();
        expect(
          commonSchemas.languageIdentifier.safeParse(language).success,
        ).toBe(true);
      });
    });

    it("should reject invalid language identifiers", () => {
      const invalidLanguages = [
        "",
        "java script", // Space
        "c++/cli", // Forward slash
        "language@version", // @ symbol
        "lang_with_underscores", // Underscores not allowed
        "language.extension", // Dot not allowed
        "language:variant", // Colon not allowed
        "a".repeat(51), // Too long
      ];

      invalidLanguages.forEach((language) => {
        expect(() =>
          commonSchemas.languageIdentifier.parse(language),
        ).toThrow();
        expect(
          commonSchemas.languageIdentifier.safeParse(language).success,
        ).toBe(false);
      });
    });

    it("should provide descriptive error messages for different failures", () => {
      const emptyResult = commonSchemas.languageIdentifier.safeParse("");
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).toBe(
          "Language identifier cannot be empty",
        );
      }

      const invalidCharResult =
        commonSchemas.languageIdentifier.safeParse("java script");
      expect(invalidCharResult.success).toBe(false);
      if (!invalidCharResult.success) {
        expect(invalidCharResult.error.issues[0].message).toBe(
          "Language identifier can only contain letters, numbers, +, #, and hyphens",
        );
      }

      const tooLongResult = commonSchemas.languageIdentifier.safeParse(
        "a".repeat(51),
      );
      expect(tooLongResult.success).toBe(false);
      if (!tooLongResult.success) {
        expect(tooLongResult.error.issues[0].message).toBe(
          "Language identifier cannot exceed 50 characters",
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
