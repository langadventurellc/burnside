import { shouldExecuteMultiTurn } from "../shouldExecuteMultiTurn";
import type { ChatRequest } from "../chatRequest";

describe("shouldExecuteMultiTurn", () => {
  const basicRequest: ChatRequest = {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
    model: "gpt-4",
  };

  const toolDefinition = {
    name: "echo",
    description: "Echo input",
    inputSchema: { type: "object" as const },
  };

  describe("when all conditions are met", () => {
    it("should return true for request with tools, enabled tools, and multiTurn config", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
        multiTurn: { maxIterations: 5 },
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(true);
    });

    it("should return true with empty multiTurn object", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
        multiTurn: {},
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(true);
    });

    it("should return true with comprehensive multiTurn config", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
        multiTurn: {
          maxIterations: 10,
          iterationTimeoutMs: 30000,
          enableStreaming: true,
          toolExecutionStrategy: "parallel",
          maxConcurrentTools: 3,
        },
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(true);
    });
  });

  describe("when tools are missing or disabled", () => {
    it("should return false when request has no tools property", () => {
      const request: ChatRequest = {
        ...basicRequest,
        multiTurn: { maxIterations: 5 },
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(false);
    });

    it("should return false when tools array is empty", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [],
        multiTurn: { maxIterations: 5 },
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(false);
    });

    it("should return false when tools are disabled in client", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
        multiTurn: { maxIterations: 5 },
      };

      const result = shouldExecuteMultiTurn(request, false);

      expect(result).toBe(false);
    });
  });

  describe("when multiTurn configuration is missing", () => {
    it("should return false when multiTurn is undefined", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(false);
    });

    it("should return false when multiTurn is undefined even with tools enabled", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition, toolDefinition],
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(false);
    });
  });

  describe("backward compatibility scenarios", () => {
    it("should return false for legacy single-turn requests with tools", () => {
      const legacyRequest: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
        // No multiTurn property - this should use single-turn execution
      };

      const result = shouldExecuteMultiTurn(legacyRequest, true);

      expect(result).toBe(false);
    });

    it("should return false for requests without tools or multiTurn", () => {
      const simpleRequest: ChatRequest = {
        ...basicRequest,
        // No tools, no multiTurn
      };

      const result = shouldExecuteMultiTurn(simpleRequest, true);

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false when all conditions are false", () => {
      const request: ChatRequest = {
        ...basicRequest,
        // No tools, no multiTurn
      };

      const result = shouldExecuteMultiTurn(request, false);

      expect(result).toBe(false);
    });

    it("should return false with tools disabled and no multiTurn", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition],
      };

      const result = shouldExecuteMultiTurn(request, false);

      expect(result).toBe(false);
    });

    it("should return false with multiple tools but no multiTurn", () => {
      const request: ChatRequest = {
        ...basicRequest,
        tools: [toolDefinition, toolDefinition, toolDefinition],
      };

      const result = shouldExecuteMultiTurn(request, true);

      expect(result).toBe(false);
    });
  });
});
