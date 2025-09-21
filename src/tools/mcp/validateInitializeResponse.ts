/**
 * Validate MCP Initialize Response
 *
 * Validates the complete initialize response structure from an MCP server.
 * Performs comprehensive validation of the MCP initialize response including
 * capability validation and required field checks.
 *
 * @example
 * ```typescript
 * const response = await connection.call('initialize', request.params);
 * validateInitializeResponse('http://localhost:3000', response);
 * ```
 */

import { McpCapabilityError } from "./mcpCapabilityError";
import { validateToolsOnlyCapabilities } from "./mcpCapabilities";
import type { McpInitializeResponse } from "./mcpInitializeResponse";

/**
 * Validates the complete initialize response structure.
 *
 * Performs comprehensive validation of the MCP initialize response including
 * capability validation and required field checks.
 *
 * @param serverUrl - URL of the MCP server for error context
 * @param response - Complete initialize response from server
 * @throws {McpCapabilityError} When response is invalid or capabilities are unsupported
 *
 * @example
 * ```typescript
 * const response = await connection.call('initialize', request.params);
 * validateInitializeResponse('http://localhost:3000', response);
 * ```
 */
export function validateInitializeResponse(
  serverUrl: string,
  response: McpInitializeResponse,
): void {
  // Validate response structure
  if (!response.capabilities) {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Initialize response missing capabilities field",
    );
  }

  if (!response.serverInfo) {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Initialize response missing serverInfo field",
    );
  }

  if (!response.protocolVersion) {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Initialize response missing protocolVersion field",
    );
  }

  // Validate capabilities
  validateToolsOnlyCapabilities(serverUrl, response.capabilities);

  // Note: Protocol version validation could be added here if needed
  // For now, we accept any version the server declares
}
