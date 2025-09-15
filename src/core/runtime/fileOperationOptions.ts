/**
 * File Operation Options
 *
 * Configuration options for file operations in the runtime adapter system.
 * Provides consistent file access configuration across different platforms.
 */

/**
 * Configuration options for file operations.
 */
export interface FileOperationOptions {
  /** Text encoding for file read/write operations */
  readonly encoding?: BufferEncoding;
  /** Create parent directories if they don't exist */
  readonly createDirectories?: boolean;
}
