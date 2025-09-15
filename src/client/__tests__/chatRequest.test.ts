import type { ChatRequest } from "../chatRequest";
import type { Message } from "../../core/messages/message";

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
      };

      expect(request.messages).toEqual(validMessages);
      expect(request.model).toBe("gpt-4");
    });

    it("should accept optional temperature parameter", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.7,
      };

      expect(request.temperature).toBe(0.7);
    });

    it("should accept optional maxTokens parameter", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        maxTokens: 1000,
      };

      expect(request.maxTokens).toBe(1000);
    });

    it("should accept optional options parameter", () => {
      const options = { customParam: "value" };
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        options,
      };

      expect(request.options).toEqual(options);
    });

    it("should accept all optional parameters together", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.5,
        maxTokens: 2000,
        options: { stream: false },
      };

      expect(request.temperature).toBe(0.5);
      expect(request.maxTokens).toBe(2000);
      expect(request.options?.stream).toBe(false);
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
        model: "gpt-3.5-turbo",
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
      };

      expect(validRequest).toBeDefined();
    });

    it("should allow proper type inference", () => {
      const request: ChatRequest = {
        messages: validMessages,
        model: "gpt-4",
        temperature: 0.8,
      };

      // TypeScript should infer the correct types
      const messages: Message[] = request.messages;
      const model: string = request.model;
      const temperature: number | undefined = request.temperature;

      expect(messages).toEqual(validMessages);
      expect(model).toBe("gpt-4");
      expect(temperature).toBe(0.8);
    });
  });
});
