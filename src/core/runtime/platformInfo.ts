/**
 * Platform Information
 *
 * Platform information including type and capabilities.
 * Provides comprehensive information about the current execution environment.
 */

import type { Platform } from "./platform.js";
import type { PlatformCapabilities } from "./platformCapabilities.js";

/**
 * Platform information including type and capabilities.
 */
export interface PlatformInfo {
  /** Platform type identifier */
  readonly platform: Platform;
  /** Platform version or identifier string */
  readonly version?: string;
  /** Platform capability information */
  readonly capabilities: PlatformCapabilities;
}
