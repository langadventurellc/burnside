/**
 * Unit Tests for MCP Test Helpers
 *
 * Comprehensive test suite for all MCP test utility functions.
 * Tests configuration creation, server lifecycle management, validation,
 * and client creation following existing E2E test patterns.
 */

import { createMcpTestConfig } from "./createMcpTestConfig";
import { setupMcpServer } from "./setupMcpServer";
import { validateMcpToolExecution } from "./validateMcpToolExecution";
import { createMcpTestClient } from "./createMcpTestClient";
import { MockMcpServer } from "./mockMcpServer";
import { BridgeClient } from "../../../client/bridgeClient";
import { ValidationError } from "../../../core/errors/validationError";

describe("MCP Test Helpers", () => {
  describe("createMcpTestConfig", () => {
    test("creates valid BridgeConfig with MCP server", () => {
      const serverUrl = "http://localhost:3000";
      const config = createMcpTestConfig(serverUrl);

      expect(config).toMatchObject({
        providers: {
          openai: {
            default: {
              apiKey: expect.any(String),
            },
          },
        },
        tools: {
          enabled: true,
          builtinTools: [],
          maxConcurrentTools: 1,
          mcpServers: [
            {
              name: "test-mcp-server",
              url: serverUrl,
            },
          ],
        },
      });
    });

    test("accepts custom server name", () => {
      const serverUrl = "http://localhost:3000";
      const serverName = "custom-mcp-server";
      const config = createMcpTestConfig(serverUrl, serverName);

      expect(config.tools?.mcpServers?.[0]?.name).toBe(serverName);
    });

    test("throws ValidationError for empty server configuration", () => {
      expect(() => createMcpTestConfig("")).toThrow(ValidationError);
      expect(() => createMcpTestConfig("")).toThrow(
        "Server configuration is required",
      );
    });

    test("throws ValidationError for invalid server configuration", () => {
      expect(() => createMcpTestConfig(null as unknown as string)).toThrow(
        ValidationError,
      );
      expect(() => createMcpTestConfig(123 as unknown as string)).toThrow(
        "Server configuration must be a URL string or command object with 'command' property",
      );
    });

    test("throws ValidationError for empty server name", () => {
      expect(() => createMcpTestConfig("http://localhost:3000", "")).toThrow(
        ValidationError,
      );
      expect(() => createMcpTestConfig("http://localhost:3000", "")).toThrow(
        "Server name is required",
      );
    });

    test("throws ValidationError for non-string server name", () => {
      expect(() =>
        createMcpTestConfig("http://localhost:3000", null as unknown as string),
      ).toThrow(ValidationError);
    });
  });

  describe("setupMcpServer", () => {
    test("starts server and returns cleanup function", async () => {
      const { server, config, cleanup } = await setupMcpServer();

      expect(server).toBeInstanceOf(MockMcpServer);
      expect(config).toMatchObject({
        tools: {
          enabled: true,
          builtinTools: [],
          mcpServers: [
            {
              name: "test-mcp-server",
              url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+$/),
            },
          ],
        },
      });
      expect(typeof cleanup).toBe("function");

      // Test cleanup function
      await expect(cleanup()).resolves.toBeUndefined();
    });

    test("cleanup function handles errors gracefully", async () => {
      const { cleanup } = await setupMcpServer();

      // Call cleanup twice to test error handling
      await cleanup();
      await expect(cleanup()).resolves.toBeUndefined();
    });
  });

  describe("validateMcpToolExecution", () => {
    test("validates correct MCP tool execution result", () => {
      const validResult = {
        content: [
          {
            type: "tool_use",
            name: "mcp_echo_tool",
            input: {
              message: "test-message",
            },
          },
        ],
      };

      expect(() =>
        validateMcpToolExecution(validResult, "test-message"),
      ).not.toThrow();
    });

    test("throws ValidationError for null result", () => {
      expect(() => validateMcpToolExecution(null, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(null, "test")).toThrow(
        "must be an object",
      );
    });

    test("throws ValidationError for non-object result", () => {
      expect(() => validateMcpToolExecution("invalid", "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution("invalid", "test")).toThrow(
        "must be an object",
      );
    });

    test("throws ValidationError for missing content array", () => {
      const invalidResult = { notContent: [] };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must have content array",
      );
    });

    test("throws ValidationError for non-array content", () => {
      const invalidResult = { content: "not-array" };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must have content array",
      );
    });

    test("throws ValidationError for empty content array", () => {
      const invalidResult = { content: [] };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "content cannot be empty",
      );
    });

    test("throws ValidationError for non-object content item", () => {
      const invalidResult = { content: ["string-item"] };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "content item must be an object",
      );
    });

    test("throws ValidationError for wrong tool type", () => {
      const invalidResult = {
        content: [
          { type: "text", name: "mcp_echo_tool", input: { message: "test" } },
        ],
      };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must contain tool_use content",
      );
    });

    test("throws ValidationError for wrong tool name", () => {
      const invalidResult = {
        content: [
          { type: "tool_use", name: "wrong_tool", input: { message: "test" } },
        ],
      };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must use mcp_echo_tool",
      );
    });

    test("throws ValidationError for missing input object", () => {
      const invalidResult = {
        content: [{ type: "tool_use", name: "mcp_echo_tool" }],
      };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must have input object",
      );
    });

    test("throws ValidationError for non-object input", () => {
      const invalidResult = {
        content: [
          { type: "tool_use", name: "mcp_echo_tool", input: "not-object" },
        ],
      };
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "test")).toThrow(
        "must have input object",
      );
    });

    test("throws ValidationError for mismatched echo content", () => {
      const invalidResult = {
        content: [
          {
            type: "tool_use",
            name: "mcp_echo_tool",
            input: { message: "wrong-message" },
          },
        ],
      };
      expect(() => validateMcpToolExecution(invalidResult, "expected")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "expected")).toThrow(
        'must echo "expected", got: wrong-message',
      );
    });

    test("throws ValidationError for missing message in input", () => {
      const invalidResult = {
        content: [
          {
            type: "tool_use",
            name: "mcp_echo_tool",
            input: { otherField: "value" },
          },
        ],
      };
      expect(() => validateMcpToolExecution(invalidResult, "expected")).toThrow(
        ValidationError,
      );
      expect(() => validateMcpToolExecution(invalidResult, "expected")).toThrow(
        'must echo "expected", got: undefined',
      );
    });
  });

  describe("createMcpTestClient", () => {
    test("creates BridgeClient with default MCP configuration", () => {
      const client = createMcpTestClient();

      expect(client).toBeInstanceOf(BridgeClient);
    });

    test("merges provided configuration with defaults", () => {
      const customConfig = {
        providers: {
          anthropic: {
            default: { apiKey: "custom-key" },
          },
        },
      };

      const client = createMcpTestClient(customConfig);
      expect(client).toBeInstanceOf(BridgeClient);
    });

    test("preserves MCP server configuration when merging", () => {
      const customConfig = {
        tools: {
          enabled: true,
          builtinTools: ["custom-tool"],
          maxConcurrentTools: 5,
        },
      };

      const client = createMcpTestClient(customConfig);
      expect(client).toBeInstanceOf(BridgeClient);
    });

    test("handles partial tools configuration", () => {
      const customConfig = {
        tools: {
          enabled: false,
          builtinTools: [],
        },
      };

      const client = createMcpTestClient(customConfig);
      expect(client).toBeInstanceOf(BridgeClient);
    });

    test("creates client with empty configuration override", () => {
      const client = createMcpTestClient({});
      expect(client).toBeInstanceOf(BridgeClient);
    });
  });
});
