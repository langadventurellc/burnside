/**
 * MCP Test Data Interface
 *
 * Test data structure for consistent MCP testing.
 */

/**
 * MCP test data for consistent testing
 */
export interface McpTestData {
  /** Test message for echo tool */
  message: string;
  /** Expected echo response */
  expectedEcho: string;
  /** Test timestamp pattern */
  timestampPattern: RegExp;
}
