/**
 * Electron Environment Detection
 *
 * Utility function to detect if the current environment is Electron.
 * Used by platform detection and adapter selection logic.
 */

import { isNodeJs } from "./isNodeJs";

/**
 * Check if running in Electron environment.
 *
 * @returns True if running in Electron
 */
export function isElectron(): boolean {
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
