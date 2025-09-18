/**
 * xAI Streaming Events Test Fixtures
 *
 * Realistic xAI streaming response examples for comprehensive testing.
 * These fixtures represent actual Server-Sent Events format used by xAI API.
 */

/**
 * Response creation event - sets up the streaming session
 */
export const RESPONSE_CREATED_CHUNK = JSON.stringify({
  sequence_number: 0,
  type: "response.created",
  response: {
    id: "response-abc123",
    model: "grok-3",
    created_at: 1703097600,
  },
});

/**
 * Response completion event - final event with usage stats
 */
export const RESPONSE_COMPLETED_CHUNK = JSON.stringify({
  sequence_number: 10,
  type: "response.completed",
  response: {
    id: "response-abc123",
    model: "grok-3",
    created_at: 1703097600,
    usage: {
      input_tokens: 25,
      output_tokens: 15,
      total_tokens: 40,
    },
  },
});

/**
 * Basic text content streaming - initial chunk with response ID
 */
export const INITIAL_TEXT_CHUNK = JSON.stringify({
  sequence_number: 1,
  type: "response.output_text.delta",
  content_index: 0,
  delta: "Hello! I'm ",
  item_id: "msg_response-abc123",
  output_index: 1,
});

/**
 * Continuation text chunk
 */
export const CONTINUATION_TEXT_CHUNK = JSON.stringify({
  sequence_number: 2,
  type: "response.output_text.delta",
  content_index: 0,
  delta: "happy to help you today!",
  item_id: "msg_response-abc123",
  output_index: 1,
});

/**
 * Tool call chunk - initial function name (new format - simplified for now)
 */
export const TOOL_CALL_START_CHUNK = JSON.stringify({
  sequence_number: 3,
  type: "response.output_text.delta",
  content_index: 0,
  delta: "I'll help you calculate that.",
  item_id: "msg_response-def456",
  output_index: 1,
});

/**
 * Tool call chunk - streaming arguments (new format - simplified for now)
 */
export const TOOL_CALL_ARGS_CHUNK = JSON.stringify({
  sequence_number: 4,
  type: "response.output_text.delta",
  content_index: 0,
  delta: " The result is 8.",
  item_id: "msg_response-def456",
  output_index: 1,
});

/**
 * Final chunk with usage information - use RESPONSE_COMPLETED_CHUNK instead
 */
export const FINAL_CHUNK_WITH_USAGE = RESPONSE_COMPLETED_CHUNK;

/**
 * Empty content chunk (should be skipped gracefully)
 */
export const EMPTY_CONTENT_CHUNK = JSON.stringify({
  sequence_number: 5,
  type: "response.completed",
  response: {
    id: "response-ghi789",
    model: "grok-3",
    created_at: 1703097600,
    usage: {
      input_tokens: 10,
      output_tokens: 0,
      total_tokens: 10,
    },
  },
});

/**
 * Error response chunk
 */
export const ERROR_RESPONSE_CHUNK = JSON.stringify({
  error: {
    message: "Rate limit exceeded",
    type: "rate_limit_error",
    code: "rate_limit_exceeded",
  },
});

/**
 * Malformed JSON for error testing
 */
export const MALFORMED_JSON_CHUNK = '{"id": "incomplete", "object":';

/**
 * Complete conversation flow - text only
 */
export const TEXT_CONVERSATION_FLOW = [
  `data: ${RESPONSE_CREATED_CHUNK}`,
  "",
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${CONTINUATION_TEXT_CHUNK}`,
  "",
  `data: ${RESPONSE_COMPLETED_CHUNK}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Complete conversation flow - with tool calls
 */
export const TOOL_CALL_CONVERSATION_FLOW = [
  `data: ${RESPONSE_CREATED_CHUNK}`,
  "",
  `data: ${TOOL_CALL_START_CHUNK}`,
  "",
  `data: ${TOOL_CALL_ARGS_CHUNK}`,
  "",
  `data: ${RESPONSE_COMPLETED_CHUNK}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Mixed content and tool call conversation
 */
export const MIXED_CONVERSATION_FLOW = [
  `data: ${RESPONSE_CREATED_CHUNK}`,
  "",
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${CONTINUATION_TEXT_CHUNK}`,
  "",
  `data: ${RESPONSE_COMPLETED_CHUNK}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Error during streaming
 */
export const ERROR_DURING_STREAMING = [
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${ERROR_RESPONSE_CHUNK}`,
  "",
].join("\n");

/**
 * Stream with malformed chunks
 */
export const MALFORMED_STREAM = [
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${MALFORMED_JSON_CHUNK}`,
  "",
  `data: ${CONTINUATION_TEXT_CHUNK}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Large content chunk for memory testing
 */
export const LARGE_CONTENT_CHUNK = JSON.stringify({
  sequence_number: 6,
  type: "response.output_text.delta",
  content_index: 0,
  delta: "A".repeat(10000), // 10KB of text
  item_id: "msg_response-large123",
  output_index: 1,
});

/**
 * Complex tool call with large arguments
 */
export const COMPLEX_TOOL_CALL_CHUNK = JSON.stringify({
  id: "response-complex789",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        tool_calls: [
          {
            id: "call_complex123",
            type: "function",
            function: {
              name: "process_data",
              arguments: JSON.stringify({
                data: Array.from({ length: 100 }, (_, i) => ({
                  id: i,
                  value: `item_${i}`,
                  nested: { deep: { value: i * 2 } },
                })),
                options: {
                  format: "json",
                  validate: true,
                  transform: "normalize",
                },
              }),
            },
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Multiple tool calls in single chunk
 */
export const MULTIPLE_TOOL_CALLS_CHUNK = JSON.stringify({
  id: "response-multi456",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        tool_calls: [
          {
            id: "call_first123",
            type: "function",
            function: {
              name: "get_weather",
              arguments: '{"location": "San Francisco"}',
            },
          },
          {
            id: "call_second456",
            type: "function",
            function: {
              name: "get_news",
              arguments: '{"category": "technology", "limit": 5}',
            },
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Edge case: chunk with optional fields missing
 */
export const MINIMAL_CHUNK = JSON.stringify({
  sequence_number: 7,
  type: "response.completed",
  response: {
    id: "response-minimal",
    model: "grok-3",
  },
});

/**
 * Edge case: chunk with all optional fields present
 */
export const MAXIMAL_CHUNK = JSON.stringify({
  sequence_number: 8,
  type: "response.output_text.delta",
  content_index: 0,
  delta: "Complete response",
  item_id: "msg_response-maximal",
  output_index: 1,
});
