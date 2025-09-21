/**
 * Create test configuration with MCP server integration
 *
 * Generates a valid BridgeConfig with MCP server configuration that integrates
 * with the existing test infrastructure. Follows patterns from provider test configs.
 *
 * @param serverUrl - URL of the MCP server to configure
 * @param serverName - Optional name for the MCP server (defaults to "test-mcp-server")
 * @returns BridgeConfig with MCP server configuration
 *
 * @example
 * ```typescript
 * const config = createMcpTestConfig("http://localhost:3000");
 * // Result includes tools.mcpServers array with the server configuration
 * ```
 */

import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { ValidationError } from "../../../core/errors/validationError";

export function createMcpTestConfig(
  serverUrl: string,
  serverName = "test-mcp-server",
): BridgeConfig {
  if (!serverUrl || typeof serverUrl !== "string") {
    throw new ValidationError("Server URL is required and must be a string");
  }

  if (!serverName || typeof serverName !== "string") {
    throw new ValidationError("Server name is required and must be a string");
  }

  return {
    defaultProvider: "openai",
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || "test-api-key",
      },
    },
    tools: {
      enabled: true,
      builtinTools: [],
      maxConcurrentTools: 1,
      mcpServers: [
        {
          name: serverName,
          url: serverUrl,
        },
      ],
    },
  };
}
