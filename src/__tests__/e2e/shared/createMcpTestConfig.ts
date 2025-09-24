/**
 * Create test configuration with MCP server integration
 *
 * Generates a valid BridgeConfig with MCP server configuration that integrates
 * with the existing test infrastructure. Supports both HTTP and STDIO transports
 * while maintaining backward compatibility.
 *
 * @param serverConfig - URL string for HTTP transport or command object for STDIO transport
 * @param serverName - Optional name for the MCP server (defaults to "test-mcp-server")
 * @returns BridgeConfig with MCP server configuration
 *
 * @example
 * ```typescript
 * // HTTP transport (backward compatible)
 * const httpConfig = createMcpTestConfig("http://localhost:3000");
 *
 * // STDIO transport
 * const stdioConfig = createMcpTestConfig({
 *   command: "node",
 *   args: ["./stdio-mcp-server.js"]
 * });
 * ```
 */

import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import type { McpServerConfig } from "../../../core/config/mcpServerConfig";
import { ValidationError } from "../../../core/errors/validationError";

export function createMcpTestConfig(
  serverConfig: string | { command: string; args?: string[] },
  serverName = "test-mcp-server",
): BridgeConfig {
  if (!serverConfig) {
    throw new ValidationError("Server configuration is required");
  }

  if (!serverName || typeof serverName !== "string") {
    throw new ValidationError("Server name is required and must be a string");
  }

  // Determine if this is HTTP (string) or STDIO (object) configuration
  let mcpServerConfig: McpServerConfig;
  if (typeof serverConfig === "string") {
    // HTTP transport - backward compatible
    mcpServerConfig = {
      name: serverName,
      url: serverConfig,
    };
  } else if (typeof serverConfig === "object" && serverConfig.command) {
    // STDIO transport
    mcpServerConfig = {
      transport: "stdio",
      name: serverName,
      command: serverConfig.command,
      ...(serverConfig.args && { args: serverConfig.args }),
    };
  } else {
    throw new ValidationError(
      "Server configuration must be a URL string or command object with 'command' property",
    );
  }

  return {
    defaultProvider: "openai",
    providers: {
      openai: {
        default: {
          apiKey: process.env.OPENAI_API_KEY || "test-api-key",
        },
      },
    },
    tools: {
      enabled: true,
      builtinTools: [],
      maxConcurrentTools: 1,
      mcpServers: [mcpServerConfig],
    },
  };
}
