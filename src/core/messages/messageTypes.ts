/**
 * Message Validation Types
 *
 * Type definitions derived from Message Zod schema for validated message objects.
 */

import { z } from "zod";
import { MessageSchema } from "./messageSchema";

/**
 * Validated Message type inferred from the Zod schema.
 * This type represents a Message that has passed all validation rules.
 */
export type ValidatedMessage = z.infer<typeof MessageSchema>;
