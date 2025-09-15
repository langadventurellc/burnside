/**
 * Type Guard Function Signature
 *
 * Generic type guard function signature for runtime type checking.
 */

/**
 * Type guard function signature for runtime type checking.
 *
 * @template T The type to guard against
 * @param value The value to check
 * @returns True if value is of type T
 */
export type TypeGuard<T> = (value: unknown) => value is T;
