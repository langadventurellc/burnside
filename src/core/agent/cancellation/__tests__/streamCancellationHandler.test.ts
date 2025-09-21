/**
 * StreamCancellationHandler Tests
 *
 * Comprehensive test suite covering stream state management, cancellation detection,
 * buffer management, and integration with CancellationManager.
 */

import { StreamCancellationHandler } from "../streamCancellationHandler";
import { CancellationManager } from "../cancellationManager";
import type { StreamDelta } from "../../../../client/streamDelta";
import type { RuntimeAdapter } from "../../../runtime/runtimeAdapter";

// Mock RuntimeAdapter for testing
const createMockRuntimeAdapter = (): RuntimeAdapter => ({
  platformInfo: {
    platform: "node" as const,
    capabilities: {
      platform: "node" as const,
      hasHttp: true,
      hasTimers: true,
      hasFileSystem: true,
      features: {},
    },
  },
  fetch: jest.fn(),
  stream: jest.fn(),
  setTimeout: jest.fn((callback: () => void, ms: number) => {
    return setTimeout(callback, ms);
  }),
  setInterval: jest.fn((callback: () => void, ms: number) => {
    return setInterval(callback, ms);
  }),
  clearTimeout: jest.fn((handle: unknown) => {
    clearTimeout(handle as NodeJS.Timeout);
  }),
  clearInterval: jest.fn((handle: unknown) => {
    clearInterval(handle as NodeJS.Timeout);
  }),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  fileExists: jest.fn(),
  createMcpConnection: jest.fn(),
});

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

// Test utilities
const createMockStreamDelta = (
  content: string = "test",
  finished: boolean = false,
): StreamDelta => ({
  id: `chunk-${Date.now()}`,
  delta: {
    content: [{ type: "text", text: content }],
  },
  finished,
});

