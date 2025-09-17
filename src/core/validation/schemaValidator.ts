/**
 * Schema Validator Interface
 *
 * Interface for consistent schema validation patterns across the library.
 */

import type { ValidationResult } from "./validationResult";
import type { TypeGuard } from "./typeGuard";

/**
 * Interface for consistent schema validation patterns across the library.
 *
 * @template TOutput The validated output type
 */
export interface SchemaValidator<TOutput> {
  /**
   * Validate input and return a ValidationResult.
   */
  validate(input: unknown): ValidationResult<TOutput>;

  /**
   * Parse input, throwing an error if validation fails.
   */
  parse(input: unknown): TOutput;

  /**
   * Check if input matches the schema without parsing.
   */
  safeParse(input: unknown): ValidationResult<TOutput>;

  /**
   * Type guard for runtime type checking.
   */
  is: TypeGuard<TOutput>;
}
