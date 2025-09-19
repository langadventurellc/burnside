import type { ProviderPlugin } from "../providerPlugin";
import { hasProviderCaching } from "../hasProviderCaching";
import { addCacheHeaders } from "../addCacheHeaders";
import { applyCacheMarkers } from "../applyCacheMarkers";

describe("Simple Caching Helpers", () => {
  // Mock provider plugin without caching support
  const basicPlugin: ProviderPlugin = {
    id: "basic",
    name: "Basic Provider",
    version: "1.0.0",
    translateRequest: jest.fn(),
    parseResponse: jest.fn(),
    normalizeError: jest.fn(),
  };

  // Mock provider plugin with full caching support
  const cachingPlugin: ProviderPlugin = {
    id: "caching",
    name: "Caching Provider",
    version: "1.0.0",
    translateRequest: jest.fn(),
    parseResponse: jest.fn(),
    normalizeError: jest.fn(),
    supportsCaching: jest.fn().mockReturnValue(true),
    getCacheHeaders: jest
      .fn()
      .mockReturnValue({ "anthropic-beta": "prompt-caching-2024-07-31" }),
    markForCaching: jest.fn().mockImplementation((content) => ({
      ...content,
      cache_control: { type: "ephemeral" },
    })),
  };

  // Mock provider plugin with partial caching support
  const partialCachingPlugin: ProviderPlugin = {
    id: "partial",
    name: "Partial Caching Provider",
    version: "1.0.0",
    translateRequest: jest.fn(),
    parseResponse: jest.fn(),
    normalizeError: jest.fn(),
    supportsCaching: jest.fn().mockReturnValue(true),
  };

  describe("hasProviderCaching", () => {
    test("returns false for plugin without caching methods", () => {
      expect(hasProviderCaching(basicPlugin)).toBe(false);
    });

    test("returns true for plugin with supportsCaching method", () => {
      expect(hasProviderCaching(partialCachingPlugin)).toBe(true);
    });

    test("returns true for plugin with getCacheHeaders method", () => {
      const plugin = {
        ...basicPlugin,
        getCacheHeaders: jest.fn(),
      };
      expect(hasProviderCaching(plugin)).toBe(true);
    });

    test("returns true for plugin with markForCaching method", () => {
      const plugin = {
        ...basicPlugin,
        markForCaching: jest.fn(),
      };
      expect(hasProviderCaching(plugin)).toBe(true);
    });

    test("returns true for plugin with full caching support", () => {
      expect(hasProviderCaching(cachingPlugin)).toBe(true);
    });
  });

  describe("addCacheHeaders", () => {
    test("returns original headers for plugin without getCacheHeaders", () => {
      const originalHeaders = { "Content-Type": "application/json" };
      const result = addCacheHeaders(basicPlugin, originalHeaders);
      expect(result).toEqual(originalHeaders);
      expect(result).toBe(originalHeaders); // Should be same reference
    });

    test("merges cache headers with existing headers", () => {
      const originalHeaders = { "Content-Type": "application/json" };
      const result = addCacheHeaders(cachingPlugin, originalHeaders);
      expect(result).toEqual({
        "Content-Type": "application/json",
        "anthropic-beta": "prompt-caching-2024-07-31",
      });
      expect(cachingPlugin.getCacheHeaders).toHaveBeenCalled();
    });

    test("returns original headers if getCacheHeaders throws error", () => {
      const errorPlugin = {
        ...basicPlugin,
        getCacheHeaders: jest.fn().mockImplementation(() => {
          throw new Error("Cache header error");
        }),
      };
      const originalHeaders = { "Content-Type": "application/json" };
      const result = addCacheHeaders(errorPlugin, originalHeaders);
      expect(result).toEqual(originalHeaders);
      expect(result).toBe(originalHeaders);
    });

    test("overwrites existing headers with same key", () => {
      const originalHeaders = { "anthropic-beta": "old-value" };
      const result = addCacheHeaders(cachingPlugin, originalHeaders);
      expect(result).toEqual({
        "anthropic-beta": "prompt-caching-2024-07-31",
      });
    });

    test("handles empty original headers", () => {
      const result = addCacheHeaders(cachingPlugin, {});
      expect(result).toEqual({
        "anthropic-beta": "prompt-caching-2024-07-31",
      });
    });
  });

  describe("applyCacheMarkers", () => {
    test("returns original content for plugin without markForCaching", () => {
      const originalContent = { messages: ["hello"] };
      const result = applyCacheMarkers(basicPlugin, originalContent);
      expect(result).toEqual(originalContent);
      expect(result).toBe(originalContent); // Should be same reference
    });

    test("applies cache markers to content", () => {
      const originalContent = { messages: ["hello"] };
      const result = applyCacheMarkers(cachingPlugin, originalContent);
      expect(result).toEqual({
        messages: ["hello"],
        cache_control: { type: "ephemeral" },
      });
      expect(cachingPlugin.markForCaching).toHaveBeenCalledWith(
        originalContent,
      );
    });

    test("returns original content if markForCaching throws error", () => {
      const errorPlugin = {
        ...basicPlugin,
        markForCaching: jest.fn().mockImplementation(() => {
          throw new Error("Cache marking error");
        }),
      };
      const originalContent = { messages: ["hello"] };
      const result = applyCacheMarkers(errorPlugin, originalContent);
      expect(result).toEqual(originalContent);
      expect(result).toBe(originalContent);
    });

    test("handles null and undefined content", () => {
      expect(applyCacheMarkers(cachingPlugin, null)).toEqual({
        cache_control: { type: "ephemeral" },
      });
      expect(applyCacheMarkers(cachingPlugin, undefined)).toEqual({
        cache_control: { type: "ephemeral" },
      });
    });

    test("handles primitive content types", () => {
      // Create a specific mock for primitive content that doesn't use spread operator
      const primitivePlugin = {
        ...basicPlugin,
        markForCaching: jest.fn().mockImplementation((content) => {
          if (typeof content === "string") {
            return { original: content, cache_control: { type: "ephemeral" } };
          }
          if (typeof content === "number") {
            return { original: content, cache_control: { type: "ephemeral" } };
          }
          return content;
        }),
      };

      expect(applyCacheMarkers(primitivePlugin, "string")).toEqual({
        original: "string",
        cache_control: { type: "ephemeral" },
      });
      expect(applyCacheMarkers(primitivePlugin, 42)).toEqual({
        original: 42,
        cache_control: { type: "ephemeral" },
      });
    });
  });

  describe("Backward Compatibility", () => {
    test("existing providers work without modification", () => {
      // Test that basic plugin operations still work
      expect(() => basicPlugin.translateRequest).not.toThrow();
      expect(() => basicPlugin.parseResponse).not.toThrow();
      expect(() => basicPlugin.normalizeError).not.toThrow();
    });

    test("caching helpers are safe with minimal plugins", () => {
      const minimalPlugin = {
        id: "minimal",
        name: "Minimal",
        version: "1.0.0",
      } as ProviderPlugin;

      expect(() => hasProviderCaching(minimalPlugin)).not.toThrow();
      expect(() => addCacheHeaders(minimalPlugin, {})).not.toThrow();
      expect(() => applyCacheMarkers(minimalPlugin, {})).not.toThrow();

      expect(hasProviderCaching(minimalPlugin)).toBe(false);
      expect(addCacheHeaders(minimalPlugin, {})).toEqual({});
      expect(applyCacheMarkers(minimalPlugin, {})).toEqual({});
    });
  });
});
