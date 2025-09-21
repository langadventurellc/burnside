import { BridgeConfigSchema } from "../bridgeConfigSchema";

describe("BridgeConfigSchema", () => {
  describe("valid configurations", () => {
    it("should accept minimal valid config with providers only", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept minimal valid config with defaultProvider only", () => {
      const config = {
        defaultProvider: "openai",
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept complete valid configuration", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test", temperature: 0.7 },
          anthropic: { apiKey: "sk-ant-test" },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        options: { retries: 3 },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should accept configuration with valid timeout values", () => {
      const configs = [
        { providers: { test: {} }, timeout: 1000 }, // minimum
        { providers: { test: {} }, timeout: 30000 }, // typical
        { providers: { test: {} }, timeout: 300000 }, // maximum
      ];

      configs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });

    it("should accept configuration with complex provider configs", () => {
      const config = {
        providers: {
          openai: {
            apiKey: "sk-test",
            baseUrl: "https://api.openai.com/v1",
            maxRetries: 3,
          },
          anthropic: {
            apiKey: "sk-ant-test",
            version: "2023-06-01",
          },
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result).toEqual(config);
    });
  });

  describe("invalid configurations", () => {
    it("should reject empty configuration", () => {
      const config = {};

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject configuration with empty defaultProvider", () => {
      const config = {
        defaultProvider: "",
        providers: { openai: { apiKey: "sk-test" } },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider cannot be empty/,
      );
    });

    it("should reject configuration with empty provider names", () => {
      const config = {
        providers: {
          "": { apiKey: "sk-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Provider name cannot be empty/,
      );
    });

    it("should reject configuration with empty defaultModel", () => {
      const config = {
        providers: { openai: { apiKey: "sk-test" } },
        defaultModel: "",
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default model cannot be empty/,
      );
    });

    it("should reject configuration with invalid timeout values", () => {
      const invalidTimeouts = [
        { value: 999, error: /at least 1000ms/ },
        { value: 300001, error: /not exceed 300000ms/ },
        { value: -1000, error: /at least 1000ms/ },
        { value: 0, error: /at least 1000ms/ },
        { value: 1.5, error: /integer/ },
      ];

      invalidTimeouts.forEach(({ value, error }) => {
        const config = {
          providers: { test: {} },
          timeout: value,
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(error);
      });
    });

    it("should reject non-number timeout values", () => {
      const config = {
        providers: { test: {} },
        timeout: "30000" as any,
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject defaultProvider not found in providers", () => {
      const config = {
        defaultProvider: "missing",
        providers: {
          openai: { apiKey: "sk-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider 'missing' not found in providers configuration/,
      );
    });

    it("should reject invalid provider configuration values", () => {
      const config = {
        providers: {
          openai: "invalid" as any,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow();
    });

    it("should reject null or undefined values for required structure", () => {
      const invalidConfigs = [
        { providers: null },
        { defaultProvider: null },
        { timeout: null },
        { options: null },
      ];

      invalidConfigs.forEach((config) => {
        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });
    });
  });

  describe("complex validation scenarios", () => {
    it("should allow defaultProvider without providers when providers is not specified", () => {
      const config = {
        defaultProvider: "openai",
        defaultModel: "gpt-4",
        timeout: 30000,
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should allow providers without defaultProvider", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
          anthropic: { apiKey: "sk-ant-test" },
        },
        defaultModel: "gpt-4",
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should validate multiple providers with matching defaultProvider", () => {
      const config = {
        defaultProvider: "anthropic",
        providers: {
          openai: { apiKey: "sk-test" },
          anthropic: { apiKey: "sk-ant-test" },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });

    it("should handle complex nested provider configurations", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: {
            apiKey: "sk-test",
            config: {
              temperature: 0.7,
              maxTokens: 1000,
              nested: { deep: true },
            },
          },
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("type inference", () => {
    it("should infer correct types from schema", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        options: { retries: 3 },
      };

      const result = BridgeConfigSchema.parse(config);

      // TypeScript compilation test
      const provider: string | undefined = result.defaultProvider;
      const providers: Record<string, Record<string, unknown>> | undefined =
        result.providers;
      const model: string | undefined = result.defaultModel;
      const timeout: number | undefined = result.timeout;
      const options: Record<string, unknown> | undefined = result.options;

      expect(provider).toBe("openai");
      expect(providers).toBeDefined();
      expect(model).toBe("gpt-4");
      expect(timeout).toBe(30000);
      expect(options).toEqual({ retries: 3 });
    });
  });

  describe("tools configuration", () => {
    describe("valid tools configurations", () => {
      it("should accept minimal tools configuration with enabled=false", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: false,
            builtinTools: [],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools).toEqual({
          enabled: false,
          builtinTools: [],
        });
      });

      it("should accept tools configuration with enabled=true and builtinTools", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools).toEqual({
          enabled: true,
          builtinTools: ["echo"],
        });
      });

      it("should accept complete tools configuration with all fields", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            executionTimeoutMs: 5000,
            maxConcurrentTools: 1,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools).toEqual({
          enabled: true,
          builtinTools: ["echo"],
          executionTimeoutMs: 5000,
          maxConcurrentTools: 1,
        });
      });

      it("should accept tools configuration with multiple builtin tools", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo", "calculator", "weather"],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.builtinTools).toEqual([
          "echo",
          "calculator",
          "weather",
        ]);
      });

      it("should accept tools configuration with valid timeout boundaries", () => {
        const configs = [
          {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              executionTimeoutMs: 1000,
            },
          }, // minimum
          {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              executionTimeoutMs: 30000,
            },
          }, // typical
          {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              executionTimeoutMs: 300000,
            },
          }, // maximum
        ];

        configs.forEach((config) => {
          expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
        });
      });

      it("should accept tools configuration with valid concurrent tool boundaries", () => {
        const configs = [
          {
            providers: { test: {} },
            tools: { enabled: true, builtinTools: [], maxConcurrentTools: 1 },
          }, // minimum
          {
            providers: { test: {} },
            tools: { enabled: true, builtinTools: [], maxConcurrentTools: 5 },
          }, // typical
          {
            providers: { test: {} },
            tools: { enabled: true, builtinTools: [], maxConcurrentTools: 10 },
          }, // maximum
        ];

        configs.forEach((config) => {
          expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
        });
      });
    });

    describe("invalid tools configurations", () => {
      it("should reject tools configuration with non-boolean enabled", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: "true" as any,
            builtinTools: [],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });

      it("should reject tools configuration with non-array builtinTools", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: "echo" as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });

      it("should reject tools configuration with empty builtin tool names", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo", "", "calculator"],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /Builtin tool name cannot be empty/,
        );
      });

      it("should reject tools configuration with invalid executionTimeoutMs values", () => {
        const invalidTimeouts = [
          { value: 999, error: /at least 1000ms/ },
          { value: 300001, error: /not exceed 300000ms/ },
          { value: -5000, error: /at least 1000ms/ },
          { value: 0, error: /at least 1000ms/ },
          { value: 2.5, error: /integer/ },
        ];

        invalidTimeouts.forEach(({ value, error }) => {
          const config = {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              executionTimeoutMs: value,
            },
          };

          expect(() => BridgeConfigSchema.parse(config)).toThrow(error);
        });
      });

      it("should reject tools configuration with invalid maxConcurrentTools values", () => {
        const invalidValues = [
          { value: 0, error: /at least 1/ },
          { value: 11, error: /not exceed 10/ },
          { value: -1, error: /at least 1/ },
          { value: 1.5, error: /integer/ },
        ];

        invalidValues.forEach(({ value, error }) => {
          const config = {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              maxConcurrentTools: value,
            },
          };

          expect(() => BridgeConfigSchema.parse(config)).toThrow(error);
        });
      });

      it("should reject tools configuration with non-number timeout values", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            executionTimeoutMs: "5000" as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });
    });

    describe("tools configuration integration", () => {
      it("should accept complete BridgeConfig with tools section", () => {
        const config = {
          defaultProvider: "openai",
          providers: {
            openai: { apiKey: "sk-test" },
            anthropic: { apiKey: "sk-ant-test" },
          },
          defaultModel: "gpt-4",
          timeout: 30000,
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            executionTimeoutMs: 5000,
            maxConcurrentTools: 1,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result).toEqual(config);
      });

      it("should accept existing configurations without tools section (backward compatibility)", () => {
        const config = {
          defaultProvider: "openai",
          providers: {
            openai: { apiKey: "sk-test" },
          },
          defaultModel: "gpt-4",
          timeout: 30000,
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools).toBeUndefined();
        expect(result.defaultProvider).toBe("openai");
      });

      it("should handle tools configuration with optional fields omitted", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: false,
            builtinTools: ["echo"],
            // executionTimeoutMs and maxConcurrentTools omitted
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools).toEqual({
          enabled: false,
          builtinTools: ["echo"],
        });
        expect(result.tools?.executionTimeoutMs).toBeUndefined();
        expect(result.tools?.maxConcurrentTools).toBeUndefined();
      });
    });

    describe("tools configuration type inference", () => {
      it("should infer correct types for tools configuration", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            executionTimeoutMs: 5000,
            maxConcurrentTools: 1,
          },
        };

        const result = BridgeConfigSchema.parse(config);

        // TypeScript compilation test
        const toolsConfig = result.tools;
        if (toolsConfig) {
          const enabled: boolean = toolsConfig.enabled;
          const builtinTools: string[] = toolsConfig.builtinTools;
          const timeout: number | undefined = toolsConfig.executionTimeoutMs;
          const maxConcurrent: number | undefined =
            toolsConfig.maxConcurrentTools;

          expect(enabled).toBe(true);
          expect(builtinTools).toEqual(["echo"]);
          expect(timeout).toBe(5000);
          expect(maxConcurrent).toBe(1);
        }
      });
    });
  });

  describe("rate limiting configuration integration", () => {
    it("should accept configuration with rate limiting enabled", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
          burst: 20,
          scope: "provider:model" as const,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.rateLimitPolicy).toEqual({
        enabled: true,
        maxRps: 10,
        burst: 20,
        scope: "provider:model",
      });
    });

    it("should accept configuration with tools and rate limiting", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          executionTimeoutMs: 5000,
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 5,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.tools?.enabled).toBe(true);
      expect(result.rateLimitPolicy?.enabled).toBe(true);
      expect(result.rateLimitPolicy?.maxRps).toBe(5);
      expect(result.rateLimitPolicy?.burst).toBe(10); // Auto-calculated
    });

    it("should maintain existing validation with rate limiting present", () => {
      const config = {
        defaultProvider: "missing", // Invalid - not in providers
        providers: {
          openai: { apiKey: "sk-test" },
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider 'missing' not found in providers configuration/,
      );
    });

    it("should handle rate limiting with complex provider configuration", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: {
            apiKey: "sk-test",
            baseUrl: "https://api.openai.com/v1",
            maxRetries: 3,
          },
          anthropic: {
            apiKey: "sk-ant-test",
            version: "2023-06-01",
          },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        rateLimitPolicy: {
          enabled: true,
          maxRps: 50,
          burst: 150,
          scope: "global" as const,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.defaultProvider).toBe("openai");
      expect(result.rateLimitPolicy?.scope).toBe("global");
      expect(result.rateLimitPolicy?.burst).toBe(150);
    });
  });

  describe("MCP server configuration", () => {
    describe("valid MCP server configurations", () => {
      it("should accept tools configuration without mcpServers (backward compatibility)", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpServers).toBeUndefined();
      });

      it("should accept tools configuration with empty mcpServers array", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpServers: [],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpServers).toEqual([]);
      });

      it("should accept single valid MCP server configuration", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpServers: [
              {
                name: "example-server",
                url: "https://example.com/mcp",
              },
            ],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpServers).toEqual([
          {
            name: "example-server",
            url: "https://example.com/mcp",
          },
        ]);
      });

      it("should accept multiple valid MCP server configurations", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpServers: [
              {
                name: "server-one",
                url: "https://api.example.com/mcp",
              },
              {
                name: "server-two",
                url: "http://localhost:8080/mcp",
              },
            ],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpServers).toEqual([
          {
            name: "server-one",
            url: "https://api.example.com/mcp",
          },
          {
            name: "server-two",
            url: "http://localhost:8080/mcp",
          },
        ]);
      });

      it("should accept HTTP and HTTPS URLs", () => {
        const httpConfig = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [{ name: "http-server", url: "http://example.com" }],
          },
        };

        const httpsConfig = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [{ name: "https-server", url: "https://example.com" }],
          },
        };

        expect(() => BridgeConfigSchema.parse(httpConfig)).not.toThrow();
        expect(() => BridgeConfigSchema.parse(httpsConfig)).not.toThrow();
      });

      it("should accept valid URLs with paths and query parameters", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "complex-server",
                url: "https://api.example.com/v1/mcp?token=abc123",
              },
            ],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).not.toThrow();
      });
    });

    describe("invalid MCP server configurations", () => {
      it("should reject MCP server with empty name", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "",
                url: "https://example.com",
              },
            ],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /MCP server name cannot be empty/,
        );
      });

      it("should reject MCP server with invalid URL", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "invalid-server",
                url: "not-a-url",
              },
            ],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /MCP server URL must be valid/,
        );
      });

      it("should reject non-HTTP/HTTPS protocols", () => {
        const invalidProtocols = [
          "ftp://example.com",
          "file:///local/path",
          "ws://example.com",
          "custom://example.com",
        ];

        invalidProtocols.forEach((url) => {
          const config = {
            providers: { test: {} },
            tools: {
              enabled: true,
              builtinTools: [],
              mcpServers: [{ name: "test-server", url }],
            },
          };

          expect(() => BridgeConfigSchema.parse(config)).toThrow(
            /MCP server URL must use HTTP or HTTPS protocol/,
          );
        });
      });

      it("should reject duplicate MCP server names", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "duplicate-name",
                url: "https://server1.example.com",
              },
              {
                name: "duplicate-name",
                url: "https://server2.example.com",
              },
            ],
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /MCP server names must be unique/,
        );
      });

      it("should reject MCP server with missing required fields", () => {
        const configMissingName = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                url: "https://example.com",
              } as any,
            ],
          },
        };

        const configMissingUrl = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "test-server",
              } as any,
            ],
          },
        };

        expect(() => BridgeConfigSchema.parse(configMissingName)).toThrow();
        expect(() => BridgeConfigSchema.parse(configMissingUrl)).toThrow();
      });

      it("should reject non-array mcpServers", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: "not-an-array" as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });

      it("should reject non-object MCP server configurations", () => {
        const config = {
          providers: { test: {} },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: ["not-an-object"] as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow();
      });
    });

    describe("MCP server configuration integration", () => {
      it("should accept complete configuration with MCP servers and other tools config", () => {
        const config = {
          defaultProvider: "openai",
          providers: {
            openai: { apiKey: "sk-test" },
          },
          tools: {
            enabled: true,
            builtinTools: ["echo", "calculator"],
            executionTimeoutMs: 5000,
            maxConcurrentTools: 2,
            mcpServers: [
              {
                name: "mcp-server-1",
                url: "https://api.example.com/mcp",
              },
            ],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.enabled).toBe(true);
        expect(result.tools?.builtinTools).toEqual(["echo", "calculator"]);
        expect(result.tools?.mcpServers).toEqual([
          {
            name: "mcp-server-1",
            url: "https://api.example.com/mcp",
          },
        ]);
      });

      it("should accept MCP servers with rate limiting and retry policies", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: [],
            mcpServers: [
              {
                name: "rate-limited-server",
                url: "https://example.com/mcp",
              },
            ],
          },
          rateLimitPolicy: {
            enabled: true,
            maxRps: 10,
          },
          retryPolicy: {
            attempts: 3,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpServers?.[0].name).toBe("rate-limited-server");
        expect(result.rateLimitPolicy?.enabled).toBe(true);
        expect(result.retryPolicy?.attempts).toBe(3);
      });
    });

    describe("MCP server configuration type inference", () => {
      it("should infer correct types for MCP server configuration", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpServers: [
              {
                name: "typed-server",
                url: "https://example.com/mcp",
              },
            ],
          },
        };

        const result = BridgeConfigSchema.parse(config);

        // TypeScript compilation test
        const toolsConfig = result.tools;
        if (toolsConfig && toolsConfig.mcpServers) {
          const mcpServers: Array<{ name: string; url: string }> =
            toolsConfig.mcpServers;
          const firstServer = mcpServers[0];
          const serverName: string = firstServer.name;
          const serverUrl: string = firstServer.url;

          expect(serverName).toBe("typed-server");
          expect(serverUrl).toBe("https://example.com/mcp");
        }
      });
    });
  });

  describe("mcpToolFailureStrategy configuration", () => {
    describe("valid mcpToolFailureStrategy configurations", () => {
      it("should accept 'immediate_unregister' strategy", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: "immediate_unregister" as const,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpToolFailureStrategy).toBe(
          "immediate_unregister",
        );
      });

      it("should accept 'mark_unavailable' strategy", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: "mark_unavailable" as const,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpToolFailureStrategy).toBe("mark_unavailable");
      });

      it("should accept undefined as a valid value", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: undefined as any,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpToolFailureStrategy).toBeUndefined();
      });

      it("should leave field undefined when not specified", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpToolFailureStrategy).toBeUndefined();
      });

      it("should work with complete tools configuration including MCP servers", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            executionTimeoutMs: 5000,
            maxConcurrentTools: 2,
            mcpServers: [
              {
                name: "test-server",
                url: "https://example.com/mcp",
              },
            ],
            mcpToolFailureStrategy: "mark_unavailable" as const,
          },
        };

        const result = BridgeConfigSchema.parse(config);
        expect(result.tools?.mcpToolFailureStrategy).toBe("mark_unavailable");
        expect(result.tools?.mcpServers).toHaveLength(1);
        expect(result.tools?.enabled).toBe(true);
      });
    });

    describe("invalid mcpToolFailureStrategy configurations", () => {
      it("should reject invalid strategy value", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: "invalid_strategy" as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /Invalid enum value/,
        );
      });

      it("should reject empty string strategy", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: "" as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /Invalid enum value/,
        );
      });

      it("should reject numeric strategy value", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: 123 as any,
          },
        };

        expect(() => BridgeConfigSchema.parse(config)).toThrow(
          /Expected.*immediate_unregister.*mark_unavailable/,
        );
      });
    });

    describe("mcpToolFailureStrategy type inference", () => {
      it("should infer correct types for failure strategy", () => {
        const config = {
          providers: { openai: { apiKey: "sk-test" } },
          tools: {
            enabled: true,
            builtinTools: ["echo"],
            mcpToolFailureStrategy: "immediate_unregister" as const,
          },
        };

        const result = BridgeConfigSchema.parse(config);

        // TypeScript compilation test
        const toolsConfig = result.tools;
        if (toolsConfig && toolsConfig.mcpToolFailureStrategy) {
          const strategy: "immediate_unregister" | "mark_unavailable" =
            toolsConfig.mcpToolFailureStrategy;
          expect(strategy).toBe("immediate_unregister");
        }
      });
    });
  });

  describe("retry policy configuration integration", () => {
    it("should accept configuration with retry policy enabled", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: { apiKey: "sk-test" },
        },
        retryPolicy: {
          attempts: 3,
          backoff: "exponential" as const,
          baseDelayMs: 1000,
          maxDelayMs: 30000,
          jitter: true,
          retryableStatusCodes: [429, 500, 502, 503, 504],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.retryPolicy).toEqual({
        attempts: 3,
        backoff: "exponential",
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: true,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      });
    });

    it("should accept configuration with tools, rate limiting, and retry policy", () => {
      const config = {
        providers: {
          openai: { apiKey: "sk-test" },
        },
        tools: {
          enabled: true,
          builtinTools: ["echo"],
          executionTimeoutMs: 5000,
        },
        rateLimitPolicy: {
          enabled: true,
          maxRps: 5,
        },
        retryPolicy: {
          attempts: 2,
          backoff: "linear" as const,
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.tools?.enabled).toBe(true);
      expect(result.rateLimitPolicy?.enabled).toBe(true);
      expect(result.retryPolicy?.attempts).toBe(2);
      expect(result.retryPolicy?.backoff).toBe("linear");
      // Verify defaults are applied
      expect(result.retryPolicy?.baseDelayMs).toBe(1000);
      expect(result.retryPolicy?.maxDelayMs).toBe(30000);
    });

    it("should maintain existing validation with retry policy present", () => {
      const config = {
        defaultProvider: "missing", // Invalid - not in providers
        providers: {
          openai: { apiKey: "sk-test" },
        },
        retryPolicy: {
          attempts: 3,
        },
      };

      expect(() => BridgeConfigSchema.parse(config)).toThrow(
        /Default provider 'missing' not found in providers configuration/,
      );
    });

    it("should handle retry policy with complex configuration", () => {
      const config = {
        defaultProvider: "openai",
        providers: {
          openai: {
            apiKey: "sk-test",
            baseUrl: "https://api.openai.com/v1",
          },
          anthropic: {
            apiKey: "sk-ant-test",
          },
        },
        defaultModel: "gpt-4",
        timeout: 30000,
        rateLimitPolicy: {
          enabled: true,
          maxRps: 10,
        },
        retryPolicy: {
          attempts: 5,
          backoff: "exponential" as const,
          baseDelayMs: 2000,
          maxDelayMs: 60000,
          jitter: false,
          retryableStatusCodes: [429, 500, 503],
        },
      };

      const result = BridgeConfigSchema.parse(config);
      expect(result.defaultProvider).toBe("openai");
      expect(result.retryPolicy?.attempts).toBe(5);
      expect(result.retryPolicy?.jitter).toBe(false);
      expect(result.retryPolicy?.retryableStatusCodes).toEqual([429, 500, 503]);
    });
  });
});
