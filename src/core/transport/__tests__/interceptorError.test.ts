/**
 * @jest-environment node
 */
import { InterceptorError } from "../interceptorError.js";
import type { InterceptorErrorContext } from "../interceptorErrorContext.js";

describe("InterceptorError", () => {
  describe("constructor", () => {
    it("should create error with required properties", () => {
      const context: InterceptorErrorContext = {
        interceptorType: "request",
        interceptorIndex: 2,
        phase: "execution",
      };

      const error = new InterceptorError("Test interceptor error", context);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InterceptorError);
      expect(error.message).toBe("Test interceptor error");
      expect(error.code).toBe("INTERCEPTOR_ERROR");
      expect(error.interceptorType).toBe("request");
      expect(error.interceptorIndex).toBe(2);
      expect(error.phase).toBe("execution");
      expect(error.originalError).toBeUndefined();
    });

    it("should create error with original error context", () => {
      const originalError = new Error("Original failure");
      const context: InterceptorErrorContext = {
        interceptorType: "response",
        interceptorIndex: 1,
        phase: "validation",
        originalError,
        customField: "custom value",
      };

      const error = new InterceptorError("Interceptor failed", context);

      expect(error.interceptorType).toBe("response");
      expect(error.interceptorIndex).toBe(1);
      expect(error.phase).toBe("validation");
      expect(error.originalError).toBe(originalError);
      expect(error.context?.customField).toBe("custom value");
    });

    it("should handle context-threading phase", () => {
      const context: InterceptorErrorContext = {
        interceptorType: "request",
        interceptorIndex: 0,
        phase: "context-threading",
      };

      const error = new InterceptorError("Context threading failed", context);

      expect(error.phase).toBe("context-threading");
    });
  });

  describe("error inheritance", () => {
    it("should extend BridgeError correctly", () => {
      const context: InterceptorErrorContext = {
        interceptorType: "request",
        interceptorIndex: 0,
        phase: "execution",
      };

      const error = new InterceptorError("Test error", context);

      expect(error.name).toBe("InterceptorError");
      expect(error.code).toBe("INTERCEPTOR_ERROR");
      expect(error.stack).toBeDefined();
    });
  });

  describe("toJSON", () => {
    it("should serialize error with interceptor context", () => {
      const originalError = new TypeError("Invalid type");
      const context: InterceptorErrorContext = {
        interceptorType: "response",
        interceptorIndex: 3,
        phase: "execution",
        originalError,
        requestId: "req_123",
      };

      const error = new InterceptorError("Serialization test", context);
      const json = error.toJSON();

      expect(json.name).toBe("InterceptorError");
      expect(json.message).toBe("Serialization test");
      expect(json.code).toBe("INTERCEPTOR_ERROR");
      expect(json.interceptorType).toBe("response");
      expect(json.interceptorIndex).toBe(3);
      expect(json.phase).toBe("execution");
      expect(json.originalError).toEqual({
        name: "TypeError",
        message: "Invalid type",
        stack: originalError.stack,
      });
      expect(json.context).toEqual(context);
      expect(json.stack).toBeDefined();
    });

    it("should serialize without original error when not provided", () => {
      const context: InterceptorErrorContext = {
        interceptorType: "request",
        interceptorIndex: 0,
        phase: "validation",
      };

      const error = new InterceptorError("No original error", context);
      const json = error.toJSON();

      expect(json.originalError).toBeUndefined();
      expect(json.interceptorType).toBe("request");
      expect(json.interceptorIndex).toBe(0);
    });
  });

  describe("error scenarios", () => {
    it("should handle all interceptor types", () => {
      const requestContext: InterceptorErrorContext = {
        interceptorType: "request",
        interceptorIndex: 0,
        phase: "execution",
      };

      const responseContext: InterceptorErrorContext = {
        interceptorType: "response",
        interceptorIndex: 1,
        phase: "execution",
      };

      const requestError = new InterceptorError(
        "Request failed",
        requestContext,
      );
      const responseError = new InterceptorError(
        "Response failed",
        responseContext,
      );

      expect(requestError.interceptorType).toBe("request");
      expect(responseError.interceptorType).toBe("response");
    });

    it("should handle all execution phases", () => {
      const phases = ["validation", "execution", "context-threading"] as const;

      phases.forEach((phase, index) => {
        const context: InterceptorErrorContext = {
          interceptorType: "request",
          interceptorIndex: index,
          phase,
        };

        const error = new InterceptorError(`${phase} failed`, context);
        expect(error.phase).toBe(phase);
      });
    });
  });
});
