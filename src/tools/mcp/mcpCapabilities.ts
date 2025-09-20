/**
 * MCP Capability Validation
 *
 * Main validation function for MCP capability negotiation with tools-only
 * scope enforcement. Validates that servers only advertise supported
 * capabilities and rejects prompts/resources.
 *
 * @example
 * ```typescript
 * const serverCaps = { tools: { supported: true } };
 * validateToolsOnlyCapabilities('http://localhost:3000', serverCaps);
 * ```
 */

import { McpCapabilityError } from "./mcpCapabilityError";
import type { McpServerCapabilities } from "./mcpServerCapabilities";

/**
 * Validates server capabilities to ensure tools-only compliance.
 *
 * Checks that the server capabilities response adheres to the tools-only
 * constraint by rejecting servers that advertise prompts or resources.
 * Throws specific capability errors for unsupported features.
 *
 * @param serverUrl - URL of the MCP server for error context
 * @param capabilities - Server capabilities from initialize response
 * @throws {McpCapabilityError} When server advertises unsupported capabilities
 *
 * @example
 * ```typescript
 * const response = await connection.call('initialize', request.params);
 * validateToolsOnlyCapabilities('http://localhost:3000', response.capabilities);
 * ```
 */
export function validateToolsOnlyCapabilities(
  serverUrl: string,
  capabilities: McpServerCapabilities,
): void {
  // Check for prompts capability
  if (capabilities.prompts?.supported === true) {
    throw McpCapabilityError.promptsNotSupported(serverUrl);
  }

  // Check for resources capability
  if (capabilities.resources?.supported === true) {
    throw McpCapabilityError.resourcesNotSupported(serverUrl);
  }

  // Check for other unsupported capabilities
  const unsupportedCaps: string[] = [];
  for (const [capName, capValue] of Object.entries(capabilities)) {
    // Skip tools (supported) and known capabilities we've already checked
    if (
      capName === "tools" ||
      capName === "prompts" ||
      capName === "resources"
    ) {
      continue;
    }

    // Check if this capability is enabled
    if (
      typeof capValue === "object" &&
      capValue !== null &&
      "supported" in capValue &&
      capValue.supported === true
    ) {
      unsupportedCaps.push(capName);
    }
  }

  // Throw error for any additional unsupported capabilities
  if (unsupportedCaps.length > 0) {
    throw McpCapabilityError.unsupportedCapabilities(
      serverUrl,
      unsupportedCaps,
    );
  }

  // Validate that tools capability exists and is properly formed
  if (!capabilities.tools) {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Server does not declare tools capability",
    );
  }

  if (typeof capabilities.tools.supported !== "boolean") {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Server tools capability has invalid format",
    );
  }

  // Server must support tools for this client to be useful
  if (capabilities.tools.supported !== true) {
    throw McpCapabilityError.invalidCapabilities(
      serverUrl,
      "Server does not support tools",
    );
  }
}
