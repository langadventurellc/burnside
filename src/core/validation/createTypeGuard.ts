/**
 * Type Guard Creator Utility
 *
 * Create type guard functions from Zod schemas for runtime type checking.
 */

import { z } from "zod";

/**
 * Create a type guard function from a Zod schema.
 *
 * @template T The expected output type
 * @param schema The Zod schema to create a type guard for
 * @returns Type guard function
 */
export function createTypeGuard<T>(schema: z.ZodSchema<T>) {
  return (value: unknown): value is T => {
    return schema.safeParse(value).success;
  };
}
