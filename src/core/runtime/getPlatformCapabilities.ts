/**
 * Platform Capabilities Detection
 *
 * Gets platform capabilities for the current environment.
 * Detects available features like HTTP, timers, and file system access.
 */

import type { PlatformCapabilities } from "./platformCapabilities.js";
import { detectPlatform } from "./detectPlatform.js";
import { isNodeJs } from "./isNodeJs.js";
import { isElectron } from "./isElectron.js";

/**
 * Get platform capabilities for the current environment.
 *
 * Detects available features like HTTP, timers, and file system access
 * based on the current platform and available APIs.
 *
 * @returns Platform capability information
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = detectPlatform();

  const capabilities: PlatformCapabilities = {
    platform,
    hasHttp: detectHttpCapability(),
    hasTimers: detectTimerCapability(),
    hasFileSystem: detectFileSystemCapability(),
    features: {},
  };

  // Add platform-specific features
  switch (platform) {
    case "node":
      capabilities.features.hasProcess = true;
      capabilities.features.hasFileSystem = true;
      capabilities.features.hasModules = true;
      break;
    case "browser":
      capabilities.features.hasWindow = true;
      capabilities.features.hasDocument = typeof document !== "undefined";
      capabilities.features.hasLocalStorage = detectLocalStorage();
      break;
    case "electron":
      capabilities.features.hasProcess = true;
      capabilities.features.hasWindow = true;
      capabilities.features.hasElectronAPIs = true;
      break;
    case "react-native":
      capabilities.features.hasAsyncStorage = detectAsyncStorage();
      capabilities.features.hasBridge = true;
      break;
  }

  return capabilities;
}

/**
 * Detect if HTTP operations are available.
 */
function detectHttpCapability(): boolean {
  try {
    return typeof globalThis.fetch === "function";
  } catch {
    return false;
  }
}

/**
 * Detect if timer operations are available.
 */
function detectTimerCapability(): boolean {
  try {
    return (
      typeof setTimeout === "function" &&
      typeof clearTimeout === "function" &&
      typeof setInterval === "function" &&
      typeof clearInterval === "function"
    );
  } catch {
    return false;
  }
}

/**
 * Detect if file system operations are available.
 */
function detectFileSystemCapability(): boolean {
  return isNodeJs() || isElectron();
}

/**
 * Detect if localStorage is available (browser feature).
 */
function detectLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Detect if AsyncStorage is available (React Native feature).
 */
function detectAsyncStorage(): boolean {
  try {
    // This is a basic check - in practice, AsyncStorage would be imported
    return typeof require !== "undefined";
  } catch {
    return false;
  }
}
