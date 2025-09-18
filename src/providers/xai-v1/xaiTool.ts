/**
 * xAI Tool Type
 *
 * Type definition for xAI tool format, which follows OpenAI compatibility.
 */

import type { XAIToolFunction } from "./xaiToolFunction";

/**
 * xAI tool type (matches OpenAI format)
 */
export interface XAITool {
  type: "function";
  function: XAIToolFunction;
}
