/**
 * Platform Capabilities Tests
 *
 * Unit tests for platform capabilities detection ensuring accurate feature
 * detection across different JavaScript runtime environments.
 */

import { getPlatformCapabilities } from "../getPlatformCapabilities";

// Mock detectPlatform
jest.mock("../detectPlatform", () => ({
  detectPlatform: jest.fn(),
}));

// Mock platform detection functions
jest.mock("../isNodeJs", () => ({
  isNodeJs: jest.fn(),
}));

jest.mock("../isElectron", () => ({
  isElectron: jest.fn(),
}));

describe("getPlatformCapabilities", () => {
  const { detectPlatform } = require("../detectPlatform");
  const { isNodeJs } = require("../isNodeJs");
  const { isElectron } = require("../isElectron");

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock globals
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn();
    (globalThis as unknown as { setTimeout: unknown }).setTimeout = jest.fn();
    (globalThis as unknown as { clearTimeout: unknown }).clearTimeout =
      jest.fn();
    (globalThis as unknown as { setInterval: unknown }).setInterval = jest.fn();
    (globalThis as unknown as { clearInterval: unknown }).clearInterval =
      jest.fn();
  });

  describe("Basic Capabilities", () => {
    it("should detect HTTP capability when fetch is available", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasHttp).toBe(true);
    });

    it("should detect missing HTTP capability when fetch is not available", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);
      (globalThis as unknown as { fetch: unknown }).fetch = undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasHttp).toBe(false);
    });

    it("should detect timer capabilities when available", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasTimers).toBe(true);
    });

    it("should detect missing timer capabilities", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);
      (globalThis as unknown as { setTimeout: unknown }).setTimeout = undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasTimers).toBe(false);
    });

    it("should detect file system capability in Node", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasFileSystem).toBe(true);
    });

    it("should detect file system capability in Electron", () => {
      detectPlatform.mockReturnValue("electron");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(true);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasFileSystem).toBe(true);
    });

    it("should detect missing file system capability in browser", () => {
      detectPlatform.mockReturnValue("browser");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasFileSystem).toBe(false);
    });
  });

  describe("Platform-Specific Features", () => {
    it("should detect Node specific features", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);

      const capabilities = getPlatformCapabilities();

      expect(capabilities.platform).toBe("node");
      expect(capabilities.features.hasProcess).toBe(true);
      expect(capabilities.features.hasFileSystem).toBe(true);
      expect(capabilities.features.hasModules).toBe(true);
    });

    it("should detect browser specific features", () => {
      detectPlatform.mockReturnValue("browser");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // Mock browser globals
      (globalThis as unknown as { document: unknown }).document = {};
      (globalThis as unknown as { localStorage: unknown }).localStorage = {};

      const capabilities = getPlatformCapabilities();

      expect(capabilities.platform).toBe("browser");
      expect(capabilities.features.hasWindow).toBe(true);
      expect(capabilities.features.hasDocument).toBe(true);
      expect(capabilities.features.hasLocalStorage).toBe(true);
    });

    it("should detect browser features without localStorage", () => {
      detectPlatform.mockReturnValue("browser");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // Mock browser globals without localStorage
      (globalThis as unknown as { document: unknown }).document = {};
      (globalThis as unknown as { localStorage: unknown }).localStorage =
        undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.features.hasLocalStorage).toBe(false);
    });

    it("should detect browser features without document", () => {
      detectPlatform.mockReturnValue("browser");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // Mock browser globals without document
      (globalThis as unknown as { document: unknown }).document = undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.features.hasDocument).toBe(false);
    });

    it("should detect Electron specific features", () => {
      detectPlatform.mockReturnValue("electron");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(true);

      // Mock Electron globals
      (globalThis as unknown as { window: unknown }).window = {};

      const capabilities = getPlatformCapabilities();

      expect(capabilities.platform).toBe("electron");
      expect(capabilities.features.hasProcess).toBe(true);
      expect(capabilities.features.hasWindow).toBe(true);
      expect(capabilities.features.hasElectronAPIs).toBe(true);
    });

    it("should detect React Native specific features", () => {
      detectPlatform.mockReturnValue("react-native");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // Mock require for AsyncStorage detection
      (globalThis as unknown as { require: unknown }).require = jest.fn();

      const capabilities = getPlatformCapabilities();

      expect(capabilities.platform).toBe("react-native");
      expect(capabilities.features.hasAsyncStorage).toBe(true);
      expect(capabilities.features.hasBridge).toBe(true);
    });

    it("should detect React Native with require available", () => {
      detectPlatform.mockReturnValue("react-native");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // In Jest environment, require is available, so AsyncStorage detection returns true
      const capabilities = getPlatformCapabilities();

      expect(capabilities.features.hasAsyncStorage).toBe(true);
      expect(capabilities.features.hasBridge).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in capability detection gracefully", () => {
      detectPlatform.mockReturnValue("node");
      isNodeJs.mockReturnValue(true);
      isElectron.mockReturnValue(false);

      // Mock fetch to be undefined to trigger the try/catch
      (globalThis as unknown as { fetch: unknown }).fetch = undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.hasHttp).toBe(false);
      expect(capabilities.platform).toBe("node");
    });

    it("should handle errors in feature detection gracefully", () => {
      detectPlatform.mockReturnValue("browser");
      isNodeJs.mockReturnValue(false);
      isElectron.mockReturnValue(false);

      // Mock localStorage to be undefined to trigger the try/catch
      (globalThis as unknown as { localStorage: unknown }).localStorage =
        undefined;

      const capabilities = getPlatformCapabilities();

      expect(capabilities.features.hasLocalStorage).toBe(false);
      expect(capabilities.platform).toBe("browser");
    });
  });
});
