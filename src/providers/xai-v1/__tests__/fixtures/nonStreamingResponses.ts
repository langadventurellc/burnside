/**
 * Test fixtures for xAI non-streaming responses
 *
 * Contains sample xAI response objects for testing the response parser
 * with various scenarios including success cases, tool calls, and edge cases.
 */

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
        {
          type: "output_text",
          text: "Hello! I'm Grok, an AI assistant created by xAI. How can I help you today?",
        },
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
  text: {},
  tool_choice: "auto",
  tools: [],
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
        {
          type: "output_text",
          text: "I'll help you check the weather. Let me get that information for you.",
        },
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
  text: {},
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
        {
          type: "output_text",
          text: "I'll search for information and then calculate the result for you.",
        },
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
  text: {},
  tool_choice: "auto",
  tools: [],
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
      content: [
        {
          type: "output_text",
          text: "OK",
        },
      ],
    },
  ],
  text: {},
  tool_choice: "auto",
  tools: [],
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
        {
          type: "output_text",
          text: "Response without usage information.",
        },
      ],
    },
  ],
  text: {},
  tool_choice: "auto",
  tools: [],
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
        {
          type: "output_text",
          text: "Based on my reasoning, the answer is 42.",
        },
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
  text: {},
  tool_choice: "auto",
  tools: [],
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
      content: [
        {
          type: "output_text",
          text: "",
        },
      ],
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
  text: {},
  tool_choice: "auto",
  tools: [],
};
