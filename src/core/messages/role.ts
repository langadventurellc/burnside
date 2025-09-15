/**
 * Message Role Type
 *
 * Represents the role of a message participant in a conversation.
 *
 * @example
 * ```typescript
 * const userMessage: Message = {
 *   role: "user",
 *   content: [{ type: "text", text: "Hello!" }]
 * };
 * ```
 */
export type Role = "system" | "user" | "assistant" | "tool";
