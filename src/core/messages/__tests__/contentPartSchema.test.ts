/**
 * Content Part Schema Tests
 *
 * Comprehensive test suite for ContentPart discriminated union schema
 * covering validation for text, image, document, and code content types.
 */

import { ContentPartSchema } from "../contentPartSchema.js";
import { validateContentPart } from "../contentPartValidation.js";

describe("ContentPartSchema", () => {
  describe("TextContent validation", () => {
    it("should validate correct text content", () => {
      const validTextContent = [
        { type: "text", text: "Hello, world!" },
        { type: "text", text: "A single character: x" },
        { type: "text", text: "Multi-line\ntext\ncontent" },
        { type: "text", text: "Text with special characters: !@#$%^&*()" },
        { type: "text", text: "Very long text content ".repeat(100) },
      ];

      validTextContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).not.toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should reject invalid text content", () => {
      const invalidTextContent = [
        { type: "text", text: "" }, // Empty text
        { type: "text", text: "   " }, // Whitespace only
        { type: "text" }, // Missing text field
        { type: "text", text: null }, // Null text
        { type: "text", text: undefined }, // Undefined text
        { type: "text", text: 123 }, // Non-string text
      ];

      invalidTextContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });

    it("should provide descriptive error messages for text content", () => {
      const emptyResult = ContentPartSchema.safeParse({
        type: "text",
        text: "",
      });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).toBe(
          "Text content cannot be empty",
        );
      }

      const whitespaceResult = ContentPartSchema.safeParse({
        type: "text",
        text: "   ",
      });
      expect(whitespaceResult.success).toBe(false);
      if (!whitespaceResult.success) {
        expect(whitespaceResult.error.issues[0].message).toBe(
          "Text content cannot be only whitespace",
        );
      }
    });
  });

  describe("ImageContent validation", () => {
    it("should validate correct image content", () => {
      const validImageContent = [
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
        {
          type: "image",
          data: "SGVsbG8gd29ybGQ=",
          mimeType: "image/jpeg",
          alt: "Sample image",
        },
        {
          type: "image",
          data: "VGVzdA==",
          mimeType: "image/gif",
          alt: "",
        },
        {
          type: "image",
          data: "YWJjZGVmZ2hpams=",
          mimeType: "image/webp",
        },
        {
          type: "image",
          data: "dGVzdGRhdGE=",
          mimeType: "image/svg+xml",
          alt: "SVG image description",
        },
      ];

      validImageContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).not.toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should reject invalid image content", () => {
      const invalidImageContent = [
        { type: "image", data: "Hello world", mimeType: "image/png" }, // Invalid base64
        { type: "image", data: "SGVsbG8gd29ybGQ=", mimeType: "image/bmp" }, // Unsupported MIME type
        { type: "image", data: "", mimeType: "image/png" }, // Empty data not allowed
        { type: "image", data: "SGVsbG8gd29ybGQ=", mimeType: "text/plain" }, // Wrong MIME type category
        { type: "image", mimeType: "image/png" }, // Missing data field
        { type: "image", data: "SGVsbG8gd29ybGQ=" }, // Missing mimeType field
        { type: "image", data: null, mimeType: "image/png" }, // Null data
        { type: "image", data: "SGVsbG8gd29ybGQ=", mimeType: null }, // Null mimeType
      ];

      invalidImageContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });

    it("should provide descriptive error messages for image content", () => {
      const invalidBase64Result = ContentPartSchema.safeParse({
        type: "image",
        data: "Hello world",
        mimeType: "image/png",
      });
      expect(invalidBase64Result.success).toBe(false);
      if (!invalidBase64Result.success) {
        expect(invalidBase64Result.error.issues[0].message).toBe(
          "Must be valid base64 data",
        );
      }

      const invalidMimeTypeResult = ContentPartSchema.safeParse({
        type: "image",
        data: "SGVsbG8gd29ybGQ=",
        mimeType: "image/bmp",
      });
      expect(invalidMimeTypeResult.success).toBe(false);
      if (!invalidMimeTypeResult.success) {
        expect(invalidMimeTypeResult.error.issues[0].message).toBe(
          "Must be a supported image MIME type (jpeg, png, gif, webp, svg+xml)",
        );
      }
    });
  });

  describe("DocumentContent validation", () => {
    it("should validate correct document content", () => {
      const validDocumentContent = [
        {
          type: "document",
          data: "SGVsbG8gd29ybGQ=",
          mimeType: "application/pdf",
        },
        {
          type: "document",
          data: "VGVzdA==",
          mimeType: "text/plain",
          name: "document.txt",
        },
        {
          type: "document",
          data: "dGVzdGRhdGE=",
          mimeType: "text/markdown",
          name: "readme.md",
        },
        {
          type: "document",
          data: "anNvbmRhdGE=",
          mimeType: "application/json",
        },
        {
          type: "document",
          data: "Y3N2ZGF0YQ==",
          mimeType: "text/csv",
          name: "data.csv",
        },
      ];

      validDocumentContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).not.toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should reject invalid document content", () => {
      const invalidDocumentContent = [
        { type: "document", data: "Hello world", mimeType: "application/pdf" }, // Invalid base64
        { type: "document", data: "", mimeType: "application/pdf" }, // Empty data not allowed
        { type: "document", data: "SGVsbG8gd29ybGQ=", mimeType: "image/png" }, // Wrong MIME type category
        {
          type: "document",
          data: "SGVsbG8gd29ybGQ=",
          mimeType: "application/unknown",
        }, // Unsupported MIME type
        { type: "document", mimeType: "application/pdf" }, // Missing data field
        { type: "document", data: "SGVsbG8gd29ybGQ=" }, // Missing mimeType field
        {
          type: "document",
          data: "SGVsbG8gd29ybGQ=",
          mimeType: "application/pdf",
          name: "invalid file name.pdf",
        }, // Invalid filename
        {
          type: "document",
          data: "SGVsbG8gd29ybGQ=",
          mimeType: "application/pdf",
          name: "",
        }, // Empty filename
      ];

      invalidDocumentContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });

    it("should provide descriptive error messages for document content", () => {
      const invalidMimeTypeResult = ContentPartSchema.safeParse({
        type: "document",
        data: "SGVsbG8gd29ybGQ=",
        mimeType: "image/png",
      });
      expect(invalidMimeTypeResult.success).toBe(false);
      if (!invalidMimeTypeResult.success) {
        expect(invalidMimeTypeResult.error.issues[0].message).toBe(
          "Must be a supported document MIME type",
        );
      }

      const invalidFilenameResult = ContentPartSchema.safeParse({
        type: "document",
        data: "SGVsbG8gd29ybGQ=",
        mimeType: "application/pdf",
        name: "invalid file name.pdf",
      });
      expect(invalidFilenameResult.success).toBe(false);
      if (!invalidFilenameResult.success) {
        expect(invalidFilenameResult.error.issues[0].message).toBe(
          "Filename can only contain letters, numbers, dots, underscores, and hyphens",
        );
      }
    });
  });

  describe("CodeContent validation", () => {
    it("should validate correct code content", () => {
      const validCodeContent = [
        {
          type: "code",
          text: "console.log('Hello, world!');",
        },
        {
          type: "code",
          text: "function add(a, b) { return a + b; }",
          language: "javascript",
        },
        {
          type: "code",
          text: "def hello():\n    print('Hello')",
          language: "python",
          filename: "hello.py",
        },
        {
          type: "code",
          text: "#include <stdio.h>\nint main() { return 0; }",
          language: "c",
          filename: "main.c",
        },
        {
          type: "code",
          text: "SELECT * FROM users;",
          language: "sql",
        },
        {
          type: "code",
          text: 'pub fn main() { println!("Hello"); }',
          language: "rust",
          filename: "main.rs",
        },
      ];

      validCodeContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).not.toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should reject invalid code content", () => {
      const invalidCodeContent = [
        { type: "code", text: "" }, // Empty code
        { type: "code", text: "   " }, // Whitespace only
        { type: "code" }, // Missing text field
        { type: "code", text: null }, // Null text
        { type: "code", text: "console.log('test');", language: "" }, // Empty language
        { type: "code", text: "console.log('test');", language: "java script" }, // Invalid language identifier
        { type: "code", text: "console.log('test');", filename: "" }, // Empty filename
        {
          type: "code",
          text: "console.log('test');",
          filename: "invalid file name.js",
        }, // Invalid filename
      ];

      invalidCodeContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });

    it("should provide descriptive error messages for code content", () => {
      const emptyCodeResult = ContentPartSchema.safeParse({
        type: "code",
        text: "",
      });
      expect(emptyCodeResult.success).toBe(false);
      if (!emptyCodeResult.success) {
        expect(emptyCodeResult.error.issues[0].message).toBe(
          "Code content cannot be empty",
        );
      }

      const whitespaceCodeResult = ContentPartSchema.safeParse({
        type: "code",
        text: "   ",
      });
      expect(whitespaceCodeResult.success).toBe(false);
      if (!whitespaceCodeResult.success) {
        expect(whitespaceCodeResult.error.issues[0].message).toBe(
          "Code content cannot be only whitespace",
        );
      }

      const invalidLanguageResult = ContentPartSchema.safeParse({
        type: "code",
        text: "console.log('test');",
        language: "java script",
      });
      expect(invalidLanguageResult.success).toBe(false);
      if (!invalidLanguageResult.success) {
        expect(invalidLanguageResult.error.issues[0].message).toBe(
          "Language identifier can only contain letters, numbers, +, #, and hyphens",
        );
      }
    });
  });

  describe("Discriminated union behavior", () => {
    it("should correctly discriminate based on type field", () => {
      const textContent = { type: "text", text: "Hello" };
      const imageContent = {
        type: "image",
        data: "SGVsbG8=",
        mimeType: "image/png",
      };
      const documentContent = {
        type: "document",
        data: "SGVsbG8=",
        mimeType: "application/pdf",
      };
      const codeContent = { type: "code", text: "console.log('hello');" };

      expect(ContentPartSchema.safeParse(textContent).success).toBe(true);
      expect(ContentPartSchema.safeParse(imageContent).success).toBe(true);
      expect(ContentPartSchema.safeParse(documentContent).success).toBe(true);
      expect(ContentPartSchema.safeParse(codeContent).success).toBe(true);
    });

    it("should reject invalid type values", () => {
      const invalidTypes = [
        { type: "video", url: "https://example.com/video.mp4" },
        { type: "audio", url: "https://example.com/audio.mp3" },
        { type: "unknown", data: "some data" },
        { type: "", text: "hello" },
        { type: null, text: "hello" },
        { type: undefined, text: "hello" },
        { text: "hello" }, // Missing type field
      ];

      invalidTypes.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });

    it("should reject mixed content type properties", () => {
      const mixedContent = [
        { type: "text", text: "hello", data: "SGVsbG8=" }, // Text with image data
        { type: "image", text: "hello", mimeType: "image/png" }, // Image with text
        { type: "document", text: "code", mimeType: "application/pdf" }, // Document with code text
        { type: "code", data: "SGVsbG8=", text: "console.log('hello');" }, // Code with binary data
      ];

      mixedContent.forEach((content) => {
        expect(() => ContentPartSchema.parse(content)).toThrow();
        expect(ContentPartSchema.safeParse(content).success).toBe(false);
      });
    });
  });

  describe("validateContentPart utility function", () => {
    it("should work correctly with valid content", () => {
      const validContent = { type: "text", text: "Hello, world!" };
      const result = validateContentPart(validContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validContent);
      }
    });

    it("should work correctly with invalid content", () => {
      const invalidContent = { type: "text", text: "" };
      const result = validateContentPart(invalidContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues[0].message).toBe(
          "Text content cannot be empty",
        );
      }
    });

    it("should handle completely invalid input", () => {
      const invalidInputs = [
        null,
        undefined,
        "string",
        123,
        [],
        true,
        { invalid: "object" },
      ];

      invalidInputs.forEach((input) => {
        const result = validateContentPart(input);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle minimal valid content", () => {
      const minimalContent = [
        { type: "text", text: "x" }, // Single character
        { type: "image", data: "QQ==", mimeType: "image/png" }, // Minimal valid base64 (single character 'A')
        { type: "document", data: "QQ==", mimeType: "application/pdf" }, // Minimal valid base64
        { type: "code", text: ";" }, // Single character code
      ];

      minimalContent.forEach((content) => {
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should handle large content", () => {
      const largeText = "A".repeat(10000);
      // Create a single large valid base64 string by encoding large data
      const largeData = "Hello world! ".repeat(5000); // Create large text
      const largeBase64 = Buffer.from(largeData).toString("base64");

      const largeContent = [
        { type: "text", text: largeText },
        { type: "image", data: largeBase64, mimeType: "image/png" },
        { type: "document", data: largeBase64, mimeType: "application/pdf" },
        { type: "code", text: largeText },
      ];

      largeContent.forEach((content) => {
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });

    it("should handle special characters in text and code", () => {
      const specialCharacters = "!@#$%^&*()[]{}|\\:;\"'<>,.?/~`±§¿";
      const unicodeText = "Hello 世界 🌍 emoji";

      const specialContent = [
        { type: "text", text: specialCharacters },
        { type: "text", text: unicodeText },
        { type: "code", text: specialCharacters },
        { type: "code", text: unicodeText },
      ];

      specialContent.forEach((content) => {
        expect(ContentPartSchema.safeParse(content).success).toBe(true);
      });
    });
  });
});
