/**
 * Node Environment Detection
 *
 * Utility function to detect if the current environment is Node.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in Node environment.
 *
 * @returns True if running in Node
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
