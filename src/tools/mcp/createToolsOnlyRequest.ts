/**
 * Create Tools-Only MCP Request
 *
 * Creates a tools-only client capability request for MCP initialize.
 * Generates the client capabilities object that explicitly declares support
 * for tools only, with prompts and resources marked as not supported.
 *
 * @example
 * ```typescript
 * const request = createToolsOnlyRequest('MyApp', '1.0.0');
 * const response = await connection.call('initialize', request.params);
 * ```
 */

import type { McpInitializeRequest } from "./mcpInitializeRequest";

/**
 * Creates a tools-only client capability request for MCP initialize.
 *
 * Generates the client capabilities object that explicitly declares support
 * for tools only, with prompts and resources marked as not supported.
 *
 * @param clientName - Name of the client application
 * @param clientVersion - Version of the client application
 * @returns Complete initialize request structure
 *
 * @example
 * ```typescript
 * const request = createToolsOnlyRequest('MyApp', '1.0.0');
 * const response = await connection.call('initialize', request.params);
 * ```
 */
export function createToolsOnlyRequest(
  clientName: string,
  clientVersion: string,
): McpInitializeRequest {
  return {
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: {
          supported: true,
        },
        prompts: {
          supported: false,
        },
        resources: {
          supported: false,
        },
      },
      clientInfo: {
        name: clientName,
        version: clientVersion,
      },
    },
  };
}
