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
export type { ValidationResult } from "./validationResult";
export type { SchemaInput } from "./schemaInput";
export type { SchemaOutput } from "./schemaOutput";
export type { TypeGuard } from "./typeGuard";
export type { SchemaValidator } from "./schemaValidator";
export type { ValidationOptions } from "./validationOptions";
export type { SchemaCompositionOptions } from "./schemaCompositionOptions";

// Common validation schemas
export { commonSchemas } from "./commonSchemas";

// Provider validation
export { providerSchemas } from "./providerSchemas";
export { providerValidation } from "./providerValidation";
export type { ProviderSchemaTypes } from "./providerSchemaTypes";

// Validation utilities
export { formatValidationError } from "./formatValidationError";
export { safeValidate } from "./safeValidate";
export { validateOrThrow } from "./validateOrThrow";
export { createTypeGuard } from "./createTypeGuard";
export { schemaComposition } from "./schemaComposition";
