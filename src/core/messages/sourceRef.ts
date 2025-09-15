/**
 * Source Reference Interface
 *
 * Interface for citation and reference tracking within messages.
 * Enables linking to source documents, URLs, or other reference materials.
 *
 * @example
 * ```typescript
 * const citation: SourceRef = {
 *   id: "doc-123",
 *   url: "https://example.com/document",
 *   title: "Reference Document"
 * };
 * ```
 */
export interface SourceRef {
  /** Unique identifier for the source reference */
  id: string;
  /** Optional URL to the source material */
  url?: string;
  /** Optional title or description of the source */
  title?: string;
  /** Additional metadata for the source reference */
  metadata?: Record<string, unknown>;
}
