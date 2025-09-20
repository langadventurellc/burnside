/**
 * In-Memory Tool Registry Implementation
 *
 * Provides a Map-based storage implementation for tool registration,
 * discovery, and lifecycle management. Follows patterns established
 * in provider and model registries with validation and error handling.
 *
 * Features:
 * - O(1) tool lookup performance using Map storage
 * - Comprehensive validation of tool definitions and handlers
 * - Tool name sanitization to prevent injection attacks
 * - Registration metadata tracking with timestamps
 * - Defensive error handling with ToolError
 *
 * @example
 * ```typescript
 * import { InMemoryToolRegistry } from "./inMemoryToolRegistry";
 * import { z } from "zod";
 *
 * const registry = new InMemoryToolRegistry();
 *
 * // Register echo tool
 * const echoDefinition = {
 *   name: "echo",
 *   description: "Echo back input parameters",
 *   inputSchema: z.object({ message: z.string() })
 * };
 *
 * const echoHandler = async (params) => {
 *   return { success: true, result: params };
 * };
 *
 * registry.register("echo", echoDefinition, echoHandler);
 *
 * // Use registered tool
 * const tool = registry.get("echo");
 * const result = await tool.handler({ message: "hello" });
 * ```
 */

import type { ToolRegistry } from "./toolRegistry";
import type { ToolDefinition } from "./toolDefinition";
import type { ToolHandler } from "./toolHandler";
import type { RegistryEntry } from "./registryEntry";
import { ToolDefinitionSchema } from "./toolDefinitionSchema";
import { validateOrThrow } from "../validation/validateOrThrow";
import { ToolError } from "../errors/toolError";
import { commonSchemas } from "../validation/commonSchemas";
import { logger } from "../logging";

/**
 * In-memory implementation of ToolRegistry interface
 *
 * Uses Map-based storage for efficient tool registration and lookup.
 * Provides validation, error handling, and metadata tracking for
 * comprehensive tool management.
 */
export class InMemoryToolRegistry implements ToolRegistry {
  private tools = new Map<string, RegistryEntry>();
  private registrationTimes = new Map<string, Date>();

  /**
   * Validates tool definition using ToolDefinitionSchema
   *
   * @private
   * @param definition - Tool definition to validate
   * @throws ToolError if validation fails
   */
  private validateToolDefinition(definition: ToolDefinition): void {
    try {
      validateOrThrow(ToolDefinitionSchema, definition, {
        errorPrefix: `Invalid tool definition for ${definition.name}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn("Tool definition validation failed", {
        toolName: definition.name,
        validationError: errorMessage,
        definitionKeys: Object.keys(definition),
      });
      throw new ToolError(
        `Tool definition validation failed for ${definition.name}: ${errorMessage}`,
        {
          toolName: definition.name,
          originalError: error,
          definition,
        },
      );
    }
  }

  /**
   * Validates tool name using commonSchemas toolName validation
   *
   * @private
   * @param name - Tool name to validate
   * @throws ToolError if validation fails
   */
  private validateToolName(name: string): void {
    try {
      validateOrThrow(commonSchemas.toolName, name, {
        errorPrefix: "Invalid tool name",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn("Tool name validation failed", {
        toolName: name,
        validationError: errorMessage,
        nameLength: name?.length,
      });
      throw new ToolError(`Tool name validation failed: ${errorMessage}`, {
        toolName: name,
        originalError: error,
      });
    }
  }

  /**
   * Validates tool handler is a callable function
   *
   * @private
   * @param handler - Tool handler to validate
   * @param toolName - Tool name for error context
   * @throws ToolError if validation fails
   */
  private validateToolHandler(handler: ToolHandler, toolName: string): void {
    if (typeof handler !== "function") {
      throw new ToolError(
        `Tool handler must be a function, received ${typeof handler}`,
        {
          toolName,
          handlerType: typeof handler,
        },
      );
    }
  }

  /**
   * Register a tool with name, definition, and handler
   *
   * @param name - Unique tool name (alphanumeric, underscore, dash only)
   * @param definition - Tool definition with schema and metadata
   * @param handler - Tool execution handler function
   * @throws ToolError when tool name is invalid, definition fails validation, or tool already exists
   */
  register(
    name: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void {
    // Validate inputs
    if (!name || typeof name !== "string") {
      throw new ToolError("Tool name must be a non-empty string", {
        toolName: name,
        nameType: typeof name,
      });
    }

    if (!definition || typeof definition !== "object") {
      throw new ToolError("Tool definition must be a non-null object", {
        toolName: name,
        definition,
        definitionType: typeof definition,
      });
    }

    // Validate tool name format
    this.validateToolName(name);

    // Validate tool definition structure
    this.validateToolDefinition(definition);

    // Validate tool handler
    this.validateToolHandler(handler, name);

    // Check for duplicate registration
    if (this.tools.has(name)) {
      const existingRegistration = this.registrationTimes.get(name);
      console.warn(
        `Overwriting existing tool registration: ${name}` +
          (existingRegistration
            ? ` (originally registered at ${existingRegistration.toISOString()})`
            : ""),
      );
    }

    // Register the tool
    const registryEntry: RegistryEntry = {
      definition,
      handler,
    };

    this.tools.set(name, registryEntry);
    this.registrationTimes.set(name, new Date());

    logger.info("Tool registered successfully", {
      toolName: name,
      description: definition.description,
      inputSchema: definition.inputSchema ? "defined" : "undefined",
      totalToolsRegistered: this.tools.size,
    });

    logger.debug("Tool registration details", {
      toolName: name,
      definitionKeys: Object.keys(definition),
      hasInputSchema: Boolean(definition.inputSchema),
      hasOutputSchema: Boolean(definition.outputSchema),
    });
  }

  /**
   * Unregister a tool by name
   *
   * @param name - Tool name to unregister
   * @returns true if tool was removed, false if tool didn't exist
   */
  unregister(name: string): boolean {
    if (!name || typeof name !== "string") {
      return false;
    }

    const removed = this.tools.delete(name);
    if (removed) {
      this.registrationTimes.delete(name);
      logger.info("Tool unregistered successfully", {
        toolName: name,
        remainingToolsRegistered: this.tools.size,
      });
    }

    return removed;
  }

  /**
   * Check if a tool is registered
   *
   * @param name - Tool name to check
   * @returns true if tool exists, false otherwise
   */
  has(name: string): boolean {
    if (!name || typeof name !== "string") {
      return false;
    }

    return this.tools.has(name);
  }

  /**
   * Get a registered tool by name
   *
   * @param name - Tool name to retrieve
   * @returns Registry entry with definition and handler, or undefined if not found
   */
  get(name: string): RegistryEntry | undefined {
    if (!name || typeof name !== "string") {
      return undefined;
    }

    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   *
   * @returns Map of all tool names to registry entries
   */
  getAll(): Map<string, RegistryEntry> {
    return new Map(this.tools);
  }

  /**
   * Get names of all registered tools
   *
   * @returns Array of tool names sorted alphabetically
   */
  getNames(): string[] {
    return Array.from(this.tools.keys()).sort();
  }

  /**
   * Get number of registered tools
   *
   * @returns Count of registered tools
   */
  size(): number {
    return this.tools.size;
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
    this.registrationTimes.clear();
  }
}
