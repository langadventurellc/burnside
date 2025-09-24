/**
 * BridgeClient Tool Integration Tests
 *
 * Tests for the integration between BridgeClient and the tool system,
 * ensuring tool execution works correctly with chat and stream methods.
 */

import { BridgeClient } from "../bridgeClient";
import type { BridgeConfig } from "../../core/config/bridgeConfig";
import type { ChatRequest } from "../chatRequest";
import { z } from "zod";

describe("BridgeClient Tool Integration", () => {
  let config: BridgeConfig;
  let client: BridgeClient;

  beforeEach(() => {
    config = {
      providers: {
        openai: {
          default: { apiKey: "test-key" },
        },
      },
      tools: {
        enabled: true,
        builtinTools: ["echo"],
        executionTimeoutMs: 5000,
        maxConcurrentTools: 1,
      },
    };
    client = new BridgeClient(config);
  });

  describe("Tool System Initialization", () => {
    it("should initialize tool system when enabled in config", () => {
      expect(client.getToolRouter()).toBeDefined();
    });

    it("should not initialize tool system when disabled", () => {
      const disabledConfig = {
        ...config,
        tools: { ...config.tools!, enabled: false },
      };
      const disabledClient = new BridgeClient(disabledConfig);
      expect(disabledClient.getToolRouter()).toBeUndefined();
    });

    it("should not initialize tool system when not in config", () => {
      const { tools: _tools, ...configWithoutTools } = config;
      const clientWithoutTools = new BridgeClient(configWithoutTools);
      expect(clientWithoutTools.getToolRouter()).toBeUndefined();
    });
  });

  describe("Tool Registration", () => {
    it("should register a tool successfully", () => {
      const toolDefinition = {
        name: "test_tool",
        description: "A test tool",
        inputSchema: z.object({
          input: z.string(),
        }),
      };

      const handler = jest.fn().mockResolvedValue({ result: "test output" });

      expect(() => {
        client.registerTool(toolDefinition, handler);
      }).not.toThrow();
    });

    it("should throw error when registering tool without tool system enabled", () => {
      const disabledConfig = {
        ...config,
        tools: { ...config.tools!, enabled: false },
      };
      const disabledClient = new BridgeClient(disabledConfig);

      const toolDefinition = {
        name: "test_tool",
        description: "A test tool",
        inputSchema: z.object({
          input: z.string(),
        }),
      };

      const handler = jest.fn().mockResolvedValue({ result: "test output" });

      expect(() => {
        disabledClient.registerTool(toolDefinition, handler);
      }).toThrow("Tool system not initialized");
    });

    it("should validate tool definition before registration", () => {
      const invalidToolDefinition = {
        name: "",
        description: "Invalid tool",
        inputSchema: z.object({}),
      };

      const handler = jest.fn();

      expect(() => {
        client.registerTool(invalidToolDefinition, handler);
      }).toThrow();
    });
  });

  describe("Chat Request Validation", () => {
    it("should validate tool definitions in chat requests", async () => {
      const invalidRequest: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
        model: "gpt-4",
        tools: [
          {
            name: "",
            description: "Invalid tool",
            inputSchema: { type: "object" },
          } as any,
        ],
      };

      // The invalid tool definition should cause validation to fail
      await expect(client.chat(invalidRequest)).rejects.toThrow();
    });

    it("should throw error when tools provided but system disabled", async () => {
      const disabledConfig = {
        ...config,
        tools: { ...config.tools!, enabled: false },
      };
      const disabledClient = new BridgeClient(disabledConfig);

      const request: ChatRequest = {
        messages: [
          { role: "user", content: [{ type: "text", text: "Hello" }] },
        ],
        model: "gpt-4",
        tools: [
          {
            name: "test_tool",
            description: "A test tool",
            inputSchema: { type: "object" },
          },
        ],
      };

      await expect(disabledClient.chat(request)).rejects.toThrow(
        "Tools provided but tool system not enabled",
      );
    });
  });

  describe("Tool Configuration", () => {
    it("should correctly identify when tools are enabled", () => {
      const toolRouter = client.getToolRouter();
      expect(toolRouter).toBeDefined();
    });

    it("should respect tool configuration settings", () => {
      expect(client.getConfig().tools?.enabled).toBe(true);
      expect(client.getConfig().tools?.executionTimeoutMs).toBe(5000);
      expect(client.getConfig().tools?.maxConcurrentTools).toBe(1);
    });
  });
});
