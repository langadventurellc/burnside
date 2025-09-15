import { z } from "zod";
import type { ProviderPlugin } from "./providerPlugin.js";
import type { ProviderRegistry } from "./providerRegistry.js";
import type { ProviderInfo } from "./providerInfo.js";
import type { ProviderKey } from "./providerKey.js";
import { validateOrThrow } from "../validation/validateOrThrow.js";
import { ValidationError } from "../errors/validationError.js";

/**
 * Zod schema for validating ProviderPlugin during registration
 */
const providerPluginSchema = z.object({
  id: z.string().min(1, "Provider ID is required"),
  name: z.string().min(1, "Provider name is required"),
  version: z.string().min(1, "Provider version is required"),
  initialize: z.function().optional(),
  supportsModel: z.function().optional(),
  metadata: z.record(z.unknown()).optional(),
  translateRequest: z.function(),
  parseResponse: z.function().returns(z.union([z.promise(z.any()), z.any()])),
  isTerminal: z.function(),
  normalizeError: z.function(),
  capabilities: z
    .object({
      streaming: z.boolean(),
      toolCalls: z.boolean(),
      images: z.boolean(),
      documents: z.boolean(),
      supportedContentTypes: z.array(z.string()),
    })
    .optional(),
});

/**
 * In-memory implementation of ProviderRegistry
 *
 * Provides a Map-based storage implementation suitable for runtime provider
 * plugin management. Providers are stored by composite keys (id:version)
 * and can be queried efficiently by ID, version, or capability.
 *
 * Features:
 * - Thread-safe operations using synchronous Map operations
 * - Zod-based validation of provider plugin structure
 * - Semantic version sorting for latest version resolution
 * - Efficient storage and retrieval with composite keys
 *
 * @example
 * ```typescript
 * const registry = new InMemoryProviderRegistry();
 *
 * // Register provider plugins
 * registry.register(openaiV1Plugin);
 * registry.register(openaiV2Plugin);
 * registry.register(anthropicPlugin);
 *
 * // Get specific version
 * const openaiV1 = registry.get("openai", "1.0.0");
 *
 * // Get latest version
 * const latestOpenAI = registry.getLatest("openai");
 *
 * // List providers
 * const allProviders = registry.list();
 * const openaiVersions = registry.list("openai");
 * ```
 */
export class InMemoryProviderRegistry implements ProviderRegistry {
  private providers = new Map<ProviderKey, ProviderPlugin>();
  private registrationTimes = new Map<ProviderKey, Date>();

  /**
   * Validates provider plugin structure using Zod schema
   *
   * @private
   * @param plugin - The provider plugin to validate
   * @throws ValidationError if validation fails
   */
  private validateProviderPlugin(plugin: ProviderPlugin): void {
    try {
      validateOrThrow(providerPluginSchema, plugin, {
        errorPrefix: `Invalid provider plugin for ${plugin.id}:${plugin.version}`,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ValidationError(
        `Provider plugin validation failed for ${plugin.id}:${plugin.version}: ${errorMessage}`,
        {
          providerId: plugin.id,
          version: plugin.version,
          originalError: error,
        },
      );
    }
  }

  /**
   * Creates a composite key for provider storage
   *
   * @private
   * @param id - Provider ID
   * @param version - Provider version
   * @returns Composite key in format "id:version"
   */
  private createKey(id: string, version: string): ProviderKey {
    return `${id}:${version}`;
  }

  /**
   * Parses a composite key back into components
   *
   * @private
   * @param key - Composite key to parse
   * @returns Object with id and version components
   */
  private parseKey(key: ProviderKey): { id: string; version: string } {
    const [id, ...versionParts] = key.split(":");
    const version = versionParts.join(":");
    return { id, version };
  }

  /**
   * Compares two semantic version strings
   *
   * @private
   * @param a - First version to compare
   * @param b - Second version to compare
   * @returns Negative if a < b, positive if a > b, 0 if equal
   */
  private compareVersions(a: string, b: string): number {
    const parseVersion = (v: string) => {
      const parts = v.split(/[.-]/).map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? part : num;
      });
      return parts;
    };

    const versionA = parseVersion(a);
    const versionB = parseVersion(b);
    const maxLength = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLength; i++) {
      const partA = versionA[i] ?? 0;
      const partB = versionB[i] ?? 0;

      if (typeof partA === "number" && typeof partB === "number") {
        if (partA !== partB) return partA - partB;
      } else {
        const strA = String(partA);
        const strB = String(partB);
        if (strA !== strB) return strA.localeCompare(strB);
      }
    }

