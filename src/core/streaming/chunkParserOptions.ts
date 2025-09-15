/**
 * Chunk Parser Options
 *
 * Configuration options for ChunkParser.
 */

/**
 * Configuration options for ChunkParser.
 */
export interface ChunkParserOptions {
  /** Maximum size in bytes for a single JSON object (default: 1MB) */
  maxObjectSize?: number;
  /** Text encoding for chunk decoding (default: 'utf-8') */
  encoding?: string;
}
