/**
 * E2E Test Shared Utilities - Barrel Export
 *
 * Unified export for all E2E test utilities including MCP testing,
 * provider helpers, and common test functionality.
 *
 * @example MCP Testing
 * ```typescript
 * import {
 *   createMcpTestConfig,
 *   setupMcpServer,
 *   validateMcpToolExecution,
 *   createMcpTestClient
 * } from "./shared";
 *
 * const { server, config, cleanup } = await setupMcpServer();
 * const client = createMcpTestClient(config);
 * // ... perform tests
 * await cleanup();
 * ```
 */

// MCP Test Utilities (New - from T-create-mcp-test-helpers-and)
export { createMcpTestConfig } from "./createMcpTestConfig";
export { setupMcpServer } from "./setupMcpServer";
export { validateMcpToolExecution } from "./validateMcpToolExecution";
export { createMcpTestClient } from "./createMcpTestClient";

// MCP Infrastructure (Existing - from T-create-mock-mcp-server-for)
export { MockMcpServer } from "./mockMcpServer";
export type { MockMcpServerOptions } from "./mockMcpServerOptions";
export type { McpToolDefinition } from "./mcpToolDefinition";

// MCP Test Environment (Existing)
export { createMcpTestEnvironment } from "./createMcpTestEnvironment";
export { cleanupMcpTestEnvironment } from "./cleanupMcpTestEnvironment";
export { validateMcpToolResult } from "./validateMcpToolResult";
export { generateMcpTestData } from "./generateMcpTestData";
export type { McpTestEnvironment } from "./mcpTestEnvironmentInterface";
export type { McpTestEnvironmentOptions } from "./mcpTestEnvironmentOptions";
export type { McpToolResultExpectation } from "./mcpToolResultExpectation";
export type { McpTestData } from "./mcpTestData";

// Provider Test Configurations
export { loadTestConfig as loadOpenAITestConfig } from "./openAITestConfig";
export { loadAnthropicTestConfig } from "./anthropicTestConfig";
export { loadGoogleTestConfig } from "./googleTestConfig";
export { loadXaiTestConfig } from "./xaiTestConfig";

// Provider Model Helpers
export { createTestClient as createOpenAITestClient } from "./openAIModelHelpers";
export { createAnthropicTestClient } from "./anthropicModelHelpers";
export { createGoogleTestClient } from "./googleModelHelpers";
export { createTestClient as createXaiTestClient } from "./xaiModelHelpers";

// Test Model Getters
export { getTestModel as getOpenAITestModel } from "./getTestModel";
export { getAnthropicTestModel } from "./getAnthropicTestModel";
export { getGoogleTestModel } from "./getGoogleTestModel";
export { getXaiTestModel } from "./getXaiTestModel";

// Common Test Utilities
export { createTestTool } from "./createTestTool";
export { createTestMessages } from "./createTestMessages";
export { createToolCall } from "./createToolCall";
export { prepareToolCallMessage } from "./prepareToolCallMessage";
export { testToolHandler } from "./testToolHandler";
export { validateApiKey } from "./validateApiKey";
export { validateToolExecution } from "./validateToolExecution";
export { ensureModelRegistered } from "./ensureModelRegistered";
export { withTimeout } from "./withTimeout";

// Test Helper Functions
export * from "./testHelpers";
export * from "./toolHelpers";
