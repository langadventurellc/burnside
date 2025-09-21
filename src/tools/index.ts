/**
 * Tool Implementations Aggregator
 *
 * This module serves as the entry point for built-in tool registration
 * and discovery. Provides access to all available built-in tools,
 * MCP client functionality, and tool registration utilities.
 */

// Export all built-in tools
export {
  echoToolDefinition,
  echoToolHandler,
  EchoInputSchema,
  EchoOutputSchema,
} from "./builtin/index";

export type { EchoInput, EchoOutput } from "./builtin/index";

// Export MCP module for Model Context Protocol integration
export * from "./mcp/index";
