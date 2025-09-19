/**
 * Cancellation Errors Test Suite
 *
 * Comprehensive tests for cancellation error functionality including classes,
 * factory methods, type guards, and error serialization.
 */

import {
  CancellationError,
  GracefulCancellationTimeoutError,
  type CancellationPhase,
  createCancellationError,
  createTimeoutError,
  fromAbortSignal,
  isCancellationError,
  isGracefulTimeoutError,
} from "../index";

describe("CancellationError", () => {
  describe("constructor", () => {
    it("should create error with all required properties", () => {
      const message = "Test cancellation";
      const phase: CancellationPhase = "execution";
      const cleanupCompleted = true;
      const reason = "User requested";
      const timestamp = Date.now();

      const error = new CancellationError(
        message,
        phase,
        cleanupCompleted,
        reason,
        timestamp,
      );

      expect(error.message).toBe(message);
      expect(error.code).toBe("CANCELLATION_ERROR");
      expect(error.phase).toBe(phase);
      expect(error.cleanupCompleted).toBe(cleanupCompleted);
      expect(error.reason).toBe(reason);
      expect(error.timestamp).toBe(timestamp);
      expect(error.name).toBe("CancellationError");
    });

    it("should create error with minimal properties", () => {
      const message = "Test cancellation";
      const phase: CancellationPhase = "streaming";
      const cleanupCompleted = false;

      const error = new CancellationError(message, phase, cleanupCompleted);

      expect(error.message).toBe(message);
      expect(error.code).toBe("CANCELLATION_ERROR");
      expect(error.phase).toBe(phase);
      expect(error.cleanupCompleted).toBe(cleanupCompleted);
      expect(error.reason).toBeUndefined();
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it("should use current timestamp when not provided", () => {
      const before = Date.now();
      const error = new CancellationError("test", "cleanup", false);
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it("should extend Error properly", () => {
      const error = new CancellationError("test", "execution", false);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CancellationError);
      expect(error.stack).toBeDefined();
    });
  });

  describe("toJSON", () => {
    it("should serialize all properties", () => {
      const error = new CancellationError(
        "Test error",
        "tool_calls",
        true,
        "timeout",
        12345,
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: "CancellationError",
        message: "Test error",
        code: "CANCELLATION_ERROR",
        reason: "timeout",
        phase: "tool_calls",
        cleanupCompleted: true,
        timestamp: 12345,
        stack: error.stack,
      });
    });

    it("should handle undefined reason", () => {
      const error = new CancellationError(
        "Test error",
        "initialization",
        false,
      );

      const json = error.toJSON();

      expect(json.reason).toBeUndefined();
    });
  });
});

describe("GracefulCancellationTimeoutError", () => {
  describe("constructor", () => {
    it("should create timeout error with all properties", () => {
      const message = "Timeout occurred";
      const phase: CancellationPhase = "cleanup";
      const timeoutMs = 5000;
      const cleanupAttempted = true;
      const reason = "External signal";
      const timestamp = Date.now();

      const error = new GracefulCancellationTimeoutError(
        message,
        phase,
        timeoutMs,
        cleanupAttempted,
        reason,
        timestamp,
      );

      expect(error.message).toBe(message);
      expect(error.code).toBe("GRACEFUL_CANCELLATION_TIMEOUT");
      expect(error.phase).toBe(phase);
      expect(error.timeoutMs).toBe(timeoutMs);
      expect(error.cleanupAttempted).toBe(cleanupAttempted);
      expect(error.cleanupCompleted).toBe(false); // Always false from super
      expect(error.reason).toBe(reason);
      expect(error.timestamp).toBe(timestamp);
      expect(error.name).toBe("GracefulCancellationTimeoutError");
    });

    it("should extend CancellationError properly", () => {
      const error = new GracefulCancellationTimeoutError(
        "test",
        "execution",
        1000,
        false,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CancellationError);
      expect(error).toBeInstanceOf(GracefulCancellationTimeoutError);
    });
  });

  describe("toJSON", () => {
    it("should serialize all properties including timeout context", () => {
      const error = new GracefulCancellationTimeoutError(
        "Timeout error",
        "streaming",
        3000,
        true,
        "signal timeout",
        67890,
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: "GracefulCancellationTimeoutError",
        message: "Timeout error",
        code: "GRACEFUL_CANCELLATION_TIMEOUT",
        reason: "signal timeout",
        phase: "streaming",
        cleanupCompleted: false,
        timestamp: 67890,
        stack: error.stack,
        timeoutMs: 3000,
        cleanupAttempted: true,
      });
    });
  });
});

describe("Factory Methods", () => {
  describe("createCancellationError", () => {
    it("should create error with reason", () => {
      const reason = "User cancelled";
      const phase: CancellationPhase = "tool_calls";
      const cleanupCompleted = true;

      const error = createCancellationError(reason, phase, cleanupCompleted);

      expect(error).toBeInstanceOf(CancellationError);
      expect(error.message).toBe("Agent execution cancelled: User cancelled");
      expect(error.reason).toBe(reason);
      expect(error.phase).toBe(phase);
      expect(error.cleanupCompleted).toBe(cleanupCompleted);
    });

    it("should create error without reason", () => {
      const phase: CancellationPhase = "initialization";

      const error = createCancellationError(undefined, phase);

      expect(error.message).toBe(
        "Agent execution cancelled during initialization phase",
      );
      expect(error.reason).toBeUndefined();
      expect(error.phase).toBe(phase);
      expect(error.cleanupCompleted).toBe(false);
    });

    it("should use default cleanupCompleted value", () => {
      const error = createCancellationError("test", "execution");

      expect(error.cleanupCompleted).toBe(false);
    });
  });

  describe("createTimeoutError", () => {
    it("should create timeout error with all parameters", () => {
      const timeoutMs = 2000;
      const cleanupAttempted = true;
      const phase: CancellationPhase = "streaming";
      const reason = "External timeout";

      const error = createTimeoutError(
        timeoutMs,
        cleanupAttempted,
        phase,
        reason,
      );

      expect(error).toBeInstanceOf(GracefulCancellationTimeoutError);
      expect(error.message).toBe(
        "Graceful cancellation timeout after 2000ms during streaming phase",
      );
      expect(error.timeoutMs).toBe(timeoutMs);
      expect(error.cleanupAttempted).toBe(cleanupAttempted);
      expect(error.phase).toBe(phase);
      expect(error.reason).toBe(reason);
    });

    it("should use default phase value", () => {
      const error = createTimeoutError(1000, false);

      expect(error.phase).toBe("cleanup");
    });

    it("should handle undefined reason", () => {
      const error = createTimeoutError(5000, true, "execution");

      expect(error.reason).toBeUndefined();
    });
  });

  describe("fromAbortSignal", () => {
    it("should create error from AbortSignal with string reason", () => {
      const controller = new AbortController();
      const reason = "Operation cancelled";
      controller.abort(reason);
      const phase: CancellationPhase = "tool_calls";
      const cleanupCompleted = true;

      const error = fromAbortSignal(controller.signal, phase, cleanupCompleted);

      expect(error).toBeInstanceOf(CancellationError);
      expect(error.message).toBe(
        "Agent execution cancelled via AbortSignal during tool_calls phase",
      );
      expect(error.reason).toBe(reason);
      expect(error.phase).toBe(phase);
      expect(error.cleanupCompleted).toBe(cleanupCompleted);
    });

    it("should create error from AbortSignal with object reason", () => {
      const controller = new AbortController();
      const reasonObj = { message: "Custom cancellation" };
      controller.abort(reasonObj);

      const error = fromAbortSignal(controller.signal, "execution");

      expect(error.reason).toBe("[object Object]");
    });

    it("should create error from AbortSignal without reason", () => {
      const controller = new AbortController();
      controller.abort();

      const error = fromAbortSignal(controller.signal, "streaming");

      // AbortController.abort() without reason creates a default AbortError message
      expect(error.reason).toContain("abort");
    });

    it("should use default cleanupCompleted value", () => {
      const controller = new AbortController();
      controller.abort("test");

      const error = fromAbortSignal(controller.signal, "cleanup");

      expect(error.cleanupCompleted).toBe(false);
    });

    it("should handle signal with non-string, non-object reason", () => {
      const controller = new AbortController();
      controller.abort(42);

      const error = fromAbortSignal(controller.signal, "execution");

      // When abort() is called with a number, it gets stringified by the AbortController
      expect(error.reason).toBe("AbortSignal triggered");
    });
  });
});

describe("Type Guards", () => {
  describe("isCancellationError", () => {
    it("should return true for CancellationError instances", () => {
      const error = new CancellationError("test", "execution", false);

      expect(isCancellationError(error)).toBe(true);
    });

    it("should return true for GracefulCancellationTimeoutError instances", () => {
      const error = new GracefulCancellationTimeoutError(
        "test",
        "cleanup",
        1000,
        false,
      );

      expect(isCancellationError(error)).toBe(true);
    });

    it("should return false for regular Error instances", () => {
      const error = new Error("test");

      expect(isCancellationError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isCancellationError(null)).toBe(false);
      expect(isCancellationError(undefined)).toBe(false);
      expect(isCancellationError("error")).toBe(false);
      expect(isCancellationError(42)).toBe(false);
      expect(isCancellationError({})).toBe(false);
    });
  });

  describe("isGracefulTimeoutError", () => {
    it("should return true for GracefulCancellationTimeoutError instances", () => {
      const error = new GracefulCancellationTimeoutError(
        "test",
        "cleanup",
        1000,
        false,
      );

      expect(isGracefulTimeoutError(error)).toBe(true);
    });

    it("should return false for regular CancellationError instances", () => {
      const error = new CancellationError("test", "execution", false);

      expect(isGracefulTimeoutError(error)).toBe(false);
    });

    it("should return false for regular Error instances", () => {
      const error = new Error("test");

      expect(isGracefulTimeoutError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isGracefulTimeoutError(null)).toBe(false);
      expect(isGracefulTimeoutError(undefined)).toBe(false);
      expect(isGracefulTimeoutError("error")).toBe(false);
      expect(isGracefulTimeoutError(42)).toBe(false);
      expect(isGracefulTimeoutError({})).toBe(false);
    });
  });
});

describe("CancellationPhase", () => {
  it("should accept all valid phase values", () => {
    const phases: CancellationPhase[] = [
      "initialization",
      "execution",
      "tool_calls",
      "streaming",
      "cleanup",
    ];

    phases.forEach((phase) => {
      const error = new CancellationError("test", phase, false);
      expect(error.phase).toBe(phase);
    });
  });
});

describe("Error Integration", () => {
  it("should work with instanceof checks", () => {
    const cancellationError = new CancellationError("test", "execution", false);
    const timeoutError = new GracefulCancellationTimeoutError(
      "test",
      "cleanup",
      1000,
      false,
    );

    expect(cancellationError instanceof Error).toBe(true);
    expect(cancellationError instanceof CancellationError).toBe(true);
    expect(cancellationError instanceof GracefulCancellationTimeoutError).toBe(
      false,
    );

    expect(timeoutError instanceof Error).toBe(true);
    expect(timeoutError instanceof CancellationError).toBe(true);
    expect(timeoutError instanceof GracefulCancellationTimeoutError).toBe(true);
  });

  it("should preserve stack traces", () => {
    const error = new CancellationError("test", "execution", false);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("CancellationError");
  });

  it("should work with JSON.stringify", () => {
    const error = new CancellationError(
      "test",
      "streaming",
      true,
      "reason",
      12345,
    );

    const jsonString = JSON.stringify(error);
    const parsed = JSON.parse(jsonString);

    expect(parsed.name).toBe("CancellationError");
    expect(parsed.message).toBe("test");
    expect(parsed.code).toBe("CANCELLATION_ERROR");
    expect(parsed.phase).toBe("streaming");
    expect(parsed.cleanupCompleted).toBe(true);
    expect(parsed.reason).toBe("reason");
    expect(parsed.timestamp).toBe(12345);
  });
});
