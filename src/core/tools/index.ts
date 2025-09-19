/**
 * Tool Model and Execution Module
 *
 * This module contains tool model and execution contracts including
 * ToolDefinition, ToolHandler, ToolExecutionContext, ToolCall, and ToolResult
 * for the unified tool system, plus configurable execution strategies for
 * sequential and parallel tool execution.
 *
 * These exports provide the foundation for tool registration, execution,
 * call tracking, result processing, provider integration, and multi-tool
 * execution strategies with comprehensive Zod validation.
 */

// Core tool interfaces and types
export type { ToolDefinition } from "./toolDefinition";
export type { ToolHandler } from "./toolHandler";
export type { ToolExecutionContext } from "./toolExecutionContext";
export type { ToolCall } from "./toolCall";
export type { ToolResult } from "./toolResult";
export type { ToolRegistry } from "./toolRegistry";
export type { RegistryEntry } from "./registryEntry";

// Tool execution strategy interfaces and types
export type { ToolExecutionStrategy } from "./toolExecutionStrategy";
export type { ToolExecutionOptions } from "./toolExecutionOptions";
export type { ToolExecutionResult } from "./toolExecutionResult";

// Schema exports
export { ToolDefinitionSchema } from "./toolDefinitionSchema";
export { ToolCallSchema } from "./toolCallSchema";
export { ToolResultSchema } from "./toolResultSchema";

// Core implementation exports
export { InMemoryToolRegistry } from "./inMemoryToolRegistry";
export { ToolRouter } from "./toolRouter";

// Strategy implementation exports
export { SequentialExecutionStrategy } from "./sequentialExecutionStrategy";
export { ParallelExecutionStrategy } from "./parallelExecutionStrategy";
