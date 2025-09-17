/**
 * Safe Validation Utility
 *
 * Safe parsing wrapper that returns ValidationResult instead of throwing.
 */

import { z } from "zod";
import type { ValidationResult } from "./validationResult";
import type { ValidationOptions } from "./validationOptions";
import { formatValidationError } from "./formatValidationError";

/**
 * Safe parsing wrapper that returns ValidationResult instead of throwing.
 *
 * @template T The expected output type
 * @param schema The Zod schema to validate against
 * @param input The input value to validate
 * @param options Validation options
 * @returns ValidationResult with success/failure information
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  options: ValidationOptions = {},
): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const { maxIssues = 10 } = options;
  const issues = result.error.issues.slice(0, maxIssues);

  return {
    success: false,
    error: {
      message: formatValidationError(issues, options),
      issues,
    },
  };
}
