/**
 * xAI Response Fixtures for Termination Detection Testing
 *
 * Realistic xAI Grok API response fixtures covering all termination scenarios
 * for comprehensive contract testing and cross-provider consistency validation.
 * xAI follows OpenAI-compatible API format with finish_reason field.
 */

import type { StreamDelta } from "../../../../client/streamDelta";
import type { Message } from "../../../messages/message";

/**
 * Non-streaming response fixtures for xAI Grok API
 */
export const xaiResponses = {
  /**
   * Natural completion with finish_reason: "stop"
   */
  naturalCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Hello! I'm Grok, an AI assistant created by xAI. How can I assist you today?",
        },
      ],
    },
    usage: {
      promptTokens: 12,
      completionTokens: 17,
      totalTokens: 29,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456789",
      object: "chat.completion",
      created: 1699000000,
      model: "grok-3",
      status: "completed",
      finish_reason: "stop",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "Hello! I'm Grok, an AI assistant created by xAI. How can I assist you today?",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 17,
        total_tokens: 29,
      },
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
          text: "This is a very long response from Grok that has reached the maximum token limit and therefore gets truncated without proper",
        },
      ],
    },
    usage: {
      promptTokens: 100,
      completionTokens: 4096,
      totalTokens: 4196,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456790",
      object: "chat.completion",
      created: 1699000001,
      model: "grok-3",
      status: "incomplete",
      finish_reason: "length",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "This is a very long response from Grok that has reached the maximum token limit and therefore gets truncated without proper",
          },
          finish_reason: "length",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 4096,
        total_tokens: 4196,
      },
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
          text: "I can't provide information about that topic due to content policies.",
        },
      ],
    },
    usage: {
      promptTokens: 25,
      completionTokens: 12,
      totalTokens: 37,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456791",
      object: "chat.completion",
      created: 1699000002,
      model: "grok-3",
      status: "completed",
      finish_reason: "content_filter",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "I can't provide information about that topic due to content policies.",
          },
          finish_reason: "content_filter",
        },
      ],
      usage: {
        prompt_tokens: 25,
        completion_tokens: 12,
        total_tokens: 37,
      },
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
          text: "I'll help you with that calculation using a tool.",
        },
        {
          type: "tool_use" as const,
          id: "call_grok_123",
          name: "calculate",
          input: { expression: "2 * 2" },
        },
      ],
    },
    usage: {
      promptTokens: 45,
      completionTokens: 25,
      totalTokens: 70,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456792",
      object: "chat.completion",
      created: 1699000003,
      model: "grok-3",
      status: "completed",
      finish_reason: "tool_calls",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I'll help you with that calculation using a tool.",
            tool_calls: [
              {
                id: "call_grok_123",
                type: "function",
                function: {
                  name: "calculate",
                  arguments: '{"expression": "2 * 2"}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
      usage: {
        prompt_tokens: 45,
        completion_tokens: 25,
        total_tokens: 70,
      },
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
   * Function call completion with finish_reason: "function_call" (legacy)
   */
  functionCallCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Let me retrieve that information for you.",
        },
        {
          type: "tool_use" as const,
          id: "call_grok_456",
          name: "search_web",
          input: { query: "latest news" },
        },
      ],
    },
    usage: {
      promptTokens: 38,
      completionTokens: 20,
      totalTokens: 58,
    },
    model: "grok-2",
    metadata: {
      id: "chatcmpl-123456793",
      object: "chat.completion",
      created: 1699000004,
      model: "grok-2",
      status: "completed",
      finish_reason: "function_call",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Let me retrieve that information for you.",
            function_call: {
              name: "search_web",
              arguments: '{"query": "latest news"}',
            },
          },
          finish_reason: "function_call",
        },
      ],
      usage: {
        prompt_tokens: 38,
        completion_tokens: 20,
        total_tokens: 58,
      },
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
          text: "Response with unclear termination status from Grok.",
        },
      ],
    },
    usage: {
      promptTokens: 15,
      completionTokens: 9,
      totalTokens: 24,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456794",
      object: "chat.completion",
      created: 1699000005,
      model: "grok-3",
      status: null,
      finish_reason: null,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response with unclear termination status from Grok.",
          },
          finish_reason: null,
        },
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 9,
        total_tokens: 24,
      },
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
          text: "Response with missing termination metadata from Grok.",
        },
      ],
    },
    usage: {
      promptTokens: 18,
      completionTokens: 8,
      totalTokens: 26,
    },
    model: "grok-3",
    metadata: {
      id: "chatcmpl-123456795",
      object: "chat.completion",
      created: 1699000006,
      model: "grok-3",
      status: null,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response with missing termination metadata from Grok.",
          },
          // finish_reason is completely missing
        },
      ],
      usage: {
        prompt_tokens: 18,
        completion_tokens: 8,
        total_tokens: 26,
      },
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
 * Streaming response fixtures for xAI Grok API
 */
export const xaiStreamingResponses = {
  /**
   * Streaming delta with natural completion (finish_reason: "stop")
   */
  naturalCompletionDelta: {
    id: "chunk-xai-natural",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " That's my final answer!",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 12,
      completionTokens: 17,
      totalTokens: 29,
    },
    metadata: {
      eventType: "response.completed",
      finish_reason: "stop",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " That's my final answer!",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 17,
        total_tokens: 29,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with token limit reached (finish_reason: "length")
   */
  tokenLimitDelta: {
    id: "chunk-xai-tokens",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " and gets cut off here due to limit",
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
      eventType: "response.completed",
      finish_reason: "length",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " and gets cut off here due to limit",
          },
          finish_reason: "length",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 4096,
        total_tokens: 4196,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with content filter (finish_reason: "content_filter")
   */
  contentFilterDelta: {
    id: "chunk-xai-filter",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I can't continue with that.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 25,
      completionTokens: 5,
      totalTokens: 30,
    },
    metadata: {
      eventType: "response.completed",
      finish_reason: "content_filter",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: "I can't continue with that.",
          },
          finish_reason: "content_filter",
        },
      ],
      usage: {
        prompt_tokens: 25,
        completion_tokens: 5,
        total_tokens: 30,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with tool call completion (finish_reason: "tool_calls")
   */
  toolCallDelta: {
    id: "chunk-xai-tool",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Using tools to help you.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 45,
      completionTokens: 25,
      totalTokens: 70,
    },
    metadata: {
      eventType: "response.completed",
      finish_reason: "tool_calls",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: "Using tools to help you.",
            tool_calls: [
              {
                id: "call_grok_stream",
                type: "function",
                function: {
                  name: "calculate",
                  arguments: '{"x": 10, "y": 5}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
      usage: {
        prompt_tokens: 45,
        completion_tokens: 25,
        total_tokens: 70,
      },
    },
  } as StreamDelta,

  /**
   * Incomplete streaming delta (not finished)
   */
  incompleteDelta: {
    id: "chunk-xai-ongoing",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "This response from Grok is still being generated",
        },
      ],
    },
    finished: false,
    metadata: {
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: "This response from Grok is still being generated",
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
    id: "chunk-xai-unknown",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " completed with unknown reason.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 15,
      completionTokens: 6,
      totalTokens: 21,
    },
    metadata: {
      eventType: null,
      finish_reason: null,
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: " completed with unknown reason.",
          },
          finish_reason: null,
        },
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 6,
        total_tokens: 21,
      },
    },
  } as StreamDelta,
};