    return 0;
  }

  /**
   * Finds the latest version for a given provider ID
   *
   * @private
   * @param id - Provider ID to find latest version for
   * @returns Latest version string or undefined if not found
   */
  private getLatestVersion(id: string): string | undefined {
    const versions = this.getVersions(id);
    return versions.length > 0 ? versions[0] : undefined;
  }

  register(plugin: ProviderPlugin): void {
    if (!plugin || typeof plugin !== "object") {
      throw new ValidationError("Provider plugin must be a non-null object", {
        plugin,
      });
    }

    // Validate the plugin structure
    this.validateProviderPlugin(plugin);

    const key = this.createKey(plugin.id, plugin.version);

    // Log when overwriting existing registration
    if (this.providers.has(key)) {
      const existingRegistration = this.registrationTimes.get(key);
      console.warn(
        `Overwriting existing provider registration: ${plugin.id}:${plugin.version}` +
          (existingRegistration
            ? ` (originally registered at ${existingRegistration.toISOString()})`
            : ""),
      );
    }

    this.providers.set(key, plugin);
    this.registrationTimes.set(key, new Date());
  }

  get(id: string, version?: string): ProviderPlugin | undefined {
    if (!id || typeof id !== "string") {
      return undefined;
    }

    if (version) {
      const key = this.createKey(id, version);
      return this.providers.get(key);
    }

    // Get latest version if no version specified
    const latestVersion = this.getLatestVersion(id);
    if (!latestVersion) {
      return undefined;
    }

    const key = this.createKey(id, latestVersion);
    return this.providers.get(key);
  }

  getLatest(id: string): ProviderPlugin | undefined {
    return this.get(id); // get() without version returns latest
  }

  list(id?: string): ProviderInfo[] {
    const result: ProviderInfo[] = [];

    for (const [key, plugin] of this.providers.entries()) {
      const { id: pluginId } = this.parseKey(key);

      if (id && pluginId !== id) {
        continue;
      }

      const registeredAt = this.registrationTimes.get(key) ?? new Date();
      result.push({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        registeredAt,
      });
    }

    // Sort by ID first, then by version (latest first)
    result.sort((a, b) => {
      if (a.id !== b.id) {
        return a.id.localeCompare(b.id);
      }
      return -this.compareVersions(a.version, b.version);
    });

    return result;
  }

  has(id: string, version?: string): boolean {
    if (!id || typeof id !== "string") {
      return false;
    }

    if (version) {
      const key = this.createKey(id, version);
      return this.providers.has(key);
    }

    // Check if any version exists
    for (const key of this.providers.keys()) {
      const { id: pluginId } = this.parseKey(key);
      if (pluginId === id) {
        return true;
      }
    }

    return false;
  }

  unregister(id: string, version?: string): boolean {
    if (!id || typeof id !== "string") {
      return false;
    }

    let removed = false;

    if (version) {
      // Remove specific version
      const key = this.createKey(id, version);
      if (this.providers.delete(key)) {
        this.registrationTimes.delete(key);
        removed = true;
      }
    } else {
      // Remove all versions of the provider
      const keysToRemove: ProviderKey[] = [];

      for (const key of this.providers.keys()) {
        const { id: pluginId } = this.parseKey(key);
        if (pluginId === id) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        this.providers.delete(key);
        this.registrationTimes.delete(key);
        removed = true;
      }
    }

    return removed;
  }

  getVersions(id: string): string[] {
    if (!id || typeof id !== "string") {
      return [];
    }

    const versions: string[] = [];

    for (const key of this.providers.keys()) {
      const { id: pluginId, version } = this.parseKey(key);
      if (pluginId === id) {
        versions.push(version);
      }
    }

    // Sort versions in descending order (latest first)
    return versions.sort((a, b) => -this.compareVersions(a, b));
  }
}
