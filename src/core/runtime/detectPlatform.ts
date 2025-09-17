/**
 * Platform Detection
 *
 * Detects the current platform type using environment inspection.
 * Used by the adapter registry for automatic adapter selection.
 */

import type { Platform } from "./platform";

/**
 * Detect the current platform type.
 *
 * Uses environment inspection to determine if running in Node, browser,
 * Electron, or React Native environment. Provides reliable detection across
 * different JavaScript runtime environments.
 *
 * @returns Platform type string
 */
export function detectPlatform(): Platform {
  // Check for Node environment
  if (isNodeJs()) {
    // Check if running in Electron (which also has Node APIs)
    if (isElectron()) {
      return "electron";
    }
    return "node";
  }

  // Check for React Native environment
  if (isReactNative()) {
    return "react-native";
  }

  // Default to browser if none of the above
  return "browser";
}

/**
 * Check if running in Node environment.
 */
function isNodeJs(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null
    );
  } catch {
    return false;
  }
}

/**
 * Check if running in Electron environment.
 */
function isElectron(): boolean {
  try {
    // Electron has both Node APIs and browser-like environment
    return (
      isNodeJs() &&
      (typeof process.versions.electron !== "undefined" ||
        typeof window !== "undefined")
    );
  } catch {
    return false;
  }
}

/**
 * Check if running in React Native environment.
 */
function isReactNative(): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.userAgent === "string" &&
      navigator.userAgent.includes("ReactNative")
    );
  } catch {
    return false;
  }
}
