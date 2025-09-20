/**
 * Tests for MCP Error Classes
 *
 * Comprehensive test suite for MCP error handling including base error class,
 * specific error types, error codes, and error creation utilities.
 */

import { McpError } from "../mcpError";
import { McpConnectionError } from "../mcpConnectionError";
import { McpCapabilityError } from "../mcpCapabilityError";
import { McpToolError } from "../mcpToolError";
import { MCP_ERROR_CODES } from "../mcpErrorCodes";
import { createMcpError } from "../createMcpError";

describe("McpError", () => {
  it("should extend BridgeError with MCP-specific properties", () => {
    const error = new McpError("Test error", "TEST_CODE", { key: "value" });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("McpError");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.context).toEqual({ key: "value" });
  });

  it("should serialize to JSON correctly", () => {
    const error = new McpError("Test error", "TEST_CODE", { key: "value" });
    const json = error.toJSON();

    expect(json).toEqual({
      name: "McpError",
      message: "Test error",
      code: "TEST_CODE",
      context: { key: "value" },
      stack: expect.any(String),
    });
  });

  it("should work without context", () => {
    const error = new McpError("Test error", "TEST_CODE");

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.context).toBeUndefined();
  });
});

describe("McpConnectionError", () => {
  it("should use connection failed error code by default", () => {
    const error = new McpConnectionError("Connection failed");

    expect(error.code).toBe(MCP_ERROR_CODES.CONNECTION_FAILED);
    expect(error.message).toBe("Connection failed");
  });

  it("should create timeout errors with proper context", () => {
    const error = McpConnectionError.timeout("http://localhost:3000", 5000);

    expect(error.message).toBe(
      "Connection to MCP server timed out after 5000ms",
    );
    expect(error.context?.errorType).toBe("timeout");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
    expect(error.context?.timeoutMs).toBe(5000);
    expect(error.context?.code).toBe(MCP_ERROR_CODES.CONNECTION_TIMEOUT);
  });

  it("should create refused errors with optional reason", () => {
    const errorWithReason = McpConnectionError.refused(
      "http://localhost:3000",
      "Port not open",
    );
    const errorWithoutReason = McpConnectionError.refused(
      "http://localhost:3000",
    );

    expect(errorWithReason.message).toBe(
      "Connection to MCP server refused: Port not open",
    );
    expect(errorWithoutReason.message).toBe("Connection to MCP server refused");
    expect(errorWithReason.context?.reason).toBe("Port not open");
    expect(errorWithoutReason.context?.reason).toBeUndefined();
  });

  it("should create connection lost errors", () => {
    const error = McpConnectionError.lost("http://localhost:3000");

    expect(error.message).toBe("Lost connection to MCP server");
    expect(error.context?.errorType).toBe("lost");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.CONNECTION_LOST);
  });

  it("should create reconnection failed errors", () => {
    const error = McpConnectionError.reconnectionFailed(
      "http://localhost:3000",
      3,
    );

    expect(error.message).toBe(
      "Failed to reconnect to MCP server after 3 attempts",
    );
    expect(error.context?.errorType).toBe("reconnectionFailed");
    expect(error.context?.attempts).toBe(3);
    expect(error.context?.code).toBe(MCP_ERROR_CODES.RECONNECTION_FAILED);
  });
});

