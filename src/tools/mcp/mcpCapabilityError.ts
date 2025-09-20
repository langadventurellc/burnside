/**
 * MCP Capability Error
 *
 * Error thrown when MCP capability negotiation fails including servers
 * advertising unsupported capabilities (prompts/resources), capability
 * exchange failures, or invalid server capabilities. This enforces the
 * tools-only scope limitation.
 *
 * @example Rejecting prompts
 * ```typescript
 * const error = McpCapabilityError.promptsNotSupported('http://localhost:3000');
 * throw error;
 * ```
 */

import { McpError } from "./mcpError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";

/**
 * Error thrown when MCP capability negotiation fails.
 *
 * Used when servers advertise unsupported capabilities (prompts/resources),
 * capability exchange fails, or server capabilities are invalid.
 * This enforces the tools-only scope limitation.
 */
export class McpCapabilityError extends McpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, MCP_ERROR_CODES.CAPABILITY_NEGOTIATION_FAILED, context);
  }

  /**
   * Create error for servers advertising prompts capability
   */
  static promptsNotSupported(serverUrl: string): McpCapabilityError {
    return new McpCapabilityError(
      `MCP server advertises prompts capability which is not supported. This client only supports tools.`,
      {
        errorType: "promptsNotSupported",
        serverUrl,
        rejectedCapability: "prompts",
        code: MCP_ERROR_CODES.PROMPTS_NOT_SUPPORTED,
      },
    );
  }

  /**
   * Create error for servers advertising resources capability
   */
  static resourcesNotSupported(serverUrl: string): McpCapabilityError {
    return new McpCapabilityError(
      `MCP server advertises resources capability which is not supported. This client only supports tools.`,
      {
        errorType: "resourcesNotSupported",
        serverUrl,
        rejectedCapability: "resources",
        code: MCP_ERROR_CODES.RESOURCES_NOT_SUPPORTED,
      },
    );
  }

  /**
   * Create error for unsupported capabilities
   */
  static unsupportedCapabilities(
    serverUrl: string,
    unsupportedCaps: string[],
  ): McpCapabilityError {
    return new McpCapabilityError(
      `MCP server advertises unsupported capabilities: ${unsupportedCaps.join(", ")}. This client only supports tools.`,
      {
        errorType: "unsupportedCapabilities",
        serverUrl,
        rejectedCapabilities: unsupportedCaps,
        code: MCP_ERROR_CODES.UNSUPPORTED_CAPABILITIES,
      },
    );
  }

  /**
   * Create error for invalid capability responses
   */
  static invalidCapabilities(
    serverUrl: string,
    reason: string,
  ): McpCapabilityError {
    return new McpCapabilityError(
      `MCP server returned invalid capabilities: ${reason}`,
      {
        errorType: "invalidCapabilities",
        serverUrl,
        reason,
        code: MCP_ERROR_CODES.INVALID_CAPABILITIES,
      },
    );
  }
}
