import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { createTestClient } from "../shared/openAIModelHelpers";
import { getTestModel } from "../shared/getTestModel";
import { loadTestConfig } from "../shared/openAITestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { createTestTool } from "../shared/createTestTool";
import { testToolHandler } from "../shared/testToolHandler";
import { createTrackingTestTool } from "../shared/createTrackingTestTool";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

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
    // Parameterized test for all tool-capable OpenAI models - validates actual tool execution
    test.each(openaiModels)(
      "should execute tools when requested using $name ($id)",
      async ({ id: modelId }) => {
        // Create a tracking test tool for this specific test
        const { toolDefinition, executionTracker, handler } =
          createTrackingTestTool();
        const testClient = createTestClient();
        testClient.registerTool(
          toolDefinition,
          handler as (params: Record<string, unknown>) => Promise<unknown>,
        );

        const messages = createTestMessages(
          "Use the e2e_echo_tool to echo the message 'Hello from tool test'",
        );

        const response = await withTimeout(
          testClient.chat({
            messages,
            model: modelId,
          }),
          25000,
        );

        // Validate response structure
        validateMessageSchema(response);
        expect(response.role).toBe("assistant");
        expect(response.content).toBeDefined();

        // Validate tool execution actually occurred
        expect(executionTracker.wasExecuted()).toBe(true);
        expect(executionTracker.hasParameters()).toBe(true);
      },
      30000,
    );
  });

  describe("Tool System Integration", () => {
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
    test("should handle complex tool requests with execution validation", async () => {
      // Create a tracking test tool for this specific test
      const { toolDefinition, executionTracker, handler } =
        createTrackingTestTool();
      const testClient = createTestClient();
      testClient.registerTool(
        toolDefinition,
        handler as (params: Record<string, unknown>) => Promise<unknown>,
      );

      const messages = createTestMessages(
        "Please use the e2e_echo_tool multiple times: first echo 'Hello', then echo 'World'",
      );

      const response = await withTimeout(
        testClient.chat({
          messages,
          model: testModel,
        }),
        25000,
      );

      // Validate response structure
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();

      // Validate tool execution actually occurred
      expect(executionTracker.wasExecuted()).toBe(true);
      expect(executionTracker.hasParameters()).toBe(true);
      // For complex requests, we might have multiple executions
      expect(executionTracker.getExecutionCount()).toBeGreaterThan(0);
    });
  });
});
