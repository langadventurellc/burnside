/**
 * Adapter Registry
 *
 * Manages runtime adapter registration, selection, and provides automatic
 * adapter detection with manual override capabilities. Implements singleton
 * pattern for global adapter management.
 */

import type { RuntimeAdapter } from "./runtimeAdapter";
import type { Platform } from "./platform";
import { RuntimeError } from "./runtimeError";
import { detectPlatform } from "./detectPlatform";
import { NodeRuntimeAdapter } from "./adapters/nodeRuntimeAdapter";

/**
 * Registry for managing runtime adapters across different platforms.
 *
 * Provides automatic adapter detection based on platform, manual adapter
 * registration, and fallback patterns when preferred adapters are unavailable.
 */
export class AdapterRegistry {
  private static instance: AdapterRegistry | undefined;
  private readonly adapters = new Map<Platform, RuntimeAdapter>();
  private defaultAdapter: RuntimeAdapter | undefined;

  /**
   * Get the singleton instance of the adapter registry.
   */
  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
      AdapterRegistry.instance.initializeDefaultAdapters();
    }
    return AdapterRegistry.instance;
  }

  /**
   * Register an adapter for a specific platform.
   *
   * @param platform - Platform identifier
   * @param adapter - Runtime adapter implementation
   */
  registerAdapter(platform: Platform, adapter: RuntimeAdapter): void {
    this.adapters.set(platform, adapter);
  }

  /**
   * Get an adapter for the specified platform or auto-detect.
   *
   * @param platform - Optional platform identifier, auto-detects if not provided
   * @returns Runtime adapter for the platform
   * @throws RuntimeError if no suitable adapter is found
   */
  getAdapter(platform?: Platform): RuntimeAdapter {
    // Use default adapter if set
    if (this.defaultAdapter) {
      return this.defaultAdapter;
    }

    // Use specified platform or detect current platform
    const targetPlatform = platform ?? detectPlatform();

    // Get registered adapter for platform
    const adapter = this.adapters.get(targetPlatform);
    if (adapter) {
      return adapter;
    }

    // Try fallback adapters if primary platform adapter not found
    const fallbackAdapter = this.getFallbackAdapter(targetPlatform);
    if (fallbackAdapter) {
      return fallbackAdapter;
    }

    throw new RuntimeError(
      `No runtime adapter available for platform: ${targetPlatform}`,
      "RUNTIME_ADAPTER_NOT_FOUND",
      {
        platform: targetPlatform,
        availablePlatforms: Array.from(this.adapters.keys()),
      },
    );
  }

  /**
   * Set a default adapter that overrides automatic detection.
   *
   * @param adapter - Runtime adapter to use as default
   */
  setDefaultAdapter(adapter: RuntimeAdapter): void {
    this.defaultAdapter = adapter;
  }

  /**
   * Clear the default adapter, returning to automatic detection.
   */
  clearDefaultAdapter(): void {
    this.defaultAdapter = undefined;
  }

  /**
   * Get list of available platform adapters.
   *
   * @returns Array of platform identifiers with registered adapters
   */
  getAvailableAdapters(): Platform[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if an adapter is registered for the specified platform.
   *
   * @param platform - Platform identifier to check
   * @returns True if adapter is available for platform
   */
  hasAdapter(platform: Platform): boolean {
    return this.adapters.has(platform);
  }

  /**
   * Initialize default adapters for supported platforms.
   */
  private initializeDefaultAdapters(): void {
    try {
      // Register Node adapter if we're in a Node environment
      const currentPlatform = detectPlatform();
      if (currentPlatform === "node" || currentPlatform === "electron") {
        this.registerAdapter("node", new NodeRuntimeAdapter());
      }
    } catch {
      // Silently fail adapter initialization to allow manual registration
      // In production, this would typically be logged
    }
  }

  /**
   * Get fallback adapter for platforms without direct adapters.
   *
   * @param platform - Target platform
   * @returns Fallback adapter or undefined if none available
   */
  private getFallbackAdapter(platform: Platform): RuntimeAdapter | undefined {
    // Fallback strategies based on platform compatibility
    switch (platform) {
      case "electron":
        // Electron can use Node adapter as fallback
        return this.adapters.get("node");
      case "react-native":
        // React Native might use browser-like adapter in some cases
        return this.adapters.get("browser");
      case "browser":
        // No fallback for browser - too different from other platforms
        return undefined;
      case "node":
        // No fallback for Node - it's the most basic platform
        return undefined;
      default:
        return undefined;
    }
  }
}
