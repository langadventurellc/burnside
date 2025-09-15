/**
 * Validation Options Configuration
 *
 * Options for customizing validation behavior throughout the library.
 */

/**
 * Options for customizing validation behavior.
 */
export interface ValidationOptions {
  /**
   * Whether to include detailed path information in error messages.
   * @default true
   */
  includePath?: boolean;

  /**
   * Maximum number of validation issues to collect before stopping.
   * @default 10
   */
  maxIssues?: number;

  /**
   * Custom error message prefix for validation failures.
   */
  errorPrefix?: string;
}
