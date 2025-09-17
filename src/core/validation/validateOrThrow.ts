/**
 * Throwing Validation Utility
 *
 * Validation wrapper that throws ValidationError on failure.
 */

import { z } from "zod";
import { ValidationError } from "../errors/validationError";
import type { ValidationOptions } from "./validationOptions";
import { safeValidate } from "./safeValidate";

/**
 * Validation wrapper that throws ValidationError on failure.
 *
 * @template T The expected output type
 * @param schema The Zod schema to validate against
 * @param input The input value to validate
 * @param options Validation options
 * @returns Validated data of type T
 * @throws ValidationError if validation fails
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  options: ValidationOptions = {},
): T {
  const result = safeValidate(schema, input, options);

  if (result.success) {
    return result.data;
  }

  throw new ValidationError(result.error.message, {
    issues: result.error.issues,
    input: typeof input === "object" ? "[object]" : input,
  });
}
