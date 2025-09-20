/**
 * Electron Renderer Environment Detection
 *
 * Utility function to detect if the current environment is Electron renderer process.
 * Used by platform detection and adapter selection logic.
 */

/**
 * Check if running in Electron renderer process.
 * Renderer process has both window object and process.type === 'renderer'.
 *
 * @returns True if running in Electron renderer process
 */
export function isElectronRenderer(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof process !== "undefined" &&
      (process as unknown as { type?: string }).type === "renderer"
    );
  } catch {
    return false;
  }
}
