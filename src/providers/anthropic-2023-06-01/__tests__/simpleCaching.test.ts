/**
 * Unit tests for Anthropic provider prompt caching functionality
 *
 * Tests the simple caching implementation in the AnthropicMessagesV1Provider
 * including capability detection, header generation, and cache marking.
 */

import { AnthropicMessagesV1Provider } from "../anthropicMessagesV1Provider";
import { shouldCacheContent } from "../shouldCacheContent";
import { addCacheControlField } from "../addCacheControlField";
import { createCacheControlObject } from "../createCacheControlObject";
import { ANTHROPIC_CACHE_HEADER, MINIMUM_CACHE_SIZE } from "../cacheUtils";

describe("AnthropicMessagesV1Provider Caching", () => {
  let provider: AnthropicMessagesV1Provider;

  beforeEach(() => {
    provider = new AnthropicMessagesV1Provider();
  });

  describe("supportsCaching", () => {
    test("returns true for Anthropic models with promptCaching capability", () => {
      const claudeModels = [
        "claude-3-haiku-20240307",
        "claude-3-5-haiku-latest",
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-opus-4-1-20250805",
      ];

      claudeModels.forEach((modelId) => {
        expect(provider.supportsCaching(modelId)).toBe(true);
      });
    });

    test("returns false for non-existent models", () => {
      const invalidModels = [
        "non-existent-model",
        "gpt-4", // OpenAI model
        "invalid-claude",
        "",
      ];

      invalidModels.forEach((modelId) => {
        expect(provider.supportsCaching(modelId)).toBe(false);
      });
    });

    test("handles errors gracefully", () => {
      // Should not throw and return false for any edge cases
      expect(() => provider.supportsCaching("test")).not.toThrow();
      expect(provider.supportsCaching("test")).toBe(false);
    });
  });

  describe("getCacheHeaders", () => {
    test("returns correct Anthropic beta header", () => {
      const headers = provider.getCacheHeaders();

      expect(headers).toEqual({
        "anthropic-beta": "prompt-caching-2024-07-31",
      });
    });

    test("returns object that can be merged with existing headers", () => {
      const existingHeaders = {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      };

      const cacheHeaders = provider.getCacheHeaders();
      const mergedHeaders = { ...existingHeaders, ...cacheHeaders };

      expect(mergedHeaders).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token",
        "anthropic-beta": "prompt-caching-2024-07-31",
      });
    });
  });

  describe("markForCaching", () => {
    const longText = "a".repeat(MINIMUM_CACHE_SIZE + 100); // Above threshold
    const shortText = "a".repeat(MINIMUM_CACHE_SIZE - 100); // Below threshold

    test("adds cache_control to long text content", () => {
      const result = provider.markForCaching(longText);

      expect(result).toEqual({
        original: longText,
        cache_control: { type: "ephemeral" },
      });
    });

    test("leaves short text content unchanged", () => {
      const result = provider.markForCaching(shortText);
      expect(result).toBe(shortText);
    });

    test("adds cache_control to objects with long text field", () => {
      const content = { text: longText, type: "system" };
      const result = provider.markForCaching(content);

      expect(result).toEqual({
        text: longText,
        type: "system",
        cache_control: { type: "ephemeral" },
      });
    });

    test("leaves objects with short text field unchanged", () => {
      const content = { text: shortText, type: "system" };
      const result = provider.markForCaching(content);

      expect(result).toBe(content);
    });

    test("handles objects with content array (system messages)", () => {
      const content = {
        role: "system",
        content: [
          { type: "text", text: longText },
          { type: "text", text: "additional content" },
        ],
      };

      const result = provider.markForCaching(content);

      expect(result).toEqual({
        role: "system",
        content: [
          { type: "text", text: longText },
          { type: "text", text: "additional content" },
        ],
        cache_control: { type: "ephemeral" },
      });
    });

    test("does not cache objects with short content array", () => {
      const content = {
        role: "system",
        content: [{ type: "text", text: shortText }],
      };

      const result = provider.markForCaching(content);
      expect(result).toBe(content);
    });

    test("handles null and undefined gracefully", () => {
      expect(provider.markForCaching(null)).toBe(null);
      expect(provider.markForCaching(undefined)).toBe(undefined);
    });

    test("handles primitive types other than strings", () => {
      expect(provider.markForCaching(123)).toBe(123);
      expect(provider.markForCaching(true)).toBe(true);
      expect(provider.markForCaching([])).toEqual([]);
    });

    test("handles errors gracefully and returns original content", () => {
      // Mock shouldCacheContent to throw an error
      const mockShouldCache = jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      });

      // Replace the import temporarily - this is a bit hacky but necessary for testing
      jest.doMock("../shouldCacheContent", () => ({
        shouldCacheContent: mockShouldCache,
      }));

      const content = "test content";
      const result = provider.markForCaching(content);

      expect(result).toBe(content);

      // Restore original
      jest.dontMock("../shouldCacheContent");
    });
  });

  describe("Integration tests", () => {
    test("caching methods work together correctly", () => {
      const modelId = "claude-3-5-haiku-latest";
      const longContent = "a".repeat(MINIMUM_CACHE_SIZE + 100);

      // Check capability
      expect(provider.supportsCaching(modelId)).toBe(true);

      // Get headers
      const headers = provider.getCacheHeaders();
      expect(headers["anthropic-beta"]).toBe("prompt-caching-2024-07-31");

      // Mark content
      const markedContent = provider.markForCaching(longContent);
      expect(markedContent).toHaveProperty("cache_control");
    });

    test("provider maintains backward compatibility", () => {
      // Ensure the provider still implements all required ProviderPlugin methods
      expect(typeof provider.initialize).toBe("function");
      expect(typeof provider.supportsModel).toBe("function");
      expect(typeof provider.translateRequest).toBe("function");
      expect(typeof provider.parseResponse).toBe("function");
      expect(typeof provider.normalizeError).toBe("function");

      // Caching methods are optional additions
      expect(typeof provider.supportsCaching).toBe("function");
      expect(typeof provider.getCacheHeaders).toBe("function");
      expect(typeof provider.markForCaching).toBe("function");
    });
  });
});

