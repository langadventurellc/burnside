/**
 * Platform Detection Tests
 *
 * Unit tests for platform detection utilities ensuring accurate environment
 * identification across different JavaScript runtime environments.
 */

import { detectPlatform } from "../detectPlatform";
import { isNodeJs } from "../isNodeJs";
import { isBrowser } from "../isBrowser";
import { isElectron } from "../isElectron";
import { isElectronRenderer } from "../isElectronRenderer";
import { isReactNative } from "../isReactNative";

// Mock global objects for testing different environments
const mockGlobalThis = (globals: Record<string, unknown>) => {
  const originalGlobals: Record<string, unknown> = {};

  // Store original values
  Object.keys(globals).forEach((key) => {
    originalGlobals[key] = (globalThis as unknown as Record<string, unknown>)[
      key
    ];
  });

  // Set mock values
  Object.keys(globals).forEach((key) => {
    (globalThis as unknown as Record<string, unknown>)[key] = globals[key];
  });

  // Return cleanup function
  return () => {
    Object.keys(originalGlobals).forEach((key) => {
      (globalThis as unknown as Record<string, unknown>)[key] =
        originalGlobals[key];
    });
  };
};

describe("Platform Detection", () => {
  describe("detectPlatform", () => {
    it("should detect current platform", () => {
      const platform = detectPlatform();
      expect([
        "node",
        "browser",
        "electron",
        "electron-renderer",
        "react-native",
      ]).toContain(platform);
    });

    // Note: In Jest/Node environment, this will typically return 'node'
    it("should detect Node in current test environment", () => {
      const platform = detectPlatform();
      expect(platform).toBe("node");
    });
  });

  describe("isNodeJs", () => {
    it("should return true in Node environment", () => {
      expect(isNodeJs()).toBe(true);
    });

    it("should return false when process is not available", () => {
      const cleanup = mockGlobalThis({ process: undefined });
      expect(isNodeJs()).toBe(false);
      cleanup();
    });

    it("should return false when process.versions is not available", () => {
      const cleanup = mockGlobalThis({
        process: { versions: undefined },
      });
      expect(isNodeJs()).toBe(false);
      cleanup();
    });

    it("should return false when process.versions.node is not available", () => {
      const cleanup = mockGlobalThis({
        process: { versions: {} },
      });
      expect(isNodeJs()).toBe(false);
      cleanup();
    });
  });

  describe("isBrowser", () => {
    it("should return false in Node environment", () => {
      expect(isBrowser()).toBe(false);
    });

    it("should return true when browser globals are available", () => {
      const cleanup = mockGlobalThis({
        window: { document: {} },
        navigator: {},
      });
      expect(isBrowser()).toBe(true);
      cleanup();
    });

    it("should return false when window is not available", () => {
      const cleanup = mockGlobalThis({ window: undefined });
      expect(isBrowser()).toBe(false);
      cleanup();
    });

    it("should return false when document is not available", () => {
      const cleanup = mockGlobalThis({
        window: {},
        navigator: {},
      });
      expect(isBrowser()).toBe(false);
      cleanup();
    });

    it("should return false when navigator is not available", () => {
      const cleanup = mockGlobalThis({
        window: { document: {} },
        navigator: undefined,
      });
      expect(isBrowser()).toBe(false);
      cleanup();
    });
  });

  describe("isElectron", () => {
    it("should return false in pure Node environment", () => {
      expect(isElectron()).toBe(false);
    });

    it("should return true when Electron main process (has electron version, no window)", () => {
      const cleanup = mockGlobalThis({
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
        },
        window: undefined,
      });

      expect(isElectron()).toBe(true);
      cleanup();
    });

    it("should return false when Node + window are both available (renderer process)", () => {
      const cleanup = mockGlobalThis({
        window: {},
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
          type: "renderer",
        },
      });
      expect(isElectron()).toBe(false);
      cleanup();
    });

    it("should return false when window is available without electron version", () => {
      const cleanup = mockGlobalThis({ window: {} });
      expect(isElectron()).toBe(false);
      cleanup();
    });
  });

  describe("isElectronRenderer", () => {
    it("should return false in pure Node environment", () => {
      expect(isElectronRenderer()).toBe(false);
    });

    it("should return true when Electron renderer process (has window + process.type)", () => {
      const cleanup = mockGlobalThis({
        window: {},
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
          type: "renderer",
        },
      });

      expect(isElectronRenderer()).toBe(true);
      cleanup();
    });

    it("should return false when window is available but process.type is not renderer", () => {
      const cleanup = mockGlobalThis({
        window: {},
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
          type: "main",
        },
      });
      expect(isElectronRenderer()).toBe(false);
      cleanup();
    });

    it("should return false when process.type is renderer but no window", () => {
      const cleanup = mockGlobalThis({
        window: undefined,
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
          type: "renderer",
        },
      });
      expect(isElectronRenderer()).toBe(false);
      cleanup();
    });

    it("should return false when only window is available (browser)", () => {
      const cleanup = mockGlobalThis({
        window: {},
        process: undefined,
      });
      expect(isElectronRenderer()).toBe(false);
      cleanup();
    });
  });

  describe("detectPlatform electron-renderer", () => {
    it("should detect electron-renderer when renderer process conditions are met", () => {
      const cleanup = mockGlobalThis({
        window: {},
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
          type: "renderer",
        },
      });

      expect(detectPlatform()).toBe("electron-renderer");
      cleanup();
    });

    it("should detect electron main process (not renderer) when no window", () => {
      const cleanup = mockGlobalThis({
        window: undefined,
        process: {
          versions: {
            node: globalThis.process.versions.node,
            electron: "13.0.0",
          },
        },
      });

      expect(detectPlatform()).toBe("electron");
      cleanup();
    });
  });

  describe("isReactNative", () => {
    it("should return false in Node environment", () => {
      expect(isReactNative()).toBe(false);
    });

    it("should return true when React Native navigator is available", () => {
      const cleanup = mockGlobalThis({
        navigator: { userAgent: "Something ReactNative Something" },
      });
      expect(isReactNative()).toBe(true);
      cleanup();
    });

    it("should return false when navigator is not available", () => {
      const cleanup = mockGlobalThis({ navigator: undefined });
      expect(isReactNative()).toBe(false);
      cleanup();
    });

    it("should return false when userAgent is not a string", () => {
      const cleanup = mockGlobalThis({
        navigator: { userAgent: undefined },
      });
      expect(isReactNative()).toBe(false);
      cleanup();
    });

    it("should return false when userAgent does not contain ReactNative", () => {
      const cleanup = mockGlobalThis({
        navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      expect(isReactNative()).toBe(false);
      cleanup();
    });
  });
});
