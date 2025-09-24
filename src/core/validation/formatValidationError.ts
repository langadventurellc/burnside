/**
 * Validation Error Formatter
 *
 * Utility for formatting validation error messages with context and field information.
 */

import { z } from "zod";
import type { ValidationOptions } from "./validationOptions";

/**
 * Format validation error messages with context and field information.
 *
 * @param issues Array of Zod validation issues
 * @param options Validation options for customizing error formatting
 * @returns Formatted error message string
 */
export function formatValidationError(
  issues: z.core.$ZodIssue[],
  options: ValidationOptions = {},
): string {
  const { includePath = true, errorPrefix = "Validation failed" } = options;

  const errorMessages = issues.map((issue) => {
    const path =
      includePath && issue.path.length > 0
        ? `at ${issue.path.join(".")}: `
        : "";
    return `${path}${issue.message}`;
  });

  return `${errorPrefix}: ${errorMessages.join(", ")}`;
}
