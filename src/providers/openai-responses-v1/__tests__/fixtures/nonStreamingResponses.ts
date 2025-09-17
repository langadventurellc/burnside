/**
 * Non-streaming Response Fixtures
 *
 * Realistic OpenAI Responses API v1 non-streaming response fixtures
 * for contract testing and integration validation.
 */

/**
 * Successful chat completion response with text content
 */
export const chatCompletionSuccess = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZQ",
  object: "response",
  status: "completed",
  model: "gpt-4o-2024-08-06",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "Hello! I'm Claude, an AI assistant created by Anthropic. How can I help you today?",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 12,
    output_tokens: 19,
    total_tokens: 31,
  },
  created_at: 1726426789,
} as const;

/**
 * Response with empty/minimal content
 */
export const chatCompletionEmpty = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZR",
  object: "response",
  status: "completed",
  model: "gpt-4o-2024-08-06",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 8,
    output_tokens: 0,
    total_tokens: 8,
  },
  created_at: 1726426790,
} as const;

/**
 * Response with detailed usage information and longer content
 */
export const chatCompletionWithUsage = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZS",
  object: "response",
  status: "completed",
  model: "gpt-5-2025-08-07",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "Here's a comprehensive explanation of the topic you asked about. This response includes multiple paragraphs to demonstrate how longer responses are handled.\n\nFirst, let me outline the key concepts: understanding, implementation, and testing are crucial phases in any development process.\n\nSecond, the practical application requires careful consideration of edge cases and error scenarios to ensure robust functionality.",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 45,
    output_tokens: 78,
    total_tokens: 123,
  },
  created_at: 1726426791,
} as const;

/**
 * Response with content parts array format
 */
export const chatCompletionWithContentParts = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZT",
  object: "response",
  status: "completed",
  model: "gpt-4o-2024-08-06",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "This response uses the content parts format for structured content delivery.",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 20,
    output_tokens: 15,
    total_tokens: 35,
  },
  created_at: 1726426792,
} as const;

/**
 * Response truncated due to length limit
 */
export const chatCompletionLengthLimit = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZU",
  object: "response",
  status: "completed",
  model: "gpt-4o-2024-08-06",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "This response was truncated because it reached the maximum token limit specified in the request. The response would have continued but was cut off at this point due to the length constraint.",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 25,
    output_tokens: 50,
    total_tokens: 75,
  },
  created_at: 1726426793,
} as const;

/**
 * Response with content filter applied
 */
export const chatCompletionContentFilter = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZV",
  object: "response",
  status: "completed",
  model: "gpt-4o-2024-08-06",
  output: [
    {
      type: "message",
      role: "assistant" as const,
      content: [
        {
          type: "output_text",
          text: "I can't provide information on that topic as it violates our content policy.",
        },
      ],
    },
  ],
  usage: {
    input_tokens: 15,
    output_tokens: 16,
    total_tokens: 31,
  },
  created_at: 1726426794,
} as const;

/**
 * Collection of all non-streaming response fixtures
 */
export const nonStreamingResponses = {
  chatCompletionSuccess,
  chatCompletionEmpty,
  chatCompletionWithUsage,
  chatCompletionWithContentParts,
  chatCompletionLengthLimit,
  chatCompletionContentFilter,
} as const;
