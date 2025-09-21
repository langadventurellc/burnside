/**
 * Tests for MCP Capability Negotiation
 *
 * Comprehensive test suite for MCP capability negotiation including
 * capability validation, tools-only enforcement, and request/response creation.
 */

import { validateToolsOnlyCapabilities } from "../mcpCapabilities";
import { createToolsOnlyRequest } from "../createToolsOnlyRequest";
import { validateInitializeResponse } from "../validateInitializeResponse";
import { McpCapabilityError } from "../mcpCapabilityError";
import { MCP_ERROR_CODES } from "../mcpErrorCodes";
import type { McpServerCapabilities } from "../mcpServerCapabilities";
import type { McpInitializeResponse } from "../mcpInitializeResponse";

describe("validateToolsOnlyCapabilities", () => {
  const serverUrl = "http://localhost:3000";

  it("should accept server with only tools capability", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).not.toThrow();
  });

  it("should accept server with tools and explicitly disabled prompts/resources", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
      prompts: { supported: false },
      resources: { supported: false },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).not.toThrow();
  });

  it("should reject server advertising prompts capability", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
      prompts: { supported: true },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.context?.code).toBe(MCP_ERROR_CODES.PROMPTS_NOT_SUPPORTED);
        expect(error.context?.rejectedCapability).toBe("prompts");
      }
    }
  });

  it("should reject server advertising resources capability", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
      resources: { supported: true },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.context?.code).toBe(
          MCP_ERROR_CODES.RESOURCES_NOT_SUPPORTED,
        );
        expect(error.context?.rejectedCapability).toBe("resources");
      }
    }
  });

  it("should reject server advertising multiple unsupported capabilities", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
      customCapability: { supported: true },
      anotherCapability: { supported: true },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.context?.code).toBe(
          MCP_ERROR_CODES.UNSUPPORTED_CAPABILITIES,
        );
        expect(error.context?.rejectedCapabilities).toEqual([
          "customCapability",
          "anotherCapability",
        ]);
      }
    }
  });

  it("should reject server without tools capability", () => {
    const capabilities: McpServerCapabilities = {};

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain(
          "Server does not declare tools capability",
        );
        expect(error.context?.code).toBe(MCP_ERROR_CODES.INVALID_CAPABILITIES);
      }
    }
  });

  it("should reject server with malformed tools capability", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: "yes" as any }, // Invalid type
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain(
          "Server tools capability has invalid format",
        );
        expect(error.context?.code).toBe(MCP_ERROR_CODES.INVALID_CAPABILITIES);
      }
    }
  });

  it("should reject server with tools capability disabled", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: false },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).toThrow(McpCapabilityError);

    try {
      validateToolsOnlyCapabilities(serverUrl, capabilities);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain("Server does not support tools");
        expect(error.context?.code).toBe(MCP_ERROR_CODES.INVALID_CAPABILITIES);
      }
    }
  });

  it("should ignore capabilities that are not objects with supported property", () => {
    const capabilities: McpServerCapabilities = {
      tools: { supported: true },
      stringCapability: "not an object",
      numberCapability: 42,
      nullCapability: null,
      objectWithoutSupported: { other: "property" },
    };

    expect(() =>
      validateToolsOnlyCapabilities(serverUrl, capabilities),
    ).not.toThrow();
  });
});

describe("createToolsOnlyRequest", () => {
  it("should create valid tools-only initialize request", () => {
    const request = createToolsOnlyRequest("TestClient", "1.0.0");

    expect(request.method).toBe("initialize");
    expect(request.params.protocolVersion).toBe("2025-06-18");
    expect(request.params.clientInfo.name).toBe("TestClient");
    expect(request.params.clientInfo.version).toBe("1.0.0");
    expect(request.params.capabilities.tools?.supported).toBe(true);
    expect(request.params.capabilities.prompts?.supported).toBe(false);
    expect(request.params.capabilities.resources?.supported).toBe(false);
  });

  it("should handle different client names and versions", () => {
    const request = createToolsOnlyRequest("MyMcpClient", "2.1.0");

    expect(request.params.clientInfo.name).toBe("MyMcpClient");
    expect(request.params.clientInfo.version).toBe("2.1.0");
  });
});

describe("validateInitializeResponse", () => {
  const serverUrl = "http://localhost:3000";

  it("should accept valid response with tools-only capabilities", () => {
    const response: McpInitializeResponse = {
      capabilities: {
        tools: { supported: true },
      },
      serverInfo: {
        name: "TestServer",
        version: "1.0.0",
      },
      protocolVersion: "2025-06-18",
    };

    expect(() => validateInitializeResponse(serverUrl, response)).not.toThrow();
  });

  it("should reject response missing capabilities field", () => {
    const response = {
      serverInfo: {
        name: "TestServer",
        version: "1.0.0",
      },
      protocolVersion: "2025-06-18",
    } as unknown as McpInitializeResponse;

    expect(() => validateInitializeResponse(serverUrl, response)).toThrow(
      McpCapabilityError,
    );

    try {
      validateInitializeResponse(serverUrl, response);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain(
          "Initialize response missing capabilities field",
        );
      }
    }
  });

  it("should reject response missing serverInfo field", () => {
    const response = {
      capabilities: {
        tools: { supported: true },
      },
      protocolVersion: "2025-06-18",
    } as unknown as McpInitializeResponse;

    expect(() => validateInitializeResponse(serverUrl, response)).toThrow(
      McpCapabilityError,
    );

    try {
      validateInitializeResponse(serverUrl, response);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain(
          "Initialize response missing serverInfo field",
        );
      }
    }
  });

  it("should reject response missing protocolVersion field", () => {
    const response = {
      capabilities: {
        tools: { supported: true },
      },
      serverInfo: {
        name: "TestServer",
        version: "1.0.0",
      },
    } as unknown as McpInitializeResponse;

    expect(() => validateInitializeResponse(serverUrl, response)).toThrow(
      McpCapabilityError,
    );

    try {
      validateInitializeResponse(serverUrl, response);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.message).toContain(
          "Initialize response missing protocolVersion field",
        );
      }
    }
  });

  it("should reject response with invalid capabilities", () => {
    const response: McpInitializeResponse = {
      capabilities: {
        tools: { supported: true },
        prompts: { supported: true }, // This should be rejected
      },
      serverInfo: {
        name: "TestServer",
        version: "1.0.0",
      },
      protocolVersion: "2025-06-18",
    };

    expect(() => validateInitializeResponse(serverUrl, response)).toThrow(
      McpCapabilityError,
    );

    try {
      validateInitializeResponse(serverUrl, response);
    } catch (error) {
      expect(error).toBeInstanceOf(McpCapabilityError);
      if (error instanceof McpCapabilityError) {
        expect(error.context?.code).toBe(MCP_ERROR_CODES.PROMPTS_NOT_SUPPORTED);
      }
    }
  });

  it("should accept response with disabled prompts and resources", () => {
    const response: McpInitializeResponse = {
      capabilities: {
        tools: { supported: true },
        prompts: { supported: false },
        resources: { supported: false },
      },
      serverInfo: {
        name: "TestServer",
        version: "1.0.0",
      },
      protocolVersion: "2025-06-18",
    };

    expect(() => validateInitializeResponse(serverUrl, response)).not.toThrow();
  });
});
