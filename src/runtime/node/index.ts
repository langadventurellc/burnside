/**
 * Node Runtime Utilities
 *
 * This module provides Node-specific utilities for file system operations
 * and model loading. These utilities are isolated from the core library to
 * maintain cross-platform compatibility while enabling tooling and testing
 * scenarios that require file system access.
 *
 * @example
 * ```typescript
 * import { loadDefaultModels, loadStandardDefaultModels } from "./runtime/node/index";
 *
 * // Load from specific path
 * const customModels = loadDefaultModels('./config/custom-modelson');
 *
 * // Load from standard location
 * const defaultModels = loadStandardDefaultModels();
 * ```
 */

export { loadDefaultModels } from "./loadDefaultModels";
export { loadStandardDefaultModels } from "./loadStandardDefaultModels";
