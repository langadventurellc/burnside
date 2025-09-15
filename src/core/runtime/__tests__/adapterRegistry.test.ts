/**
 * Adapter Registry Tests
 *
 * Unit tests for adapter registry functionality including registration,
 * selection, and automatic detection with comprehensive error scenarios.
 */

import { AdapterRegistry } from "../adapterRegistry.js";
import { NodeRuntimeAdapter } from "../adapters/nodeRuntimeAdapter.js";
import { RuntimeError } from "../runtimeError.js";
import type { RuntimeAdapter, Platform } from "../index.js";

// Mock detectPlatform
jest.mock("../detectPlatform.js", () => ({
  detectPlatform: jest.fn(),
}));

// Mock NodeRuntimeAdapter to avoid actual Node.js dependencies in tests
jest.mock("../adapters/nodeRuntimeAdapter.js", () => ({
  NodeRuntimeAdapter: jest.fn().mockImplementation(() => ({
    platformInfo: {
      platform: "node",
      capabilities: { hasHttp: true, hasTimers: true, hasFileSystem: true },
    },
    fetch: jest.fn(),
    setTimeout: jest.fn(),
    setInterval: jest.fn(),
    clearTimeout: jest.fn(),
    clearInterval: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    fileExists: jest.fn(),
  })),
}));

