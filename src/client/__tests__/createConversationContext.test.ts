import { createConversationContext } from "../createConversationContext";
import type { Message } from "../../core/messages/message";
import type { ToolCall } from "../../core/tools/toolCall";
import type { AgentExecutionOptions } from "../../core/agent/agentExecutionOptions";
import type { StreamingState } from "../../core/agent/streamingState";

describe("createConversationContext", () => {
  const basicMessages: Message[] = [
    {
      role: "user",
      content: [{ type: "text", text: "Hello, help me with math" }],
    },
    {
      role: "assistant",
      content: [{ type: "text", text: "I'll help you with math!" }],
    },
  ];

  const basicOptions: AgentExecutionOptions = {
    maxIterations: 5,
    timeoutMs: 30000,
    toolTimeoutMs: 5000,
  };

  const toolCalls: ToolCall[] = [
    {
      id: "call_123",
      name: "calculator",
      parameters: { operation: "multiply", a: 15, b: 23 },
    },
    {
      id: "call_456",
      name: "search",
      parameters: { query: "weather forecast" },
    },
  ];

  describe("with default parameters", () => {
    it("should create context with default values", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );

      expect(result).toEqual({
        conversationHistory: basicMessages,
        currentIteration: 1,
        totalIterations: 5,
        startTime: expect.any(Number),
        lastIterationTime: expect.any(Number),
        streamingState: "idle",
        toolExecutionHistory: toolCalls,
        estimatedTokensUsed: undefined,
      });
    });

    it("should use current timestamp for startTime when not provided", () => {
      const beforeTime = Date.now();
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );
      const afterTime = Date.now();

      expect(result.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(result.startTime).toBeLessThanOrEqual(afterTime);
    });

    it("should use current timestamp for lastIterationTime", () => {
      const beforeTime = Date.now();
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );
      const afterTime = Date.now();

      expect(result.lastIterationTime).toBeGreaterThanOrEqual(beforeTime);
      expect(result.lastIterationTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("with custom parameters", () => {
    it("should create context with all custom values", () => {
      const customStartTime = Date.now() - 60000; // 1 minute ago
      const customIteration = 3;
      const customStreamingState: StreamingState = "streaming";
      const customTokens = 250;

      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
        customIteration,
        customStreamingState,
        customStartTime,
        customTokens,
      );

      expect(result).toEqual({
        conversationHistory: basicMessages,
        currentIteration: customIteration,
        totalIterations: 5,
        startTime: customStartTime,
        lastIterationTime: expect.any(Number),
        streamingState: customStreamingState,
        toolExecutionHistory: toolCalls,
        estimatedTokensUsed: customTokens,
      });
    });

    it("should handle all streaming states", () => {
      const streamingStates: StreamingState[] = [
        "idle",
        "streaming",
        "paused",
        "tool_execution",
        "resuming",
      ];

      streamingStates.forEach((state) => {
        const result = createConversationContext(
          basicMessages,
          basicOptions,
          toolCalls,
          1,
          state,
        );

        expect(result.streamingState).toBe(state);
      });
    });
  });

  describe("with options variations", () => {
    it("should use default maxIterations when not provided", () => {
      const optionsWithoutMax: AgentExecutionOptions = {
        timeoutMs: 30000,
      };

      const result = createConversationContext(
        basicMessages,
        optionsWithoutMax,
        toolCalls,
      );

      expect(result.totalIterations).toBe(10); // Default value
    });

    it("should use custom maxIterations when provided", () => {
      const optionsWithMax: AgentExecutionOptions = {
        maxIterations: 15,
        timeoutMs: 30000,
      };

      const result = createConversationContext(
        basicMessages,
        optionsWithMax,
        toolCalls,
      );

      expect(result.totalIterations).toBe(15);
    });

    it("should handle comprehensive options", () => {
      const comprehensiveOptions: AgentExecutionOptions = {
        maxToolCalls: 5,
        timeoutMs: 60000,
        toolTimeoutMs: 10000,
        continueOnToolError: true,
        maxIterations: 8,
        iterationTimeoutMs: 15000,
        enableStreaming: true,
        toolExecutionStrategy: "parallel",
        maxConcurrentTools: 3,
      };

      const result = createConversationContext(
        basicMessages,
        comprehensiveOptions,
        toolCalls,
      );

      expect(result.totalIterations).toBe(8);
    });
  });

  describe("with edge cases", () => {
    it("should handle empty messages array", () => {
      const result = createConversationContext([], basicOptions, toolCalls);

      expect(result.conversationHistory).toEqual([]);
      expect(result.currentIteration).toBe(1);
      expect(result.totalIterations).toBe(5);
    });

    it("should handle empty tool execution history", () => {
      const result = createConversationContext(basicMessages, basicOptions, []);

      expect(result.toolExecutionHistory).toEqual([]);
    });

    it("should handle zero estimated tokens", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
        1,
        "idle",
        Date.now(),
        0,
      );

      expect(result.estimatedTokensUsed).toBe(0);
    });

    it("should handle high iteration numbers", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
        999,
      );

      expect(result.currentIteration).toBe(999);
    });
  });

  describe("context structure validation", () => {
    it("should include all required ConversationContext properties", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );

      // Verify all required properties exist
      expect(result).toHaveProperty("conversationHistory");
      expect(result).toHaveProperty("currentIteration");
      expect(result).toHaveProperty("totalIterations");
      expect(result).toHaveProperty("startTime");
      expect(result).toHaveProperty("lastIterationTime");
      expect(result).toHaveProperty("streamingState");
      expect(result).toHaveProperty("toolExecutionHistory");
      expect(result).toHaveProperty("estimatedTokensUsed");
    });

    it("should preserve message references without deep copying", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );

      expect(result.conversationHistory).toBe(basicMessages);
    });

    it("should preserve tool call references without deep copying", () => {
      const result = createConversationContext(
        basicMessages,
        basicOptions,
        toolCalls,
      );

      expect(result.toolExecutionHistory).toBe(toolCalls);
    });
  });
});