describe("McpCapabilityError", () => {
  it("should use capability negotiation failed error code by default", () => {
    const error = new McpCapabilityError("Capability negotiation failed");

    expect(error.code).toBe(MCP_ERROR_CODES.CAPABILITY_NEGOTIATION_FAILED);
    expect(error.message).toBe("Capability negotiation failed");
  });

  it("should create prompts not supported errors", () => {
    const error = McpCapabilityError.promptsNotSupported(
      "http://localhost:3000",
    );

    expect(error.message).toBe(
      "MCP server advertises prompts capability which is not supported. This client only supports tools.",
    );
    expect(error.context?.errorType).toBe("promptsNotSupported");
    expect(error.context?.rejectedCapability).toBe("prompts");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.PROMPTS_NOT_SUPPORTED);
  });

  it("should create resources not supported errors", () => {
    const error = McpCapabilityError.resourcesNotSupported(
      "http://localhost:3000",
    );

    expect(error.message).toBe(
      "MCP server advertises resources capability which is not supported. This client only supports tools.",
    );
    expect(error.context?.errorType).toBe("resourcesNotSupported");
    expect(error.context?.rejectedCapability).toBe("resources");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.RESOURCES_NOT_SUPPORTED);
  });

  it("should create unsupported capabilities errors", () => {
    const error = McpCapabilityError.unsupportedCapabilities(
      "http://localhost:3000",
      ["prompts", "resources"],
    );

    expect(error.message).toBe(
      "MCP server advertises unsupported capabilities: prompts, resources. This client only supports tools.",
    );
    expect(error.context?.errorType).toBe("unsupportedCapabilities");
    expect(error.context?.rejectedCapabilities).toEqual([
      "prompts",
      "resources",
    ]);
    expect(error.context?.code).toBe(MCP_ERROR_CODES.UNSUPPORTED_CAPABILITIES);
  });

  it("should create invalid capabilities errors", () => {
    const error = McpCapabilityError.invalidCapabilities(
      "http://localhost:3000",
      "Missing tools field",
    );

    expect(error.message).toBe(
      "MCP server returned invalid capabilities: Missing tools field",
    );
    expect(error.context?.errorType).toBe("invalidCapabilities");
    expect(error.context?.reason).toBe("Missing tools field");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.INVALID_CAPABILITIES);
  });
});

describe("McpToolError", () => {
  it("should use tool execution failed error code by default", () => {
    const error = new McpToolError("Tool execution failed");

    expect(error.code).toBe(MCP_ERROR_CODES.TOOL_EXECUTION_FAILED);
    expect(error.message).toBe("Tool execution failed");
  });

  it("should create discovery failed errors", () => {
    const error = McpToolError.discoveryFailed(
      "http://localhost:3000",
      "Invalid response",
    );

    expect(error.message).toBe(
      "Failed to discover tools from MCP server: Invalid response",
    );
    expect(error.context?.errorType).toBe("discoveryFailed");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
    expect(error.context?.reason).toBe("Invalid response");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.TOOL_DISCOVERY_FAILED);
  });

  it("should create tool not found errors", () => {
    const error = McpToolError.notFound("calculator", "http://localhost:3000");

    expect(error.message).toBe("Tool 'calculator' not found on MCP server");
    expect(error.context?.errorType).toBe("notFound");
    expect(error.context?.toolName).toBe("calculator");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.TOOL_NOT_FOUND);
  });

  it("should create invalid params errors", () => {
    const error = McpToolError.invalidParams(
      "calculator",
      "Missing required parameter 'operation'",
    );

    expect(error.message).toBe(
      "Invalid parameters for tool 'calculator': Missing required parameter 'operation'",
    );
    expect(error.context?.errorType).toBe("invalidParams");
    expect(error.context?.toolName).toBe("calculator");
    expect(error.context?.reason).toBe(
      "Missing required parameter 'operation'",
    );
    expect(error.context?.code).toBe(MCP_ERROR_CODES.TOOL_INVALID_PARAMS);
  });

  it("should create execution failed errors", () => {
    const error = McpToolError.executionFailed(
      "calculator",
      "Division by zero",
    );

    expect(error.message).toBe(
      "Tool 'calculator' execution failed: Division by zero",
    );
    expect(error.context?.errorType).toBe("executionFailed");
    expect(error.context?.toolName).toBe("calculator");
    expect(error.context?.reason).toBe("Division by zero");
    expect(error.context?.code).toBe(MCP_ERROR_CODES.TOOL_EXECUTION_FAILED);
  });
});

