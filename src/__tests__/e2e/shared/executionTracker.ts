/**
 * Execution Tracker for E2E Tool Testing
 *
 * Tracks tool execution to validate that tools are actually called
 * during E2E tests, without being brittle about exact parameter values.
 */

import type { ToolHandler } from "../../../core/tools/toolHandler";

/**
 * Tracks tool execution for testing purposes
 */
export class ExecutionTracker {
  private executed = false;
  private lastParameters: Record<string, unknown> | null = null;
  private executionCount = 0;

  /**
   * Creates a tool handler that tracks execution
   */
  createHandler(baseHandler: ToolHandler): ToolHandler {
    return async (
      parameters: Record<string, unknown>,
      context?: unknown,
    ): Promise<unknown> => {
      this.executed = true;
      this.lastParameters = parameters;
      this.executionCount++;

      // Call the base handler
      return baseHandler(parameters, context);
    };
  }

  /**
   * Check if the tool was executed
   */
  wasExecuted(): boolean {
    return this.executed;
  }

  /**
   * Check if parameters were provided
   */
  hasParameters(): boolean {
    return (
      this.lastParameters !== null &&
      Object.keys(this.lastParameters).length > 0
    );
  }

  /**
   * Check if a specific parameter key exists
   */
  hasParameterKey(key: string): boolean {
    return this.lastParameters !== null && key in this.lastParameters;
  }

  /**
   * Get all parameter keys
   */
  getParameterKeys(): string[] {
    return this.lastParameters ? Object.keys(this.lastParameters) : [];
  }

  /**
   * Get execution count
   */
  getExecutionCount(): number {
    return this.executionCount;
  }

  /**
   * Get last parameters (for debugging)
   */
  getLastParameters(): Record<string, unknown> | null {
    return this.lastParameters;
  }

  /**
   * Reset tracker state for test isolation
   */
  reset(): void {
    this.executed = false;
    this.lastParameters = null;
    this.executionCount = 0;
  }
}
