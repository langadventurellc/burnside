/**
 * OpenAI Models Tests
 *
 * Unit tests for OpenAI model capabilities and metadata functions.
 */

import { getModelCapabilities } from "../models.js";

describe("OpenAI Models", () => {
  describe("getModelCapabilities", () => {
    it("should return capabilities for gpt-4o-2024-08-06", () => {
      const capabilities = getModelCapabilities("gpt-4o-2024-08-06");

      expect(capabilities).toBeDefined();
      expect(capabilities?.streaming).toBe(true);
      expect(capabilities?.toolCalls).toBe(false); // Phase 4 scope
      expect(capabilities?.images).toBe(true);
      expect(capabilities?.documents).toBe(true);
      expect(capabilities?.maxTokens).toBe(128000);
      expect(capabilities?.supportedContentTypes).toEqual(["text", "image"]);
    });

    it("should return capabilities for gpt-5-2025-08-07", () => {
      const capabilities = getModelCapabilities("gpt-5-2025-08-07");

      expect(capabilities).toBeDefined();
      expect(capabilities?.streaming).toBe(true);
      expect(capabilities?.toolCalls).toBe(false); // Phase 4 scope
      expect(capabilities?.images).toBe(true);
      expect(capabilities?.documents).toBe(true);
      expect(capabilities?.maxTokens).toBe(200000);
      expect(capabilities?.supportedContentTypes).toEqual(["text", "image"]);
    });

    it("should return undefined for unsupported models", () => {
      const capabilities = getModelCapabilities("gpt-3.5-turbo");

      expect(capabilities).toBeUndefined();
    });

    it("should return undefined for non-existent models", () => {
      const capabilities = getModelCapabilities("non-existent-model");

      expect(capabilities).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const capabilities = getModelCapabilities("");

      expect(capabilities).toBeUndefined();
    });

    it("should handle case sensitivity", () => {
      const capabilities = getModelCapabilities("GPT-4O-2024-08-06");

      expect(capabilities).toBeUndefined();
    });

    it("should return undefined for partial model names", () => {
      const capabilities = getModelCapabilities("gpt-4o");

      expect(capabilities).toBeUndefined();
    });
  });

  describe("model capabilities structure", () => {
    it("should have consistent capability structure across models", () => {
      const gpt4oCapabilities = getModelCapabilities("gpt-4o-2024-08-06");
      const gpt5Capabilities = getModelCapabilities("gpt-5-2025-08-07");

      expect(gpt4oCapabilities).toBeDefined();
      expect(gpt5Capabilities).toBeDefined();

      // Both should have the same capability keys
      const gpt4oKeys = Object.keys(gpt4oCapabilities!).sort();
      const gpt5Keys = Object.keys(gpt5Capabilities!).sort();
      expect(gpt4oKeys).toEqual(gpt5Keys);

      // Both should have required capability properties
      expect(typeof gpt4oCapabilities!.streaming).toBe("boolean");
      expect(typeof gpt4oCapabilities!.toolCalls).toBe("boolean");
      expect(typeof gpt4oCapabilities!.images).toBe("boolean");
      expect(typeof gpt4oCapabilities!.documents).toBe("boolean");
      expect(Array.isArray(gpt4oCapabilities!.supportedContentTypes)).toBe(
        true,
      );
    });

    it("should have valid maxTokens values", () => {
      const gpt4oCapabilities = getModelCapabilities("gpt-4o-2024-08-06");
      const gpt5Capabilities = getModelCapabilities("gpt-5-2025-08-07");

      expect(gpt4oCapabilities?.maxTokens).toBeGreaterThan(0);
      expect(gpt5Capabilities?.maxTokens).toBeGreaterThan(0);
      expect(gpt5Capabilities?.maxTokens).toBeGreaterThan(
        gpt4oCapabilities?.maxTokens ?? 0,
      );
    });

    it("should have non-empty supportedContentTypes", () => {
      const gpt4oCapabilities = getModelCapabilities("gpt-4o-2024-08-06");

      expect(gpt4oCapabilities?.supportedContentTypes).toBeDefined();
      expect(gpt4oCapabilities?.supportedContentTypes.length).toBeGreaterThan(
        0,
      );
      expect(gpt4oCapabilities?.supportedContentTypes).toContain("text");
    });
  });
});
