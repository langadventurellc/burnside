import type { ModelInfo } from "../../core/providers/modelInfo";
import { mapJsonToModelInfo } from "../../core/models/modelLoader";
import { defaultLlmModels } from "../../data/defaultLlmModels";

/**
 * Convenience function to load default models from standard location
 *
 * @returns Array of ModelInfo objects loaded from packaged default seed
 *
 * @example
 * ```typescript
 * // Load from standard location
 * const defaultModels = loadStandardDefaultModels();
 * console.log(`Loaded ${defaultModels.length} default models`);
 * ```
 */
export function loadStandardDefaultModels(): ModelInfo[] {
  return mapJsonToModelInfo(defaultLlmModels);
}
