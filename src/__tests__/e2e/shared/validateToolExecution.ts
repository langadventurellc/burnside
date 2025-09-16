/**
 * Tool Execution Validation for E2E Testing
 *
 * Validates that tool execution results have the expected test structure
 * for consistent E2E testing verification.
 */

/**
 * Validates that a tool execution result has the expected test structure.
 *
 * Checks if the result object contains the expected properties from
 * the test tool execution (echoed, timestamp, testSuccess).
 *
 * @param result - Tool execution result to validate
 * @returns true if result has expected test structure, false otherwise
 *
 * @example
 * ```typescript
 * const result = { echoed: "hello", timestamp: "2024-...", testSuccess: true };
 * const isValid = validateToolExecution(result);
 * // Returns: true
 * ```
 */
export function validateToolExecution(result: unknown): boolean {
  if (typeof result !== "object" || result === null) {
    return false;
  }

  const obj = result as Record<string, unknown>;
  return (
    obj.testSuccess === true &&
    typeof obj.echoed === "string" &&
    typeof obj.timestamp === "string"
  );
}
