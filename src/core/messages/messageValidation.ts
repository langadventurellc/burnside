/**
 * Message Validation Utility
 *
 * Provides validation function for Message objects using the MessageSchema.
 *
 * @example
 * ```typescript
 * import { validateMessage } from "./messageValidation";
 *
 * const message = validateMessage({
 *   role: "user",
 *   content: [{ type: "text", text: "Hello!" }],
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */

import { MessageSchema } from "./messageSchema";
import { validateOrThrow } from "../validation/validateOrThrow";

/**
 * Validates a message input and returns a typed Message object.
 *
 * @param input The input value to validate
 * @returns Validated Message object
 * @throws ValidationError if validation fails with detailed error information
 *
 * @example
 * ```typescript
 * const message = validateMessage({
 *   role: "user",
 *   content: [{ type: "text", text: "Hello!" }],
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export function validateMessage(input: unknown) {
  return validateOrThrow(MessageSchema, input, {
    errorPrefix: "Message validation failed",
  });
}