describe("AdapterRegistry", () => {
  const { detectPlatform } = require("../detectPlatform.js");
  let registry: AdapterRegistry;

  // Mock adapter for testing
  const mockAdapter: RuntimeAdapter = {
    platformInfo: {
      platform: "browser",
      capabilities: {
        platform: "browser",
        hasHttp: true,
        hasTimers: true,
        hasFileSystem: false,
        features: {},
      },
    },
    fetch: jest.fn(),
    setTimeout: jest.fn(),
    setInterval: jest.fn(),
    clearTimeout: jest.fn(),
    clearInterval: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    fileExists: jest.fn(),
  };

  beforeEach(() => {
    // Reset singleton instance
    (AdapterRegistry as unknown as { instance: undefined }).instance =
      undefined;

    // Mock detectPlatform to return 'browser' to avoid auto-registering Node adapter
    detectPlatform.mockReturnValue("browser");

    registry = AdapterRegistry.getInstance();
    jest.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const registry1 = AdapterRegistry.getInstance();
      const registry2 = AdapterRegistry.getInstance();

      expect(registry1).toBe(registry2);
    });

    it("should initialize default adapters on first getInstance call", () => {
      detectPlatform.mockReturnValue("node");

      // Reset singleton to test initialization
      (AdapterRegistry as unknown as { instance: undefined }).instance =
        undefined;
      const newRegistry = AdapterRegistry.getInstance();

      expect(NodeRuntimeAdapter).toHaveBeenCalled();
      expect(newRegistry.hasAdapter("node")).toBe(true);
    });
  });

  describe("Adapter Registration", () => {
    it("should register adapter for platform", () => {
      registry.registerAdapter("browser", mockAdapter);

      expect(registry.hasAdapter("browser")).toBe(true);
      expect(registry.getAvailableAdapters()).toContain("browser");
    });

    it("should override existing adapter registration", () => {
      const adapter1 = { ...mockAdapter };
      const adapter2 = { ...mockAdapter };

      registry.registerAdapter("browser", adapter1);
      registry.registerAdapter("browser", adapter2);

      expect(registry.getAdapter("browser")).toBe(adapter2);
    });
  });

  describe("Adapter Retrieval", () => {
    beforeEach(() => {
      registry.registerAdapter("browser", mockAdapter);
    });

    it("should return registered adapter for platform", () => {
      const adapter = registry.getAdapter("browser");
      expect(adapter).toBe(mockAdapter);
    });

    it("should auto-detect platform when no platform specified", () => {
      detectPlatform.mockReturnValue("browser");

      const adapter = registry.getAdapter();
      expect(detectPlatform).toHaveBeenCalled();
      expect(adapter).toBe(mockAdapter);
    });

    it("should throw error when no adapter found for platform", () => {
      // Clear any registered adapters to ensure test conditions
      (
        registry as unknown as { adapters: Map<Platform, RuntimeAdapter> }
      ).adapters.clear();

      expect(() => registry.getAdapter("react-native")).toThrow(RuntimeError);
      expect(() => registry.getAdapter("react-native")).toThrow(
        "No runtime adapter available",
      );
    });

    it("should use fallback adapter when available", () => {
      const nodeAdapter = new NodeRuntimeAdapter();
      registry.registerAdapter("node", nodeAdapter);

      // Electron should fallback to Node.js adapter
      const adapter = registry.getAdapter("electron");
      expect(adapter).toBe(nodeAdapter);
    });
  });

  describe("Default Adapter Override", () => {
    beforeEach(() => {
      registry.registerAdapter("browser", mockAdapter);
    });

    it("should use default adapter when set", () => {
      registry.setDefaultAdapter(mockAdapter);

      const adapter = registry.getAdapter("node"); // Different platform
      expect(adapter).toBe(mockAdapter);
    });

    it("should return to auto-detection after clearing default", () => {
      detectPlatform.mockReturnValue("browser");
      registry.setDefaultAdapter(mockAdapter);
      registry.clearDefaultAdapter();

      const adapter = registry.getAdapter();
      expect(adapter).toBe(mockAdapter); // Still browser adapter but through detection
    });
  });

  describe("Available Adapters", () => {
    it("should return empty array when no adapters registered", () => {
      // Reset registry without default adapters
      (AdapterRegistry as unknown as { instance: undefined }).instance =
        undefined;
      detectPlatform.mockReturnValue("browser"); // Non-node to avoid auto-registration
      const emptyRegistry = AdapterRegistry.getInstance();

      expect(emptyRegistry.getAvailableAdapters()).toEqual([]);
    });

    it("should return list of registered platforms", () => {
      registry.registerAdapter("browser", mockAdapter);
      registry.registerAdapter("react-native", mockAdapter);

      const platforms = registry.getAvailableAdapters();
      expect(platforms).toContain("browser");
      expect(platforms).toContain("react-native");
    });
  });

  describe("Adapter Existence Check", () => {
    it("should return true for registered adapter", () => {
      registry.registerAdapter("browser", mockAdapter);

      expect(registry.hasAdapter("browser")).toBe(true);
    });

    it("should return false for unregistered adapter", () => {
      expect(registry.hasAdapter("react-native" as Platform)).toBe(false);
    });
  });

  describe("Fallback Logic", () => {
    it("should provide Node.js fallback for Electron", () => {
      const nodeAdapter = new NodeRuntimeAdapter();
      registry.registerAdapter("node", nodeAdapter);

      const electronAdapter = registry.getAdapter("electron");
      expect(electronAdapter).toBe(nodeAdapter);
    });

    it("should provide browser fallback for React Native", () => {
      registry.registerAdapter("browser", mockAdapter);

      const rnAdapter = registry.getAdapter("react-native");
      expect(rnAdapter).toBe(mockAdapter);
    });

    it("should not provide fallback for browser platform", () => {
      expect(() => registry.getAdapter("browser")).toThrow(RuntimeError);
    });

    it("should not provide fallback for Node.js platform", () => {
      // Clear any auto-registered Node adapter
      (AdapterRegistry as unknown as { instance: undefined }).instance =
        undefined;
      detectPlatform.mockReturnValue("browser");
      const cleanRegistry = AdapterRegistry.getInstance();

      expect(() => cleanRegistry.getAdapter("node")).toThrow(RuntimeError);
    });
  });

  describe("Error Handling", () => {
    it("should handle initialization errors gracefully", () => {
      detectPlatform.mockReturnValue("node");
      (NodeRuntimeAdapter as jest.Mock).mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      // Reset singleton to test error handling
      (AdapterRegistry as unknown as { instance: undefined }).instance =
        undefined;

      expect(() => AdapterRegistry.getInstance()).not.toThrow();
    });

    it("should include context in adapter not found error", () => {
      // Clear any registered adapters to ensure test conditions
      (
        registry as unknown as { adapters: Map<Platform, RuntimeAdapter> }
      ).adapters.clear();

      try {
        registry.getAdapter("react-native");
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeError);
        expect((error as RuntimeError).context?.platform).toBe("react-native");
        expect((error as RuntimeError).context?.availablePlatforms).toEqual([]);
      }
    });
  });
});
