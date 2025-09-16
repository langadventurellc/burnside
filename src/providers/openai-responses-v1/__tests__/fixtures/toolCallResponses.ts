/**
 * Test fixtures for OpenAI tool call responses
 *
 * Comprehensive test data covering various tool call scenarios including
 * success cases, error cases, and edge cases for both streaming and
 * non-streaming responses.
 */

/**
 * Non-streaming response with single tool call
 */
export const nonStreamingToolCallSuccess = {
  id: "chatcmpl-test123",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "I'll help you calculate that sum.",
        tool_calls: [
          {
            id: "call_abc123",
            type: "function" as const,
            function: {
              name: "calculate_sum",
              arguments: '{"a": 5, "b": 3}',
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
  usage: {
    prompt_tokens: 20,
    completion_tokens: 15,
    total_tokens: 35,
  },
};

/**
 * Non-streaming response with multiple tool calls
 */
export const nonStreamingMultipleToolCalls = {
  id: "chatcmpl-test456",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "I'll process both calculations for you.",
        tool_calls: [
          {
            id: "call_def456",
            type: "function" as const,
            function: {
              name: "calculate_sum",
              arguments: '{"a": 10, "b": 20}',
            },
          },
          {
            id: "call_ghi789",
            type: "function" as const,
            function: {
              name: "calculate_product",
              arguments: '{"x": 4, "y": 7}',
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
  usage: {
    prompt_tokens: 25,
    completion_tokens: 18,
    total_tokens: 43,
  },
};

/**
 * Response with tool calls only (no text content)
 */
export const toolCallOnly = {
  id: "chatcmpl-test789",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            id: "call_jkl012",
            type: "function" as const,
            function: {
              name: "get_weather",
              arguments: '{"location": "San Francisco", "unit": "celsius"}',
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
  usage: {
    prompt_tokens: 15,
    completion_tokens: 5,
    total_tokens: 20,
  },
};

/**
 * Response with malformed tool call arguments (invalid JSON)
 */
export const malformedToolCallArguments = {
  id: "chatcmpl-test-error1",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "I'll calculate that for you.",
        tool_calls: [
          {
            id: "call_bad123",
            type: "function" as const,
            function: {
              name: "calculate_sum",
              arguments: '{"a": 5, "b":}', // Invalid JSON - trailing comma
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
};

/**
 * Response with missing tool call fields
 */
export const missingToolCallFields = {
  id: "chatcmpl-test-error2",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "Let me help with that.",
        tool_calls: [
          {
            // Missing id field
            type: "function" as const,
            function: {
              name: "calculate_sum",
              arguments: '{"a": 5, "b": 3}',
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
};

/**
 * Response with complex tool call parameters
 */
export const complexToolCallParameters = {
  id: "chatcmpl-test-complex",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "I'll process this complex data structure.",
        tool_calls: [
          {
            id: "call_complex123",
            type: "function" as const,
            function: {
              name: "process_data",
              arguments: JSON.stringify({
                users: [
                  { id: 1, name: "Alice", active: true },
                  { id: 2, name: "Bob", active: false },
                ],
                filters: {
                  status: ["active", "pending"],
                  roles: null,
                  metadata: {
                    source: "api",
                    version: "1.2.3",
                  },
                },
                pagination: {
                  page: 1,
                  limit: 50,
                  total: 150,
                },
              }),
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
};

/**
 * Response with empty tool call arguments
 */
export const emptyToolCallArguments = {
  id: "chatcmpl-test-empty",
  object: "chat.completion" as const,
  created: 1699000000,
  model: "gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "I'll call the function with no arguments.",
        tool_calls: [
          {
            id: "call_empty123",
            type: "function" as const,
            function: {
              name: "get_current_time",
              arguments: "{}",
            },
          },
        ],
      },
      finish_reason: "tool_calls" as const,
    },
  ],
};

/**
 * Expected unified ToolCall results for validation
 */
export const expectedToolCallResults = {
  singleToolCall: [
    {
      id: "call_abc123",
      name: "calculate_sum",
      parameters: { a: 5, b: 3 },
      metadata: {
        providerId: "openai",
        timestamp: expect.any(String),
        rawCall: {
          id: "call_abc123",
          type: "function",
          function: {
            name: "calculate_sum",
            arguments: '{"a": 5, "b": 3}',
          },
        },
      },
    },
  ],
  multipleToolCalls: [
    {
      id: "call_def456",
      name: "calculate_sum",
      parameters: { a: 10, b: 20 },
      metadata: {
        providerId: "openai",
        timestamp: expect.any(String),
        rawCall: expect.any(Object),
      },
    },
    {
      id: "call_ghi789",
      name: "calculate_product",
      parameters: { x: 4, y: 7 },
      metadata: {
        providerId: "openai",
        timestamp: expect.any(String),
        rawCall: expect.any(Object),
      },
    },
  ],
  emptyArguments: [
    {
      id: "call_empty123",
      name: "get_current_time",
      parameters: {},
      metadata: {
        providerId: "openai",
        timestamp: expect.any(String),
        rawCall: expect.any(Object),
      },
    },
  ],
};

/**
 * Streaming tool call events for streaming tests
 */
export const streamingToolCallEvents = [
  'data: {"type":"response.created","response":{"id":"resp_streaming123"}}\n\n',
  'data: {"type":"response.output_text.delta","delta":{"text":"I\'ll help you calculate that."}}\n\n',
  'data: {"type":"response.tool_calls.delta","delta":{"tool_calls":[{"id":"call_stream123","type":"function","function":{"name":"calculate_sum"}}]}}\n\n',
  'data: {"type":"response.tool_calls.delta","delta":{"tool_calls":[{"function":{"arguments":"{\\"a\\": 5"}}]}}\n\n',
  'data: {"type":"response.tool_calls.delta","delta":{"tool_calls":[{"function":{"arguments":"5, \\"b\\": 3}"}}]}}\n\n',
  'data: {"type":"response.done"}\n\n',
];

/**
 * Tool call error scenarios
 */
export const toolCallErrorScenarios = {
  invalidArgumentsType: {
    id: "chatcmpl-error-type",
    object: "chat.completion" as const,
    created: 1699000000,
    model: "gpt-4",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as const,
          content: "Error case.",
          tool_calls: [
            {
              id: "call_error_type",
              type: "function" as const,
              function: {
                name: "test_tool",
                arguments: '"not an object"', // String instead of object
              },
            },
          ],
        },
        finish_reason: "tool_calls" as const,
      },
    ],
  },
  argumentsArray: {
    id: "chatcmpl-error-array",
    object: "chat.completion" as const,
    created: 1699000000,
    model: "gpt-4",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as const,
          content: "Error case.",
          tool_calls: [
            {
              id: "call_error_array",
              type: "function" as const,
              function: {
                name: "test_tool",
                arguments: "[1, 2, 3]", // Array instead of object
              },
            },
          ],
        },
        finish_reason: "tool_calls" as const,
      },
    ],
  },
};
