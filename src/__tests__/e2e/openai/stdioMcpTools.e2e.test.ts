import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { getTestModel } from "../shared/getTestModel";
import { loadTestConfig } from "../shared/openAITestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { setupMcpServer } from "../shared/setupMcpServer";
import { createMcpTestClient } from "../shared/createMcpTestClient";
import type { StdioMcpServerManager } from "../shared/stdioMcpServerManager";
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

describe("OpenAI STDIO MCP Tool E2E", () => {
  let client: BridgeClient;
  let mcpServer: StdioMcpServerManager;
  let testModel: string;
  let _cleanup: () => Promise<void>;
  let mcpConfig: BridgeConfig;

  beforeAll(async () => {
    try {
      // Validate environment configuration
      loadTestConfig();

      // Setup STDIO MCP server (key difference from HTTP test)
      const mcpSetup = await setupMcpServer({ transport: "stdio" });
      mcpServer = mcpSetup.server;
      mcpConfig = mcpSetup.config;
      _cleanup = mcpSetup.cleanup;

      // Create client with OpenAI and MCP configuration using helper
      const testConfig = loadTestConfig();
      client = createMcpTestClient({
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: testConfig.openaiApiKey },
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

      // Register OpenAI provider
      const { OpenAIResponsesV1Provider } = await import(
        "../../../providers/openai-responses-v1/openAIResponsesV1Provider"
      );
      client.registerProvider(new OpenAIResponsesV1Provider());

      // Setup test model
      testModel = getTestModel();

      // Ensure model supports tool calls
      const modelInfo = client.getModelRegistry().get(testModel);
      if (!modelInfo?.capabilities?.toolCalls) {
        throw new Error(`Test model ${testModel} does not support tool calls`);
      }

      // Wait for MCP tools to be registered (they connect asynchronously)
      await waitForMcpToolsRegistration(client, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error in STDIO MCP test setup:", error);
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
      if (_cleanup) {
        await _cleanup();
      }
    } catch (error) {
      console.warn("Warning: Error during MCP server cleanup:", error);
    }
  });

  describe("MCP Tool Discovery", () => {
    test("should discover MCP tools through STDIO transport", () => {
      // Basic validation that client is configured with MCP
      expect(client).toBeDefined();
      expect(client.getConfig().tools?.mcpServers).toBeDefined();
      expect(client.getConfig().tools?.mcpServers?.length).toBeGreaterThan(0);

      // Verify STDIO MCP server configuration (command not url)
      const mcpServers = client.getConfig().tools?.mcpServers || [];
      expect(mcpServers).toHaveLength(1);
      expect(mcpServers[0]).toHaveProperty("name");
      expect(mcpServers[0]).toHaveProperty("command"); // Key difference: command not url
      expect(mcpServers[0]).not.toHaveProperty("url");
    });
  });

  describe("MCP Tool Execution", () => {
    test("should execute MCP tool through STDIO subprocess", async () => {
      // Clear any previous tool call history
      mcpServer.clearToolCallHistory();

      // Create test input for echo tool
      const testInput: string = "Hello MCP from OpenAI via STDIO";

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
        25000, // 25 second timeout matching existing patterns
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

      // CRITICAL: Verify that the MCP tool was actually called via STDIO
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
