/**
 * Main Library Exports Test Suite
 *
 * Comprehensive tests verifying that all public API exports are available,
 * properly typed, and work correctly for external consumption. This ensures
 * the API surface is complete and maintains backward compatibility.
 */

import * as LibraryExports from "../index";

describe("Library Exports", () => {
  describe("Primary API - Main Entry Points", () => {
    it("exports createClient function", () => {
      expect(typeof LibraryExports.createClient).toBe("function");
      expect(LibraryExports.createClient.name).toBe("createClient");
    });

    it("exports BridgeClient class", () => {
      expect(typeof LibraryExports.BridgeClient).toBe("function");
      expect(LibraryExports.BridgeClient.name).toBe("BridgeClient");
    });
  });

  describe("Core Types and Schemas - Runtime Validation", () => {
    describe("Message validation schemas", () => {
      it("exports MessageSchema", () => {
        expect(LibraryExports.MessageSchema).toBeDefined();
        expect(typeof LibraryExports.MessageSchema.parse).toBe("function");
        expect(typeof LibraryExports.MessageSchema.safeParse).toBe("function");
      });

      it("exports validateMessage function", () => {
        expect(typeof LibraryExports.validateMessage).toBe("function");
        expect(LibraryExports.validateMessage.name).toBe("validateMessage");
      });

      it("exports ContentPartSchema", () => {
        expect(LibraryExports.ContentPartSchema).toBeDefined();
        expect(typeof LibraryExports.ContentPartSchema.parse).toBe("function");
        expect(typeof LibraryExports.ContentPartSchema.safeParse).toBe(
          "function",
        );
      });

      it("exports validateContentPart function", () => {
        expect(typeof LibraryExports.validateContentPart).toBe("function");
        expect(LibraryExports.validateContentPart.name).toBe(
          "validateContentPart",
        );
      });
    });

    describe("Tool validation schemas", () => {
      it("exports ToolDefinitionSchema", () => {
        expect(LibraryExports.ToolDefinitionSchema).toBeDefined();
        expect(typeof LibraryExports.ToolDefinitionSchema.parse).toBe(
          "function",
        );
        expect(typeof LibraryExports.ToolDefinitionSchema.safeParse).toBe(
          "function",
        );
      });
    });

    describe("Configuration validation schemas", () => {
      it("exports BridgeConfigSchema", () => {
        expect(LibraryExports.BridgeConfigSchema).toBeDefined();
        expect(typeof LibraryExports.BridgeConfigSchema.parse).toBe("function");
        expect(typeof LibraryExports.BridgeConfigSchema.safeParse).toBe(
          "function",
        );
      });
    });
  });

  describe("Provider and Model Registries - Advanced Usage", () => {
    describe("Provider registry exports", () => {
      it("exports InMemoryProviderRegistry class", () => {
        expect(typeof LibraryExports.InMemoryProviderRegistry).toBe("function");
        expect(LibraryExports.InMemoryProviderRegistry.name).toBe(
          "InMemoryProviderRegistry",
        );
      });
    });

    describe("Model registry exports", () => {
      it("exports InMemoryModelRegistry class", () => {
        expect(typeof LibraryExports.InMemoryModelRegistry).toBe("function");
        expect(LibraryExports.InMemoryModelRegistry.name).toBe(
          "InMemoryModelRegistry",
        );
      });

      it("exports createModelId function", () => {
        expect(typeof LibraryExports.createModelId).toBe("function");
        expect(LibraryExports.createModelId.name).toBe("createModelId");
      });

      it("exports parseModelId function", () => {
        expect(typeof LibraryExports.parseModelId).toBe("function");
        expect(LibraryExports.parseModelId.name).toBe("parseModelId");
      });
    });
  });

  describe("Import Patterns", () => {
    it("supports named imports", () => {
      expect(() => {
        const { createClient, BridgeClient } = require("../index");
        expect(typeof createClient).toBe("function");
        expect(typeof BridgeClient).toBe("function");
      }).not.toThrow();
    });

    it("supports namespace imports", () => {
      expect(() => {
        const LLMBridge = require("../index");
        expect(typeof LLMBridge.createClient).toBe("function");
        expect(typeof LLMBridge.BridgeClient).toBe("function");
      }).not.toThrow();
    });

    it("supports destructuring of schemas", () => {
      expect(() => {
        const {
          MessageSchema,
          ContentPartSchema,
          ToolDefinitionSchema,
        } = require("../index");
        expect(MessageSchema).toBeDefined();
        expect(ContentPartSchema).toBeDefined();
        expect(ToolDefinitionSchema).toBeDefined();
      }).not.toThrow();
    });

    it("supports destructuring of registry classes", () => {
      expect(() => {
        const {
          InMemoryProviderRegistry,
          InMemoryModelRegistry,
          createModelId,
          parseModelId,
        } = require("../index");
        expect(typeof InMemoryProviderRegistry).toBe("function");
        expect(typeof InMemoryModelRegistry).toBe("function");
        expect(typeof createModelId).toBe("function");
        expect(typeof parseModelId).toBe("function");
      }).not.toThrow();
    });
  });

  describe("Documentation Examples Validation", () => {
    it("basic client creation example is syntactically valid", () => {
      const { createClient } = LibraryExports;

      expect(() => {
        const config = {
          defaultProvider: "openai" as const,
          providers: {
            openai: {
              default: { apiKey: "test-key" },
            },
          },
          defaultModel: "gpt-4",
          timeout: 30000,
        };
        createClient(config);
      }).not.toThrow();
    });

    it("registry-based model management example is syntactically valid", () => {
      const { createClient, InMemoryModelRegistry, createModelId } =
        LibraryExports;

      expect(() => {
        // Create and configure model registry
        const modelRegistry = new InMemoryModelRegistry();
        const modelId = createModelId("openai", "gpt-4");

        modelRegistry.register(modelId, {
          id: modelId,
          name: "GPT-4",
          provider: "openai",
          capabilities: {
            streaming: true,
            toolCalls: true,
            images: true,
            documents: false,
            supportedContentTypes: ["text", "image"],
          },
        });

        // Use registry in client configuration
        const _client = createClient({
          defaultProvider: "openai" as const,
          providers: {
            openai: {
              default: { apiKey: "test-key" },
            },
          },
          registryOptions: {
            models: { registry: modelRegistry },
          },
        });
      }).not.toThrow();
    });

    it("message validation example is syntactically valid", () => {
      const { MessageSchema, validateMessage } = LibraryExports;

      expect(() => {
        const message = {
          role: "user" as const,
          content: [{ type: "text" as const, text: "Hello!" }],
        };

        // Validate message structure
        const _validatedMessage = validateMessage(message);

        // Or use schema directly
        const result = MessageSchema.safeParse(message);
        if (result.success) {
          console.log("Valid message:", result.data);
        }
      }).not.toThrow();
    });
  });

  describe("API Completeness", () => {
    const expectedExports = [
      // Primary API
      "createClient",
      "BridgeClient",

      // Core schemas and validation
      "MessageSchema",
      "validateMessage",
      "ContentPartSchema",
      "validateContentPart",
      "ToolDefinitionSchema",
      "BridgeConfigSchema",

      // Registry implementations
      "InMemoryProviderRegistry",
      "InMemoryModelRegistry",
      "createModelId",
      "parseModelId",

      "BridgeError",
    ];

    it("exports all expected Phase 1 interfaces", () => {
      expectedExports.forEach((exportName) => {
        expect(LibraryExports).toHaveProperty(exportName);
        expect(
          LibraryExports[exportName as keyof typeof LibraryExports],
        ).toBeDefined();
      });
    });

    it("has no unexpected exports", () => {
      const actualExports = Object.keys(LibraryExports);
      const unexpectedExports = actualExports.filter(
        (exportName) => !expectedExports.includes(exportName),
      );

      // Allow for TypeScript-generated exports or additional Phase 1 exports
      // but flag any clearly internal or implementation details
      const suspicious = unexpectedExports.filter(
        (name) =>
          name.startsWith("_") ||
          name.includes("Internal") ||
          name.includes("Private"),
      );

      expect(suspicious).toEqual([]);
    });
  });

  describe("Type System Integration", () => {
    it("preserves type information through exports", () => {
      // This test ensures TypeScript compilation works correctly
      // by attempting to use the exported types in a type-safe manner
      const { createClient, MessageSchema } = LibraryExports;

      // Type inference should work
      const config = {
        defaultProvider: "openai" as const,
        providers: {
          openai: {
            default: { apiKey: "test" },
          },
        },
      };

      const client = createClient(config);
      expect(client).toBeDefined();

      // Schema validation should maintain types
      const message = {
        role: "user" as const,
        content: [{ type: "text" as const, text: "Hello!" }],
      };

      const result = MessageSchema.safeParse(message);
      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript should infer the correct type here
        expect(result.data.role).toBe("user");
        expect(result.data.content).toHaveLength(1);
      }
    });
  });
});
