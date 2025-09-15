/**
 * Message and Content Model Module
 *
 * This module contains unified message and content model definitions
 * for provider-agnostic message handling, including Message, ContentPart,
 * Role, and SourceRef types with Zod validation schemas.
 *
 * These exports provide the core abstractions for handling
 * messages across different LLM providers with type-safe validation.
 */

export type { Role } from "./role.js";
export type { ContentPart } from "./contentPart.js";
export type { SourceRef } from "./sourceRef.js";
export type { Message } from "./message.js";
export type { ValidatedMessage } from "./messageTypes.js";

// Zod schemas and validation utilities
export { ContentPartSchema } from "./contentPartSchema.js";
export { validateContentPart } from "./contentPartValidation.js";
export { MessageSchema } from "./messageSchema.js";
export { validateMessage } from "./messageValidation.js";
