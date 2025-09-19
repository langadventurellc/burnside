/**
 * Google Gemini Response Fixtures for Termination Detection Testing
 *
 * Realistic Google Gemini API response fixtures covering all termination scenarios
 * for comprehensive contract testing and cross-provider consistency validation.
 */

import type { StreamDelta } from "../../../../client/streamDelta";
import type { Message } from "../../../messages/message";

/**
 * Non-streaming response fixtures for Google Gemini API
 */
export const geminiResponses = {
  /**
   * Natural completion with finishReason: "STOP"
   */
  naturalCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Hello! I'm Gemini, an AI assistant by Google. How can I help you today?",
        },
      ],
    },
    usage: {
      promptTokens: 12,
      completionTokens: 16,
      totalTokens: 28,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "STOP",
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Hello! I'm Gemini, an AI assistant by Google. How can I help you today?",
              },
            ],
            role: "model",
          },
          finishReason: "STOP",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 12,
        candidatesTokenCount: 16,
        totalTokenCount: 28,
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
   * Token limit reached with finishReason: "MAX_TOKENS"
   */
  tokenLimitReached: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "This is a very long response that has reached the maximum token limit and therefore gets cut off abruptly without proper",
        },
      ],
    },
    usage: {
      promptTokens: 100,
      completionTokens: 4096,
      totalTokens: 4196,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "MAX_TOKENS",
      candidates: [
        {
          content: {
            parts: [
              {
                text: "This is a very long response that has reached the maximum token limit and therefore gets cut off abruptly without proper",
              },
            ],
            role: "model",
          },
          finishReason: "MAX_TOKENS",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 4096,
        totalTokenCount: 4196,
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
   * Safety filter triggered with finishReason: "SAFETY"
   */
  safetyFiltered: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I can't provide information about that topic due to safety guidelines.",
        },
      ],
    },
    usage: {
      promptTokens: 25,
      completionTokens: 12,
      totalTokens: 37,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "SAFETY",
      candidates: [
        {
          content: {
            parts: [
              {
                text: "I can't provide information about that topic due to safety guidelines.",
              },
            ],
            role: "model",
          },
          finishReason: "SAFETY",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HATE_SPEECH", probability: "HIGH" },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "MEDIUM" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 25,
        candidatesTokenCount: 12,
        totalTokenCount: 37,
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
   * Content recitation detected with finishReason: "RECITATION"
   */
  recitationDetected: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I can't reproduce that copyrighted content.",
        },
      ],
    },
    usage: {
      promptTokens: 30,
      completionTokens: 8,
      totalTokens: 38,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "RECITATION",
      candidates: [
        {
          content: {
            parts: [{ text: "I can't reproduce that copyrighted content." }],
            role: "model",
          },
          finishReason: "RECITATION",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 30,
        candidatesTokenCount: 8,
        totalTokenCount: 38,
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
   * Other termination reason with finishReason: "OTHER"
   */
  otherTermination: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response terminated for unspecified reasons.",
        },
      ],
    },
    usage: {
      promptTokens: 15,
      completionTokens: 7,
      totalTokens: 22,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "OTHER",
      candidates: [
        {
          content: {
            parts: [{ text: "Response terminated for unspecified reasons." }],
            role: "model",
          },
          finishReason: "OTHER",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 15,
        candidatesTokenCount: 7,
        totalTokenCount: 22,
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
   * Function calling completion with finishReason: "STOP"
   */
  functionCallCompletion: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "I'll help you with that calculation.",
        },
        {
          type: "tool_use" as const,
          id: "call_calculate_123",
          name: "calculate",
          input: { expression: "2 + 2" },
        },
      ],
    },
    usage: {
      promptTokens: 35,
      completionTokens: 18,
      totalTokens: 53,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "STOP",
      candidates: [
        {
          content: {
            parts: [
              { text: "I'll help you with that calculation." },
              {
                functionCall: {
                  name: "calculate",
                  args: { expression: "2 + 2" },
                },
              },
            ],
            role: "model",
          },
          finishReason: "STOP",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 35,
        candidatesTokenCount: 18,
        totalTokenCount: 53,
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
   * Unknown finish reason scenario
   */
  unknownFinishReason: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with unrecognized finish reason.",
        },
      ],
    },
    usage: {
      promptTokens: 18,
      completionTokens: 6,
      totalTokens: 24,
    },
    model: "gemini-1.5-pro",
    metadata: {
      finishReason: "FUTURE_UNKNOWN_REASON",
      candidates: [
        {
          content: {
            parts: [{ text: "Response with unrecognized finish reason." }],
            role: "model",
          },
          finishReason: "FUTURE_UNKNOWN_REASON",
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 18,
        candidatesTokenCount: 6,
        totalTokenCount: 24,
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
   * Missing finish reason scenario
   */
  missingFinishReason: {
    message: {
      role: "assistant" as const,
      content: [
        {
          type: "text" as const,
          text: "Response with missing finish reason.",
        },
      ],
    },
    usage: {
      promptTokens: 20,
      completionTokens: 6,
      totalTokens: 26,
    },
    model: "gemini-1.5-pro",
    metadata: {
      candidates: [
        {
          content: {
            parts: [{ text: "Response with missing finish reason." }],
            role: "model",
          },
          // finishReason field is completely missing
          index: 0,
          safetyRatings: [
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              probability: "NEGLIGIBLE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              probability: "NEGLIGIBLE",
            },
            { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              probability: "NEGLIGIBLE",
            },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 20,
        candidatesTokenCount: 6,
        totalTokenCount: 26,
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
 * Streaming response fixtures for Google Gemini API
 */
export const geminiStreamingResponses = {
  /**
   * Streaming delta with natural completion (finishReason: "STOP")
   */
  naturalCompletionDelta: {
    id: "chunk-gemini-natural",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " That's all for now!",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 12,
      completionTokens: 16,
      totalTokens: 28,
    },
    metadata: {
      finishReason: "STOP",
      candidates: [
        {
          content: {
            parts: [{ text: " That's all for now!" }],
            role: "model",
          },
          finishReason: "STOP",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 12,
        candidatesTokenCount: 16,
        totalTokenCount: 28,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with token limit (finishReason: "MAX_TOKENS")
   */
  tokenLimitDelta: {
    id: "chunk-gemini-tokens",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " and then it stops abruptly",
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
      finishReason: "MAX_TOKENS",
      candidates: [
        {
          content: {
            parts: [{ text: " and then it stops abruptly" }],
            role: "model",
          },
          finishReason: "MAX_TOKENS",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 4096,
        totalTokenCount: 4196,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with safety filter (finishReason: "SAFETY")
   */
  safetyFilterDelta: {
    id: "chunk-gemini-safety",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I can't continue with that request.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 25,
      completionTokens: 8,
      totalTokens: 33,
    },
    metadata: {
      finishReason: "SAFETY",
      candidates: [
        {
          content: {
            parts: [{ text: "I can't continue with that request." }],
            role: "model",
          },
          finishReason: "SAFETY",
          index: 0,
          safetyRatings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", probability: "HIGH" },
          ],
        },
      ],
      usageMetadata: {
        promptTokenCount: 25,
        candidatesTokenCount: 8,
        totalTokenCount: 33,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with recitation detection (finishReason: "RECITATION")
   */
  recitationDelta: {
    id: "chunk-gemini-recitation",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I can't reproduce that content.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 30,
      completionTokens: 6,
      totalTokens: 36,
    },
    metadata: {
      finishReason: "RECITATION",
      candidates: [
        {
          content: {
            parts: [{ text: "I can't reproduce that content." }],
            role: "model",
          },
          finishReason: "RECITATION",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 30,
        candidatesTokenCount: 6,
        totalTokenCount: 36,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with other termination (finishReason: "OTHER")
   */
  otherTerminationDelta: {
    id: "chunk-gemini-other",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: " for unspecified reasons.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 15,
      completionTokens: 4,
      totalTokens: 19,
    },
    metadata: {
      finishReason: "OTHER",
      candidates: [
        {
          content: {
            parts: [{ text: " for unspecified reasons." }],
            role: "model",
          },
          finishReason: "OTHER",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 15,
        candidatesTokenCount: 4,
        totalTokenCount: 19,
      },
    },
  } as StreamDelta,

  /**
   * Incomplete streaming delta (not finished)
   */
  incompleteDelta: {
    id: "chunk-gemini-ongoing",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "This response is still being",
        },
      ],
    },
    finished: false,
    metadata: {
      candidates: [
        {
          content: {
            parts: [{ text: "This response is still being" }],
            role: "model",
          },
          index: 0,
        },
      ],
    },
  } as StreamDelta,

  /**
   * Streaming delta with function call (finishReason: "STOP")
   */
  functionCallDelta: {
    id: "chunk-gemini-function",
    delta: {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Let me call a function.",
        },
      ],
    },
    finished: true,
    usage: {
      promptTokens: 35,
      completionTokens: 18,
      totalTokens: 53,
    },
    metadata: {
      finishReason: "STOP",
      candidates: [
        {
          content: {
            parts: [
              { text: "Let me call a function." },
              { functionCall: { name: "calculate", args: { x: 5 } } },
            ],
            role: "model",
          },
          finishReason: "STOP",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 35,
        candidatesTokenCount: 18,
        totalTokenCount: 53,
      },
    },
  } as StreamDelta,

  /**
   * Streaming delta with unknown finish reason
   */
  unknownFinishReasonDelta: {
    id: "chunk-gemini-unknown",
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
      completionTokens: 4,
      totalTokens: 22,
    },
    metadata: {
      finishReason: "FUTURE_UNKNOWN_REASON",
      candidates: [
        {
          content: {
            parts: [{ text: " with unknown termination." }],
            role: "model",
          },
          finishReason: "FUTURE_UNKNOWN_REASON",
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 18,
        candidatesTokenCount: 4,
        totalTokenCount: 22,
      },
    },
  } as StreamDelta,
};
