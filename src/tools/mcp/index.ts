/**
 * MCP (Model Context Protocol) Module
 *
 * Provides tools-only MCP client functionality for connecting to MCP servers,
 * negotiating capabilities, and executing tools. This module enforces a
 * tools-only scope and explicitly rejects servers that advertise prompts
 * or resources capabilities.
 *
 * @example Basic usage
 * ```typescript
 * import { McpClient } from '@/tools/mcp';
 *
 * const client = new McpClient(adapter, 'http://localhost:3000');
 * await client.connect();
 *
 * const tools = await client.listTools();
 * const result = await client.callTool('calculator', { operation: 'add', a: 1, b: 2 });
 *
 * await client.disconnect();
 * ```
 */

// Main client class (primary export)
export { McpClient } from "./mcpClient";

// Configuration and options
export type { McpClientOptions } from "./mcpClientOptions";

// Error classes
export { McpError } from "./mcpError";
export { McpConnectionError } from "./mcpConnectionError";
export { McpCapabilityError } from "./mcpCapabilityError";
export { McpToolError } from "./mcpToolError";

// Error codes and utilities
export { MCP_ERROR_CODES } from "./mcpErrorCodes";
export { createMcpError } from "./createMcpError";

// Capability negotiation
export { validateToolsOnlyCapabilities } from "./mcpCapabilities";
export { createToolsOnlyRequest } from "./createToolsOnlyRequest";
export { validateInitializeResponse } from "./validateInitializeResponse";

// Type interfaces
export type { McpClientCapabilities } from "./mcpClientCapabilities";
export type { McpServerCapabilities } from "./mcpServerCapabilities";
export type { McpInitializeRequest } from "./mcpInitializeRequest";
export type { McpInitializeResponse } from "./mcpInitializeResponse";

// Tool type definitions
export type { McpJsonSchema } from "./mcpJsonSchema";
export type { McpToolDefinition } from "./mcpToolDefinition";
export type { McpToolCall } from "./mcpToolCall";
export type { McpToolResultContent } from "./mcpToolResultContent";
export type { McpToolResult } from "./mcpToolResult";

// Schema translation functions
export { translateMcpToToolDefinition } from "./translateMcpToToolDefinition";
export { translateToolDefinitionToMcp } from "./translateToolDefinitionToMcp";
export { validateMcpToolDefinition } from "./validateMcpToolDefinition";

// Tool integration
export { createMcpToolHandler } from "./mcpToolHandler";
export { McpToolRegistry } from "./mcpToolRegistry";
