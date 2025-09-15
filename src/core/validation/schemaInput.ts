/**
 * Schema Input Type Utility
 *
 * TypeScript utility type for extracting input types from Zod schemas.
 */

import { z } from "zod";

/**
 * Extract the input type from a Zod schema.
 *
 * @template TSchema The Zod schema type
 */
export type SchemaInput<TSchema extends z.ZodTypeAny> = z.input<TSchema>;
