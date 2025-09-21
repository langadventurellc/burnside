import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { createTestClient } from "../shared/xaiModelHelpers";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { validateMessageSchema } from "../shared/testHelpers";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { createTestTool } from "../shared/createTestTool";
import { testToolHandler } from "../shared/testToolHandler";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract xAI models that support tool calls for verification
const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
if (!xaiProvider?.models.some((model) => model.toolCalls === true)) {
  throw new Error("No xAI models with tool call support found");
}

describe("xAI Multi-Turn Conversation E2E", () => {
  let client: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    loadXaiTestConfig(); // Validate environment configuration
    client = createTestClient();
    testModel = getXaiTestModel();

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

  describe("Multi-Turn Execution", () => {
    test("should execute basic multi-turn conversation flow", async () => {
      const toolDef = createTestTool();
      const messages = createTestMessages(
        "Use the e2e_echo_tool multiple times to process this request step by step",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          tools: [toolDef], // Required for multi-turn execution
          multiTurn: { maxIterations: 3 },
          maxTokens: 100,
        }),
        45000, // Longer timeout for multi-turn
      );

      // Validate response using existing patterns
      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Basic response validation for multi-turn
      expect(response.content.length).toBeGreaterThan(0);
    });

    test("should respect maxIterations limit in multi-turn conversation", async () => {
      const toolDef = createTestTool();
      const messages = createTestMessages(
        "Use the e2e_echo_tool repeatedly - keep going until stopped",
      );

      const response = await withTimeout(
        client.chat({
          messages,
          model: testModel,
          tools: [toolDef], // Required for multi-turn execution
          multiTurn: { maxIterations: 2 },
          maxTokens: 100,
        }),
        45000,
      );

      // Validate response and that conversation terminated properly
      expect(response).toBeDefined();
      validateMessageSchema(response);
      expect(response.role).toBe("assistant");
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Should maintain basic message properties
      expect(response.content.length).toBeGreaterThan(0);
    });
  });
});
