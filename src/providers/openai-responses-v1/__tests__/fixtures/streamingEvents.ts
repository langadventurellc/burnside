/**
 * Streaming Events Fixtures
 *
 * Realistic OpenAI Responses API v1 streaming SSE event fixtures
 * for streaming integration testing and contract validation.
 */

/**
 * Complete streaming event sequence for a typical chat completion
 */
export const streamEventsComplete = [
  {
    data: JSON.stringify({
      type: "response.created",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "Hello",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "! I'm",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: " Claude,",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: " an AI assistant.",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: " How can I help you?",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.completed",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZW",
      },
      usage: {
        prompt_tokens: 12,
        completion_tokens: 19,
        total_tokens: 31,
      },
    }),
  },
  {
    data: "[DONE]",
  },
] as const;

/**
 * Expected accumulated text from streamEventsComplete
 */
export const streamEventsCompleteExpectedText =
  "Hello! I'm Claude, an AI assistant. How can I help you?" as const;

/**
 * Streaming sequence that terminates with an error
 */
export const streamEventsError = [
  {
    data: JSON.stringify({
      type: "response.created",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZX",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "I was starting to respond but",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZX",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "error",
      error: {
        type: "server_error",
        message: "Internal server error occurred during streaming",
      },
    }),
  },
] as const;

/**
 * Streaming events with partial usage information
 */
export const streamEventsPartialUsage = [
  {
    data: JSON.stringify({
      type: "response.created",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZY",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "Short response.",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZY",
      },
    }),
  },
  {
    data: JSON.stringify({
      type: "response.completed",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZY",
      },
      usage: {
        prompt_tokens: 8,
        completion_tokens: 2,
        total_tokens: 10,
      },
    }),
  },
  {
    data: "[DONE]",
  },
] as const;

/**
 * Individual streaming events for unit testing
 */
export const streamEventsIndividual = {
  responseCreated: {
    data: JSON.stringify({
      type: "response.created",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
    }),
  },
  textDelta: {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "Sample text delta",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
    }),
  },
  emptyDelta: {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "",
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
    }),
  },
  deltaWithoutText: {
    data: JSON.stringify({
      type: "response.output_text.delta",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
    }),
  },
  responseCompleted: {
    data: JSON.stringify({
      type: "response.completed",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40,
      },
    }),
  },
  completedWithoutUsage: {
    data: JSON.stringify({
      type: "response.completed",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZZ",
      },
    }),
  },
  done: {
    data: "[DONE]",
  },
} as const;

/**
 * Events with missing or malformed data for error testing
 */
export const streamEventsMalformed = {
  invalidJson: {
    data: "{ invalid json structure",
  },
  missingType: {
    data: JSON.stringify({
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZR00",
      },
    }),
  },
  unknownEventType: {
    data: JSON.stringify({
      type: "unknown.event.type",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZR01",
      },
    }),
  },
  missingResponseId: {
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: "Text without response ID",
      },
    }),
  },
} as const;

/**
 * Long streaming sequence for performance testing
 */
export const streamEventsLong = [
  {
    data: JSON.stringify({
      type: "response.created",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZR02",
      },
    }),
  },
  // Generate 50 text delta events
  ...Array.from({ length: 50 }, (_, i) => ({
    data: JSON.stringify({
      type: "response.output_text.delta",
      delta: {
        text: `Word ${i + 1} `,
      },
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZR02",
      },
    }),
  })),
  {
    data: JSON.stringify({
      type: "response.completed",
      response: {
        id: "resp_01J8KRXF7QZQZQZQZQZQZQZR02",
      },
      usage: {
        prompt_tokens: 20,
        completion_tokens: 150,
        total_tokens: 170,
      },
    }),
  },
  {
    data: "[DONE]",
  },
] as const;

/**
 * Expected text from long streaming sequence
 */
export const streamEventsLongExpectedText =
  "Word 1 Word 2 Word 3 Word 4 Word 5 Word 6 Word 7 Word 8 Word 9 Word 10 Word 11 Word 12 Word 13 Word 14 Word 15 Word 16 Word 17 Word 18 Word 19 Word 20 Word 21 Word 22 Word 23 Word 24 Word 25 Word 26 Word 27 Word 28 Word 29 Word 30 Word 31 Word 32 Word 33 Word 34 Word 35 Word 36 Word 37 Word 38 Word 39 Word 40 Word 41 Word 42 Word 43 Word 44 Word 45 Word 46 Word 47 Word 48 Word 49 Word 50 ";

/**
 * Collection of all streaming event fixtures
 */
export const streamingEvents = {
  streamEventsComplete,
  streamEventsCompleteExpectedText,
  streamEventsError,
  streamEventsPartialUsage,
  streamEventsIndividual,
  streamEventsMalformed,
  streamEventsLong,
  streamEventsLongExpectedText,
} as const;
