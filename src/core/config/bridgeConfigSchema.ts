import { z } from "zod";

/**
 * Zod Schema for BridgeConfig
 *
 * Comprehensive runtime validation for BridgeConfig interface providing
 * strict type checking, default values, and clear error messages for
 * configuration validation throughout the LLM Bridge library.
 *
 * @example
 * ```typescript
 * import { BridgeConfigSchema } from "./bridgeConfigSchema";
 *
 * const config = {
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." }
 *   },
 *   rateLimitPolicy: {
 *     enabled: true,
 *     maxRps: 10,
 *     scope: "provider:model"
 *   },
 *   retryPolicy: {
 *     attempts: 3,
 *     backoff: "exponential",
 *     baseDelayMs: 1000,
 *     maxDelayMs: 30000
 *   }
 * };
 *
 * const validatedConfig = BridgeConfigSchema.parse(config);
 * ```
 */
export const BridgeConfigSchema = z
  .object({
    /** Default provider to use when none specified */
    defaultProvider: z
      .string()
      .min(1, "Default provider cannot be empty")
      .optional(),

    /** Configuration for each provider */
    providers: z
      .record(
        z.string().min(1, "Provider name cannot be empty"),
        z.record(z.string(), z.unknown()),
      )
      .optional(),

    /** Default model to use when none specified */
    defaultModel: z.string().min(1, "Default model cannot be empty").optional(),

    /** Request timeout in milliseconds */
    timeout: z
      .number()
      .int("Timeout must be an integer")
      .min(1000, "Timeout must be at least 1000ms")
      .max(300000, "Timeout must not exceed 300000ms")
      .optional(),

    /** Additional global configuration options */
    options: z.record(z.string(), z.unknown()).optional(),

    /** Registry initialization options for Phase 1 (empty state) */
    registryOptions: z
      .object({
        /** Provider registry initialization data */
        providers: z.record(z.string(), z.unknown()).optional(),
        /** Model registry initialization data */
        models: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),

    /** Optional model registry seeding configuration */
    modelSeed: z
      .union([
        z.literal("builtin"),
        z.literal("none"),
        z.object({ data: z.unknown() }),
        z.object({ path: z.string().min(1) }),
      ])
      .optional(),

    /** Tool system configuration */
    tools: z
      .object({
        /** Enable tool execution functionality */
        enabled: z.boolean().describe("Enable tool execution functionality"),
        /** List of enabled built-in tools */
        builtinTools: z
          .array(z.string().min(1, "Builtin tool name cannot be empty"))
          .describe("List of enabled built-in tools"),
        /** Tool execution timeout in milliseconds */
        executionTimeoutMs: z
          .number()
          .int("Execution timeout must be an integer")
          .min(1000, "Execution timeout must be at least 1000ms")
          .max(300000, "Execution timeout must not exceed 300000ms")
          .optional()
          .describe("Tool execution timeout in milliseconds"),
        /** Maximum concurrent tool executions (future use) */
        maxConcurrentTools: z
          .number()
          .int("Max concurrent tools must be an integer")
          .min(1, "Max concurrent tools must be at least 1")
          .max(10, "Max concurrent tools must not exceed 10")
          .optional()
          .describe("Maximum concurrent tool executions"),
        /** MCP server configurations */
        mcpServers: z
          .array(
            z.object({
              /** MCP server name */
              name: z
                .string()
                .min(1, "MCP server name cannot be empty")
                .describe("MCP server name"),
              /** MCP server URL */
              url: z
                .string()
                .url("MCP server URL must be valid")
                .refine(
                  (url) =>
                    url.startsWith("http://") || url.startsWith("https://"),
                  "MCP server URL must use HTTP or HTTPS protocol",
                )
                .describe("MCP server URL"),
            }),
          )
          .optional()
          .describe("MCP server configurations")
          .refine((servers) => {
            const names = servers?.map((s) => s.name) || [];
            return names.length === new Set(names).size;
          }, "MCP server names must be unique"),
      })
      .optional()
      .describe("Tool system configuration"),

    /** Rate limiting policy configuration */
    rateLimitPolicy: z
      .object({
        /** Enable/disable rate limiting */
        enabled: z
          .boolean()
          .default(false)
          .describe("Enable rate limiting functionality"),

        /** Maximum requests per second */
        maxRps: z
          .number()
          .positive("Max RPS must be positive")
          .max(1000, "Max RPS cannot exceed 1000")
          .optional()
          .describe("Maximum requests per second"),

        /** Burst capacity */
        burst: z
          .number()
          .positive("Burst capacity must be positive")
          .max(10000, "Burst capacity cannot exceed 10000")
          .optional()
          .describe("Burst capacity for rate limiting"),

        /** Rate limiting scope */
        scope: z
          .enum(["global", "provider", "provider:model", "provider:model:key"])
          .default("provider:model:key")
          .describe("Rate limiting scope granularity"),
      })
      .optional()
      .describe("Rate limiting policy configuration")
      .refine(
        (policy) => {
          // If enabled, maxRps is required
          if (policy?.enabled && !policy.maxRps) {
            return false;
          }
          return true;
        },
        {
          message: "maxRps is required when rate limiting is enabled",
        },
      )
      .transform((policy) => {
        // Set default burst to maxRps * 2 if not specified
        if (policy?.enabled && policy.maxRps && !policy.burst) {
          return {
            ...policy,
            burst: policy.maxRps * 2,
          };
        }
        return policy;
      }),

    /** Retry policy configuration */
    retryPolicy: z
      .object({
        /** Number of retry attempts */
        attempts: z
          .number()
          .int("Attempts must be an integer")
          .min(0, "Attempts cannot be negative")
          .max(10, "Attempts cannot exceed 10")
          .default(2)
          .describe("Number of retry attempts"),

        /** Backoff strategy */
        backoff: z
          .enum(["exponential", "linear"])
          .default("exponential")
          .describe("Backoff strategy type"),

        /** Base delay in milliseconds */
        baseDelayMs: z
          .number()
          .positive("Base delay must be positive")
          .max(60000, "Base delay cannot exceed 60 seconds")
          .default(1000)
          .describe("Base delay in milliseconds"),

        /** Maximum delay in milliseconds */
        maxDelayMs: z
          .number()
          .positive("Max delay must be positive")
          .max(300000, "Max delay cannot exceed 5 minutes")
          .default(30000)
          .describe("Maximum delay in milliseconds"),

        /** Enable jitter */
        jitter: z
          .boolean()
          .default(true)
          .describe("Enable jitter to prevent thundering herd"),

        /** Retryable status codes */
        retryableStatusCodes: z
          .array(z.number().int().min(100).max(599))
          .default([429, 500, 502, 503, 504])
          .describe("HTTP status codes that trigger retries"),
      })
      .optional()
      .describe("Retry policy configuration")
      .refine(
        (policy) => {
          // Base delay must be less than or equal to max delay
          if (policy && policy.baseDelayMs > policy.maxDelayMs) {
            return false;
          }
          return true;
        },
        {
          message: "baseDelayMs must be less than or equal to maxDelayMs",
        },
      ),
  })
  .superRefine((config, ctx) => {
    // At least one of defaultProvider or providers must be specified
    if (!config.defaultProvider && !config.providers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Configuration must specify providers",
        path: ["defaultProvider"],
      });
      return;
    }

    // If defaultProvider is specified, it must exist in providers
    if (
      config.defaultProvider &&
      config.providers &&
      !config.providers[config.defaultProvider]
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Default provider '${config.defaultProvider}' not found in providers configuration`,
        path: ["defaultProvider"],
      });
    }
  });

/**
 * Type for validated BridgeConfig
 *
 * Inferred from the Zod schema to ensure type safety between
 * runtime validation and compile-time type checking.
 */
export type ValidatedBridgeConfig = z.infer<typeof BridgeConfigSchema>;
