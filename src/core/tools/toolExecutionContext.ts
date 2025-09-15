/**
 * Tool Execution Context Interface
 *
 * Interface placeholder for tool execution environment data.
 * Provides context information available during tool execution,
 * such as user information, session data, and execution environment.
 *
 * @example
 * ```typescript
 * const context: ToolExecutionContext = {
 *   userId: "user-123",
 *   sessionId: "session-456",
 *   environment: "production",
 *   permissions: ["read", "write"]
 * };
 * ```
 */
export interface ToolExecutionContext {
  /** Optional user identifier for the execution */
  userId?: string;
  /** Optional session identifier */
  sessionId?: string;
  /** Optional execution environment information */
  environment?: string;
  /** Optional permissions available during execution */
  permissions?: string[];
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}