describe("Cache Utility Functions", () => {
  describe("shouldCacheContent", () => {
    test("returns true for content above minimum size", () => {
      const longContent = "a".repeat(MINIMUM_CACHE_SIZE + 1);
      expect(shouldCacheContent(longContent)).toBe(true);
    });

    test("returns false for content below minimum size", () => {
      const shortContent = "a".repeat(MINIMUM_CACHE_SIZE - 1);
      expect(shouldCacheContent(shortContent)).toBe(false);
    });

    test("returns true for content exactly at minimum size", () => {
      const exactContent = "a".repeat(MINIMUM_CACHE_SIZE);
      expect(shouldCacheContent(exactContent)).toBe(true);
    });
  });

  describe("createCacheControlObject", () => {
    test("returns correct cache control object", () => {
      const cacheControl = createCacheControlObject();
      expect(cacheControl).toEqual({ type: "ephemeral" });
    });
  });

  describe("addCacheControlField", () => {
    test("adds cache_control to objects", () => {
      const input = { text: "content", role: "system" };
      const result = addCacheControlField(input);

      expect(result).toEqual({
        text: "content",
        role: "system",
        cache_control: { type: "ephemeral" },
      });
    });

    test("wraps primitive values in object with cache_control", () => {
      const input = "test string";
      const result = addCacheControlField(input);

      expect(result).toEqual({
        original: "test string",
        cache_control: { type: "ephemeral" },
      });
    });

    test("handles null values", () => {
      const result = addCacheControlField(null);
      expect(result).toEqual({
        original: null,
        cache_control: { type: "ephemeral" },
      });
    });
  });

  describe("Cache constants", () => {
    test("ANTHROPIC_CACHE_HEADER has correct value", () => {
      expect(ANTHROPIC_CACHE_HEADER).toBe(
        "anthropic-beta: prompt-caching-2024-07-31",
      );
    });

    test("MINIMUM_CACHE_SIZE is reasonable", () => {
      expect(MINIMUM_CACHE_SIZE).toBe(4000);
      expect(typeof MINIMUM_CACHE_SIZE).toBe("number");
      expect(MINIMUM_CACHE_SIZE).toBeGreaterThan(0);
    });
  });
});
