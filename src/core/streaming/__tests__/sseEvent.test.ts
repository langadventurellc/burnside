/**
 * Tests for SSE Event interface and validation schema.
 */

import { describe, expect, test } from "@jest/globals";
import type { SseEvent } from "../sseEvent";
import { sseEventSchema } from "../sseEvent";

describe("SseEvent", () => {
  describe("interface validation", () => {
    test("should allow valid SSE event with all fields", () => {
      const event: SseEvent = {
        data: '{"content": "Hello world"}',
        event: "message",
        id: "123",
        retry: 5000,
      };

      expect(event.data).toBe('{"content": "Hello world"}');
      expect(event.event).toBe("message");
      expect(event.id).toBe("123");
      expect(event.retry).toBe(5000);
    });

    test("should allow event with only data field", () => {
      const event: SseEvent = {
        data: "test data",
      };

      expect(event.data).toBe("test data");
      expect(event.event).toBeUndefined();
      expect(event.id).toBeUndefined();
      expect(event.retry).toBeUndefined();
    });

    test("should allow empty event object", () => {
      const event: SseEvent = {};

      expect(Object.keys(event)).toHaveLength(0);
    });
  });

  describe("schema validation", () => {
    test("should validate event with all fields", () => {
      const validEvent = {
        data: "test data",
        event: "message",
        id: "123",
        retry: 1000,
      };

      const result = sseEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEvent);
      }
    });

    test("should validate event with only data field", () => {
      const event = { data: "test" };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe("test");
      }
    });

    test("should validate empty event object", () => {
      const event = {};

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    test("should reject invalid data type", () => {
      const event = { data: 123 };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should reject invalid event type", () => {
      const event = { event: 456 };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should reject invalid id type", () => {
      const event = { id: true };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should reject invalid retry type", () => {
      const event = { retry: "1000" };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should reject negative retry value", () => {
      const event = { retry: -100 };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should reject non-integer retry value", () => {
      const event = { retry: 1000.5 };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    test("should accept zero retry value", () => {
      const event = { retry: 0 };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retry).toBe(0);
      }
    });

    test("should ignore unknown fields", () => {
      const event = {
        data: "test",
        unknownField: "value",
      };

      const result = sseEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe("test");
        expect("unknownField" in result.data).toBe(false);
      }
    });
  });
});
