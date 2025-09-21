import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import { createGoogleTestClient } from "../shared/googleModelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getGoogleTestModel } from "../shared/getGoogleTestModel.js";
import { loadGoogleTestConfig } from "../shared/googleTestConfig.js";
import { validateMessageSchema } from "../shared/testHelpers.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { createTestTool } from "../shared/createTestTool.js";
import { testToolHandler } from "../shared/testToolHandler.js";
import { createTrackingTestTool } from "../shared/createTrackingTestTool.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

// Extract Google models that support tool calls
const googleProvider = defaultLlmModels.providers.find(
  (p) => p.id === "google",
);
const googleModels =
  googleProvider?.models
    .filter((model) => model.toolCalls === true)
    .map((model) => ({
      id: `google:${model.id}`,
      name: model.name,
    })) || [];

describe("Google Gemini Tool Execution E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadGoogleTestConfig(); // Validate environment configuration
    client = createGoogleTestClient();
    testModel = getGoogleTestModel();
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
      const testClient = createGoogleTestClient();

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
      const testClient = createGoogleTestClient();
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
    // Parameterized test for all tool-capable Google models - validates actual tool execution
    test.each(googleModels)(
      "should execute tools when requested using $name ($id)",
      async ({ id: modelId }) => {
        ensureModelRegistered(client, modelId);

        // Create a tracking test tool for this specific test
        const { toolDefinition, executionTracker, handler } =
          createTrackingTestTool();
        const testClient = createGoogleTestClient();
        ensureModelRegistered(testClient, modelId);
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
            maxTokens: 1000,
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
          maxTokens: 100,
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
      const testClient = createGoogleTestClient();

      // Test invalid tool name (empty string)
      expect(() => {
        testClient.registerTool(
          {
            name: "",
            description: "Invalid tool with empty name",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
          },
          () => Promise.resolve("test"),
        );
      }).toThrow();
    });

    test("should handle tool execution failures gracefully", async () => {
      const testClient = createGoogleTestClient();
      ensureModelRegistered(testClient, testModel);

      // Register a tool that throws an error
      testClient.registerTool(
        {
          name: "failing_tool",
          description: "A tool that always fails for testing error handling",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              result: { type: "string" },
            },
          },
        },
        () => {
          throw new Error("Simulated tool execution failure");
        },
      );

      const messages = createTestMessages(
        "Use the failing_tool to process something",
      );

      // Tool execution failure should not crash the entire request
      const response = await withTimeout(
        testClient.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      // Should handle error gracefully and return a response
      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
    });

    test("should handle disabled tool system", async () => {
      const disabledToolsClient = createGoogleTestClient({
        tools: { enabled: false, builtinTools: [] },
      });
      ensureModelRegistered(disabledToolsClient, testModel);

      const messages = createTestMessages(
        "Use any tools if available, otherwise just respond normally",
      );

      const response = await withTimeout(
        disabledToolsClient.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      // Should work even when tools are disabled
      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });

    test("should handle invalid tool configurations", async () => {
      const messages = createTestMessages(
        "Try to use any available tools for this request",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      // Should handle gracefully even with potential tool issues
      expect(response).toBeDefined();
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
      const testClient = createGoogleTestClient();
      ensureModelRegistered(testClient, testModel);
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
          maxTokens: 200,
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
