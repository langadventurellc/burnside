/**
 * Error Serialization Function
 *
 * Converts error objects to JSON-safe format for logging and transport.
 * Handles circular references and preserves essential error information.
 *
 * @example
 * ```typescript
 * import { serializeError } from "./serializeError";
 *
 * const error = new TransportError("Connection failed", {
 *   url: "https://api.openai.com",
 *   timeout: 30000
 * });
 *
 * const serialized = serializeError(error);
 * console.log(JSON.stringify(serialized, null, 2));
 * ```
 */
import type { SerializedError } from "./serializedError";

/**
 * Safely converts a non-Error object to a string representation.
 */
function stringifyNonError(error: unknown): string {
  let errorString: string;
  try {
    if (typeof error === "object" && error !== null) {
      errorString = JSON.stringify(error);
    } else if (
      typeof error === "string" ||
      typeof error === "number" ||
      typeof error === "boolean"
    ) {
      errorString = String(error);
    } else {
      errorString = "[Non-serializable error object]";
    }
  } catch {
    errorString = "[Object that cannot be stringified]";
  }
  return errorString;
}

/**
 * Safely serializes error context, handling circular references.
 */
function serializeContext(
  context: unknown,
): Record<string, unknown> | undefined {
  if (typeof context !== "object" || context === null) {
    return undefined;
  }

  try {
    const contextString = JSON.stringify(context);
    return JSON.parse(contextString) as Record<string, unknown>;
  } catch {
    return { serialization_failed: true };
  }
}

/**
 * Adds enumerable properties from the error to the serialized object.
 */
function addEnumerableProperties(
  error: Error,
  serialized: SerializedError,
): void {
  for (const [key, value] of Object.entries(error)) {
    if (!serialized[key] && value !== undefined) {
      try {
        JSON.stringify(value);
        if (typeof value === "string") {
          serialized[key] = value;
        } else if (typeof value === "number") {
          serialized[key] = value;
        } else if (typeof value === "boolean") {
          serialized[key] = value;
        }
      } catch {
        // Skip non-serializable properties
      }
    }
  }
}

/**
 * Converts an error object to a JSON-safe serialized format.
 *
 * Preserves error information including name, message, code, context,
 * and stack trace while handling circular references safely.
 *
 * @param error - The error object to serialize
 * @returns Serialized error object safe for JSON.stringify()
 *
 * @example
 * ```typescript
 * const error = new AuthError("Invalid token", {
 *   provider: "openai",
 *   requestId: "req_123"
 * });
 *
 * const serialized = serializeError(error);
 * // {
 * //   name: "AuthError",
 * //   message: "Invalid token",
 * //   code: "AUTH_ERROR",
 * //   context: { provider: "openai", requestId: "req_123" },
 * //   stack: "AuthError: Invalid token\n    at ..."
 * // }
 * ```
 */
export function serializeError(error: unknown): SerializedError {
  if (error === null || error === undefined) {
    return {
      name: "Unknown",
      message: "Unknown error occurred",
    };
  }

  if (!(error instanceof Error)) {
    return {
      name: "NonErrorObject",
      message: stringifyNonError(error),
    };
  }

  const serialized: SerializedError = {
    name: error.name || "Error",
    message: error.message || "No message provided",
  };

  // Add stack trace if available
  if (error.stack) {
    serialized.stack = error.stack;
  }

  // Add error code if it's a BridgeError or has a code property
  if ("code" in error && typeof error.code === "string") {
    serialized.code = error.code;
  }

  // Add context if it's a BridgeError or has context property
  if ("context" in error) {
    const context = serializeContext(error.context);
    if (context) {
      serialized.context = context;
    }
  }

  // Add any other enumerable properties from the error
  addEnumerableProperties(error, serialized);

  return serialized;
}
