/**
 * Request Examples Fixtures
 *
 * Unified ChatRequest examples and their expected OpenAI API translations
 * for request translation contract testing.
 */

import type { ChatRequest } from "../../../../client/chatRequest";
import type { OpenAIResponsesV1Config } from "../../configSchema";

/**
 * Basic configuration for testing
 */
export const basicConfig: OpenAIResponsesV1Config = {
  apiKey: "sk-test-key-12345678901234567890123456789012",
  baseUrl: "https://api.openai.com/v1",
} as const;

/**
 * Configuration with additional options
 */
export const configWithOptions: OpenAIResponsesV1Config = {
  apiKey: "sk-test-key-98765432109876543210987654321098",
  baseUrl: "https://custom.openai.com/v1",
  organization: "org-test123",
  project: "proj-test456",
  headers: {
    "X-Custom-Header": "test-value",
    "X-Request-ID": "req-123456",
  },
} as const;

/**
 * Simple text message request
 */
export const requestBasicText: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Hello, how are you?" }],
    },
  ],
  providerConfig: "default",
} as const;

/**
 * Expected OpenAI API request for basic text
 */
export const expectedRequestBasicText = {
  url: "https://api.openai.com/v1/responses",
  method: "POST",
  headers: {
    Authorization: "Bearer sk-test-key-12345678901234567890123456789012",
    "Content-Type": "application/json",
  },
  body: {
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Hello, how are you?" }],
      },
    ],
    stream: false,
  },
} as const;

/**
 * Multi-message conversation request
 */
export const requestConversation: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "system",
      content: [{ type: "text", text: "You are a helpful assistant." }],
    },
    {
      role: "user",
      content: [{ type: "text", text: "What's the weather like?" }],
    },
    {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I'd be happy to help with weather information, but I don't have access to current weather data.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Can you explain how weather forecasting works?",
        },
      ],
    },
  ],
  providerConfig: "default",
} as const;

/**
 * Request with streaming enabled
 */
export const requestWithStreaming: ChatRequest & { stream: boolean } = {
  model: "gpt-5-2025-08-07",
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Tell me a story." }],
    },
  ],
  stream: true,
  providerConfig: "default",
} as const;

/**
 * Expected OpenAI API request for streaming
 */
export const expectedRequestWithStreaming = {
  url: "https://api.openai.com/v1/responses",
  method: "POST",
  headers: {
    Authorization: "Bearer sk-test-key-12345678901234567890123456789012",
    "Content-Type": "application/json",
  },
  body: {
    model: "gpt-5-2025-08-07",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Tell me a story." }],
      },
    ],
    stream: true,
  },
} as const;

/**
 * Request with temperature and max_tokens parameters
 */
export const requestWithParameters: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Generate a creative poem." }],
    },
  ],
  temperature: 0.8,
  maxTokens: 150,
  providerConfig: "default",
} as const;

/**
 * Expected OpenAI API request with parameters
 */
export const expectedRequestWithParameters = {
  url: "https://api.openai.com/v1/responses",
  method: "POST",
  headers: {
    Authorization: "Bearer sk-test-key-12345678901234567890123456789012",
    "Content-Type": "application/json",
  },
  body: {
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Generate a creative poem." }],
      },
    ],
    stream: false,
    temperature: 0.8,
    max_tokens: 150,
  },
} as const;

/**
 * Request with custom configuration (organization, project, headers)
 */
export const requestWithCustomConfig: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Process this request with custom settings." },
      ],
    },
  ],
  providerConfig: "default",
} as const;

/**
 * Expected OpenAI API request with custom configuration
 */
export const expectedRequestWithCustomConfig = {
  url: "https://custom.openai.com/v1/responses",
  method: "POST",
  headers: {
    Authorization: "Bearer sk-test-key-98765432109876543210987654321098",
    "Content-Type": "application/json",
    "OpenAI-Organization": "org-test123",
    "OpenAI-Project": "proj-test456",
    "X-Custom-Header": "test-value",
    "X-Request-ID": "req-123456",
  },
  body: {
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Process this request with custom settings." },
        ],
      },
    ],
    stream: false,
  },
} as const;

/**
 * Request with empty message content
 */
export const requestEmptyContent: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "" }],
    },
  ],
  providerConfig: "default",
} as const;

/**
 * Request with multiple content parts (though OpenAI Responses v1 only supports text)
 */
export const requestMultipleContentParts: ChatRequest = {
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Here's my question: " },
        { type: "text", text: "What is artificial intelligence?" },
      ],
    },
  ],
  providerConfig: "default",
} as const;

/**
 * Request with maximum parameters
 */
export const requestMaximalParameters: ChatRequest & {
  stream: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
} = {
  model: "gpt-5-2025-08-07",
  messages: [
    {
      role: "system",
      content: [{ type: "text", text: "You are an expert in the field." }],
    },
    {
      role: "user",
      content: [{ type: "text", text: "Provide a comprehensive analysis." }],
    },
  ],
  stream: true,
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
  providerConfig: "default",
} as const;

/**
 * Collection of request/response pairs for contract testing
 */
export const requestResponsePairs = [
  {
    name: "basicText",
    config: basicConfig,
    request: requestBasicText,
    expected: expectedRequestBasicText,
  },
  {
    name: "withStreaming",
    config: basicConfig,
    request: requestWithStreaming,
    expected: expectedRequestWithStreaming,
  },
  {
    name: "withParameters",
    config: basicConfig,
    request: requestWithParameters,
    expected: expectedRequestWithParameters,
  },
  {
    name: "withCustomConfig",
    config: configWithOptions,
    request: requestWithCustomConfig,
    expected: expectedRequestWithCustomConfig,
  },
] as const;

/**
 * Collection of all request example fixtures
 */
export const requestExamples = {
  basicConfig,
  configWithOptions,
  requestBasicText,
  expectedRequestBasicText,
  requestConversation,
  requestWithStreaming,
  expectedRequestWithStreaming,
  requestWithParameters,
  expectedRequestWithParameters,
  requestWithCustomConfig,
  expectedRequestWithCustomConfig,
  requestEmptyContent,
  requestMultipleContentParts,
  requestMaximalParameters,
  requestResponsePairs,
} as const;
