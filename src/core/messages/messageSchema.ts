/**
 * Message Zod Schema
 *
 * Comprehensive Zod validation schema for the Message interface providing
 * runtime validation and type inference for the core message structure.
 *
 * @example
 * ```typescript
 * import { MessageSchema } from "./messageSchema.js";
 *
 * const result = MessageSchema.parse({
 *   role: "user",
 *   content: [{ type: "text", text: "Hello, world!" }]
 * });
 * ```
 */

import { z } from "zod";
import { ContentPartSchema } from "./contentPartSchema.js";
import type { Role } from "./role.js";
import { commonSchemas } from "../validation/commonSchemas.js";

/**
 * UUID v4 validation schema for message IDs.
 */
const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Must be a valid UUID v4 format",
  );

/**
 * Role validation schema with strict enum checking.
 */
const roleSchema = z.enum(["system", "user", "assistant", "tool"], {
  errorMap: () => ({
    message: "Role must be one of: system, user, assistant, tool",
  }),
}) satisfies z.ZodSchema<Role>;

/**
 * SourceRef validation schema for message source references.
 */
const sourceRefSchema = z
  .object({
    id: z.string().min(1, "Source reference ID cannot be empty"),
    url: commonSchemas.url.optional(),
    title: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/**
 * Comprehensive Zod schema for Message interface validation.
 * Validates all required and optional fields with proper type constraints.
 */
export const MessageSchema = z
  .object({
    id: uuidSchema.optional(),
    role: roleSchema,
    content: z
      .array(ContentPartSchema)
      .min(1, "Message content cannot be empty")
      .refine(
        (content) =>
          content.every((part) => part !== null && part !== undefined),
        "All content parts must be valid",
      ),
    timestamp: commonSchemas.timestamp.optional(),
    sources: z.array(sourceRefSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
