/**
 * Runtime Platform Adapters Module
 *
 * Platform abstraction layer providing runtime adapters for HTTP, timers,
 * and file access across Node, Electron, and React Native environments.
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
 * const content = await adapter.readFile('./configon');
 * ```
 */

// Core interfaces and types
export type { RuntimeAdapter } from "./runtimeAdapter";
export type { Platform } from "./platform";
export type { PlatformInfo } from "./platformInfo";
export type { PlatformCapabilities } from "./platformCapabilities";
export type { TimerHandle } from "./timerHandle";
export type { FileOperationOptions } from "./fileOperationOptions";

// Error handling
export { RuntimeError } from "./runtimeError";

// Platform detection utilities
export { detectPlatform } from "./detectPlatform";
export { isNodeJs } from "./isNodeJs";
export { isBrowser } from "./isBrowser";
export { isElectron } from "./isElectron";
export { isReactNative } from "./isReactNative";
export { getPlatformCapabilities } from "./getPlatformCapabilities";

// Adapter implementations
export { NodeRuntimeAdapter } from "./adapters/nodeRuntimeAdapter";

// Registry system
export { AdapterRegistry } from "./adapterRegistry";
