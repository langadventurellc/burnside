/**
 * Message and Content Model Module
 *
 * This module contains unified message and content model definitions
 * for provider-agnostic message handling, including Message, ContentPart,
 * Role, and SourceRef types.
 *
 * These exports provide the core abstractions for handling
 * messages across different LLM providers.
 */

export type { Role } from "./role";
export type { ContentPart } from "./contentPart";
export type { SourceRef } from "./sourceRef";
export type { Message } from "./message";
