import type { Message } from "../../../core/messages/message";

export function validateMessageSchema(message: Message): boolean {
  return (
    typeof message.id === "string" &&
    typeof message.role === "string" &&
    Array.isArray(message.content) &&
    typeof message.timestamp === "string"
  );
}
