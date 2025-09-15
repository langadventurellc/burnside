import { BridgeConfigSchema } from "./core/config";
import { BridgeClient } from "./client";
import { ValidationError } from "./core/errors";
import { validateOrThrow } from "./core/validation";
import type { BridgeConfig } from "./core/config";

/**
 * Creates a configured LLM Bridge client instance.
 *
 * This is the primary entry point for the LLM Bridge Library, providing
 * comprehensive configuration validation, sensible defaults, and proper
 * error handling for client initialization.
 *
 * @param config - Configuration object for the bridge client
 * @returns Configured BridgeClient instance
 * @throws {ValidationError} When configuration is invalid
 * @throws {BridgeError} When client initialization fails
 *
 * @example
 * ```typescript
 * // Minimal configuration with providers
 * const client = createClient({
 *   providers: {
 *     openai: { apiKey: "sk-..." }
 *   }
 * });
 *
 * // Complete configuration with all options
 * const client = createClient({
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." },
 *     anthropic: { apiKey: "sk-ant-..." }
 *   },
 *   defaultModel: "gpt-4",
 *   timeout: 30000,
 *   options: { retries: 3 },
 *   registryOptions: {
 *     providers: {},
 *     models: {}
 *   }
 * });
 *
 * // Using environment variables
 * const client = createClient({
 *   providers: {
 *     openai: { apiKey: "${OPENAI_API_KEY}" }
 *   }
 * });
 * ```
 */
export function createClient(config: BridgeConfig): BridgeClient {
  try {
    // Validate configuration with Zod schema
    const validatedConfig = validateOrThrow(BridgeConfigSchema, config);

    // Process environment variable references in configuration
    const processedConfig = processEnvironmentVariables(validatedConfig);

    // Merge with defaults and create client
    const configWithDefaults = mergeWithDefaults(processedConfig);

    // Create and return BridgeClient instance
    return new BridgeClient(configWithDefaults);
  } catch (error) {
    // Re-throw ValidationError as-is for clear configuration errors
    if (error instanceof ValidationError) {
      throw error;
    }

    // Wrap other errors in ValidationError for consistency
    throw new ValidationError(
      `Failed to create client: ${error instanceof Error ? error.message : "Unknown error"}`,
      { originalError: error, config },
    );
  }
}

/**
 * Process Environment Variable References
 *
 * Replaces ${ENV_VAR} patterns in string values with actual environment
 * variable values. Provides clear error messages for missing variables.
 *
 * @param config - Configuration with potential environment variable references
 * @returns Configuration with environment variables resolved
 * @throws {ValidationError} When required environment variables are missing
 */
function processEnvironmentVariables(config: BridgeConfig): BridgeConfig {
  const processed = { ...config };

  if (processed.providers) {
    const processedProviders: Record<string, Record<string, unknown>> = {};

    for (const [providerName, providerConfig] of Object.entries(
      processed.providers,
    )) {
      processedProviders[providerName] = processObjectValues(
        providerConfig,
        `providers.${providerName}`,
      );
    }

    processed.providers = processedProviders;
  }

  return processed;
}

/**
 * Process Object Values Recursively
 *
 * Recursively processes object values to replace environment variable
 * references with actual values from process.env.
 *
 * @param obj - Object to process
 * @param path - Current path for error reporting
 * @returns Object with environment variables resolved
 */
function processObjectValues(
  obj: Record<string, unknown>,
  path: string,
): Record<string, unknown> {
  const processed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = `${path}.${key}`;

    if (typeof value === "string") {
      processed[key] = processStringValue(value, currentPath);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      processed[key] = processObjectValues(
        value as Record<string, unknown>,
        currentPath,
      );
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Process String Value for Environment Variables
 *
 * Replaces ${ENV_VAR} patterns in strings with environment variable values.
 *
 * @param value - String value to process
 * @param path - Current path for error reporting
 * @returns String with environment variables resolved
 */
function processStringValue(value: string, path: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, envVarName) => {
    const envValue = process.env[envVarName as keyof NodeJS.ProcessEnv];

    if (envValue === undefined) {
      throw new ValidationError(
        `Environment variable '${envVarName}' is not defined but required for ${path}`,
        { envVarName, path, originalValue: value },
      );
    }

    return envValue;
  });
}

/**
 * Merge Configuration with Defaults
 *
 * Applies sensible default values for optional configuration fields
 * while preserving explicitly provided values.
 *
 * @param config - Validated configuration
 * @returns Configuration with defaults applied
 */
function mergeWithDefaults(config: BridgeConfig): BridgeConfig {
  return {
    ...config,
    defaultModel: config.defaultModel || "gpt-3.5-turbo",
    timeout: config.timeout || 30000,
    options: config.options || {},
    registryOptions: {
      providers: config.registryOptions?.providers || {},
      models: config.registryOptions?.models || {},
    },
  };
}
