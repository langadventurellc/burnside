/**
 * xAI Streaming Events Test Fixtures
 *
 * Realistic xAI streaming response examples for comprehensive testing.
 * These fixtures represent actual Server-Sent Events format used by xAI API.
 */

/**
 * Basic text content streaming - initial chunk with response ID
 */
export const INITIAL_TEXT_CHUNK = JSON.stringify({
  id: "response-abc123",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Hello! I'm ",
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Continuation text chunk
 */
export const CONTINUATION_TEXT_CHUNK = JSON.stringify({
  id: "response-abc123",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        content: [
          {
            type: "output_text",
            text: "happy to help you today!",
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Tool call chunk - initial function name
 */
export const TOOL_CALL_START_CHUNK = JSON.stringify({
  id: "response-def456",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        role: "assistant",
        tool_calls: [
          {
            id: "call_123abc",
            type: "function",
            function: {
              name: "calculate",
              arguments: "",
            },
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Tool call chunk - streaming arguments
 */
export const TOOL_CALL_ARGS_CHUNK = JSON.stringify({
  id: "response-def456",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        tool_calls: [
          {
            id: "call_123abc",
            type: "function",
            function: {
              name: "",
              arguments: '{"num1": 5, "num2": 3, "operation": "add"}',
            },
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
});

/**
 * Final chunk with usage information
 */
export const FINAL_CHUNK_WITH_USAGE = JSON.stringify({
  id: "response-abc123",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {},
    },
  ],
  usage: {
    input_tokens: 25,
    input_tokens_details: {
      cached_tokens: 0,
    },
    output_tokens: 15,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: 40,
  },
  created_at: 1703097600,
});

/**
 * Empty content chunk (should be skipped gracefully)
 */
export const EMPTY_CONTENT_CHUNK = JSON.stringify({
  id: "response-ghi789",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        content: [],
      },
    },
  ],
  created_at: 1703097600,
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
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${CONTINUATION_TEXT_CHUNK}`,
  "",
  `data: ${FINAL_CHUNK_WITH_USAGE}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Complete conversation flow - with tool calls
 */
export const TOOL_CALL_CONVERSATION_FLOW = [
  `data: ${TOOL_CALL_START_CHUNK}`,
  "",
  `data: ${TOOL_CALL_ARGS_CHUNK}`,
  "",
  `data: ${FINAL_CHUNK_WITH_USAGE}`,
  "",
  "data: [DONE]",
  "",
].join("\n");

/**
 * Mixed content and tool call conversation
 */
export const MIXED_CONVERSATION_FLOW = [
  `data: ${INITIAL_TEXT_CHUNK}`,
  "",
  `data: ${TOOL_CALL_START_CHUNK}`,
  "",
  `data: ${TOOL_CALL_ARGS_CHUNK}`,
  "",
  `data: ${CONTINUATION_TEXT_CHUNK}`,
  "",
  `data: ${FINAL_CHUNK_WITH_USAGE}`,
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
  id: "response-large123",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "A".repeat(10000), // 10KB of text
          },
        ],
      },
    },
  ],
  created_at: 1703097600,
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
  id: "response-minimal",
  object: "response.chunk",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {},
    },
  ],
});

/**
 * Edge case: chunk with all optional fields present
 */
export const MAXIMAL_CHUNK = JSON.stringify({
  id: "response-maximal",
  object: "response.chunk",
  status: "completed",
  model: "grok-3",
  output: [
    {
      type: "message",
      delta: {
        role: "assistant",
        content: [
          {
            type: "output_text",
            text: "Complete response",
          },
        ],
        tool_calls: [
          {
            id: "call_maximal123",
            type: "function",
            function: {
              name: "final_action",
              arguments: '{"status": "complete"}',
            },
          },
        ],
      },
    },
  ],
  usage: {
    input_tokens: 50,
    input_tokens_details: {
      cached_tokens: 10,
    },
    output_tokens: 25,
    output_tokens_details: {
      reasoning_tokens: 5,
    },
    total_tokens: 75,
  },
  created_at: 1703097600,
});
