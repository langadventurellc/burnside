/**
 * Electron Environment Detection
 *
 * Utility function to detect if the current environment is Electron.
 * Used by platform detection and adapter selection logic.
 */

import { isNodeJs } from "./isNodeJs";

/**
 * Check if running in Electron main process.
 * Main process has Node APIs but no window object.
 *
 * @returns True if running in Electron main process
 */
export function isElectron(): boolean {
  try {
    return (
      isNodeJs() &&
      typeof process.versions.electron !== "undefined" &&
      typeof window === "undefined"
    );
  } catch {
    return false;
  }
}
