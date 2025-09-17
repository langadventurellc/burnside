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

export type { Role } from "./role";
export type { ContentPart } from "./contentPart";
export type { SourceRef } from "./sourceRef";
export type { Message } from "./message";
export type { ValidatedMessage } from "./messageTypes";

// Zod schemas and validation utilities
export { ContentPartSchema } from "./contentPartSchema";
export { validateContentPart } from "./contentPartValidation";
export { MessageSchema } from "./messageSchema";
export { validateMessage } from "./messageValidation";