const createMockStream = async function* (
  chunks: string[],
  finishLast: boolean = true,
): AsyncIterable<StreamDelta> {
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    yield createMockStreamDelta(chunks[i], isLast && finishLast);
    // Small delay to simulate streaming
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

const createMockCancellationManager = (
  cancelled: boolean = false,
  reason?: string,
): CancellationManager => {
  const manager = new CancellationManager(createMockRuntimeAdapter());
  if (cancelled) {
    manager.cancel(reason);
  }
  return manager;
};

describe("StreamCancellationHandler", () => {
  let handler: StreamCancellationHandler;
  let cancellationManager: CancellationManager;

  beforeEach(() => {
    cancellationManager = createMockCancellationManager();
    handler = new StreamCancellationHandler(
      cancellationManager,
      createMockRuntimeAdapter(),
    );
  });

  afterEach(() => {
    handler.dispose();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("Construction and Initialization", () => {
    it("should initialize with active state and empty buffer", () => {
      expect(handler.getStreamState()).toBe("active");
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should accept custom cancellation check interval", () => {
      const customHandler = new StreamCancellationHandler(
        cancellationManager,
        createMockRuntimeAdapter(),
        {
          cancellationCheckIntervalMs: 50,
        },
      );

      expect(customHandler).toBeDefined();
      customHandler.dispose();
    });

    it("should use default check interval when not provided", () => {
      const defaultHandler = new StreamCancellationHandler(
        cancellationManager,
        createMockRuntimeAdapter(),
      );

      expect(defaultHandler).toBeDefined();
      defaultHandler.dispose();
    });
  });

  describe("Stream State Management", () => {
    it("should transition from active to paused", () => {
      handler.pauseStream();
      expect(handler.getStreamState()).toBe("paused");
    });

    it("should transition from paused to active", () => {
      handler.pauseStream();
      handler.resumeStream();
      expect(handler.getStreamState()).toBe("active");
    });

    it("should not pause already cancelled streams", () => {
      handler.cancelStream("test cancellation");
      handler.pauseStream();
      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should not pause already completed streams", () => {
      handler.completeStream();
      handler.pauseStream();
      expect(handler.getStreamState()).toBe("completed");
    });

    it("should not resume non-paused streams", () => {
      handler.resumeStream(); // Try to resume active stream
      expect(handler.getStreamState()).toBe("active");

      handler.cancelStream("test");
      handler.resumeStream(); // Try to resume cancelled stream
      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should complete stream successfully", () => {
      handler.completeStream();
      expect(handler.getStreamState()).toBe("completed");
    });

    it("should not complete already cancelled streams", () => {
      handler.cancelStream("test");
      handler.completeStream();
      expect(handler.getStreamState()).toBe("cancelled");
    });
  });

  describe("Stream Cancellation", () => {
    it("should cancel stream with reason", () => {
      const reason = "User requested cancellation";
      handler.cancelStream(reason);

      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should cancel stream without reason", () => {
      handler.cancelStream();
      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should handle double cancellation gracefully", () => {
      handler.cancelStream("first cancellation");
      handler.cancelStream("second cancellation");

      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should propagate cancellation to manager when not already cancelled", () => {
      const spy = jest.spyOn(cancellationManager, "cancel");

      handler.cancelStream("test reason");

      expect(spy).toHaveBeenCalledWith("test reason");
    });

    it("should not propagate cancellation when manager already cancelled", () => {
      cancellationManager.cancel("already cancelled");
      const spy = jest.spyOn(cancellationManager, "cancel");

      handler.cancelStream("test reason");

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("Buffer Management", () => {
    it("should accumulate content in buffer", () => {
      const chunk1 = createMockStreamDelta("Hello ");
      const chunk2 = createMockStreamDelta("World!");

      handler.appendToBuffer(chunk1);
      handler.appendToBuffer(chunk2);

      expect(handler.getCurrentBuffer()).toBe("Hello World!");
    });

    it("should handle chunks without content", () => {
      const emptyChunk: StreamDelta = {
        id: "empty",
        delta: {},
        finished: false,
      };

      handler.appendToBuffer(emptyChunk);
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should handle chunks with non-text content", () => {
      const nonTextChunk: StreamDelta = {
        id: "non-text",
        delta: {
          content: [{ type: "image", data: "...", mimeType: "image/png" }],
        },
        finished: false,
      };

      handler.appendToBuffer(nonTextChunk);
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should clear buffer when requested", () => {
      handler.appendToBuffer(createMockStreamDelta("test content"));
      expect(handler.getCurrentBuffer()).toBe("test content");

      handler.clearBuffer();
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should preserve buffer during cancellation", () => {
      handler.appendToBuffer(createMockStreamDelta("preserved content"));
      handler.cancelStream();

      expect(handler.getCurrentBuffer()).toBe("preserved content");
    });
  });

  describe("Cancellation Detection", () => {
    it("should detect cancellation from manager", () => {
      cancellationManager.cancel("external cancellation");

      expect(() => handler.checkCancellationDuringStream()).toThrow(
        "Agent execution cancelled: external cancellation",
      );
      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should throw when stream already cancelled", () => {
      handler.cancelStream("already cancelled");

      expect(() => handler.checkCancellationDuringStream()).toThrow(
        "Stream was already cancelled",
      );
    });

    it("should not throw when stream is active and manager not cancelled", () => {
      expect(() => handler.checkCancellationDuringStream()).not.toThrow();
    });
  });

  describe("Stream Monitoring", () => {
    it("should start monitoring with correct initial state", () => {
      handler.startStreamMonitoring();

      expect(handler.getStreamState()).toBe("active");
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should reset state when starting new monitoring", () => {
      handler.appendToBuffer(createMockStreamDelta("old content"));
      handler.pauseStream();

      handler.startStreamMonitoring();

      expect(handler.getStreamState()).toBe("active");
      expect(handler.getCurrentBuffer()).toBe("");
    });
  });

  describe("Stream Wrapping", () => {
    it("should wrap stream successfully", async () => {
      const originalChunks = ["Hello", " ", "World!"];
      const originalStream = createMockStream(originalChunks);

      const wrappedChunks: StreamDelta[] = [];
      for await (const chunk of handler.wrapStreamWithCancellation(
        originalStream,
      )) {
        wrappedChunks.push(chunk);
      }

      expect(wrappedChunks).toHaveLength(3);
      expect(handler.getCurrentBuffer()).toBe("Hello World!");
      expect(handler.getStreamState()).toBe("completed");
    });

    it("should handle cancellation during stream processing", async () => {
      const originalStream = createMockStream(["chunk1", "chunk2", "chunk3"]);

      // Cancel after first chunk
      setTimeout(() => {
        cancellationManager.cancel("cancelled during processing");
      }, 15);

      const wrappedChunks: StreamDelta[] = [];
      await expect(async () => {
        for await (const chunk of handler.wrapStreamWithCancellation(
          originalStream,
        )) {
          wrappedChunks.push(chunk);
        }
      }).rejects.toThrow("cancelled during processing");

      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should handle stream errors gracefully", async () => {
      const errorStream = async function* (): AsyncIterable<StreamDelta> {
        yield createMockStreamDelta("chunk1");
        await new Promise((resolve) => setTimeout(resolve, 1));
        throw new Error("Stream error occurred");
      };

      await expect(async () => {
        for await (const _chunk of handler.wrapStreamWithCancellation(
          errorStream(),
        )) {
          // Process chunks
        }
      }).rejects.toThrow("Stream error occurred");
    });

    it("should handle cancellation errors in stream", async () => {
      const cancellationErrorStream =
        async function* (): AsyncIterable<StreamDelta> {
          yield createMockStreamDelta("chunk1");
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new Error("Operation was cancelled");
        };

      await expect(async () => {
        for await (const _chunk of handler.wrapStreamWithCancellation(
          cancellationErrorStream(),
        )) {
          // Process chunks
        }
      }).rejects.toThrow("Operation was cancelled");

      expect(handler.getStreamState()).toBe("cancelled");
    });
  });

  describe("Stream Metrics", () => {
    it("should provide accurate stream metrics", () => {
      handler.startStreamMonitoring();
      handler.appendToBuffer(createMockStreamDelta("test content"));

      const metrics = handler.getStreamMetrics();

      expect(metrics.state).toBe("active");
      expect(metrics.bufferSize).toBe(12); // "test content".length
      expect(metrics.streamDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.lastActivity).toBeGreaterThan(0);
    });

    it("should track state transitions in metrics", () => {
      handler.pauseStream();
      const pausedMetrics = handler.getStreamMetrics();
      expect(pausedMetrics.state).toBe("paused");

      handler.resumeStream();
      const resumedMetrics = handler.getStreamMetrics();
      expect(resumedMetrics.state).toBe("active");

      handler.cancelStream();
      const cancelledMetrics = handler.getStreamMetrics();
      expect(cancelledMetrics.state).toBe("cancelled");
    });
  });

  describe("Resource Cleanup", () => {
    it("should dispose resources properly", () => {
      handler.startStreamMonitoring();
      handler.appendToBuffer(createMockStreamDelta("content"));

      handler.dispose();

      // Handler should still be functional but not monitoring
      expect(handler.getCurrentBuffer()).toBe("content");
    });

    it("should handle disposal when not monitoring", () => {
      expect(() => handler.dispose()).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid state transitions", () => {
      handler.pauseStream();
      handler.resumeStream();
      handler.pauseStream();
      handler.resumeStream();
      handler.cancelStream();

      expect(handler.getStreamState()).toBe("cancelled");
    });

    it("should handle empty stream", async () => {
      const emptyStream = async function* (): AsyncIterable<StreamDelta> {
        // Empty stream
      };

      const chunks: StreamDelta[] = [];
      for await (const chunk of handler.wrapStreamWithCancellation(
        emptyStream(),
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(0);
      expect(handler.getCurrentBuffer()).toBe("");
    });

    it("should handle stream with only finished chunk", async () => {
      const finishedOnlyStream =
        async function* (): AsyncIterable<StreamDelta> {
          await new Promise((resolve) => setTimeout(resolve, 1));
          yield createMockStreamDelta("", true);
        };

      const chunks: StreamDelta[] = [];
      for await (const chunk of handler.wrapStreamWithCancellation(
        finishedOnlyStream(),
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(handler.getStreamState()).toBe("completed");
    });
  });

  describe("Integration with CancellationManager", () => {
    it("should respect external cancellation signal", () => {
      const controller = new AbortController();
      const managerWithSignal = new CancellationManager(
        createMockRuntimeAdapter(),
        {
          signal: controller.signal,
        },
      );
      const handlerWithSignal = new StreamCancellationHandler(
        managerWithSignal,
        createMockRuntimeAdapter(),
      );

      controller.abort("External abort");

      expect(() => handlerWithSignal.checkCancellationDuringStream()).toThrow();
      expect(handlerWithSignal.getStreamState()).toBe("cancelled");

      handlerWithSignal.dispose();
    });

    it("should work with pre-cancelled signal", () => {
      const controller = new AbortController();
      controller.abort("Pre-cancelled");

      const managerWithCancelledSignal = new CancellationManager(
        createMockRuntimeAdapter(),
        {
          signal: controller.signal,
        },
      );
      const handlerWithCancelledSignal = new StreamCancellationHandler(
        managerWithCancelledSignal,
        createMockRuntimeAdapter(),
      );

      expect(() =>
        handlerWithCancelledSignal.checkCancellationDuringStream(),
      ).toThrow();

      handlerWithCancelledSignal.dispose();
    });

    it("should integrate with cleanup handlers", () => {
      const cleanupSpy = jest.fn();
      cancellationManager.addCleanupHandler(cleanupSpy);

      handler.cancelStream("test cleanup");

      // Give cleanup time to execute
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cleanupSpy).toHaveBeenCalled();
          resolve();
        }, 10);
      });
    });
  });
});
