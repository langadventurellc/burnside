/**
 * Logging Configuration Interface
 *
 * Defines the configuration structure for logger behavior.
 * Follows existing project patterns for optional configuration fields.
 */

import type { LogLevel } from "./logLevel";

/**
 * Configuration interface for logging behavior
 * All fields are optional with sensible defaults
 */
export interface LoggingConfig {
  /** Enable or disable logging entirely (default: true) */
  enabled?: boolean;
  /** Minimum log level to display (default: 'warn') */
  level?: LogLevel;
}
