import type { TerminationReason } from "./terminationReason";

/**
 * Enhanced termination reasons that include provider-specific completion scenarios.
 * Extends the base TerminationReason with additional provider-aware cases.
 *
 * @example Provider-specific termination reasons
 * ```typescript
 * const reason: EnhancedTerminationReason = "token_limit_reached";
 * // Provider hit token/length limit (OpenAI "length", Anthropic "max_tokens")
 *
 * const filtered: EnhancedTerminationReason = "content_filtered";
 * // Provider applied safety filtering (OpenAI "content_filter", Gemini "SAFETY")
 *
 * const stopped: EnhancedTerminationReason = "stop_sequence";
 * // Custom stop sequence matched (Anthropic "stop_sequence")
 * ```
 */
export type EnhancedTerminationReason =
  | TerminationReason
  | "token_limit_reached" // Provider reported token/length limit hit
  | "content_filtered" // Provider applied content filtering/safety
  | "stop_sequence" // Custom stop sequence was matched
  | "unknown"; // Unrecognized or ambiguous termination signal
