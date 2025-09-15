/**
 * Schema Composition Options Configuration
 *
 * Configuration for schema composition operations like merging and extending.
 */

/**
 * Configuration for schema composition operations.
 */
export interface SchemaCompositionOptions {
  /**
   * How to handle conflicting keys when merging schemas.
   * @default "error"
   */
  conflictResolution?: "error" | "first" | "last";

  /**
   * Whether to perform deep merging of nested objects.
   * @default true
   */
  deepMerge?: boolean;
}
