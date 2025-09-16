/**
 * Tool Model and Execution Module
 *
 * This module contains tool model and execution contracts including
 * ToolDefinition, ToolHandler, ToolExecutionContext, ToolCall, and ToolResult
 * for the unified tool system.
 *
 * These exports provide the foundation for tool registration, execution,
 * call tracking, result processing, and provider integration with
 * comprehensive Zod validation.
 */

export type { ToolDefinition } from "./toolDefinition";
export type { ToolHandler } from "./toolHandler";
export type { ToolExecutionContext } from "./toolExecutionContext";
export type { ToolCall } from "./toolCall";
export type { ToolResult } from "./toolResult";
export { ToolDefinitionSchema } from "./toolDefinitionSchema";
export { ToolCallSchema } from "./toolCallSchema";
export { ToolResultSchema } from "./toolResultSchema";
