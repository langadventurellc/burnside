/**
 * Built-in Tools Aggregator
 *
 * Centralized exports for all built-in tools provided by the LLM Bridge library.
 * This module serves as the entry point for tool registration and discovery
 * of built-in tool implementations.
 */

// Export all Echo tool components
export {
  echoToolDefinition,
  echoToolHandler,
  EchoInputSchema,
  EchoOutputSchema,
} from "./echo/index.js";

export type { EchoInput, EchoOutput } from "./echo/index.js";
