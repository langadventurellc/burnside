import {
  isUnifiedTerminationSignal,
  createTerminationSignal,
  calculateTerminationConfidence,
} from "../index";
import type {
  UnifiedTerminationSignal,
  EnhancedTerminationReason,
  TerminationConfidence,
} from "../index";

describe("UnifiedTerminationSignal", () => {
  describe("isUnifiedTerminationSignal", () => {
    it("should return true for valid UnifiedTerminationSignal", () => {
      const validSignal: UnifiedTerminationSignal = {
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
        },
      };

      expect(isUnifiedTerminationSignal(validSignal)).toBe(true);
    });

    it("should return false for null or undefined", () => {
      expect(isUnifiedTerminationSignal(null)).toBe(false);
      expect(isUnifiedTerminationSignal(undefined)).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isUnifiedTerminationSignal("string")).toBe(false);
      expect(isUnifiedTerminationSignal(123)).toBe(false);
      expect(isUnifiedTerminationSignal(true)).toBe(false);
    });

    it("should return false for object missing required fields", () => {
      expect(
        isUnifiedTerminationSignal({
          shouldTerminate: true,
          // missing reason, confidence, providerSpecific
        }),
      ).toBe(false);

      expect(
        isUnifiedTerminationSignal({
          shouldTerminate: true,
          reason: "natural_completion",
          confidence: "high",
          // missing providerSpecific
        }),
      ).toBe(false);
    });

    it("should return false for invalid confidence values", () => {
      expect(
        isUnifiedTerminationSignal({
          shouldTerminate: true,
          reason: "natural_completion",
          confidence: "invalid",
          providerSpecific: {
            originalField: "finish_reason",
            originalValue: "stop",
          },
        }),
      ).toBe(false);
    });

    it("should return false for invalid providerSpecific structure", () => {
      expect(
        isUnifiedTerminationSignal({
          shouldTerminate: true,
          reason: "natural_completion",
          confidence: "high",
          providerSpecific: {
            // missing originalField and originalValue
          },
        }),
      ).toBe(false);

      expect(
        isUnifiedTerminationSignal({
          shouldTerminate: true,
          reason: "natural_completion",
          confidence: "high",
          providerSpecific: null,
        }),
      ).toBe(false);
    });

    it("should return true for signal with optional fields", () => {
      const signalWithOptionalFields: UnifiedTerminationSignal = {
        shouldTerminate: false,
        reason: "unknown",
        confidence: "low",
        providerSpecific: {
          originalField: "isTerminal",
          originalValue: "false",
          metadata: { model: "gpt-4" },
        },
        message: "Optional message",
      };

      expect(isUnifiedTerminationSignal(signalWithOptionalFields)).toBe(true);
    });
  });

  describe("createTerminationSignal", () => {
    it("should create basic signal with defaults", () => {
      const signal = createTerminationSignal(true, "finished", "true");

      expect(signal).toEqual({
        shouldTerminate: true,
        reason: "unknown",
        confidence: "low",
        providerSpecific: {
          originalField: "finished",
          originalValue: "true",
          metadata: undefined,
        },
        message: undefined,
      });
    });

    it("should create signal with all parameters", () => {
      const signal = createTerminationSignal(
        true,
        "finish_reason",
        "stop",
        "natural_completion",
        "high",
        "Model completed naturally",
        { model: "gpt-4", usage: { tokens: 100 } },
      );

      expect(signal).toEqual({
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
          metadata: { model: "gpt-4", usage: { tokens: 100 } },
        },
        message: "Model completed naturally",
      });
    });

    it("should create signal for non-termination", () => {
      const signal = createTerminationSignal(
        false,
        "streaming",
        "continue",
        "unknown",
        "medium",
      );

      expect(signal).toEqual({
        shouldTerminate: false,
        reason: "unknown",
        confidence: "medium",
        providerSpecific: {
          originalField: "streaming",
          originalValue: "continue",
          metadata: undefined,
        },
        message: undefined,
      });
    });

    it("should accept all enhanced termination reasons", () => {
      const reasons: EnhancedTerminationReason[] = [
        "natural_completion",
        "max_iterations",
        "timeout",
        "cancelled",
        "error",
        "token_limit_reached",
        "content_filtered",
        "stop_sequence",
        "unknown",
      ];

      for (const reason of reasons) {
        const signal = createTerminationSignal(
          true,
          "test_field",
          "test_value",
          reason,
        );
        expect(signal.reason).toBe(reason);
      }
    });

    it("should accept all confidence levels", () => {
      const confidences: TerminationConfidence[] = ["high", "medium", "low"];

      for (const confidence of confidences) {
        const signal = createTerminationSignal(
          true,
          "test_field",
          "test_value",
          "natural_completion",
          confidence,
        );
        expect(signal.confidence).toBe(confidence);
      }
    });
  });

  describe("calculateTerminationConfidence", () => {
    it("should return high confidence for explicit signal with known value", () => {
      expect(calculateTerminationConfidence(true, true, false)).toBe("high");
      expect(calculateTerminationConfidence(true, true, true)).toBe("high");
    });

    it("should return medium confidence for partial signals", () => {
      expect(calculateTerminationConfidence(true, false, false)).toBe("medium");
      expect(calculateTerminationConfidence(false, true, false)).toBe("medium");
      expect(calculateTerminationConfidence(true, false, true)).toBe("medium");
      expect(calculateTerminationConfidence(false, true, true)).toBe("medium");
    });

    it("should return low confidence for no clear signals", () => {
      expect(calculateTerminationConfidence(false, false, false)).toBe("low");
      expect(calculateTerminationConfidence(false, false, true)).toBe("low");
    });

    it("should handle optional hasMetadata parameter", () => {
      // Test default value (false)
      expect(calculateTerminationConfidence(true, true)).toBe("high");
      expect(calculateTerminationConfidence(false, false)).toBe("low");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct types for UnifiedTerminationSignal", () => {
      // This test validates TypeScript compilation
      const signal: UnifiedTerminationSignal = {
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
        },
      };

      expect(typeof signal.shouldTerminate).toBe("boolean");
      expect(typeof signal.reason).toBe("string");
      expect(typeof signal.confidence).toBe("string");
      expect(typeof signal.providerSpecific.originalField).toBe("string");
      expect(typeof signal.providerSpecific.originalValue).toBe("string");
    });

    it("should enforce correct enhanced termination reason types", () => {
      const reasons: EnhancedTerminationReason[] = [
        "natural_completion",
        "token_limit_reached",
        "content_filtered",
        "stop_sequence",
        "unknown",
      ];

      for (const reason of reasons) {
        expect(typeof reason).toBe("string");
      }
    });

    it("should enforce correct confidence level types", () => {
      const confidences: TerminationConfidence[] = ["high", "medium", "low"];

      for (const confidence of confidences) {
        expect(typeof confidence).toBe("string");
        expect(["high", "medium", "low"]).toContain(confidence);
      }
    });
  });

  describe("Documentation Examples", () => {
    it("should work with JSDoc example from UnifiedTerminationSignal", () => {
      const signal: UnifiedTerminationSignal = {
        shouldTerminate: true,
        reason: "natural_completion",
        confidence: "high",
        providerSpecific: {
          originalField: "finish_reason",
          originalValue: "stop",
          metadata: { model: "gpt-4" },
        },
        message: "Model completed response naturally",
      };

      expect(isUnifiedTerminationSignal(signal)).toBe(true);
      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("high");
    });

    it("should work with JSDoc example from createTerminationSignal", () => {
      const signal = createTerminationSignal(
        true,
        "finished",
        "true",
        "natural_completion",
        "medium",
      );

      expect(signal.shouldTerminate).toBe(true);
      expect(signal.reason).toBe("natural_completion");
      expect(signal.confidence).toBe("medium");
      expect(signal.providerSpecific.originalField).toBe("finished");
      expect(signal.providerSpecific.originalValue).toBe("true");
    });

    it("should work with JSDoc example from calculateTerminationConfidence", () => {
      const confidence = calculateTerminationConfidence(
        true, // has finish_reason field
        true, // value is "stop" (well-known)
        true, // has usage metadata
      );

      expect(confidence).toBe("high");
    });
  });
});
