/**
 * SSE Event Interface and Validation
 *
 * Defines the structure for Server-Sent Events as parsed from streaming responses.
 * Follows the W3C Server-Sent Events specification for event-stream data.
 *
 * @example
 * ```typescript
 * const event: SseEvent = {
 *   data: '{"content": "Hello world"}',
 *   event: "message",
 *   id: "123",
 *   retry: 5000
 * };
 * ```
 */

import { z } from "zod";

/**
 * Server-Sent Event structure containing parsed SSE fields.
 * All fields are optional as per SSE specification.
 */
export interface SseEvent {
  /** Event data payload, typically JSON string */
  data?: string;
  /** Event type identifier */
  event?: string;
  /** Event ID for tracking and replay */
  id?: string;
  /** Retry timeout in milliseconds */
  retry?: number;
}

/**
 * Zod validation schema for SSE events.
 * Validates field types and constraints per SSE specification.
 */
export const sseEventSchema = z.object({
  data: z.string().optional(),
  event: z.string().optional(),
  id: z.string().optional(),
  retry: z.int().min(0).optional(),
});
