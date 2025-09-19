/**
 * Log Level Type Definition
 *
 * Defines the available log levels in order of priority.
 * Lower priority levels include higher priority levels
 * (e.g., 'info' level shows info, warn, and error messages).
 */

/**
 * Available log levels in order of priority
 * - error: Critical errors and failures
 * - warn: Warning conditions and potential issues
 * - info: General informational messages
 * - debug: Detailed debugging information
 */
export type LogLevel = "error" | "warn" | "info" | "debug";