describe("MCP_ERROR_CODES", () => {
  it("should contain all expected error codes", () => {
    expect(MCP_ERROR_CODES.CONNECTION_FAILED).toBe("MCP_CONNECTION_FAILED");
    expect(MCP_ERROR_CODES.CONNECTION_TIMEOUT).toBe("MCP_CONNECTION_TIMEOUT");
    expect(MCP_ERROR_CODES.CONNECTION_LOST).toBe("MCP_CONNECTION_LOST");
    expect(MCP_ERROR_CODES.CONNECTION_REFUSED).toBe("MCP_CONNECTION_REFUSED");
    expect(MCP_ERROR_CODES.RECONNECTION_FAILED).toBe("MCP_RECONNECTION_FAILED");

    expect(MCP_ERROR_CODES.CAPABILITY_NEGOTIATION_FAILED).toBe(
      "MCP_CAPABILITY_NEGOTIATION_FAILED",
    );
    expect(MCP_ERROR_CODES.UNSUPPORTED_CAPABILITIES).toBe(
      "MCP_UNSUPPORTED_CAPABILITIES",
    );
    expect(MCP_ERROR_CODES.INVALID_CAPABILITIES).toBe(
      "MCP_INVALID_CAPABILITIES",
    );
    expect(MCP_ERROR_CODES.PROMPTS_NOT_SUPPORTED).toBe(
      "MCP_PROMPTS_NOT_SUPPORTED",
    );
    expect(MCP_ERROR_CODES.RESOURCES_NOT_SUPPORTED).toBe(
      "MCP_RESOURCES_NOT_SUPPORTED",
    );

    expect(MCP_ERROR_CODES.TOOL_DISCOVERY_FAILED).toBe(
      "MCP_TOOL_DISCOVERY_FAILED",
    );
    expect(MCP_ERROR_CODES.TOOL_EXECUTION_FAILED).toBe(
      "MCP_TOOL_EXECUTION_FAILED",
    );
    expect(MCP_ERROR_CODES.TOOL_NOT_FOUND).toBe("MCP_TOOL_NOT_FOUND");
    expect(MCP_ERROR_CODES.TOOL_INVALID_PARAMS).toBe("MCP_TOOL_INVALID_PARAMS");

    expect(MCP_ERROR_CODES.PROTOCOL_ERROR).toBe("MCP_PROTOCOL_ERROR");
    expect(MCP_ERROR_CODES.INVALID_RESPONSE).toBe("MCP_INVALID_RESPONSE");
    expect(MCP_ERROR_CODES.JSONRPC_ERROR).toBe("MCP_JSONRPC_ERROR");

    expect(MCP_ERROR_CODES.UNKNOWN_ERROR).toBe("MCP_UNKNOWN_ERROR");
  });
});

describe("createMcpError", () => {
  it("should create connection errors", () => {
    const error = createMcpError.connection("Connection failed", {
      serverUrl: "http://localhost:3000",
    });

    expect(error).toBeInstanceOf(McpConnectionError);
    expect(error.message).toBe("Connection failed");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
  });

  it("should create capability errors", () => {
    const error = createMcpError.capability("Invalid capabilities", {
      serverUrl: "http://localhost:3000",
    });

    expect(error).toBeInstanceOf(McpCapabilityError);
    expect(error.message).toBe("Invalid capabilities");
    expect(error.context?.serverUrl).toBe("http://localhost:3000");
  });

  it("should create tool errors", () => {
    const error = createMcpError.tool("Tool failed", {
      toolName: "calculator",
    });

    expect(error).toBeInstanceOf(McpToolError);
    expect(error.message).toBe("Tool failed");
    expect(error.context?.toolName).toBe("calculator");
  });

  it("should create protocol errors", () => {
    const error = createMcpError.protocol("Protocol violation", {
      details: "Invalid JSON-RPC",
    });

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(MCP_ERROR_CODES.PROTOCOL_ERROR);
    expect(error.message).toBe("Protocol violation");
    expect(error.context?.details).toBe("Invalid JSON-RPC");
  });

  it("should create JSON-RPC errors", () => {
    const error = createMcpError.jsonrpc("Method not found", -32601, {
      method: "unknown",
    });

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(MCP_ERROR_CODES.JSONRPC_ERROR);
    expect(error.message).toBe("Method not found");
    expect(error.context?.jsonrpcCode).toBe(-32601);
    expect(error.context?.data).toEqual({ method: "unknown" });
  });
});
