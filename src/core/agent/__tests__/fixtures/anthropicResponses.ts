/**
 * Anthropic Response Fixtures for Termination Detection Testing
 *
 * Realistic Anthropic Messages API response fixtures covering all termination scenarios
 * for comprehensive contract testing and cross-provider consistency validation.
 */

import type { StreamDelta } from "../../../../client/streamDelta";
import type { Message } from "../../../messages/message";

/**
 * Non-streaming response fixtures for Anthropic Messages API
 */
export const anthropicResponses = {
  /**
   * Natural completion with stop_reason: "end_turn"
   */
  naturalCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Hello! I'm Claude, an AI assistant created by Anthropic. How can I help you today?",
        },
      ],
    },
    usage: {
      promptTokens: 12,
      completionTokens: 19,
      totalTokens: 31,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZQ",
      stopReason: "end_turn",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 12,
        output_tokens: 19,
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
   * Token limit reached with stop_reason: "max_tokens"
   */
  tokenLimitReached: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "This is a very long response that has reached the maximum token limit and therefore gets truncated",
        },
      ],
    },
    usage: {
      promptTokens: 100,
      completionTokens: 4096,
      totalTokens: 4196,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZR",
      stopReason: "max_tokens",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 100,
        output_tokens: 4096,
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
   * Stop sequence triggered with stop_reason: "stop_sequence"
   */
  stopSequenceTriggered: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "This response was terminated by a custom stop sequence [STOP]",
        },
      ],
    },
    usage: {
      promptTokens: 25,
      completionTokens: 12,
      totalTokens: 37,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZS",
      stopReason: "stop_sequence",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 25,
        output_tokens: 12,
      },
      stop_sequence: "[STOP]",
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
   * Tool use completion with stop_reason: "tool_use"
   */
  toolUseCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I'll help you get the current weather information.",
        },
        {
          type: "tool_use" as const,
          id: "toolu_01A09q90qw90lkasdjfl",
          name: "get_weather",
          input: { location: "San Francisco, CA" },
        },
      ],
    },
    usage: {
      promptTokens: 45,
      completionTokens: 28,
      totalTokens: 73,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZT",
      stopReason: "tool_use",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 45,
        output_tokens: 28,
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
   * Unknown/unrecognized stop_reason scenario
   */
  unknownStopReason: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with unrecognized termination reason.",
        },
      ],
    },
    usage: {
      promptTokens: 15,
      completionTokens: 7,
      totalTokens: 22,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZU",
      stopReason: "unknown_future_reason",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 15,
        output_tokens: 7,
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
   * Null stop_reason scenario
   */
  nullStopReason: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with null stop reason.",
        },
      ],
    },
    usage: {
      promptTokens: 18,
      completionTokens: 6,
      totalTokens: 24,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZV",
      stopReason: null,
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 18,
        output_tokens: 6,
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
   * Missing stop_reason scenario
   */
  missingStopReason: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with missing stop reason metadata.",
        },
      ],
    },
    usage: {
      promptTokens: 20,
      completionTokens: 8,
      totalTokens: 28,
    },
    model: "claude-3-sonnet-20240229",
    metadata: {
      id: "msg_01J8KRXF7QZQZQZQZQZQZQZQZW",
      model: "claude-3-sonnet-20240229",
      usage: {
        input_tokens: 20,
        output_tokens: 8,
      },
      // stopReason field is completely missing
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
 * Streaming response fixtures for Anthropic Messages API
 */
export const anthropicStreamingResponses = {
  /**
   * Streaming delta with natural completion (stop_reason: "end_turn")
   */
  naturalCompletionDelta: {
    id: "chunk-anthropic-natural",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " That's everything!",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 12,
      completionTokens: 19,
      totalTokens: 31,
    },
    metadata: {
      type: "message_stop",
      stopReason: "end_turn",
      message: {
        id: "msg_stream_123",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 12,
          output_tokens: 19,
        },
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with token limit (stop_reason: "max_tokens")
   */
  tokenLimitDelta: {
    id: "chunk-anthropic-tokens",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " and gets cut off here",
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
      type: "message_stop",
      stopReason: "max_tokens",
      message: {
        id: "msg_stream_456",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 100,
          output_tokens: 4096,
        },
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with stop sequence (stop_reason: "stop_sequence")
   */
  stopSequenceDelta: {
    id: "chunk-anthropic-stop",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " before hitting [STOP]",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 25,
      completionTokens: 12,
      totalTokens: 37,
    },
    metadata: {
      type: "message_stop",
      stopReason: "stop_sequence",
      message: {
        id: "msg_stream_789",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 25,
          output_tokens: 12,
        },
      },
      stop_sequence: "[STOP]",
    },
  } as StreamDelta,

  /**
   * Streaming delta with tool use (stop_reason: "tool_use")
   */
  toolUseDelta: {
    id: "chunk-anthropic-tool",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Let me use a tool to help you.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 45,
      completionTokens: 28,
      totalTokens: 73,
    },
    metadata: {
      type: "message_stop",
      stopReason: "tool_use",
      message: {
        id: "msg_stream_abc",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 45,
          output_tokens: 28,
        },
      },
    },
  } as StreamDelta,

  /**
   * Incomplete streaming delta (not finished)
   */
  incompleteDelta: {
    id: "chunk-anthropic-ongoing",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "This response is still being generated",
        },
      ],
    },
    finished: false,
    metadata: {
      type: "content_block_delta",
      delta: {
        type: "text_delta",
        text: "This response is still being generated",
      },
      index: 0,
    },
  } as StreamDelta,

  /**
   * Streaming delta with null stop_reason
   */
  nullStopReasonDelta: {
    id: "chunk-anthropic-null",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " and completed.",
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
      type: "message_stop",
      stopReason: null,
      message: {
        id: "msg_stream_def",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 15,
          output_tokens: 8,
        },
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with unknown stop_reason
   */
  unknownStopReasonDelta: {
    id: "chunk-anthropic-unknown",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " with unknown termination.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 18,
      completionTokens: 6,
      totalTokens: 24,
    },
    metadata: {
      type: "message_stop",
      stopReason: "future_unknown_reason",
      message: {
        id: "msg_stream_ghi",
        model: "claude-3-sonnet-20240229",
        usage: {
          input_tokens: 18,
          output_tokens: 6,
        },
      },
    },
  } as StreamDelta,
};
