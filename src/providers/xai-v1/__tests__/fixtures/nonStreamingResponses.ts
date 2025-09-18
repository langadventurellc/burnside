/**
 * Test fixtures for xAI non-streaming responses
 *
 * Contains sample xAI response objects for testing the response parser
 * with various scenarios including success cases, tool calls, and edge cases.
 */

// Helper function to create properly structured content parts
function createFixtureContentPart(
  text: string,
  annotations?: unknown[],
  logprobs?: unknown[],
) {
  return {
    type: "output_text" as const,
    text,
    annotations: annotations || null,
    logprobs: logprobs || null,
  };
}

// Helper function to create base response fields that are now required/nullable
function createBaseFixtureFields(overrides: any = {}) {
  return {
    max_output_tokens: null,
    metadata: null,
    previous_response_id: null,
    temperature: null,
    top_p: null,
    user: null,
    incomplete_details: null,
    debug_output: {
      attempts: 1,
      cache_read_count: 0,
      cache_read_input_bytes: 0,
      cache_write_count: 0,
      cache_write_input_bytes: 0,
      engine_request: "req_123",
      lb_address: "10.0.0.1",
      prompt: "Hello",
      request: "original_request",
      responses: [],
      sampler_tag: "default",
    },
    reasoning: {
      effort: null,
      generate_summary: false,
      summary: null,
    },
    store: false,
    parallel_tool_calls: false,
    text: {
      format: {
        type: "text",
      },
    },
    ...overrides,
  };
}

export const validTextResponse = {
  id: "resp_2024_12_xai_text",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "msg_abc123",
      type: "message",
      role: "assistant",
      content: [
        createFixtureContentPart(
          "Hello! I'm Grok, an AI assistant created by xAI. How can I help you today?",
        ),
      ],
    },
  ],
  usage: {
    input_tokens: 12,
    input_tokens_details: {
      cached_tokens: 0,
    },
    output_tokens: 23,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: 35,
  },
  created_at: 1703097600,
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields(),
};

export const validTextResponseWithToolCalls = {
  id: "resp_2024_12_xai_tools",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "msg_def456",
      type: "message",
      role: "assistant",
      content: [
        createFixtureContentPart(
          "I'll help you check the weather. Let me get that information for you.",
        ),
      ],
      tool_calls: [
        {
          id: "call_weather_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco, CA", "unit": "celsius"}',
          },
        },
      ],
    },
  ],
  usage: {
    input_tokens: 15,
    input_tokens_details: {
      cached_tokens: 0,
    },
    output_tokens: 28,
    output_tokens_details: {
      reasoning_tokens: 5,
    },
    total_tokens: 43,
  },
  created_at: 1703097700,
  tool_choice: "auto",
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather information",
      },
    },
  ],
  ...createBaseFixtureFields({
    parallel_tool_calls: true,
  }),
};

export const validMultipleToolCallsResponse = {
  id: "resp_2024_12_xai_multi_tools",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "msg_ghi789",
      type: "message",
      role: "assistant",
      content: [
        createFixtureContentPart(
          "I'll search for information and then calculate the result for you.",
        ),
      ],
      tool_calls: [
        {
          id: "call_search_456",
          type: "function",
          function: {
            name: "web_search",
            arguments: '{"query": "current exchange rate USD to EUR"}',
          },
        },
        {
          id: "call_calc_789",
          type: "function",
          function: {
            name: "calculate",
            arguments: '{"expression": "100 * 0.85", "precision": 2}',
          },
        },
      ],
    },
  ],
  usage: {
    input_tokens: 20,
    input_tokens_details: {
      cached_tokens: 5,
    },
    output_tokens: 35,
    output_tokens_details: {
      reasoning_tokens: 10,
    },
    total_tokens: 55,
  },
  created_at: 1703097800,
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields({
    parallel_tool_calls: true,
  }),
};

export const validMinimalResponse = {
  id: "resp_minimal",
  object: "completion",
  status: "completed",
  model: "grok-3-mini",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [createFixtureContentPart("OK")],
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields(),
};

export const validResponseWithoutUsage = {
  id: "resp_no_usage",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [
        createFixtureContentPart("Response without usage information."),
      ],
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields(),
};

export const validResponseWithReasoningOutput = {
  id: "resp_reasoning",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "reasoning_001",
      type: "reasoning",
      summary: ["Step 1: Analyze the problem", "Step 2: Consider options"],
    },
    {
      id: "msg_reasoning",
      type: "message",
      role: "assistant",
      content: [
        createFixtureContentPart("Based on my reasoning, the answer is 42."),
      ],
    },
  ],
  usage: {
    input_tokens: 10,
    input_tokens_details: {
      cached_tokens: 0,
    },
    output_tokens: 15,
    output_tokens_details: {
      reasoning_tokens: 25,
    },
    total_tokens: 25,
  },
  created_at: 1703097900,
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields({
    reasoning: {
      effort: "medium",
      generate_summary: true,
      summary: "detailed reasoning provided",
    },
  }),
};

export const validResponseWithEmptyContent = {
  id: "resp_empty_content",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [createFixtureContentPart("")],
    },
  ],
  usage: {
    input_tokens: 5,
    input_tokens_details: {
      cached_tokens: 0,
    },
    output_tokens: 1,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: 6,
  },
  created_at: 1703098000,
  tool_choice: "auto",
  tools: [],
  ...createBaseFixtureFields(),
};
