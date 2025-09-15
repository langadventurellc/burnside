/**
 * Platform Capabilities
 *
 * Platform capability information describing available features.
 * Used to determine what operations are supported in the current environment.
 */

import type { Platform } from "./platform.js";

/**
 * Platform capability information describing available features.
 */
export interface PlatformCapabilities {
  /** Platform type identifier */
  readonly platform: Platform;
  /** Whether HTTP fetch operations are supported */
  readonly hasHttp: boolean;
  /** Whether timer operations are supported */
  readonly hasTimers: boolean;
  /** Whether file system operations are supported */
  readonly hasFileSystem: boolean;
  /** Additional platform-specific capability flags */
  readonly features: Record<string, boolean>;
}
