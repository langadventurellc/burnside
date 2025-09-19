/**
 * OpenAI Response Fixtures for Termination Detection Testing
 *
 * Realistic OpenAI API response fixtures covering all termination scenarios
 * for comprehensive contract testing and cross-provider consistency validation.
 */

import type { StreamDelta } from "../../../../client/streamDelta";
import type { Message } from "../../../messages/message";

/**
 * Non-streaming response fixtures for OpenAI API
 */
export const openAIResponses = {
  /**
   * Natural completion with finish_reason: "stop"
   */
  naturalCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Hello! I'm Claude, an AI assistant. How can I help you today?",
        },
      ],
    },
    usage: {
      promptTokens: 12,
      completionTokens: 15,
      totalTokens: 27,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      finish_reason: "stop",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "Hello! I'm Claude, an AI assistant. How can I help you today?",
          },
          finish_reason: "stop",
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Token limit reached with finish_reason: "length"
   */
  tokenLimitReached: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "This is a very long response that has reached the maximum token limit and therefore",
        },
      ],
    },
    usage: {
      promptTokens: 100,
      completionTokens: 4096,
      totalTokens: 4196,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      finish_reason: "length",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "This is a very long response that has reached the maximum token limit and therefore",
          },
          finish_reason: "length",
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Content filtered with finish_reason: "content_filter"
   */
  contentFiltered: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I can't provide information about that topic.",
        },
      ],
    },
    usage: {
      promptTokens: 25,
      completionTokens: 8,
      totalTokens: 33,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      finish_reason: "content_filter",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I can't provide information about that topic.",
          },
          finish_reason: "content_filter",
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Tool call completion with finish_reason: "tool_calls"
   */
  toolCallCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I'll help you get the current weather.",
        },
        {
          type: "tool_use" as const,
          id: "call_abc123",
          name: "get_weather",
          input: { location: "San Francisco" },
        },
      ],
    },
    usage: {
      promptTokens: 45,
      completionTokens: 23,
      totalTokens: 68,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      finish_reason: "tool_calls",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I'll help you get the current weather.",
            tool_calls: [
              {
                id: "call_abc123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location": "San Francisco"}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Function call completion with finish_reason: "function_call" (deprecated)
   */
  functionCallCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Let me get that information for you.",
        },
        {
          type: "tool_use" as const,
          id: "call_def456",
          name: "search_database",
          input: { query: "user data" },
        },
      ],
    },
    usage: {
      promptTokens: 38,
      completionTokens: 18,
      totalTokens: 56,
    },
    model: "gpt-3.5-turbo",
    metadata: {
      finish_reason: "function_call",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Let me get that information for you.",
            function_call: {
              name: "search_database",
              arguments: '{"query": "user data"}',
            },
          },
          finish_reason: "function_call",
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Unknown/null finish_reason scenario
   */
  unknownTermination: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with unclear termination status.",
        },
      ],
    },
    usage: {
      promptTokens: 15,
      completionTokens: 7,
      totalTokens: 22,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      finish_reason: null,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response with unclear termination status.",
          },
          finish_reason: null,
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },

  /**
   * Malformed response missing finish_reason
   */
  malformedResponse: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with missing termination metadata.",
        },
      ],
    },
    usage: {
      promptTokens: 18,
      completionTokens: 6,
      totalTokens: 24,
    },
    model: "gpt-4o-2024-08-06",
    metadata: {
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response with missing termination metadata.",
          },
          // finish_reason is completely missing
        },
      ],
    },
  } as {
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    metadata: Record<string, unknown>;
  },
};

/**
 * Streaming response fixtures for OpenAI API
 */
export const openAIStreamingResponses = {
  /**
   * Streaming delta with natural completion (finish_reason: "stop")
   */
  naturalCompletionDelta: {
    id: "chunk-natural-complete",
    delta: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: " complete.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 12,
      completionTokens: 15,
      totalTokens: 27,
    },
    metadata: {
      finish_reason: "stop",
      eventType: "response.completed",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " complete.",
          },
          finish_reason: "stop",
        },
      ],
    },
  } as StreamDelta,

  /**
   * Streaming delta with token limit reached (finish_reason: "length")
   */
  tokenLimitDelta: {
    id: "chunk-token-limit",
    delta: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: " and therefore",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 100,
      completionTokens: 4096,
      totalTokens: 4196,
    },
    metadata: {
      finish_reason: "length",
      eventType: "response.completed",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " and therefore",
          },
          finish_reason: "length",
        },
      ],
    },
  } as StreamDelta,

  /**
   * Streaming delta with content filter (finish_reason: "content_filter")
   */
  contentFilterDelta: {
    id: "chunk-content-filter",
    delta: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 25,
      completionTokens: 0,
      totalTokens: 25,
    },
    metadata: {
      finish_reason: "content_filter",
      eventType: "response.completed",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: "",
          },
          finish_reason: "content_filter",
        },
      ],
    },
  } as StreamDelta,

  /**
   * Streaming delta with tool call completion (finish_reason: "tool_calls")
   */
  toolCallDelta: {
    id: "chunk-tool-call",
    delta: {
      role: "assistant",
      content: [{ type: "text", text: "Using tools to help..." }],
    },
    finished: true,
    usage: {
      promptTokens: 30,
      completionTokens: 20,
      totalTokens: 50,
    },
    metadata: {
      finish_reason: "tool_calls",
      eventType: "response.completed",
    },
  } as StreamDelta,

  /**
   * Incomplete streaming delta (not finished)
   */
  incompleteDelta: {
    id: "chunk-incomplete",
    delta: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "This is still being generated",
        },
      ],
    },
    finished: false,
    metadata: {
      eventType: "response.content_chunk",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: "This is still being generated",
          },
          finish_reason: null,
        },
      ],
    },
  } as StreamDelta,

  /**
   * Streaming delta with unknown finish_reason
   */
  unknownTerminationDelta: {
    id: "chunk-unknown",
    delta: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: " completed.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 15,
      completionTokens: 8,
      totalTokens: 23,
    },
    metadata: {
      finish_reason: null,
      eventType: "response.completed",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " completed.",
          },
          finish_reason: null,
        },
      ],
    },
  } as StreamDelta,
};
