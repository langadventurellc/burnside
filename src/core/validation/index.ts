/**
 * Validation Module Exports
 *
 * Centralized exports for the validation module providing Zod-based
 * validation infrastructure, common schemas, error formatting,
 * and type utilities for the LLM Bridge library.
 *
 * This module serves as the foundation for schema-driven validation
 * throughout the library, enabling type-safe validation of messages,
 * content parts, tool definitions, and configuration objects.
 */

// Type utilities
export type { ValidationResult } from "./validationResult.js";
export type { SchemaInput } from "./schemaInput.js";
export type { SchemaOutput } from "./schemaOutput.js";
export type { TypeGuard } from "./typeGuard.js";
export type { SchemaValidator } from "./schemaValidator.js";
export type { ValidationOptions } from "./validationOptions.js";
export type { SchemaCompositionOptions } from "./schemaCompositionOptions.js";

// Common validation schemas
export { commonSchemas } from "./commonSchemas.js";

// Provider validation
export { providerSchemas } from "./providerSchemas.js";
export { providerValidation } from "./providerValidation.js";
export type { ProviderSchemaTypes } from "./providerSchemaTypes.js";

// Validation utilities
export { formatValidationError } from "./formatValidationError.js";
export { safeValidate } from "./safeValidate.js";
export { validateOrThrow } from "./validateOrThrow.js";
export { createTypeGuard } from "./createTypeGuard.js";
export { schemaComposition } from "./schemaComposition.js";
