/**
 * Node.js Environment Detection
 *
 * Utility function to detect if the current environment is Node.js.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in Node.js environment.
 *
 * @returns True if running in Node.js
 */
export function isNodeJs(): boolean {
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
