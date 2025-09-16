/**
 * Echo Tool Module Exports
 *
 * Barrel file providing clean module exports for the Echo built-in tool.
 * Aggregates tool definition, handler, schemas, and types for external consumption.
 */

// Tool definition and handler
export { echoToolDefinition, echoToolHandler } from "./echoTool.js";

// Validation schemas
export { EchoInputSchema } from "./echoInputSchema.js";
export { EchoOutputSchema } from "./echoOutputSchema.js";

// TypeScript types
export type { EchoInput } from "./echoInputType.js";
export type { EchoOutput } from "./echoOutputType.js";
