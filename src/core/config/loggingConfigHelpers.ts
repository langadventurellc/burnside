/**
 * Logging Configuration Helper Utilities
 *
 * Provides type-safe utilities for accessing and validating logging
 * configuration from BridgeConfig following established patterns.
 */

import type { LogLevel, LoggingConfig } from "../logging";

/**
 * Valid log levels for validation
 */
const VALID_LOG_LEVELS: readonly LogLevel[] = [
  "error",
  "warn",
  "info",
  "debug",
];

/**
 * Default logging configuration used when no config provided or config is invalid
 */
const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: true,
  level: "warn",
};

/**
 * Type guard to check if a value is a valid LogLevel
 * @param level Value to check
 * @returns True if value is a valid LogLevel
 */
function isValidLogLevel(level: unknown): level is LogLevel {
  return (
    typeof level === "string" && VALID_LOG_LEVELS.includes(level as LogLevel)
  );
}

/**
 * Safely extract logging configuration from options object
 * @param options The options object from BridgeConfig
 * @returns LoggingConfig if found, undefined otherwise
 */
function getLoggingConfig(
  options?: Record<string, unknown>,
): LoggingConfig | undefined {
  if (!options || typeof options !== "object") {
    return undefined;
  }

  const logging = options.logging;
  if (!logging || typeof logging !== "object") {
    return undefined;
  }

  return logging as LoggingConfig;
}

/**
 * Validate logging configuration and provide safe defaults
 * @param config Raw configuration object to validate
 * @returns Validated LoggingConfig with defaults applied
 */
function validateLoggingConfig(config: unknown): LoggingConfig {
  if (!config || typeof config !== "object") {
    return DEFAULT_LOGGING_CONFIG;
  }

  const typedConfig = config as Record<string, unknown>;
  const result: LoggingConfig = {};

  // Validate enabled field
  if (typeof typedConfig.enabled === "boolean") {
    result.enabled = typedConfig.enabled;
  } else {
    result.enabled = DEFAULT_LOGGING_CONFIG.enabled;
  }

  // Validate level field
  if (isValidLogLevel(typedConfig.level)) {
    result.level = typedConfig.level;
  } else {
    result.level = DEFAULT_LOGGING_CONFIG.level;
    if (typedConfig.level !== undefined) {
      // Safe logging without problematic string conversion
      console.warn(
        "Invalid log level provided. Using default level:",
        DEFAULT_LOGGING_CONFIG.level,
      );
    }
  }

  return result;
}

/**
 * Logging configuration utilities
 */
export const loggingConfigHelpers = {
  getLoggingConfig,
  validateLoggingConfig,
  isValidLogLevel,
};
