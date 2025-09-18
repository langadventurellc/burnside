/**
 * xAI v1 Error Response Schema Tests
 *
 * Comprehensive unit tests for xAI error response schema validation.
 */

import { XAIV1ErrorResponseSchema } from "../errorResponseSchema";

describe("XAIV1ErrorResponseSchema", () => {
  describe("Valid Error Responses", () => {
    it("should validate minimal error response", () => {
      const validError = {
        error: {
          code: "invalid_request",
          message: "The request was invalid",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it("should validate complete error response", () => {
      const validError = {
        error: {
          code: "rate_limit_exceeded",
          message: "You have exceeded your rate limit. Please try again later.",
          type: "rate_limit_error",
          param: "requests_per_minute",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it("should validate error with null param", () => {
      const validError = {
        error: {
          code: "model_not_found",
          message: "The specified model was not found",
          type: "validation_error",
          param: null,
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it("should validate authentication error", () => {
      const authError = {
        error: {
          code: "invalid_api_key",
          message: "Invalid API key provided",
          type: "authentication_error",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(authError);
      expect(result.success).toBe(true);
    });

    it("should validate quota exceeded error", () => {
      const quotaError = {
        error: {
          code: "quota_exceeded",
          message: "You have exceeded your usage quota",
          type: "quota_error",
          param: "monthly_limit",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(quotaError);
      expect(result.success).toBe(true);
    });

    it("should validate validation error with specific param", () => {
      const validationError = {
        error: {
          code: "invalid_parameter",
          message: "The 'temperature' parameter must be between 0 and 2",
          type: "validation_error",
          param: "temperature",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(validationError);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Error Responses", () => {
    it("should reject missing required fields", () => {
      const invalidErrors = [
        {}, // Missing error object entirely
        { error: {} }, // Missing code and message
        { error: { code: "test" } }, // Missing message
        { error: { message: "test" } }, // Missing code
      ];

      invalidErrors.forEach((errorResponse) => {
        const result = XAIV1ErrorResponseSchema.safeParse(errorResponse);
        expect(result.success).toBe(false);
      });
    });

    it("should reject empty code", () => {
      const invalidError = {
        error: {
          code: "",
          message: "Error message",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });

    it("should reject empty message", () => {
      const invalidError = {
        error: {
          code: "error_code",
          message: "",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });

    it("should reject non-string fields", () => {
      const invalidErrors = [
        {
          error: {
            code: 123, // Should be string
            message: "Error message",
          },
        },
        {
          error: {
            code: "error_code",
            message: 456, // Should be string
          },
        },
        {
          error: {
            code: "error_code",
            message: "Error message",
            type: 789, // Should be string
          },
        },
      ];

      invalidErrors.forEach((errorResponse) => {
        const result = XAIV1ErrorResponseSchema.safeParse(errorResponse);
        expect(result.success).toBe(false);
      });
    });

    it("should reject non-null, non-string param", () => {
      const invalidError = {
        error: {
          code: "error_code",
          message: "Error message",
          param: 123, // Should be string or null
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });
  });

  describe("Common Error Types", () => {
    it("should validate rate limit error format", () => {
      const rateLimitError = {
        error: {
          code: "rate_limit_exceeded",
          message:
            "Rate limit exceeded. Please wait before making more requests.",
          type: "rate_limit_error",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(rateLimitError);
      expect(result.success).toBe(true);
    });

    it("should validate authentication error format", () => {
      const authError = {
        error: {
          code: "invalid_api_key",
          message: "Invalid authentication credentials",
          type: "authentication_error",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(authError);
      expect(result.success).toBe(true);
    });

    it("should validate server error format", () => {
      const serverError = {
        error: {
          code: "internal_server_error",
          message: "An internal server error occurred",
          type: "server_error",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(serverError);
      expect(result.success).toBe(true);
    });

    it("should validate model error format", () => {
      const modelError = {
        error: {
          code: "model_not_found",
          message: "The requested model 'invalid-model' was not found",
          type: "invalid_request_error",
          param: "model",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(modelError);
      expect(result.success).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long error messages", () => {
      const longMessage = "A".repeat(1000);
      const errorWithLongMessage = {
        error: {
          code: "validation_error",
          message: longMessage,
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(errorWithLongMessage);
      expect(result.success).toBe(true);
    });

    it("should handle special characters in error messages", () => {
      const specialCharError = {
        error: {
          code: "invalid_input",
          message: "Error with special chars: àáâãäåæçèéêë ñòóôõö ùúûüý",
          type: "validation_error",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(specialCharError);
      expect(result.success).toBe(true);
    });

    it("should handle JSON-like content in error messages", () => {
      const jsonLikeError = {
        error: {
          code: "json_parse_error",
          message: 'Invalid JSON: {"key": "value", "missing": }',
          type: "validation_error",
          param: "request_body",
        },
      };

      const result = XAIV1ErrorResponseSchema.safeParse(jsonLikeError);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should infer correct TypeScript types", () => {
      const validError = {
        error: {
          code: "test_error" as const,
          message: "Test error message",
          type: "test_type" as const,
          param: "test_param" as const,
        },
      };

      const parsed = XAIV1ErrorResponseSchema.parse(validError);

      // Type assertions to verify proper inference
      expect(parsed.error.code).toBe("test_error");
      expect(parsed.error.message).toBe("Test error message");
      expect(parsed.error.type).toBe("test_type");
      expect(parsed.error.param).toBe("test_param");
    });

    it("should handle optional fields correctly", () => {
      const minimalError = {
        error: {
          code: "minimal_error",
          message: "Minimal error with only required fields",
        },
      };

      const parsed = XAIV1ErrorResponseSchema.parse(minimalError);

      expect(parsed.error.code).toBe("minimal_error");
      expect(parsed.error.message).toBe(
        "Minimal error with only required fields",
      );
      expect(parsed.error.type).toBeUndefined();
      expect(parsed.error.param).toBeUndefined();
    });
  });
});
