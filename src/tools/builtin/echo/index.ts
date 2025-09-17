/**
 * Echo Tool Module Exports
 *
 * Barrel file providing clean module exports for the Echo built-in tool.
 * Aggregates tool definition, handler, schemas, and types for external consumption.
 */

// Tool definition and handler
export { echoToolDefinition, echoToolHandler } from "./echoTool";

// Validation schemas
export { EchoInputSchema } from "./echoInputSchema";
export { EchoOutputSchema } from "./echoOutputSchema";

// TypeScript types
export type { EchoInput } from "./echoInputType";
export type { EchoOutput } from "./echoOutputType";
