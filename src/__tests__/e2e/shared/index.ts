/**
 * E2E Testing Helpers
 *
 * Barrel export for all E2E testing utilities including tool helpers and MCP testing.
 *
 * Tool Helper Exports:
 * - prepareToolCallMessage: Converts unified tool calls to OpenAI raw format
 * - createTestTool: Creates simple test tool definition
 * - testToolHandler: Handler for test tool execution
 * - validateToolExecution: Validates test tool results
 * - createToolCall: Creates ToolCall objects for testing
 *
 * MCP Testing Exports:
 * - MockMcpServer: Mock MCP server for testing
 * - createMcpTestEnvironment: Creates complete MCP test environment
 * - cleanupMcpTestEnvironment: Safely cleans up MCP test environments
 * - validateMcpToolResult: Validates MCP tool execution results
 * - generateMcpTestData: Generates consistent test data
 *
 * Type Exports:
 * - MockMcpServerOptions: Configuration for mock MCP server
 * - McpTestEnvironment: Complete test environment interface
 * - McpToolDefinition: MCP tool definition structure
 */

// Tool helpers
export { prepareToolCallMessage } from "./prepareToolCallMessage";
export { createTestTool } from "./createTestTool";
export { testToolHandler } from "./testToolHandler";
export { validateToolExecution } from "./validateToolExecution";
export { createToolCall } from "./createToolCall";

// MCP testing utilities
export { MockMcpServer } from "./mockMcpServer";
export { createMcpTestEnvironment } from "./createMcpTestEnvironment";
export { cleanupMcpTestEnvironment } from "./cleanupMcpTestEnvironment";
export { validateMcpToolResult } from "./validateMcpToolResult";
export { generateMcpTestData } from "./generateMcpTestData";

// MCP type exports
export type { MockMcpServerOptions } from "./mockMcpServerOptions";
export type { McpTestEnvironment } from "./mcpTestEnvironmentInterface";
export type { McpTestEnvironmentOptions } from "./mcpTestEnvironmentOptions";
export type { McpToolDefinition } from "./mcpToolDefinition";
export type { McpToolResultExpectation } from "./mcpToolResultExpectation";
export type { McpTestData } from "./mcpTestData";
