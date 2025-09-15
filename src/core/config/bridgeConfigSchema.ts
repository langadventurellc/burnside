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
 * import { BridgeConfigSchema } from "./bridgeConfigSchema.js";
 *
 * const config = {
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." }
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
  })
  .superRefine((config, ctx) => {
    // At least one of defaultProvider or providers must be specified
    if (!config.defaultProvider && !config.providers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Configuration must specify either defaultProvider or providers",
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
