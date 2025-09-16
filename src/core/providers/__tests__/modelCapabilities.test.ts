/**
 * @file Tests for ModelCapabilities interface
 */

import type { ModelCapabilities } from "../modelCapabilities.js";

describe("ModelCapabilities Interface", () => {
  describe("temperature capability", () => {
    test("should accept temperature capability as true", () => {
      const capabilities: ModelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: false,
        documents: false,
        temperature: true,
        supportedContentTypes: ["text"],
      };

      expect(capabilities.temperature).toBe(true);
    });

    test("should accept temperature capability as false", () => {
      const capabilities: ModelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: false,
        documents: false,
        temperature: false,
        supportedContentTypes: ["text"],
      };

      expect(capabilities.temperature).toBe(false);
    });

    test("should accept temperature capability as undefined", () => {
      const capabilities: ModelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: false,
        documents: false,
        supportedContentTypes: ["text"],
      };

      expect(capabilities.temperature).toBeUndefined();
    });

    test("should maintain type safety for temperature field", () => {
      // This test ensures TypeScript enforces the boolean type
      const capabilities: ModelCapabilities = {
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        temperature: true, // Must be boolean or undefined
        maxTokens: 1000,
        supportedContentTypes: ["text", "image"],
        metadata: { test: "value" },
      };

      // Type assertion to verify the temperature field is boolean | undefined
      const temperatureValue: boolean | undefined = capabilities.temperature;
      expect(
        typeof temperatureValue === "boolean" || temperatureValue === undefined,
      ).toBe(true);
    });

    test("should work with all optional fields including temperature", () => {
      const minimalCapabilities: ModelCapabilities = {
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        supportedContentTypes: [],
      };

      expect(minimalCapabilities.temperature).toBeUndefined();
      expect(minimalCapabilities.maxTokens).toBeUndefined();
      expect(minimalCapabilities.metadata).toBeUndefined();
    });

    test("should work with complete capabilities including temperature", () => {
      const completeCapabilities: ModelCapabilities = {
        streaming: true,
        toolCalls: true,
        images: true,
        documents: false,
        temperature: true,
        maxTokens: 128000,
        supportedContentTypes: ["text", "image", "document"],
        metadata: {
          provider: "openai",
          version: "v1",
        },
      };

      expect(completeCapabilities.temperature).toBe(true);
      expect(completeCapabilities.maxTokens).toBe(128000);
      expect(completeCapabilities.metadata).toEqual({
        provider: "openai",
        version: "v1",
      });
    });
  });

  describe("interface compatibility", () => {
    test("should maintain compatibility with existing interface structure", () => {
      const capabilities: ModelCapabilities = {
        streaming: true,
        toolCalls: false,
        images: true,
        documents: false,
        temperature: false, // New field
        maxTokens: 4096,
        supportedContentTypes: ["text", "image"],
        metadata: { contextWindow: 4096 },
      };

      // Verify all expected fields exist and have correct types
      expect(typeof capabilities.streaming).toBe("boolean");
      expect(typeof capabilities.toolCalls).toBe("boolean");
      expect(typeof capabilities.images).toBe("boolean");
      expect(typeof capabilities.documents).toBe("boolean");
      expect(typeof capabilities.temperature).toBe("boolean");
      expect(typeof capabilities.maxTokens).toBe("number");
      expect(Array.isArray(capabilities.supportedContentTypes)).toBe(true);
      expect(typeof capabilities.metadata).toBe("object");
    });
  });
});
