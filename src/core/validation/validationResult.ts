/**
 * Validation Result Type
 *
 * Result of a validation operation, containing either success data or error information.
 */

import { z } from "zod";

/**
 * Result of a validation operation, containing either success data or error information.
 *
 * @template T The type of data when validation succeeds
 */
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
        issues: z.core.$ZodIssue[];
      };
    };
