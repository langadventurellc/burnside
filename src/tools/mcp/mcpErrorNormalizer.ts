/**
 * MCP Error Normalizer
 *
 * Implements error normalization for MCP-specific errors following the established
 * provider pattern. Maps JSON-RPC errors to appropriate Bridge error types with
 * comprehensive context preservation and error sanitization.
 *
 * @example
 * ```typescript
 * const normalizer = new McpErrorNormalizer();
 * const error = normalizer.normalizeConnectionError(
 *   new Error("ECONNREFUSED"),
 *   "http://localhost:3000"
 * );
 * ```
 */

import { ErrorNormalizer } from "../../core/errors/errorNormalizer";
import { ErrorContext } from "../../core/errors/errorContext";
import { NormalizedError } from "../../core/errors/normalizedError";
import { TransportError } from "../../core/errors/transportError";
import { ProviderError } from "../../core/errors/providerError";
import { ToolError } from "../../core/errors/toolError";
import { BridgeError } from "../../core/errors/bridgeError";
import {
  MCP_ERROR_CODES,
  JSONRPC_TO_BRIDGE_ERROR_TYPE,
  JSONRPC_ERROR_DESCRIPTIONS,
} from "./mcpErrorCodes";

/**
 * JSON-RPC error object structure
 */
interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP error context for enhanced error information
 */
interface McpErrorContext extends Record<string, unknown> {
  serverName?: string;
  serverUrl?: string;
  protocolVersion?: string;
  requestMethod?: string;
  toolName?: string;
  connectionState?: "connecting" | "connected" | "disconnected" | "failed";
}

export class McpErrorNormalizer implements ErrorNormalizer {
  /**
   * Normalize a provider-specific error into a standardized format
   */
  normalize(providerError: unknown, context: ErrorContext): NormalizedError {
    // Handle JSON-RPC errors
    if (this.isJsonRpcError(providerError)) {
      return this.normalizeJsonRpcError(providerError, context);
    }

    // Handle connection errors
    if (this.isConnectionError(providerError)) {
      return this.normalizeConnectionErrorFromUnknown(providerError, context);
    }

    // Handle tool errors
    if (this.isToolError(providerError)) {
      return this.normalizeToolErrorFromUnknown(providerError, context);
    }

    // Fallback to generic MCP error
    return {
      type: "BridgeError",
      message: this.sanitizeErrorMessage(String(providerError)),
      code: MCP_ERROR_CODES.UNKNOWN_ERROR,
      context: this.sanitizeContext(context),
    };
  }

  /**
   * Normalize connection errors to TransportError with MCP context
   */
  static normalizeConnectionError(
    error: Error,
    serverUrl: string,
    mcpContext?: McpErrorContext,
  ): TransportError {
    const sanitizedUrl = McpErrorNormalizer.sanitizeUrl(serverUrl);
    const message = McpErrorNormalizer.sanitizeErrorMessage(error.message);

    return new TransportError(`MCP connection failed: ${message}`, {
      serverUrl: sanitizedUrl,
      originalError: error.name,
      ...McpErrorNormalizer.sanitizeContext(mcpContext),
    });
  }

  /**
   * Normalize JSON-RPC errors to appropriate Bridge error types
   */
  static normalizeJsonRpcError(
    jsonRpcError: JsonRpcError,
    context: string,
    mcpContext?: McpErrorContext,
  ): BridgeError {
    const errorType =
      JSONRPC_TO_BRIDGE_ERROR_TYPE[
        jsonRpcError.code as keyof typeof JSONRPC_TO_BRIDGE_ERROR_TYPE
      ] || "ProviderError";
    const description =
      JSONRPC_ERROR_DESCRIPTIONS[
        jsonRpcError.code as keyof typeof JSONRPC_ERROR_DESCRIPTIONS
      ] || jsonRpcError.message;
    const sanitizedMessage =
      McpErrorNormalizer.sanitizeErrorMessage(description);

    const errorContext = {
      jsonRpcCode: jsonRpcError.code,
      context,
      ...McpErrorNormalizer.sanitizeContext(mcpContext),
    };

    switch (errorType) {
      case "TransportError":
        return new TransportError(sanitizedMessage, errorContext);
      case "ToolError":
        return new ToolError(sanitizedMessage, errorContext);
      case "ProviderError":
      default:
        return new ProviderError(sanitizedMessage, errorContext);
    }
  }

  /**
   * Normalize tool execution errors to ToolError with execution context
   */
  static normalizeToolExecutionError(
    error: unknown,
    toolName: string,
    serverName: string,
    mcpContext?: McpErrorContext,
  ): ToolError {
    const sanitizedToolName = McpErrorNormalizer.sanitizeString(toolName);
    const sanitizedServerName = McpErrorNormalizer.sanitizeString(serverName);
    const message = McpErrorNormalizer.sanitizeErrorMessage(String(error));

    return new ToolError(
      `MCP tool "${sanitizedToolName}" execution failed: ${message}`,
      {
        toolName: sanitizedToolName,
        serverName: sanitizedServerName,
        ...McpErrorNormalizer.sanitizeContext(mcpContext),
      },
    );
  }

