/**
 * Schema Output Type Utility
 *
 * TypeScript utility type for extracting output types from Zod schemas.
 */

import { z } from "zod";

/**
 * Extract the output type from a Zod schema.
 *
 * @template TSchema The Zod schema type
 */
export type SchemaOutput<TSchema extends z.ZodTypeAny> = z.output<TSchema>;
