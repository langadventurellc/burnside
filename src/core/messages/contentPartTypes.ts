/**
 * Content Part Types
 *
 * TypeScript types for ContentPart union and individual content types
 * derived from the Zod schema validation.
 */

import { z } from "zod";
import { ContentPartSchema } from "./contentPartSchema.js";

/**
 * TypeScript type for the ContentPart union derived from the schema.
 */
export type ContentPart = z.infer<typeof ContentPartSchema>;
