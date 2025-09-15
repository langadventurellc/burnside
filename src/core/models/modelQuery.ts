import type { ModelCapabilities } from "../providers/modelCapabilities.js";

/**
 * Model Query interface for filtering models by provider and capabilities
 *
 * @example
 * ```typescript
 * const query: ModelQuery = {
 *   providerId: "openai",
 *   capabilities: ["streaming", "toolCalls"]
 * };
 * ```
 */
export interface ModelQuery {
  /** Optional provider ID to filter models */
  providerId?: string;
  /** Optional capabilities to filter by */
  capabilities?: (keyof ModelCapabilities)[];
}
