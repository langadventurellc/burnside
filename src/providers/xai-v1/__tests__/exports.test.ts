/**
 * @fileoverview Test exports from the xAI v1 provider module
 */

import {
  XAIV1Provider,
  XAI_PROVIDER_INFO,
  XAIV1Config,
  parseXAIV1ResponseStream,
  parseXAIResponse,
  translateChatRequest,
  translateToolDefinitionToXAI,
  translateToolsForXAI,
  XAIV1ResponseSchema,
  XAIV1StreamingResponseSchema,
  XAIV1Response,
  XAIV1StreamingResponse,
  XAIV1RequestSchema,
  XAIV1Request,
  XAIV1ConfigSchema,
  XAIV1ErrorResponseSchema,
  XAIV1ErrorResponse,
  normalizeXAIError,
  default as defaultExport,
} from "../index";

describe("xAI v1 Provider Module Exports", () => {
  describe("Core provider exports", () => {
    test("exports XAIV1Provider class", () => {
      expect(XAIV1Provider).toBeDefined();
      expect(typeof XAIV1Provider).toBe("function");
    });

    test("exports XAI_PROVIDER_INFO metadata", () => {
      expect(XAI_PROVIDER_INFO).toBeDefined();
      expect(XAI_PROVIDER_INFO.id).toBe("xai");
      expect(XAI_PROVIDER_INFO.version).toBe("v1");
    });

    test("exports default export", () => {
      expect(defaultExport).toBeDefined();
      expect(defaultExport).toBe(XAIV1Provider);
    });
  });

  describe("Utility function exports", () => {
    test("exports streaming parser", () => {
      expect(parseXAIV1ResponseStream).toBeDefined();
      expect(typeof parseXAIV1ResponseStream).toBe("function");
    });

    test("exports response parser", () => {
      expect(parseXAIResponse).toBeDefined();
      expect(typeof parseXAIResponse).toBe("function");
    });

    test("exports request translator", () => {
      expect(translateChatRequest).toBeDefined();
      expect(typeof translateChatRequest).toBe("function");
    });

    test("exports tool translators", () => {
      expect(translateToolDefinitionToXAI).toBeDefined();
      expect(typeof translateToolDefinitionToXAI).toBe("function");

      expect(translateToolsForXAI).toBeDefined();
      expect(typeof translateToolsForXAI).toBe("function");
    });

    test("exports error normalizer", () => {
      expect(normalizeXAIError).toBeDefined();
      expect(typeof normalizeXAIError).toBe("function");
    });
  });

  describe("Schema exports", () => {
    test("exports response schemas", () => {
      expect(XAIV1ResponseSchema).toBeDefined();
      expect(XAIV1StreamingResponseSchema).toBeDefined();
    });

    test("exports request schema", () => {
      expect(XAIV1RequestSchema).toBeDefined();
    });

    test("exports config schema", () => {
      expect(XAIV1ConfigSchema).toBeDefined();
    });

    test("exports error response schema", () => {
      expect(XAIV1ErrorResponseSchema).toBeDefined();
    });
  });

  describe("Type exports", () => {
    test("types are properly exported", () => {
      // These tests will fail at compile time if types aren't exported
      const _config: XAIV1Config = {} as any;
      const _response: XAIV1Response = {} as any;
      const _streamingResponse: XAIV1StreamingResponse = {} as any;
      const _request: XAIV1Request = {} as any;
      const _errorResponse: XAIV1ErrorResponse = {} as any;

      // Suppress unused variable warnings
      expect(_config).toBeDefined();
      expect(_response).toBeDefined();
      expect(_streamingResponse).toBeDefined();
      expect(_request).toBeDefined();
      expect(_errorResponse).toBeDefined();
    });
  });
});
