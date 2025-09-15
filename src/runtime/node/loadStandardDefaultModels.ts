import { loadDefaultModels } from "./loadDefaultModels.js";
import type { ModelInfo } from "../../core/providers/modelInfo.js";

/**
 * Convenience function to load default models from standard location
 *
 * @returns Array of ModelInfo objects loaded from docs/defaultLlmModels.json
 *
 * @example
 * ```typescript
 * // Load from standard location
 * const defaultModels = loadStandardDefaultModels();
 * console.log(`Loaded ${defaultModels.length} default models`);
 * ```
 */
export function loadStandardDefaultModels(): ModelInfo[] {
  return loadDefaultModels("./docs/defaultLlmModels.json");
}
