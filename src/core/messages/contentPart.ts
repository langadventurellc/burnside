/**
 * Content Part Interface
 *
 * Base interface for different types of content that can be included in a message.
 * Content parts enable rich, multi-modal messages with text, images, and other media.
 *
 * @example
 * ```typescript
 * const textContent: ContentPart = {
 *   type: "text",
 *   text: "Hello, world!"
 * };
 * ```
 */
export interface ContentPart {
  /** The type of content (text, image, etc.) */
  type: string;
  /** Additional properties are defined by specific content type implementations */
  [key: string]: unknown;
}
