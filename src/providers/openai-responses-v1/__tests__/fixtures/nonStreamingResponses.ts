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
  object: "chat.completion",
  created: 1726426789,
  model: "gpt-4o-2024-08-06",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content:
          "Hello! I'm Claude, an AI assistant created by Anthropic. How can I help you today?",
      },
      finish_reason: "stop" as const,
    },
  ],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 19,
    total_tokens: 31,
  },
} as const;

/**
 * Response with empty/minimal content
 */
export const chatCompletionEmpty = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZR",
  object: "chat.completion",
  created: 1726426790,
  model: "gpt-4o-2024-08-06",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "",
      },
      finish_reason: "stop" as const,
    },
  ],
  usage: {
    prompt_tokens: 8,
    completion_tokens: 0,
    total_tokens: 8,
  },
} as const;

/**
 * Response with detailed usage information and longer content
 */
export const chatCompletionWithUsage = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZS",
  object: "chat.completion",
  created: 1726426791,
  model: "gpt-5-2025-08-07",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content:
          "Here's a comprehensive explanation of the topic you asked about. This response includes multiple paragraphs to demonstrate how longer responses are handled.\n\nFirst, let me outline the key concepts: understanding, implementation, and testing are crucial phases in any development process.\n\nSecond, the practical application requires careful consideration of edge cases and error scenarios to ensure robust functionality.",
      },
      finish_reason: "stop" as const,
    },
  ],
  usage: {
    prompt_tokens: 45,
    completion_tokens: 78,
    total_tokens: 123,
  },
} as const;

/**
 * Response with content parts array format
 */
export const chatCompletionWithContentParts = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZT",
  object: "chat.completion",
  created: 1726426792,
  model: "gpt-4o-2024-08-06",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: [
          {
            type: "text" as const,
            text: "This response uses the content parts format for structured content delivery.",
          },
        ],
      },
      finish_reason: "stop" as const,
    },
  ],
  usage: {
    prompt_tokens: 20,
    completion_tokens: 15,
    total_tokens: 35,
  },
} as const;

/**
 * Response truncated due to length limit
 */
export const chatCompletionLengthLimit = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZU",
  object: "chat.completion",
  created: 1726426793,
  model: "gpt-4o-2024-08-06",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content:
          "This response was truncated because it reached the maximum token limit specified in the request. The response would have continued but was cut off at this point due to the length constraint.",
      },
      finish_reason: "length" as const,
    },
  ],
  usage: {
    prompt_tokens: 25,
    completion_tokens: 50,
    total_tokens: 75,
  },
} as const;

/**
 * Response with content filter applied
 */
export const chatCompletionContentFilter = {
  id: "resp_01J8KRXF7QZQZQZQZQZQZQZQZV",
  object: "chat.completion",
  created: 1726426794,
  model: "gpt-4o-2024-08-06",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content:
          "I can't provide information on that topic as it violates our content policy.",
      },
      finish_reason: "content_filter" as const,
    },
  ],
  usage: {
    prompt_tokens: 15,
    completion_tokens: 16,
    total_tokens: 31,
  },
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
