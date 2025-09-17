import type { Message } from "../../../core/messages/message";

export function createTestMessages(content: string): Message[] {
  return [
    {
      id: `test-msg-${Date.now()}`,
      role: "user",
      content: [{ type: "text", text: content }],
      timestamp: new Date().toISOString(),
    },
  ];
}
