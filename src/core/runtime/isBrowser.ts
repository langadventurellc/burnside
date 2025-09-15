/**
 * Browser Environment Detection
 *
 * Utility function to detect if the current environment is a browser.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in browser environment.
 *
 * @returns True if running in browser
 */
export function isBrowser(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.document !== "undefined" &&
      typeof navigator !== "undefined"
    );
  } catch {
    return false;
  }
}
