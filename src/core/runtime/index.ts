/**
 * Runtime Platform Adapters Module
 *
 * Platform abstraction layer providing runtime adapters for HTTP, timers,
 * and file access across Node.js, Electron, and React Native environments.
 * Includes automatic adapter detection and registry management.
 *
 * @example Basic usage
 * ```typescript
 * import { AdapterRegistry } from './runtime';
 *
 * const registry = AdapterRegistry.getInstance();
 * const adapter = registry.getAdapter(); // Auto-detects platform
 *
 * // Use adapter for platform-agnostic operations
 * const response = await adapter.fetch('https://api.example.com');
 * const content = await adapter.readFile('./config.json');
 * ```
 */

// Core interfaces and types
export type { RuntimeAdapter } from "./runtimeAdapter.js";
export type { Platform } from "./platform.js";
export type { PlatformInfo } from "./platformInfo.js";
export type { PlatformCapabilities } from "./platformCapabilities.js";
export type { TimerHandle } from "./timerHandle.js";
export type { FileOperationOptions } from "./fileOperationOptions.js";

// Error handling
export { RuntimeError } from "./runtimeError.js";

// Platform detection utilities
export { detectPlatform } from "./detectPlatform.js";
export { isNodeJs } from "./isNodeJs.js";
export { isBrowser } from "./isBrowser.js";
export { isElectron } from "./isElectron.js";
export { isReactNative } from "./isReactNative.js";
export { getPlatformCapabilities } from "./getPlatformCapabilities.js";

// Adapter implementations
export { NodeRuntimeAdapter } from "./adapters/nodeRuntimeAdapter.js";

// Registry system
export { AdapterRegistry } from "./adapterRegistry.js";
