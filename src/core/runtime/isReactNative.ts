/**
 * React Native Environment Detection
 *
 * Utility function to detect if the current environment is React Native.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in React Native environment.
 *
 * @returns True if running in React Native
 */
export function isReactNative(): boolean {
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
