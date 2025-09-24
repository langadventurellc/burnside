/**
 * Google Gemini v1 Request Schema
 *
 * Zod schemas for validating Google Gemini API v1 request structure
 * following established patterns from OpenAI and Anthropic providers.
 */

import { z } from "zod";

/**
 * Gemini text content part schema
 */
const GeminiTextPartSchema = z.object({
  text: z.string(),
});

/**
 * Gemini inline data content part schema for images and documents
 */
const GeminiInlineDataPartSchema = z.object({
  inline_data: z.object({
    mime_type: z.string(),
    data: z.string(), // Base64 encoded data
  }),
});

/**
 * Union of all Gemini content part types
 */
const GeminiPartSchema = z.union([
  GeminiTextPartSchema,
  GeminiInlineDataPartSchema,
]);

/**
 * Gemini content schema with role and parts
 */
const GeminiContentSchema = z.object({
  role: z.enum(["user", "model"]).optional(),
  parts: z
    .array(GeminiPartSchema)
    .min(1, "At least one content part is required"),
});

/**
 * Gemini function declaration schema for tool definitions
 */
const GeminiFunctionDeclarationSchema = z.object({
  name: z.string().min(1, "Function name is required"),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(), // JSON Schema object
});

/**
 * Gemini tool schema containing function declarations
 */
const GeminiToolSchema = z.object({
  function_declarations: z.array(GeminiFunctionDeclarationSchema).min(1),
});

/**
 * Gemini generation configuration schema
 */
const GeminiGenerationConfigSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().positive().max(8192).optional(),
  topK: z.number().positive().max(100).optional(),
  topP: z.number().min(0).max(1).optional(),
  stopSequences: z.array(z.string()).max(5).optional(),
  thinkingConfig: z
    .object({
      thinkingBudget: z.number().optional(),
    })
    .optional(),
});

/**
 * Gemini safety setting category enum
 */
const GeminiSafetyCategorySchema = z.enum([
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
]);

/**
 * Gemini safety setting threshold enum
 */
const GeminiSafetyThresholdSchema = z.enum([
  "BLOCK_NONE",
  "BLOCK_ONLY_HIGH",
  "BLOCK_MEDIUM_AND_ABOVE",
  "BLOCK_LOW_AND_ABOVE",
]);

/**
 * Gemini safety setting schema
 */
const GeminiSafetySettingSchema = z.object({
  category: GeminiSafetyCategorySchema,
  threshold: GeminiSafetyThresholdSchema,
});

/**
 * Gemini system instruction schema
 */
const GeminiSystemInstructionSchema = z.object({
  parts: z.array(GeminiTextPartSchema).min(1),
});

/**
 * Main Google Gemini v1 Request Schema
 *
 * Schema for validating requests to the Google Gemini API v1 endpoint.
 * Supports chat completions, multimodal content, function calling, and
 * safety configurations.
 */
export const GoogleGeminiV1RequestSchema = z.object({
  /** Array of content objects representing the conversation */
  contents: z
    .array(GeminiContentSchema)
    .min(1, "At least one content item is required"),

  /** Optional tools for function calling */
  tools: z.array(GeminiToolSchema).optional(),

  /** Optional generation configuration parameters */
  generationConfig: GeminiGenerationConfigSchema.optional(),

  /** Optional safety settings for content filtering */
  safetySettings: z.array(GeminiSafetySettingSchema).optional(),

  /** Optional system instruction for model behavior */
  systemInstruction: GeminiSystemInstructionSchema.optional(),
});

/**
 * TypeScript type inferred from the Gemini request schema
 */
export type GoogleGeminiV1Request = z.infer<typeof GoogleGeminiV1RequestSchema>;
