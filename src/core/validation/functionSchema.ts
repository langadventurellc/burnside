import { z } from "zod";

type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Create a Zod schema that validates a JavaScript function.
 *
 * Zod 4's `z.function()` helper no longer produces a first-class schema that can
 * be embedded in other schemas, so this utility provides a lightweight wrapper
 * around `z.custom` to preserve the previous behaviour when validating object
 * shapes that include callable properties.
 *
 * @param message - Optional error message when validation fails
 */
export function functionSchema(message = "Must be a function") {
  return z.custom<AnyFunction>(
    (value): value is AnyFunction => typeof value === "function",
    { message },
  );
}
