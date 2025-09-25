import type { ChatRequest } from "../chatRequest";
import type { Message } from "../../core/messages/message";
import type { AgentExecutionOptions } from "../../core/agent/agentExecutionOptions";

describe("ChatRequest", () => {
  const validMessage: Message = {
    role: "user",
    content: [{ type: "text", text: "Hello!" }],
  };

  const validMessages: Message[] = [validMessage];

  describe("interface structure", () => {
    it("should accept valid chat request with required fields", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        providerConfig: "default",
      };

      expect(request.messages).toEqual(validMessages);
      expect(request.model).toBe("gpt-4");
    });

    it("should accept optional temperature parameter", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.7,
        providerConfig: "default",
      };

      expect(request.temperature).toBe(0.7);
    });

    it("should accept optional maxTokens parameter", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        maxTokens: 1000,
        providerConfig: "default",
      };

      expect(request.maxTokens).toBe(1000);
    });

    it("should accept optional options parameter", () => {
      const options = { customParam: "value" };
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        options,
        providerConfig: "default",
      };

      expect(request.options).toEqual(options);
    });

    it("should accept optional providerConfig parameter", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "openai:gpt-4",
        providerConfig: "prod",
      };

      expect(request.providerConfig).toBe("prod");
    });

    it("should accept providerConfig with other optional parameters", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "anthropic:claude-3-sonnet",
        providerConfig: "dev",
        temperature: 0.8,
        maxTokens: 1500,
      };

      expect(request.providerConfig).toBe("dev");
      expect(request.temperature).toBe(0.8);
      expect(request.maxTokens).toBe(1500);
    });

    it("should accept all optional parameters together", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.5,
        maxTokens: 2000,
        options: { stream: false },
        providerConfig: "main",
      };

      expect(request.temperature).toBe(0.5);
      expect(request.maxTokens).toBe(2000);
      expect(request.options?.stream).toBe(false);
      expect(request.providerConfig).toBe("main");
    });
  });

  describe("TypeScript compilation", () => {
    it("should compile with valid message array", () => {
      const multipleMessages: Message[] = [
        { role: "user", content: [{ type: "text", text: "Hello!" }] },
        { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
      ];

      const request: ChatRequest = {
        messages: multipleMessages,
        model: "gpt-5-nano-2025-08-07",
        providerConfig: "default",
      };

      expect(request.messages).toHaveLength(2);
    });

    it("should enforce required fields", () => {
      // These should cause TypeScript compilation errors if uncommented:
      // const invalidRequest1: ChatRequest = { model: "gpt-4" }; // missing messages
      // const invalidRequest2: ChatRequest = { messages: validMessages }; // missing model

      // This test ensures the interface requires both fields
      const validRequest: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        providerConfig: "default",
      };

      expect(validRequest).toBeDefined();
    });

    it("should allow proper type inference", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.8,
        providerConfig: "default",
      };

      // TypeScript should infer the correct types
      const messages: Message[] = request.messages;
      const model: string = request.model;
      const temperature: number | undefined = request.temperature;

      expect(messages).toEqual(validMessages);
      expect(model).toBe("gpt-4");
      expect(temperature).toBe(0.8);
    });

    it("should allow proper type inference with providerConfig", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "openai:gpt-4",
        providerConfig: "prod",
      };

      // TypeScript should infer the correct types
      const providerConfig: string | undefined = request.providerConfig;
      const model: string = request.model;

      expect(providerConfig).toBe("prod");
      expect(model).toBe("openai:gpt-4");
    });
  });

  describe("multi-turn configuration", () => {
    it("should accept optional multiTurn property", () => {
      const multiTurnConfig: Partial<AgentExecutionOptions> = {
        maxIterations: 5,
        iterationTimeoutMs: 30000,
      };

      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        multiTurn: multiTurnConfig,
        providerConfig: "default",
      };

      expect(request.multiTurn).toEqual(multiTurnConfig);
      expect(request.multiTurn?.maxIterations).toBe(5);
      expect(request.multiTurn?.iterationTimeoutMs).toBe(30000);
    });

    it("should accept partial multiTurn configuration", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        multiTurn: {
          maxIterations: 3,
        },
        providerConfig: "default",
      };

      expect(request.multiTurn?.maxIterations).toBe(3);
      expect(request.multiTurn?.iterationTimeoutMs).toBeUndefined();
    });

    it("should accept comprehensive multiTurn configuration", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        multiTurn: {
          maxIterations: 10,
          iterationTimeoutMs: 45000,
          enableStreaming: true,
          toolExecutionStrategy: "parallel",
          maxConcurrentTools: 2,
          timeoutMs: 120000,
        },
        providerConfig: "default",
      };

      expect(request.multiTurn?.maxIterations).toBe(10);
      expect(request.multiTurn?.iterationTimeoutMs).toBe(45000);
      expect(request.multiTurn?.enableStreaming).toBe(true);
      expect(request.multiTurn?.toolExecutionStrategy).toBe("parallel");
      expect(request.multiTurn?.maxConcurrentTools).toBe(2);
      expect(request.multiTurn?.timeoutMs).toBe(120000);
    });

    it("should allow empty multiTurn object", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        multiTurn: {},
        providerConfig: "default",
      };

      expect(request.multiTurn).toEqual({});
    });

    it("should maintain backward compatibility without multiTurn", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 1000,
        providerConfig: "default",
      };

      expect(request.multiTurn).toBeUndefined();
      expect(request.temperature).toBe(0.7);
      expect(request.maxTokens).toBe(1000);
    });

    it("should compile documentation examples correctly", () => {
      // Basic multi-turn configuration from docs
      const basicConfig: ChatRequest = {
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Help me with a task" }],
          },
        ],
        model: "gpt-4",
        multiTurn: {
          maxIterations: 5,
          iterationTimeoutMs: 30000,
          toolExecutionStrategy: "sequential",
          enableStreaming: true,
        },
        providerConfig: "default",
      };

      expect(basicConfig.multiTurn?.maxIterations).toBe(5);
      expect(basicConfig.multiTurn?.toolExecutionStrategy).toBe("sequential");
    });

    it("should ensure type safety for multiTurn options", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        multiTurn: {
          maxIterations: 5,
          enableStreaming: true,
        },
        providerConfig: "default",
      };

      // TypeScript should infer correct types
      const maxIterations: number | undefined =
        request.multiTurn?.maxIterations;
      const enableStreaming: boolean | undefined =
        request.multiTurn?.enableStreaming;
      const strategy: "sequential" | "parallel" | undefined =
        request.multiTurn?.toolExecutionStrategy;

      expect(maxIterations).toBe(5);
      expect(enableStreaming).toBe(true);
      expect(strategy).toBeUndefined();
    });
  });
});
