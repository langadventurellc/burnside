/**
 * Simple Cross-Platform Logger
 *
 * A lightweight logger utility that provides level-based filtering,
 * safe serialization, and consistent formatting across Node.js,
 * browser, and React Native environments.
 *
 * @example
 * ```typescript
 * import { logger } from "./simpleLogger";
 *
 * // Use default instance (warn level, enabled)
 * logger.error("Connection failed", { code: "TIMEOUT" });
 * logger.warn("Rate limit approaching");
 * logger.info("Request completed"); // Not shown (below warn level)
 *
 * // Configure runtime behavior
 * logger.configure({ level: "debug", enabled: true });
 * logger.debug("Debug info", { payload: data }); // Now shown
 * ```
 */

import type { LogLevel } from "./logLevel";
import type { LoggingConfig } from "./loggingConfig";

/**
 * Simple logger implementation with cross-platform compatibility
 * Provides level-based filtering and safe serialization
 */
export class SimpleLogger {
  private enabled: boolean = true;
  private currentLevel: LogLevel = "warn";

  /** Map log levels to numeric priorities (lower = higher priority) */
  private readonly levelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  /** Map log levels to appropriate console methods */
  private readonly consoleMethods: Record<LogLevel, keyof Console> = {
    error: "error",
    warn: "warn",
    info: "info",
    debug: "log",
  };

  /**
   * Configure logger behavior at runtime
   * @param config Configuration object with optional enabled and level settings
   */
  configure(config: LoggingConfig): void {
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
    if (config.level !== undefined) {
      this.currentLevel = config.level;
    }
  }

  /**
   * Check if a specific log level is enabled
   * Useful for performance optimization to avoid expensive operations
   * @param level Log level to check
   * @returns true if the level would be logged
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this.enabled && this.shouldLog(level);
  }

  /**
   * Log an error message
   * @param message Error message string
   * @param data Optional additional data to include
   */
  error(message: string, data?: unknown): void {
    if (arguments.length === 1) {
      this.log("error", message);
    } else {
      this.log("error", message, data);
    }
  }

  /**
   * Log a warning message
   * @param message Warning message string
   * @param data Optional additional data to include
   */
  warn(message: string, data?: unknown): void {
    if (arguments.length === 1) {
      this.log("warn", message);
    } else {
      this.log("warn", message, data);
    }
  }

  /**
   * Log an informational message
   * @param message Info message string
   * @param data Optional additional data to include
   */
  info(message: string, data?: unknown): void {
    if (arguments.length === 1) {
      this.log("info", message);
    } else {
      this.log("info", message, data);
    }
  }

  /**
   * Log a debug message
   * @param message Debug message string
   * @param data Optional additional data to include
   */
  debug(message: string, data?: unknown): void {
    if (arguments.length === 1) {
      this.log("debug", message);
    } else {
      this.log("debug", message, data);
    }
  }

  /**
   * Internal logging method that handles formatting and output
   * @param level Log level for this message
   * @param message Message string
   * @param data Optional additional data
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    try {
      const timestamp = this.formatTimestamp();
      const levelTag = level.toUpperCase();
      const formattedMessage = `[${timestamp}] [${levelTag}] ${message}`;

      const consoleMethod = this.consoleMethods[level];

      if (arguments.length > 2) {
        // Data parameter was passed (even if undefined)
        const serializedData = this.safeSerialize(data);
        this.callConsoleMethod(
          consoleMethod,
          `${formattedMessage}: ${serializedData}`,
        );
      } else {
        this.callConsoleMethod(consoleMethod, formattedMessage);
      }
    } catch {
      // Fail safe: if logging fails, don't crash the application
      // Try to log the original message with minimal formatting
      try {
        console.error(`[LOGGER ERROR] Failed to log: ${message}`);
      } catch {
        // If even that fails, silently continue
      }
    }
  }

  /**
   * Check if a message at the given level should be logged
   * @param level Log level to check
   * @returns true if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] <= this.levelPriority[this.currentLevel];
  }

  /**
   * Safely call the appropriate console method
   * @param method Console method name
   * @param message Message to log
   */
  private callConsoleMethod(method: keyof Console, message: string): void {
    switch (method) {
      case "error":
        console.error(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(message);
        break;
      case "log":
        // eslint-disable-next-line no-console
        console.log(message);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(message);
        break;
    }
  }

  /**
   * Format current timestamp as ISO string
   * @returns ISO timestamp string
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Safely serialize data to string, handling circular references
   * @param data Data to serialize
   * @returns Serialized string representation
   */
  private safeSerialize(data: unknown): string {
    try {
      // Handle primitives and null/undefined
      if (
        data === null ||
        data === undefined ||
        typeof data === "string" ||
        typeof data === "number" ||
        typeof data === "boolean"
      ) {
        return String(data);
      }

      // Handle objects and arrays with circular reference protection
      const seen = new WeakSet();
      const replacer = (key: string, value: unknown): unknown => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      };

      return JSON.stringify(data, replacer);
    } catch (error) {
      // Fallback for any serialization errors
      return `[Serialization Error: ${String(error)}]`;
    }
  }
}

/**
 * Default logger instance pre-configured for immediate use
 * Configured with warn level and enabled by default
 */
export const logger = new SimpleLogger();
