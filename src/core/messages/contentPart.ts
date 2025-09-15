/**
 * Content Part Types
 *
 * Strongly-typed content part definitions derived from Zod validation schemas.
 * Supports text, image, document, and code content types with comprehensive
 * validation and type safety.
 *
 * @example
 * ```typescript
 * import { ContentPart, TextContent } from "./contentPart.js";
 *
 * const textContent: TextContent = {
 *   type: "text",
 *   text: "Hello, world!"
 * };
 *
 * const imageContent: ContentPart = {
 *   type: "image",
 *   data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY...",
 *   mimeType: "image/png",
 *   alt: "Sample image"
 * };
 * ```
 */

export type { ContentPart } from "./contentPartTypes.js";
