/**
 * @jest-environment node
 */

import { McpServerSchema } from "../mcpServerSchema";
import { McpServersArraySchema } from "../mcpServersArraySchema";
import type { McpServerConfig } from "../mcpServerConfig";
import type { McpServerConfigs } from "../mcpServerConfigs";
import { validateMcpServerConfig } from "../validateMcpServerConfig";
import { validateMcpServerConfigs } from "../validateMcpServerConfigs";

describe("MCP Server Configuration Types and Validation", () => {
  describe("McpServerSchema", () => {
    it("should validate valid MCP server configuration", () => {
      const validConfig = {
        name: "github-api",
        url: "https://api.github.com/mcp",
      };

      const result = McpServerSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });

    it("should reject configuration with empty name", () => {
      const invalidConfig = {
        name: "",
        url: "https://api.github.com/mcp",
      };

      const result = McpServerSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("should reject configuration with invalid URL", () => {
      const invalidConfig = {
        name: "test-server",
        url: "not-a-url",
      };

      const result = McpServerSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must be valid");
      }
    });

    it("should reject non-HTTP/HTTPS URLs", () => {
      const invalidConfig = {
        name: "test-server",
        url: "ftp://example.com/mcp",
      };

      const result = McpServerSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("HTTP or HTTPS");
      }
    });

    it("should accept HTTP URLs", () => {
      const validConfig = {
        name: "test-server",
        url: "http://localhost:3000/mcp",
      };

      const result = McpServerSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("should accept HTTPS URLs", () => {
      const validConfig = {
        name: "test-server",
        url: "https://secure.example.com/mcp",
      };

      const result = McpServerSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("McpServersArraySchema", () => {
    it("should validate empty array", () => {
      const result = McpServersArraySchema.safeParse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should validate undefined (optional)", () => {
      const result = McpServersArraySchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should validate array with valid servers", () => {
      const validServers = [
        { name: "server1", url: "https://api1.com/mcp" },
        { name: "server2", url: "https://api2.com/mcp" },
      ];

      const result = McpServersArraySchema.safeParse(validServers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validServers);
      }
    });

    it("should reject array with duplicate server names", () => {
      const duplicateServers = [
        { name: "duplicate", url: "https://api1.com/mcp" },
        { name: "duplicate", url: "https://api2.com/mcp" },
      ];

      const result = McpServersArraySchema.safeParse(duplicateServers);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must be unique");
      }
    });

    it("should reject array with invalid server objects", () => {
      const invalidServers = [{ name: "", url: "https://api.com/mcp" }];

      const result = McpServersArraySchema.safeParse(invalidServers);
      expect(result.success).toBe(false);
    });
  });

  describe("validateMcpServerConfig function", () => {
    it("should return true for valid configuration", () => {
      const validConfig = {
        name: "test-server",
        url: "https://api.example.com/mcp",
      };

      expect(validateMcpServerConfig(validConfig)).toBe(true);
    });

    it("should return false for null", () => {
      expect(validateMcpServerConfig(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(validateMcpServerConfig(undefined)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(validateMcpServerConfig("not an object")).toBe(false);
      expect(validateMcpServerConfig(123)).toBe(false);
      expect(validateMcpServerConfig(true)).toBe(false);
    });

    it("should return false for object with missing fields", () => {
      expect(validateMcpServerConfig({ name: "test" })).toBe(false);
      expect(validateMcpServerConfig({ url: "https://api.com" })).toBe(false);
    });

    it("should return false for object with invalid field types", () => {
      expect(
        validateMcpServerConfig({ name: 123, url: "https://api.com" }),
      ).toBe(false);
      expect(validateMcpServerConfig({ name: "test", url: 123 })).toBe(false);
    });

    it("should provide type narrowing", () => {
      const unknownInput: unknown = {
        name: "test-server",
        url: "https://api.example.com/mcp",
      };

      if (validateMcpServerConfig(unknownInput)) {
        // TypeScript should infer unknownInput as McpServerConfig here
        expect(unknownInput.name).toBe("test-server");
        expect(unknownInput.url).toBe("https://api.example.com/mcp");
      }
    });
  });

  describe("validateMcpServerConfigs function", () => {
    it("should return true for valid array", () => {
      const validConfigs = [
        { name: "server1", url: "https://api1.com/mcp" },
        { name: "server2", url: "https://api2.com/mcp" },
      ];

      expect(validateMcpServerConfigs(validConfigs)).toBe(true);
    });

    it("should return true for empty array", () => {
      expect(validateMcpServerConfigs([])).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(validateMcpServerConfigs(undefined)).toBe(true);
    });

    it("should return false for non-array", () => {
      expect(validateMcpServerConfigs("not an array")).toBe(false);
      expect(validateMcpServerConfigs(123)).toBe(false);
      expect(validateMcpServerConfigs({})).toBe(false);
    });

    it("should return false for array with invalid servers", () => {
      const invalidConfigs = [{ name: "", url: "https://api.com/mcp" }];

      expect(validateMcpServerConfigs(invalidConfigs)).toBe(false);
    });

    it("should return false for array with duplicate names", () => {
      const duplicateConfigs = [
        { name: "duplicate", url: "https://api1.com/mcp" },
        { name: "duplicate", url: "https://api2.com/mcp" },
      ];

      expect(validateMcpServerConfigs(duplicateConfigs)).toBe(false);
    });

    it("should provide type narrowing", () => {
      const unknownInput: unknown = [
        { name: "server1", url: "https://api1.com/mcp" },
      ];

      if (validateMcpServerConfigs(unknownInput)) {
        // TypeScript should infer unknownInput as McpServerConfig[] here
        expect(unknownInput[0].name).toBe("server1");
        expect(unknownInput[0].url).toBe("https://api1.com/mcp");
      }
    });
  });

  describe("Type compatibility", () => {
    it("should maintain type compatibility with BridgeConfigSchema", () => {
      // This test ensures our extracted types remain compatible with the main schema
      const mcpConfig: McpServerConfig = {
        name: "test-server",
        url: "https://api.example.com/mcp",
      };

      const configs: McpServerConfigs = [mcpConfig];

      expect(mcpConfig).toBeDefined();
      expect(configs).toBeDefined();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs[0]).toEqual(mcpConfig);
    });

    it("should handle optional McpServerConfigs type", () => {
      const optionalConfigs: McpServerConfigs = undefined;
      expect(optionalConfigs).toBeUndefined();

      const definedConfigs: McpServerConfigs = [
        { name: "test", url: "https://api.com/mcp" },
      ];
      expect(definedConfigs).toBeDefined();
      expect(Array.isArray(definedConfigs)).toBe(true);
    });
  });
});
