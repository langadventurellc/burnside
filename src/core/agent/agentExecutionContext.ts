/**
 * Agent Execution Context Utilities
 *
 * Provides execution context creation utilities for agent operations.
 * Creates ToolExecutionContext from message history and manages execution
 * environment data for tool execution within agent loops.
 */

import type { Message } from "../messages/message";
import type { ToolExecutionContext } from "../tools/toolExecutionContext";

/**
 * Creates a ToolExecutionContext from message history and execution metadata
 *
 * Extracts relevant context information from the conversation history and
 * generates a unique execution context for tool execution. Includes session
 * tracking, metadata extraction, and security constraints.
 *
 * @param messages - Array of messages from conversation history
 * @param options - Optional context creation options
 * @returns ToolExecutionContext for tool execution
 *
 * @example
 * ```typescript
 * const messages: Message[] = [
 *   { role: "user", content: [{ type: "text", text: "Hello" }] }
 * ];
 * const context = createExecutionContext(messages);
 * // Returns context with unique ID and extracted metadata
 * ```
 */
export function createExecutionContext(
  messages: Message[],
  options?: {
    userId?: string;
    sessionId?: string;
    environment?: string;
    permissions?: string[];
  },
): ToolExecutionContext {
  // Generate unique context ID for this execution
  const contextId = `ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Extract metadata from message history
  const messageMetadata = extractMessageMetadata(messages);

  // Get timestamp from most recent message or current time
  const timestamp =
    messages.length > 0
      ? messages[messages.length - 1]?.timestamp || new Date().toISOString()
      : new Date().toISOString();

  return {
    userId: options?.userId,
    sessionId: options?.sessionId || `session-${contextId}`,
    environment: options?.environment || "agent-loop",
    permissions: options?.permissions || ["read"],
    metadata: {
      contextId,
      timestamp,
      messageCount: messages.length,
      conversationMetadata: messageMetadata,
      executionSource: "agent-loop",
    },
  };
}

/**
 * Extracts relevant metadata from message history
 *
 * Analyzes the conversation history to extract useful context information
 * such as message sources, content types, and conversation patterns.
 *
 * @param messages - Array of messages to analyze
 * @returns Extracted metadata object
 */
function extractMessageMetadata(messages: Message[]): Record<string, unknown> {
  if (messages.length === 0) {
    return { isEmpty: true };
  }

  const roles = new Set(messages.map((msg) => msg.role));
  const contentTypes = new Set(
    messages.flatMap((msg) => msg.content.map((part) => part.type)),
  );

  const hasUserMessages = roles.has("user");
  const hasAssistantMessages = roles.has("assistant");
  const hasToolMessages = roles.has("tool");

  return {
    totalMessages: messages.length,
    roles: Array.from(roles),
    contentTypes: Array.from(contentTypes),
    hasUserMessages,
    hasAssistantMessages,
    hasToolMessages,
    conversationFlow: {
      startsWithUser: messages[0]?.role === "user",
      endsWithAssistant: messages[messages.length - 1]?.role === "assistant",
    },
  };
}
