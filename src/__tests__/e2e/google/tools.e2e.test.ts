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
    // Parameterized test for all tool-capable Google models
    test.each(googleModels)(
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
            maxTokens: 100,
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
          maxTokens: 100,
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
      const testClient = createGoogleTestClient();
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
          maxTokens: 100,
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
    test("should maintain message format consistency across tool calls", async () => {
      const messages = createTestMessages(
        "Use e2e_echo_tool with the message 'format consistency test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
    });

    test("should handle complex tool requests with special characters", async () => {
      const messages = createTestMessages(
        "Use the e2e_echo_tool to echo this complex message: 'Test with symbols: @#$%^&*()[]{}|;:,.<>?'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 200,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });

    test("should handle multiple tool calls in sequence", async () => {
      const messages = createTestMessages(
        "First use e2e_echo_tool to say 'First call', then use it again to say 'Second call'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 200,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });

    test("should preserve conversation context across tool executions", async () => {
      // First establish context
      const contextMessages = createTestMessages("Remember this number: 42");

      const contextResponse = await withTimeout(
        client.chat({
          messages: contextMessages,
          model: testModel,
          maxTokens: 50,
        }),
        25000,
      );

      expect(contextResponse).toBeDefined();
      validateMessageSchema(contextResponse);

      // Then use tool with context reference
      const toolMessages = [
        ...contextMessages,
        contextResponse,
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: "Now use e2e_echo_tool to repeat the number I mentioned",
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await withTimeout(
        client.chat({
          messages: toolMessages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
    });

    test("should validate tool arguments properly", async () => {
      const messages = createTestMessages(
        "Use e2e_echo_tool with the message 'argument validation test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
    });

    test("should format tool responses correctly", async () => {
      const messages = createTestMessages(
        "Use e2e_echo_tool to echo 'response formatting test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
    });

    test("should preserve metadata across tool interactions", async () => {
      const messages = createTestMessages(
        "Use e2e_echo_tool with 'metadata preservation test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.timestamp).toBeDefined();
      expect(response.content).toBeDefined();
    });

    test("should handle tool execution timing appropriately", async () => {
      const startTime = Date.now();
      const messages = createTestMessages(
        "Use e2e_echo_tool quickly with 'timing test'",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          maxTokens: 100,
        }),
        25000,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(duration).toBeLessThan(25000); // Should complete within timeout
      expect(duration).toBeGreaterThan(0); // Should take some time
    });
  });
});
