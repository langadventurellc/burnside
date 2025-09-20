/**
 * Platform Type
 *
 * Platform types supported by the runtime adapter system.
 * Used to identify the current execution environment and select
 * appropriate runtime adapters.
 */

/**
 * Platform types supported by the runtime adapter system.
 */
export type Platform =
  | "node"
  | "browser"
  | "electron"
  | "electron-renderer"
  | "react-native";
