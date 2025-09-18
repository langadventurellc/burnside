/**
 * xAI v1 Error Response Schema
 *
 * Zod schema for validating xAI API v1 error response structure.
 */

import { z } from "zod";

/**
 * xAI Error Response Schema
 */
export const XAIV1ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1, "Error code cannot be empty"),
    message: z.string().min(1, "Error message cannot be empty"),
    type: z.string().optional(),
    param: z.string().nullable().optional(),
  }),
});

/**
 * TypeScript type derived from the error response schema
 */
export type XAIV1ErrorResponse = z.infer<typeof XAIV1ErrorResponseSchema>;
