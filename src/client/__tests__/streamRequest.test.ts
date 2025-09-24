import type { StreamRequest } from "../streamRequest";
import type { ChatRequest } from "../chatRequest";
import type { Message } from "../../core/messages/message";
import type { AgentExecutionOptions } from "../../core/agent/agentExecutionOptions";

describe("StreamRequest", () => {
  const validMessage: Message = {
    role: "user",
    content: [{ type: "text", text: "Hello!" }],
  };

  const validMessages: Message[] = [validMessage];

  describe("interface structure", () => {
    it("should extend ChatRequest interface", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 1000,
      };

      // Should have all ChatRequest properties
      expect(request.messages).toEqual(validMessages);
      expect(request.model).toBe("gpt-4");
      expect(request.temperature).toBe(0.7);
      expect(request.maxTokens).toBe(1000);
    });

    it("should accept optional stream parameter", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
      };

      expect(request.stream).toBe(true);
    });

    it("should accept optional streamOptions parameter", () => {
      const streamOptions = {
        includeUsage: true,
        bufferSize: 1024,
      };

      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        streamOptions,
      };

      expect(request.streamOptions).toEqual(streamOptions);
    });

    it("should accept streamOptions with partial configuration", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        streamOptions: {
          includeUsage: false,
        },
      };

      expect(request.streamOptions?.includeUsage).toBe(false);
      expect(request.streamOptions?.bufferSize).toBeUndefined();
    });

    it("should accept providerConfig from ChatRequest inheritance", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "openai:gpt-4",
        providerConfig: "prod",
        stream: true,
      };

      expect(request.providerConfig).toBe("prod");
      expect(request.stream).toBe(true);
    });

    it("should accept all streaming parameters together", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.5,
        stream: true,
        streamOptions: {
          includeUsage: true,
          bufferSize: 2048,
        },
        providerConfig: "main",
      };

      expect(request.stream).toBe(true);
      expect(request.streamOptions?.includeUsage).toBe(true);
      expect(request.streamOptions?.bufferSize).toBe(2048);
      expect(request.providerConfig).toBe("main");
    });
  });

  describe("inheritance from ChatRequest", () => {
    it("should be assignable to ChatRequest", () => {
      const streamRequest: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
      };

      // Should be assignable to ChatRequest
      const chatRequest: ChatRequest = streamRequest;
      expect(chatRequest.messages).toEqual(validMessages);
      expect(chatRequest.model).toBe("gpt-4");
    });

    it("should inherit providerConfig from ChatRequest", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "anthropic:claude-3-sonnet",
        providerConfig: "backup",
      };

      // Should inherit providerConfig from ChatRequest
      expect(request.providerConfig).toBe("backup");

      // Should maintain type compatibility
      const chatRequest: ChatRequest = request;
      expect(chatRequest.providerConfig).toBe("backup");
    });

    it("should maintain type compatibility with providerConfig", () => {
      const streamRequest: StreamRequest = {
        messages: validMessages,
        model: "openai:gpt-4",
        providerConfig: "dev",
        stream: true,
      };

      // Should be assignable to ChatRequest with providerConfig
      const chatRequest: ChatRequest = streamRequest;
      expect(chatRequest.providerConfig).toBe("dev");
      expect(chatRequest.model).toBe("openai:gpt-4");
    });

    it("should inherit all ChatRequest optional properties", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.9,
        maxTokens: 500,
        options: { customOption: "value" },
        providerConfig: "test",
        stream: true,
        streamOptions: { includeUsage: true },
      };

      // All ChatRequest properties should be accessible
      expect(request.temperature).toBe(0.9);
      expect(request.maxTokens).toBe(500);
      expect(request.options?.customOption).toBe("value");
      expect(request.providerConfig).toBe("test");

      // Plus StreamRequest-specific properties
      expect(request.stream).toBe(true);
      expect(request.streamOptions?.includeUsage).toBe(true);
    });
  });

  describe("TypeScript compilation", () => {
    it("should enforce streamOptions type safety", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        streamOptions: {
          includeUsage: true,
          bufferSize: 1024,
        },
      };

      // TypeScript should infer correct types
      const includeUsage: boolean | undefined =
        request.streamOptions?.includeUsage;
      const bufferSize: number | undefined = request.streamOptions?.bufferSize;

      expect(includeUsage).toBe(true);
      expect(bufferSize).toBe(1024);
    });

    it("should allow undefined streamOptions", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
      };

      expect(request.streamOptions).toBeUndefined();
    });

    it("should maintain type compatibility with ChatRequest", () => {
      const createChatRequest = (req: ChatRequest): string => req.model;

      const streamRequest: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
      };

      // Should work without type errors
      const model = createChatRequest(streamRequest);
      expect(model).toBe("gpt-4");
    });
  });

  describe("multi-turn configuration", () => {
    it("should inherit multiTurn property from ChatRequest", () => {
      const multiTurnConfig: Partial<AgentExecutionOptions> = {
        maxIterations: 5,
        iterationTimeoutMs: 30000,
        enableStreaming: true,
      };

      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        multiTurn: multiTurnConfig,
      };

      expect(request.multiTurn).toEqual(multiTurnConfig);
      expect(request.multiTurn?.maxIterations).toBe(5);
      expect(request.multiTurn?.enableStreaming).toBe(true);
    });

    it("should support streaming-specific multiTurn combinations", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        streamOptions: { includeUsage: true, bufferSize: 1024 },
        multiTurn: {
          maxIterations: 3,
          iterationTimeoutMs: 45000,
          enableStreaming: true,
          toolExecutionStrategy: "sequential",
        },
      };

      expect(request.stream).toBe(true);
      expect(request.multiTurn?.enableStreaming).toBe(true);
      expect(request.multiTurn?.toolExecutionStrategy).toBe("sequential");
      expect(request.streamOptions?.bufferSize).toBe(1024);
    });

    it("should work with enableStreaming false while stream is true", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        multiTurn: {
          maxIterations: 2,
          enableStreaming: false, // Disable streaming interruption handling
        },
      };

      expect(request.stream).toBe(true);
      expect(request.multiTurn?.enableStreaming).toBe(false);
    });

    it("should maintain assignability to ChatRequest with multiTurn", () => {
      const streamRequest: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        multiTurn: {
          maxIterations: 4,
          toolExecutionStrategy: "parallel",
          maxConcurrentTools: 2,
        },
      };

      // Should still be assignable to ChatRequest
      const chatRequest: ChatRequest = streamRequest;
      expect(chatRequest.multiTurn?.maxIterations).toBe(4);
      expect(chatRequest.multiTurn?.toolExecutionStrategy).toBe("parallel");
    });

    it("should compile documentation examples correctly", () => {
      // Multi-turn streaming example from docs
      const multiTurnStreamRequest: StreamRequest = {
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Help me research a topic" }],
          },
        ],
        model: "gpt-4",
        stream: true,
        streamOptions: { includeUsage: true, bufferSize: 1024 },
        tools: [
          {
            name: "search",
            description: "Search for information",
            inputSchema: { type: "object" },
          },
        ],
        multiTurn: {
          maxIterations: 5,
          iterationTimeoutMs: 45000,
          enableStreaming: true,
          toolExecutionStrategy: "sequential",
        },
      };

      expect(multiTurnStreamRequest.multiTurn?.maxIterations).toBe(5);
      expect(multiTurnStreamRequest.multiTurn?.enableStreaming).toBe(true);
      expect(multiTurnStreamRequest.stream).toBe(true);
    });

    it("should support comprehensive multiTurn configuration for streaming", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        multiTurn: {
          maxIterations: 8,
          iterationTimeoutMs: 60000,
          enableStreaming: true,
          toolExecutionStrategy: "parallel",
          maxConcurrentTools: 3,
          timeoutMs: 300000,
          maxToolCalls: 10,
          continueOnToolError: true,
        },
      };

      expect(request.multiTurn?.maxIterations).toBe(8);
      expect(request.multiTurn?.enableStreaming).toBe(true);
      expect(request.multiTurn?.toolExecutionStrategy).toBe("parallel");
      expect(request.multiTurn?.maxConcurrentTools).toBe(3);
      expect(request.multiTurn?.continueOnToolError).toBe(true);
    });

    it("should ensure type safety for inherited multiTurn options", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        multiTurn: {
          maxIterations: 6,
          enableStreaming: true,
          toolExecutionStrategy: "parallel",
        },
      };

      // TypeScript should infer correct types
      const maxIterations: number | undefined =
        request.multiTurn?.maxIterations;
      const enableStreaming: boolean | undefined =
        request.multiTurn?.enableStreaming;
      const strategy: "sequential" | "parallel" | undefined =
        request.multiTurn?.toolExecutionStrategy;
      const stream: boolean | undefined = request.stream;

      expect(maxIterations).toBe(6);
      expect(enableStreaming).toBe(true);
      expect(strategy).toBe("parallel");
      expect(stream).toBe(true);
    });

    it("should maintain backward compatibility without multiTurn", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        stream: true,
        streamOptions: { includeUsage: true },
      };

      expect(request.multiTurn).toBeUndefined();
      expect(request.stream).toBe(true);
      expect(request.streamOptions?.includeUsage).toBe(true);
    });
  });
});
