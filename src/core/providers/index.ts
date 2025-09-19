/**
 * Provider Base Types Module
 *
 * This module contains provider base types and capability model including
 * ProviderPlugin interface, ModelInfo, ModelCapabilities, ProviderRegistry
 * interface and implementation, unified termination detection, and the
 * foundation for the extensible provider system.
 *
 * These exports provide base contracts for all provider implementations,
 * registry management functionality, and enhanced termination detection
 * capabilities.
 */

export { addCacheHeaders } from "./addCacheHeaders";
export { applyCacheMarkers } from "./applyCacheMarkers";
export { defaultDetectTermination } from "./defaultTerminationDetection";
export { hasProviderCaching } from "./hasProviderCaching";
export type { ModelCapabilities } from "./modelCapabilities";
export type { ModelInfo } from "./modelInfo";
export type { ProviderPlugin } from "./providerPlugin";
export type { ProviderRegistry } from "./providerRegistry";
export type { ProviderInfo } from "./providerInfo";
export type { ProviderKey } from "./providerKey";
export type { UnifiedTerminationSignal } from "../agent/unifiedTerminationSignal";
export { InMemoryProviderRegistry } from "./inMemoryProviderRegistry";
