/**
 * Content Part Schema
 *
 * Main Zod discriminated union schema for ContentPart validation supporting
 * text, image, document, and code content types with proper discrimination.
 *
 * @example
 * ```typescript
 * import { ContentPartSchema } from "./contentPartSchema.js";
 *
 * const result = ContentPartSchema.parse({
 *   type: "text",
 *   text: "Hello, world!"
 * });
 * ```
 */

import { z } from "zod";
import { commonSchemas } from "../validation/commonSchemas.js";

const TextContentSchema = z
  .object({
    type: z.literal("text"),
    text: z
      .string()
      .min(1, "Text content cannot be empty")
      .refine(
        (text) => text.trim().length > 0,
        "Text content cannot be only whitespace",
      ),
  })
  .strict();

const ImageContentSchema = z
  .object({
    type: z.literal("image"),
    data: commonSchemas.base64,
    mimeType: commonSchemas.imageMimeType,
    alt: z.string().optional(),
  })
  .strict();

const DocumentContentSchema = z
  .object({
    type: z.literal("document"),
    data: commonSchemas.base64,
    mimeType: commonSchemas.documentMimeType,
    name: commonSchemas.filename.optional(),
  })
  .strict();

const CodeContentSchema = z
  .object({
    type: z.literal("code"),
    text: z
      .string()
      .min(1, "Code content cannot be empty")
      .refine(
        (text) => text.trim().length > 0,
        "Code content cannot be only whitespace",
      ),
    language: commonSchemas.languageIdentifier.optional(),
    filename: commonSchemas.filename.optional(),
  })
  .strict();

/**
 * Discriminated union schema for all ContentPart types.
 * Uses the 'type' field for discrimination between content types.
 */
export const ContentPartSchema = z.discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  DocumentContentSchema,
  CodeContentSchema,
]);
