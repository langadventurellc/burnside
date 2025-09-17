/**
 * Tool Registry Interface
 *
 * Interface for managing tool registration, discovery, and lifecycle operations.
 * Provides the core registry functionality that ToolRouter will use for tool management.
 *
 * Follows registry patterns established in provider and model registry systems
 * with unified tool definition storage and O(1) lookup performance.
 *
 * @example
 * ```typescript
 * import { InMemoryToolRegistry } from "./inMemoryToolRegistry";
 * import { ToolDefinition, ToolHandler } from "./index";
 *
 * const registry = new InMemoryToolRegistry();
 *
 * // Register a tool
 * const echoTool: ToolDefinition = {
 *   name: "echo",
 *   description: "Echo back the input parameters",
 *   inputSchema: z.object({ message: z.string() })
 * };
 *
 * const echoHandler: ToolHandler = async (params) => {
 *   return { success: true, result: params };
 * };
 *
 * registry.register("echo", echoTool, echoHandler);
 *
 * // Discover and execute
 * if (registry.has("echo")) {
 *   const tool = registry.get("echo");
 *   const result = await tool.handler({ message: "hello" });
 * }
 * ```
 */

import type { ToolDefinition } from "./toolDefinition";
import type { ToolHandler } from "./toolHandler";
import type { RegistryEntry } from "./registryEntry";

/**
 * Tool Registry interface for managing tool registration, discovery, and lifecycle.
 *
 * Provides unified tool management with validation, registration, and O(1) lookup
 * performance for efficient tool discovery and execution.
 */
export interface ToolRegistry {
  /**
   * Register a tool with name, definition, and handler
   *
   * @param name - Unique tool name (alphanumeric, underscore, dash only)
   * @param definition - Tool definition with schema and metadata
   * @param handler - Tool execution handler function
   * @throws {ToolError} When tool name is invalid, definition fails validation, or tool already exists
   *
   * @example
   * ```typescript
   * registry.register("echo", echoDefinition, echoHandler);
   * ```
   */
  register(
    name: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void;

  /**
   * Unregister a tool by name
   *
   * @param name - Tool name to unregister
   * @returns true if tool was removed, false if tool didn't exist
   *
   * @example
   * ```typescript
   * const removed = registry.unregister("echo"); // true if existed
   * ```
   */
  unregister(name: string): boolean;

  /**
   * Check if a tool is registered
   *
   * @param name - Tool name to check
   * @returns true if tool exists, false otherwise
   *
   * @example
   * ```typescript
   * if (registry.has("echo")) {
   *   // Tool is available
   * }
   * ```
   */
  has(name: string): boolean;

  /**
   * Get a registered tool by name
   *
   * @param name - Tool name to retrieve
   * @returns Registry entry with definition and handler, or undefined if not found
   *
   * @example
   * ```typescript
   * const tool = registry.get("echo");
   * if (tool) {
   *   const result = await tool.handler(params);
   * }
   * ```
   */
  get(name: string): RegistryEntry | undefined;

  /**
   * Get all registered tools
   *
   * @returns Map of all tool names to registry entries
   *
   * @example
   * ```typescript
   * const allTools = registry.getAll();
   * for (const [name, entry] of allTools) {
   *   console.log(`Tool: ${name}, Description: ${entry.definition.description}`);
   * }
   * ```
   */
  getAll(): Map<string, RegistryEntry>;

  /**
   * Get names of all registered tools
   *
   * @returns Array of tool names
   *
   * @example
   * ```typescript
   * const toolNames = registry.getNames(); // ["echo", "weather", ...]
   * ```
   */
  getNames(): string[];

  /**
   * Get number of registered tools
   *
   * @returns Count of registered tools
   *
   * @example
   * ```typescript
   * const count = registry.size(); // 3
   * ```
   */
  size(): number;

  /**
   * Clear all registered tools
   *
   * @example
   * ```typescript
   * registry.clear(); // Removes all tools
   * console.log(registry.size()); // 0
   * ```
   */
  clear(): void;
}
