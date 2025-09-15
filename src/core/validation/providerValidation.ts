/**
 * Provider Configuration Validation Utilities
 *
 * Functions for validating provider configurations and registrations
 * using the provider schemas with meaningful error messages.
 */

import type { z } from "zod";
import { validateOrThrow } from "./validateOrThrow.js";
import type { ValidationOptions } from "./validationOptions.js";
import { providerSchemas } from "./providerSchemas.js";

/**
 * Validate provider configuration with specific schema
 */
function validateProviderConfig<T>(
  providerId: string,
  config: unknown,
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {},
): T {
  return validateOrThrow(schema, config, {
    errorPrefix: `Invalid configuration for provider '${providerId}'`,
    ...options,
  });
}

/**
 * Validate provider registration data
 */
function validateProviderRegistration(
  registrationData: unknown,
  options: ValidationOptions = {},
) {
  return validateOrThrow(
    providerSchemas.ProviderRegistrationSchema,
    registrationData,
    {
      errorPrefix: "Invalid provider registration data",
      ...options,
    },
  );
}

/**
 * Provider validation utilities
 */
export const providerValidation = {
  validateProviderConfig,
  validateProviderRegistration,
};
