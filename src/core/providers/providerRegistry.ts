import type { ProviderPlugin } from "./providerPlugin.js";
import type { ProviderInfo } from "./providerInfo.js";

/**
 * Provider Registry Interface
 *
 * Defines the contract for managing provider plugin registration,
 * resolution, and lifecycle. Supports concurrent provider versions
 * and provides methods for listing, querying, and managing
 * registered provider plugins.
 *
 * @example
 * ```typescript
 * const registry = new InMemoryProviderRegistry();
 *
 * // Register a provider plugin
 * const openaiProvider: ProviderPlugin = {
 *   id: "openai",
 *   name: "OpenAI Provider",
 *   version: "1.0.0",
 *   // ... other plugin implementation
 * };
 * registry.register(openaiProvider);
 *
 * // Resolve provider by specific version
 * const provider = registry.get("openai", "1.0.0");
 *
 * // Get latest version
 * const latest = registry.getLatest("openai");
 *
 * // List all registered providers
 * const allProviders = registry.list();
 *
 * // List versions of specific provider
 * const versions = registry.getVersions("openai");
 * ```
 */
export interface ProviderRegistry {
  /**
   * Register a provider plugin with the registry
   *
   * Validates the provider plugin structure and stores it with
   * a composite key combining id and version. Duplicate
   * registrations for the same id:version will overwrite
   * the previous registration.
   *
   * @param plugin - The provider plugin to register
   * @throws ValidationError if plugin structure is invalid
   *
   * @example
   * ```typescript
   * const plugin: ProviderPlugin = {
   *   id: "openai",
   *   name: "OpenAI Provider",
   *   version: "1.2.0"
   * };
   * registry.register(plugin);
   * ```
   */
  register(plugin: ProviderPlugin): void;

  /**
   * Get a provider plugin by ID and optional version
   *
   * When version is specified, returns the exact version match.
   * When version is not specified, returns the latest registered
   * version based on semantic version sorting.
   *
   * @param id - The provider ID to retrieve
   * @param version - Optional specific version to retrieve
   * @returns Provider plugin or undefined if not found
   *
   * @example
   * ```typescript
   * // Get specific version
   * const v1 = registry.get("openai", "1.0.0");
   *
   * // Get latest version
   * const latest = registry.get("openai");
   * ```
   */
  get(id: string, version?: string): ProviderPlugin | undefined;

  /**
   * Get the latest version of a provider by ID
   *
   * Determines the latest version using semantic version
   * comparison among all registered versions of the provider.
   * Returns undefined if no versions are registered.
   *
   * @param id - The provider ID to get latest version for
   * @returns Latest provider plugin version or undefined
   *
   * @example
   * ```typescript
   * const latest = registry.getLatest("anthropic");
   * ```
   */
  getLatest(id: string): ProviderPlugin | undefined;

  /**
   * List registered providers with optional filtering by ID
   *
   * When id is not specified, returns information for all
   * registered provider plugins across all versions.
   * When id is specified, returns all versions of that
   * specific provider.
   *
   * @param id - Optional provider ID to filter results
   * @returns Array of provider information
   *
   * @example
   * ```typescript
   * // List all providers
   * const all = registry.list();
   *
   * // List versions of specific provider
   * const openaiVersions = registry.list("openai");
   * ```
   */
  list(id?: string): ProviderInfo[];

  /**
   * Check if a provider or specific version exists in registry
   *
   * When version is specified, checks for exact id:version match.
   * When version is not specified, checks if any version of
   * the provider ID is registered.
   *
   * @param id - The provider ID to check
   * @param version - Optional specific version to check
   * @returns True if provider/version exists, false otherwise
   *
   * @example
   * ```typescript
   * // Check if any version exists
   * const hasOpenAI = registry.has("openai");
   *
   * // Check specific version
   * const hasV2 = registry.has("openai", "2.0.0");
   * ```
   */
  has(id: string, version?: string): boolean;

  /**
   * Remove provider registration from the registry
   *
   * When version is specified, removes only that specific version.
   * When version is not specified, removes all versions of the
   * provider ID from the registry.
   *
   * @param id - The provider ID to unregister
   * @param version - Optional specific version to unregister
   * @returns True if something was removed, false otherwise
   *
   * @example
   * ```typescript
   * // Remove specific version
   * const removedV1 = registry.unregister("openai", "1.0.0");
   *
   * // Remove all versions
   * const removedAll = registry.unregister("openai");
   * ```
   */
  unregister(id: string, version?: string): boolean;

  /**
   * Get all registered versions for a provider ID
   *
   * Returns version strings sorted in descending semantic
   * version order (latest first). Returns empty array if
   * provider ID is not registered.
   *
   * @param id - The provider ID to get versions for
   * @returns Array of version strings, sorted latest first
   *
   * @example
   * ```typescript
   * const versions = registry.getVersions("openai");
   * // Returns: ["2.1.0", "2.0.0", "1.5.0", "1.0.0"]
   * ```
   */
  getVersions(id: string): string[];
}
