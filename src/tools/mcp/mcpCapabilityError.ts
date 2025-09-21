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

import { ProviderError } from "../../core/errors/providerError";
import { MCP_ERROR_CODES } from "./mcpErrorCodes";
import { getErrorSeverity } from "./getErrorSeverity";

/**
 * Error thrown when MCP capability negotiation fails.
 *
 * Used when servers advertise unsupported capabilities (prompts/resources),
 * capability exchange fails, or server capabilities are invalid.
 * This enforces the tools-only scope limitation. Extends ProviderError for proper error taxonomy integration.
 */
export class McpCapabilityError extends ProviderError {
  constructor(message: string, context?: Record<string, unknown>) {
    // Use the code from context if available, otherwise default
    const errorCode =
      (context?.code as string) ||
      MCP_ERROR_CODES.CAPABILITY_NEGOTIATION_FAILED;
    super(message, { ...context, code: errorCode });
    // Override the code to be MCP-specific while maintaining ProviderError taxonomy
    Object.defineProperty(this, "code", {
      value: errorCode,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  /**
   * Get capability mismatch details for debugging
   */
  getCapabilityMismatch(): {
    rejectedCapability?: string;
    rejectedCapabilities?: string[];
    serverUrl?: string;
    recoverable: boolean;
  } {
    const errorCode =
      (this.context?.code as string) ||
      MCP_ERROR_CODES.CAPABILITY_NEGOTIATION_FAILED;
    const severity = getErrorSeverity(errorCode);

    return {
      rejectedCapability: this.context?.rejectedCapability as string,
      rejectedCapabilities: this.context?.rejectedCapabilities as string[],
      serverUrl: this.context?.serverUrl as string,
      recoverable: severity === "recoverable" || severity === "temporary",
    };
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
