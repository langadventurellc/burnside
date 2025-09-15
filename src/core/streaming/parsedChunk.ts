/**
 * Parsed Chunk Interface
 *
 * Represents a parsed chunk containing extracted JSON data and original raw string.
 */

/**
 * Parsed chunk containing extracted JSON data and original raw string.
 */
export interface ParsedChunk {
  /** The parsed JSON object */
  data: unknown;
  /** The original raw string data */
  raw: string;
}