  /**
   * Normalize capability errors to ProviderError with negotiation context
   */
  static normalizeCapabilityError(
    capabilities: unknown,
    rejectedFeatures: string[],
    mcpContext?: McpErrorContext,
  ): ProviderError {
    const sanitizedFeatures = rejectedFeatures.map((f) =>
      McpErrorNormalizer.sanitizeString(f),
    );

    return new ProviderError(
      `MCP capability negotiation failed: rejected features ${sanitizedFeatures.join(", ")}`,
      {
        rejectedFeatures: sanitizedFeatures,
        ...McpErrorNormalizer.sanitizeContext(mcpContext),
      },
    );
  }

  /**
   * Normalize schema translation errors to BridgeError
   */
  static normalizeSchemaError(
    originalSchema: unknown,
    context: string,
    mcpContext?: McpErrorContext,
  ): BridgeError {
    const sanitizedContext = McpErrorNormalizer.sanitizeString(context);

    return new BridgeError(
      `MCP schema translation failed: ${sanitizedContext}`,
      MCP_ERROR_CODES.INVALID_RESPONSE,
      {
        translationContext: sanitizedContext,
        ...McpErrorNormalizer.sanitizeContext(mcpContext),
      },
    );
  }

  private normalizeJsonRpcError(
    jsonRpcError: JsonRpcError,
    context: ErrorContext,
  ): NormalizedError {
    const errorType =
      JSONRPC_TO_BRIDGE_ERROR_TYPE[
        jsonRpcError.code as keyof typeof JSONRPC_TO_BRIDGE_ERROR_TYPE
      ] || "ProviderError";
    const description =
      JSONRPC_ERROR_DESCRIPTIONS[
        jsonRpcError.code as keyof typeof JSONRPC_ERROR_DESCRIPTIONS
      ] || jsonRpcError.message;
    const sanitizedMessage =
      McpErrorNormalizer.sanitizeErrorMessage(description);

    return {
      type: errorType,
      message: sanitizedMessage,
      code: MCP_ERROR_CODES.JSONRPC_ERROR,
      context: {
        jsonRpcCode: jsonRpcError.code,
        ...this.sanitizeContext(context),
      },
    };
  }

  private normalizeConnectionErrorFromUnknown(
    error: unknown,
    context: ErrorContext,
  ): NormalizedError {
    const message = McpErrorNormalizer.sanitizeErrorMessage(String(error));

    return {
      type: "TransportError",
      message: `MCP connection failed: ${message}`,
      code: MCP_ERROR_CODES.CONNECTION_FAILED,
      context: this.sanitizeContext(context),
    };
  }

  private normalizeToolErrorFromUnknown(
    error: unknown,
    context: ErrorContext,
  ): NormalizedError {
    const message = McpErrorNormalizer.sanitizeErrorMessage(String(error));

    return {
      type: "ToolError",
      message: `MCP tool execution failed: ${message}`,
      code: MCP_ERROR_CODES.TOOL_EXECUTION_FAILED,
      context: this.sanitizeContext(context),
    };
  }

  private isJsonRpcError(error: unknown): error is JsonRpcError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error &&
      typeof (error as JsonRpcError).code === "number" &&
      typeof (error as JsonRpcError).message === "string"
    );
  }

  private isConnectionError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const errorString =
      error instanceof Error ? error.message : JSON.stringify(error);
    return (
      errorString.includes("ECONNREFUSED") ||
      errorString.includes("ENOTFOUND") ||
      errorString.includes("ETIMEDOUT") ||
      errorString.includes("ECONNRESET")
    );
  }

  private isToolError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const errorString =
      error instanceof Error ? error.message : JSON.stringify(error);
    return (
      errorString.includes("tool") ||
      errorString.includes("execution") ||
      errorString.includes("parameter")
    );
  }

  /**
   * Sanitize error message to prevent information leakage
   */
  private static sanitizeErrorMessage(message: string): string {
    // Remove file paths, IP addresses, and other sensitive information
    return message
      .replace(/\/[^\s]+/g, "[PATH]") // Remove file paths
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]") // Remove IP addresses
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL]",
      ) // Remove emails
      .slice(0, 500); // Limit message length
  }

  private sanitizeErrorMessage(message: string): string {
    return McpErrorNormalizer.sanitizeErrorMessage(message);
  }

  /**
   * Sanitize URL to prevent information leakage while preserving useful debugging info
   */
  private static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Keep protocol and hostname, remove sensitive parts
      return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
    } catch {
      return "[INVALID_URL]";
    }
  }

  /**
   * Sanitize string to prevent information leakage
   */
  private static sanitizeString(value: string): string {
    return value.slice(0, 100); // Limit string length
  }

  /**
   * Sanitize context object to prevent information leakage
   */
  private static sanitizeContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!context) return {};

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === "string") {
        sanitized[key] = McpErrorNormalizer.sanitizeString(value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      } else {
        sanitized[key] = "[OBJECT]";
      }
    }
    return sanitized;
  }

  private sanitizeContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> {
    return McpErrorNormalizer.sanitizeContext(context);
  }
}
