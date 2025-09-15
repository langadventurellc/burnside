/**
 * Content Part Validation Utilities
 *
 * Utility functions for validating and type-checking ContentPart objects
 * using the Zod schema with safe validation and type guards.
 */

import { ContentPartSchema } from "./contentPartSchema.js";

/**
 * Validation utility for safely validating content parts.
 * Returns a success/error result without throwing.
 *
 * @param data - Data to validate as a ContentPart
 * @returns Zod SafeParseReturnType with success flag and parsed data or error
 *
 * @example
 * ```typescript
 * const result = validateContentPart({ type: "text", text: "Hello" });
 * if (result.success) {
 *   console.log("Valid content:", result.data);
 * } else {
 *   console.log("Validation errors:", result.error.issues);
 * }
 * ```
 */
export const validateContentPart = (data: unknown) => {
  return ContentPartSchema.safeParse(data);
};
