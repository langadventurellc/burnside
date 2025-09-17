/**
 * Google Gemini v1 Response Schema
 *
 * Zod schemas for validating Google Gemini API v1 response structure
 * before parsing to unified format.
 */

import { z } from "zod";

/**
 * Gemini response text part schema
 */
const GeminiResponseTextPartSchema = z.object({
  text: z.string(),
});

/**
 * Gemini function call schema for tool responses
 */
const GeminiFunctionCallSchema = z.object({
  name: z.string(),
  args: z.record(z.unknown()),
});

/**
 * Gemini response function call part schema
 */
const GeminiResponseFunctionCallPartSchema = z.object({
  functionCall: GeminiFunctionCallSchema,
});

/**
 * Union of all Gemini response content part types
 */
const GeminiResponsePartSchema = z.union([
  GeminiResponseTextPartSchema,
  GeminiResponseFunctionCallPartSchema,
]);

/**
 * Gemini response content schema
 */
const GeminiResponseContentSchema = z.object({
  parts: z.array(GeminiResponsePartSchema),
  role: z.enum(["user", "model"]).optional(),
});

/**
 * Gemini finish reason enum
 */
const GeminiFinishReasonSchema = z.enum([
  "FINISH_REASON_UNSPECIFIED",
  "STOP",
  "MAX_TOKENS",
  "SAFETY",
  "RECITATION",
  "OTHER",
]);

/**
 * Gemini safety category enum
 */
const GeminiSafetyCategorySchema = z.enum([
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
]);

/**
 * Gemini safety probability enum
 */
const GeminiSafetyProbabilitySchema = z.enum([
  "NEGLIGIBLE",
  "LOW",
  "MEDIUM",
  "HIGH",
]);

/**
 * Gemini safety rating schema
 */
const GeminiSafetyRatingSchema = z.object({
  category: GeminiSafetyCategorySchema,
  probability: GeminiSafetyProbabilitySchema,
  blocked: z.boolean().optional(),
});

/**
 * Gemini citation metadata schema
 */
const GeminiCitationMetadataSchema = z.object({
  citationSources: z
    .array(
      z.object({
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        uri: z.string().optional(),
        license: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Gemini candidate schema
 */
const GeminiCandidateSchema = z.object({
  content: GeminiResponseContentSchema.optional(),
  finishReason: GeminiFinishReasonSchema.optional(),
  index: z.number().optional(),
  safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
  citationMetadata: GeminiCitationMetadataSchema.optional(),
});

/**
 * Gemini usage metadata schema
 */
const GeminiUsageMetadataSchema = z.object({
  promptTokenCount: z.number().int().nonnegative().optional(),
  candidatesTokenCount: z.number().int().nonnegative().optional(),
  totalTokenCount: z.number().int().nonnegative().optional(),
});

/**
 * Gemini prompt feedback schema
 */
const GeminiPromptFeedbackSchema = z.object({
  blockReason: z
    .enum(["BLOCKED_REASON_UNSPECIFIED", "SAFETY", "OTHER"])
    .optional(),
  safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
});

/**
 * Main Google Gemini v1 Response Schema
 *
 * Schema for validating responses from the Google Gemini API v1 endpoint.
 * Supports both streaming and non-streaming response formats with
 * comprehensive metadata validation.
 */
export const GoogleGeminiV1ResponseSchema = z.object({
  /** Array of candidate responses */
  candidates: z.array(GeminiCandidateSchema).optional(),

  /** Usage metadata for token counting */
  usageMetadata: GeminiUsageMetadataSchema.optional(),

  /** Model version information */
  modelVersion: z.string().optional(),

  /** Prompt feedback for safety filtering */
  promptFeedback: GeminiPromptFeedbackSchema.optional(),
});

/**
 * Gemini streaming response chunk schema
 *
 * For Server-Sent Events (SSE) streaming responses that may contain
 * partial candidate data and usage metadata.
 */
export const GoogleGeminiV1StreamingResponseSchema = z.object({
  /** Array of partial candidate responses */
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(GeminiResponsePartSchema),
            role: z.enum(["user", "model"]).optional(),
          })
          .optional(),
        finishReason: GeminiFinishReasonSchema.optional(),
        index: z.number().optional(),
        safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
      }),
    )
    .optional(),

  /** Usage metadata (typically only in final chunk) */
  usageMetadata: GeminiUsageMetadataSchema.optional(),

  /** Model version information */
  modelVersion: z.string().optional(),
}); // Allow unknown properties for future Google API extensions

/**
 * TypeScript type inferred from the Gemini response schema
 */
export type GoogleGeminiV1Response = z.infer<
  typeof GoogleGeminiV1ResponseSchema
>;
