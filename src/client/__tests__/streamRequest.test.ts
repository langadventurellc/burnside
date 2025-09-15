import type { StreamRequest } from "../streamRequest";
import type { ChatRequest } from "../chatRequest";
import type { Message } from "../../core/messages/message";

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
      };

      expect(request.stream).toBe(true);
      expect(request.streamOptions?.includeUsage).toBe(true);
      expect(request.streamOptions?.bufferSize).toBe(2048);
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

    it("should inherit all ChatRequest optional properties", () => {
      const request: StreamRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.9,
        maxTokens: 500,
        options: { customOption: "value" },
        stream: true,
        streamOptions: { includeUsage: true },
      };

      // All ChatRequest properties should be accessible
      expect(request.temperature).toBe(0.9);
      expect(request.maxTokens).toBe(500);
      expect(request.options?.customOption).toBe("value");

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
});
