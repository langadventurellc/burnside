/**
 * React Native Environment Detection
 *
 * Utility function to detect if the current environment is React Native.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in React Native environment.
 *
 * Uses multiple detection strategies for reliable React Native identification:
 * 1. Primary: React Native bridge detection (global.__fbBatchedBridge)
 * 2. Secondary: Development flag and Hermes engine detection
 * 3. Fallback: navigator.userAgent check for older compatibility
 *
 * @returns True if running in React Native
 */
export function isReactNative(): boolean {
  try {
    // Cast globalThis to any to access React Native-specific properties
    const globalObj = globalThis as Record<string, unknown>;

    // Primary detection: React Native bridge
    // Most reliable indicator across all RN versions
    if (typeof globalThis !== "undefined" && globalObj.__fbBatchedBridge) {
      return true;
    }

    // Secondary detection: React Native development indicators
    if (typeof globalThis !== "undefined") {
      // Check for React Native development flag
      if (globalObj.__DEV__ !== undefined) {
        return true;
      }

      // Check for Hermes JavaScript engine (React Native's preferred engine)
      if (globalObj.HermesInternal) {
        return true;
      }
    }

    // Fallback detection: navigator.userAgent (for older compatibility)
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.userAgent === "string" &&
      navigator.userAgent.includes("ReactNative")
    );
  } catch {
    return false;
  }
}
