/**
 * Logging Module Exports
 *
 * This module provides a simple, cross-platform logging utility
 * that works consistently across Node.js, browser, and React Native
 * environments with level-based filtering and safe serialization.
 *
 * @example
 * ```typescript
 * import { logger, LogLevel, LoggingConfig } from "@/core/logging";
 *
 * // Use default logger instance
 * logger.error("Connection failed", { code: "TIMEOUT" });
 * logger.warn("Rate limit approaching");
 *
 * // Configure logger behavior
 * logger.configure({ level: "debug", enabled: true });
 *
 * // Create custom logger instance
 * const customLogger = new SimpleLogger();
 * customLogger.configure({ level: "info" });
 * ```
 */

// Type exports
export type { LogLevel } from "./logLevel";
export type { LoggingConfig } from "./loggingConfig";

// Class exports
export { SimpleLogger } from "./simpleLogger";

// Default instance export
export { logger } from "./simpleLogger";
