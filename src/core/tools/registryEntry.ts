/**
 * Tool Registry Entry
 *
 * Registry entry containing both tool definition and execution handler
 * for unified storage and retrieval in tool registries.
 */

import type { ToolDefinition } from "./toolDefinition.js";
import type { ToolHandler } from "./toolHandler.js";

/**
 * Registry entry containing both tool definition and execution handler
 */
export interface RegistryEntry {
  /** Tool definition with schema and metadata */
  definition: ToolDefinition;
  /** Tool execution handler function */
  handler: ToolHandler;
}
