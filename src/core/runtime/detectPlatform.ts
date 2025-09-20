/**
 * Platform Detection
 *
 * Detects the current platform type using environment inspection.
 * Used by the adapter registry for automatic adapter selection.
 */

import type { Platform } from "./platform";
import { isNodeJs } from "./isNodeJs";
import { isElectron } from "./isElectron";
import { isElectronRenderer } from "./isElectronRenderer";
import { isReactNative } from "./isReactNative";

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
  // Check for Electron renderer process first (has window object + renderer process type)
  if (isElectronRenderer()) {
    return "electron-renderer";
  }

  // Check for Node environment
  if (isNodeJs()) {
    // Check if running in Electron main process (which also has Node APIs)
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
