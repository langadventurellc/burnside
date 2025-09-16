import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import { createTestClient } from "../shared/modelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getTestModel } from "../shared/getTestModel.js";
import { loadTestConfig } from "../shared/testConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { createTestTool } from "../shared/createTestTool.js";
import { testToolHandler } from "../shared/testToolHandler.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

// Extract OpenAI models that support tool calls
const openaiProvider = defaultLlmModels.providers.find(
  (p) => p.id === "openai",
);
const openaiModels =
  openaiProvider?.models
    .filter((model) => model.toolCalls === true)
    .map((model) => ({
      id: `openai:${model.id}`,
      name: model.name,
    })) || [];

describe("OpenAI Tool Execution E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadTestConfig(); // Validate environment configuration
    client = createTestClient();
    testModel = getTestModel();
    ensureModelRegistered(client, testModel);

    // Ensure model supports tool calls
    const modelInfo = client.getModelRegistry().get(testModel);
    if (!modelInfo?.capabilities?.toolCalls) {
      throw new Error(`Test model ${testModel} does not support tool calls`);
    }

    // Register test tool
    const toolDef = createTestTool();
    client.registerTool(
      toolDef,
      testToolHandler as (params: Record<string, unknown>) => Promise<unknown>,
    );
  });

  describe("Tool Registration", () => {
    test("should register tools successfully", () => {
      const toolDef = createTestTool();
      const testClient = createTestClient();

      // Should not throw when registering valid tool
      expect(() => {
        testClient.registerTool(
          toolDef,
          testToolHandler as (
            params: Record<string, unknown>,
          ) => Promise<unknown>,
        );
      }).not.toThrow();
    });

    test("should validate tool definitions", () => {
      const testClient = createTestClient();
      const toolDef = createTestTool();

      // Register tool and verify it's available
      testClient.registerTool(
        toolDef,
        testToolHandler as (
          params: Record<string, unknown>,
        ) => Promise<unknown>,
      );

      // Tool should be registered (this is tested implicitly through successful execution)
      expect(toolDef.name).toBe("e2e_echo_tool");
      expect(toolDef.description).toBeTruthy();
      expect(toolDef.inputSchema).toBeDefined();
      expect(toolDef.outputSchema).toBeDefined();
    });
  });

  describe("Function Calling with Tools", () => {
    // Parameterized test for all tool-capable OpenAI models
    test.each(openaiModels)(
      "should handle chat requests with tools using $name ($id)",
      async ({ id: modelId }) => {
        ensureModelRegistered(client, modelId);

        const messages = createTestMessages(
          "Use the e2e_echo_tool to echo the message 'Hello from tool test'",
        );

        const response = await withTimeout(
          client.chat({
            messages,
            model: modelId,
          }),
          25000,
        );

        // Should receive a valid response
        expect(response).toBeDefined();
        validateMessageSchema(response);
        expect(response.role).toBe("assistant");
        expect(response.content).toBeDefined();
        expect(Array.isArray(response.content)).toBe(true);
      },
      30000,
    );

    test("should process tool calls in chat responses", async () => {
      const messages = createTestMessages(
        "Use the e2e_echo_tool to echo the message 'Test tool call processing'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Validate basic response structure
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Response should be well-formed even with tool processing
      if (response.content.length > 0 && response.content[0].type === "text") {
        expect(response.content[0].text).toBeTruthy();
      }
    });
  });

  describe("Tool System Integration", () => {
    test("should handle tool execution through BridgeClient", async () => {
      // Create a separate client to test tool integration
      const testClient = createTestClient();
      ensureModelRegistered(testClient, testModel);

      const toolDef = createTestTool();
      testClient.registerTool(
        toolDef,
        testToolHandler as (
          params: Record<string, unknown>,
        ) => Promise<unknown>,
      );

      const messages = createTestMessages(
        "Please use the e2e_echo_tool to echo back the message 'Integration test'",
      );

      const response = await withTimeout(
        testClient.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Tool execution should result in valid response
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });

    test("should handle requests when tools are available but not used", async () => {
      const messages = createTestMessages(
        "Just say hello, don't use any tools",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Should work normally even when tools are registered but not used
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();

      if (response.content.length > 0 && response.content[0].type === "text") {
        expect(response.content[0].text.toLowerCase()).toContain("hello");
      }
    });
  });

  describe("Tool Error Handling", () => {
    test("should handle tool registration errors gracefully", () => {
      const testClient = createTestClient();

      // Test with invalid tool definition
      const invalidToolDef = {
        name: "", // Invalid empty name
        description: "Invalid tool",
        inputSchema: createTestTool().inputSchema,
        outputSchema: createTestTool().outputSchema,
      };

      // Should handle invalid tool registration
      expect(() => {
        testClient.registerTool(
          invalidToolDef,
          testToolHandler as (
            params: Record<string, unknown>,
          ) => Promise<unknown>,
        );
      }).toThrow();
    });

    test("should handle tool execution failures gracefully", async () => {
      const testClient = createTestClient();
      ensureModelRegistered(testClient, testModel);

      // Register a tool that will fail
      const errorToolDef = {
        name: "error_test_tool",
        description: "Tool that causes errors for testing",
        inputSchema: createTestTool().inputSchema,
        outputSchema: createTestTool().outputSchema,
      };

      const errorHandler = () => {
        throw new Error("Intentional test error");
      };

      testClient.registerTool(errorToolDef, errorHandler);

      const messages = createTestMessages(
        "Use the error_test_tool to cause an error",
      );

      // Should not throw, but handle error gracefully
      const response = await withTimeout(
        testClient.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Should receive a valid response even with tool errors
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
    });

    test("should handle requests when tool system is disabled", async () => {
      // Create client without tool system
      const noToolsClient = createTestClient();
      // Don't register any tools
      ensureModelRegistered(noToolsClient, testModel);

      const messages = createTestMessages(
        "Just have a normal conversation without tools",
      );

      const response = await withTimeout(
        noToolsClient.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Should work normally without tool system
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });
  });

  describe("Tool Behavior Validation", () => {
    test("should maintain message format consistency with tools", async () => {
      const messages = createTestMessages(
        "Use the e2e_echo_tool to echo 'Format consistency test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Validate response maintains consistent format
      validateMessageSchema(response);
      expect(response).toHaveProperty("role");
      expect(response).toHaveProperty("content");
      expect(response.role).toBe("assistant");
      expect(Array.isArray(response.content)).toBe(true);

      // Should have timestamp and id
      expect(response.timestamp).toBeTruthy();
      expect(response.id).toBeTruthy();
    });

    test("should handle complex tool requests appropriately", async () => {
      const messages = createTestMessages(
        "Please use the e2e_echo_tool multiple times: first echo 'Hello', then echo 'World'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Should handle complex requests gracefully
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    });

    test("should preserve metadata in tool responses", async () => {
      const messages = createTestMessages(
        "Use the e2e_echo_tool to echo 'Metadata preservation test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Should have proper metadata structure
      validateMessageSchema(response);

      if (response.metadata) {
        expect(typeof response.metadata).toBe("object");
      }

      // Should maintain basic message properties
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(response.timestamp).toBeTruthy();
      expect(response.id).toBeTruthy();
    });
  });
});
