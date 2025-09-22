/**
 * MCP Server Configuration Utilities
 *
 * Helper functions for working with McpServerConfig objects,
 * including conversion from legacy URL-based configurations.
 */

import type { McpServerConfig } from "./mcpServerConfig";

/**
 * Convert a URL string to an MCP server configuration object.
 *
 * This helper function is useful for maintaining backward compatibility
 * when migrating from URL-based configurations to the new McpServerConfig format.
 *
 * @param url - The MCP server URL
 * @param name - Optional server name (defaults to URL-based name)
 * @returns McpServerConfig object for HTTP-based servers
 *
 * @example
 * ```typescript
 * const config = urlToMcpServerConfig('https://api.example.com/mcp');
 * // Result: { name: 'api.example.com', url: 'https://api.example.com/mcp' }
 *
 * const namedConfig = urlToMcpServerConfig('http://localhost:3000', 'local-server');
 * // Result: { name: 'local-server', url: 'http://localhost:3000' }
 * ```
 */
export function urlToMcpServerConfig(
  url: string,
  name?: string,
): McpServerConfig {
  if (!name) {
    // Generate a name from the URL hostname
    try {
      const urlObj = new URL(url);
      name = urlObj.hostname;
    } catch {
      // Fallback for invalid URLs
      name = url.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
    }
  }

  return {
    name,
    url,
  };
}
