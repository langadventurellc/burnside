import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { getAnthropicTestModel } from "../shared/getAnthropicTestModel";
import { loadAnthropicTestConfig } from "../shared/anthropicTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { setupMcpServer } from "../shared/setupMcpServer";
import { createMcpTestClient } from "../shared/createMcpTestClient";
import type { MockMcpServer } from "../shared/mockMcpServer";
import type { BridgeConfig } from "../../../core/config/bridgeConfig";

/**
 * Wait for MCP tools to be registered with the client
 */
async function waitForMcpToolsRegistration(
  client: BridgeClient,
  timeoutMs: number = 10000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const toolRouter = client.getToolRouter();
    if (toolRouter) {
      const tools = toolRouter.getRegisteredTools();
      const mcpTools = tools.filter((tool) => tool.name.startsWith("mcp_"));

      if (mcpTools.length > 0) {
        return;
      }
    }

    // Wait 100ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`MCP tools were not registered within ${timeoutMs}ms`);
}

describe("Anthropic MCP Tool Basic Validation E2E", () => {
  let client: BridgeClient;
  let mcpServer: MockMcpServer;
  let testModel: string;
  let cleanup: () => Promise<void>;
  let mcpConfig: BridgeConfig;

  beforeAll(async () => {
    try {
      // Validate environment configuration
      loadAnthropicTestConfig();

      // Setup MCP server and configuration
      const mcpSetup = await setupMcpServer();
      mcpServer = mcpSetup.server;
      mcpConfig = mcpSetup.config;
      cleanup = mcpSetup.cleanup;

      // Create client with Anthropic and MCP configuration using helper
      const testConfig = loadAnthropicTestConfig();
      client = createMcpTestClient({
        providers: {
          anthropic: {
            default: { apiKey: testConfig.anthropicApiKey },
          },
        },
        modelSeed: "builtin",
        options: {
          logging: {
            enabled: false,
            // level: "debug",
          },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          mcpServers: mcpConfig.tools?.mcpServers || [],
        },
      });

      // Register Anthropic provider BEFORE setting up models
      const { AnthropicMessagesV1Provider } = await import(
        "../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider"
      );
      const provider = new AnthropicMessagesV1Provider();

      // Initialize the provider with the configuration
      await provider.initialize({ apiKey: testConfig.anthropicApiKey });

      client.registerProvider(provider);

      // Setup test model AFTER provider registration
      testModel = getAnthropicTestModel();

      // Ensure model supports tool calls
      const modelInfo = client.getModelRegistry().get(testModel);
      if (!modelInfo?.capabilities?.toolCalls) {
        throw new Error(`Test model ${testModel} does not support tool calls`);
      }

      // Wait for MCP tools to be registered (they connect asynchronously)
      await waitForMcpToolsRegistration(client, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error in beforeAll setup:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Dispose of client first to disconnect MCP connections
      if (client) {
        await client.dispose();
      }
    } catch (error) {
      console.warn("Warning: Error during client cleanup:", error);
    }

    try {
      // Then cleanup the MCP server
      if (cleanup) {
        await cleanup();
      }
    } catch (error) {
      console.warn("Warning: Error during MCP server cleanup:", error);
    }
  });

  describe("MCP Tool Discovery", () => {
    test("should discover MCP tools during client initialization", () => {
      // Basic validation that client is configured with MCP
      expect(client).toBeDefined();
      expect(client.getConfig().tools?.mcpServers).toBeDefined();
      expect(client.getConfig().tools?.mcpServers?.length).toBeGreaterThan(0);

      // Verify MCP server configuration is present
      const mcpServers = client.getConfig().tools?.mcpServers || [];
      expect(mcpServers).toHaveLength(1);
      expect(mcpServers[0]).toHaveProperty("name");
      expect(mcpServers[0]).toHaveProperty("url");
    });
  });

  describe("MCP Tool Execution", () => {
    test("should execute MCP tool through Anthropic model", async () => {
      // Clear any previous tool call history
      mcpServer.clearToolCallHistory();

      // Create test input for echo tool
      const testInput: string = "Hello MCP from Anthropic";

      // Create chat request that uses MCP tool
      const messages = createTestMessages(
        `Please use the mcp_echo_tool to echo this message: "${testInput}"`,
      );

      // Execute chat request with timeout
      const response = await withTimeout(
        client.chat({
          model: testModel,
          messages,
          maxTokens: 100,
        }),
        25000, // 25 second timeout matching existing Anthropic patterns
      );

      // Validate response format matches existing tool tests
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Basic validation that the response is well-formed
      if (response.content.length > 0 && response.content[0].type === "text") {
        expect(response.content[0].text).toBeTruthy();
      }

      // CRITICAL: Verify that the MCP tool was actually called
      expect(mcpServer.wasToolCalled("echo_tool")).toBe(true);
      expect(mcpServer.getToolCallCount("echo_tool")).toBeGreaterThan(0);

      // Verify the tool was called with the expected message
      const toolCalls = mcpServer.getToolCallsFor("echo_tool");
      expect(toolCalls.length).toBeGreaterThan(0);

      const lastCall = toolCalls[toolCalls.length - 1];
      expect(lastCall.arguments).toMatchObject({
        message: testInput,
      });
    });
  });
});
