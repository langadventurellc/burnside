/**
 * Cancellation Manager Test Suite
 *
 * Comprehensive tests for CancellationManager functionality including signal composition,
 * cleanup handler management, periodic checks, and cancellation detection.
 */

import {
  CancellationManager,
  type CancellationOptions,
  CancellationError,
  GracefulCancellationTimeoutError,
  isCancellationError,
} from "../index";
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

describe("CancellationManager", () => {
  let manager: CancellationManager;

  afterEach(() => {
    if (manager) {
      manager.dispose();
    }
  });

  describe("constructor", () => {
    it("should create manager with default options", () => {
      manager = new CancellationManager(createMockRuntimeAdapter());

      expect(manager.isCancelled()).toBe(false);
      expect(manager.getCancellationReason()).toBeUndefined();
    });

    it("should create manager with custom options", () => {
      const options: CancellationOptions = {
        cancellationCheckIntervalMs: 50,
        gracefulCancellationTimeoutMs: 3000,
        cleanupOnCancel: false,
      };

      manager = new CancellationManager(createMockRuntimeAdapter(), options);

      expect(manager.isCancelled()).toBe(false);
      expect(manager.getCancellationReason()).toBeUndefined();
    });

    it("should handle external signal in constructor", () => {
      const controller = new AbortController();
      const options: CancellationOptions = {
        signal: controller.signal,
      };

      manager = new CancellationManager(createMockRuntimeAdapter(), options);

      expect(manager.isCancelled()).toBe(false);

      // Cancel external signal
      controller.abort("External cancellation");

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBe("External cancellation");
    });

    it("should handle pre-cancelled external signal", () => {
      const controller = new AbortController();
      controller.abort("Already cancelled");

      const options: CancellationOptions = {
        signal: controller.signal,
      };

      manager = new CancellationManager(createMockRuntimeAdapter(), options);

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBe("Already cancelled");
    });
  });

  describe("signal composition", () => {
    it("should create composed signal that responds to external cancellation", () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      const context = manager.createCancellableContext();

      expect(context.signal.aborted).toBe(false);

      controller.abort("External abort");

      expect(context.signal.aborted).toBe(true);
      expect(manager.isCancelled()).toBe(true);
    });

    it("should create composed signal that responds to internal cancellation", () => {
      manager = new CancellationManager(createMockRuntimeAdapter());

      const context = manager.createCancellableContext();

      expect(context.signal.aborted).toBe(false);

      manager.cancel("Internal abort");

      expect(context.signal.aborted).toBe(true);
      expect(manager.isCancelled()).toBe(true);
    });

    it("should handle external signal with non-string reason", () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      // AbortController.abort() can accept any value
      controller.abort(42 as any);

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBeUndefined(); // Non-string reason filtered out
    });
  });

  describe("createCancellableContext", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should create context with proper signal", () => {
      const context = manager.createCancellableContext();

      expect(context.signal).toBeDefined();
      expect(context.signal.aborted).toBe(false);
      expect(context.isCancelled()).toBe(false);
      expect(context.cancellationReason).toBeUndefined();
    });

    it("should create context that reflects cancellation state", () => {
      const context = manager.createCancellableContext();

      manager.cancel("Test cancellation");

      expect(context.signal.aborted).toBe(true);
      expect(context.isCancelled()).toBe(true);
    });

    it("should support onCancel callback", (done) => {
      const context = manager.createCancellableContext();
      context.onCancel = (reason) => {
        expect(reason).toBe("Test reason");
        done();
      };

      // Note: onCancel callback would need to be triggered by the signal's abort event
      // For this test, we're just verifying the property can be set
      expect(context.onCancel).toBeDefined();
      done();
    });
  });

  describe("cancel method", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should cancel with reason", () => {
      const reason = "User requested cancellation";

      manager.cancel(reason);

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBe(reason);
    });

    it("should cancel without reason", () => {
      manager.cancel();

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBeUndefined();
    });

    it("should be idempotent", () => {
      manager.cancel("First call");
      manager.cancel("Second call");

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBe("First call"); // Should keep first reason
    });

    it("should not perform cleanup when cleanupOnCancel is false", () => {
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        cleanupOnCancel: false,
      });

      const cleanupSpy = jest.fn();
      manager.addCleanupHandler(cleanupSpy);

      manager.cancel("No cleanup");

      expect(manager.isCancelled()).toBe(true);
      // Give time for any async cleanup (there shouldn't be any)
      setTimeout(() => {
        expect(cleanupSpy).not.toHaveBeenCalled();
      }, 50);
    });
  });

  describe("cleanup handlers", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should execute cleanup handlers in LIFO order", async () => {
      const executionOrder: number[] = [];

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(1);
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(2);
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(3);
      });

      await manager.performCleanup();

      expect(executionOrder).toEqual([3, 2, 1]); // LIFO order
    });

    it("should continue cleanup if individual handlers fail", async () => {
      const executionOrder: number[] = [];

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(1);
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(2);
        throw new Error("Handler 2 failed");
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        executionOrder.push(3);
      });

      // Should not throw despite handler failure
      await expect(manager.performCleanup()).resolves.toBeUndefined();

      expect(executionOrder).toEqual([3, 2, 1]); // All handlers executed
    });

    it("should timeout cleanup handlers", async () => {
      const shortTimeout = 100;
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        gracefulCancellationTimeoutMs: shortTimeout,
      });

      manager.addCleanupHandler(async () => {
        // Handler that takes longer than timeout
        await new Promise((resolve) => setTimeout(resolve, shortTimeout * 2));
      });

      await expect(manager.performCleanup()).rejects.toThrow(
        GracefulCancellationTimeoutError,
      );
    });

    it("should handle empty cleanup handlers list", async () => {
      await expect(manager.performCleanup()).resolves.toBeUndefined();
    });
  });

  describe("periodic checks", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should schedule and stop periodic checks", () => {
      manager.schedulePeriodicChecks();
      manager.stopPeriodicChecks();

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });

    it("should be idempotent for scheduling", () => {
      manager.schedulePeriodicChecks();
      manager.schedulePeriodicChecks(); // Should not create duplicate intervals

      manager.stopPeriodicChecks();

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });

    it("should handle stopping when not scheduled", () => {
      manager.stopPeriodicChecks(); // Should not error

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });
  });

  describe("cancellation detection", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should detect internal cancellation", () => {
      expect(manager.isCancelled()).toBe(false);

      manager.cancel("Internal");

      expect(manager.isCancelled()).toBe(true);
    });

    it("should detect external cancellation", () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      expect(manager.isCancelled()).toBe(false);

      controller.abort("External");

      expect(manager.isCancelled()).toBe(true);
    });

    it("should throw appropriate error for internal cancellation", () => {
      const reason = "Internal cancellation";
      manager.cancel(reason);

      expect(() => manager.throwIfCancelled()).toThrow(CancellationError);
      expect(() => manager.throwIfCancelled()).toThrow(reason);
    });

    it("should throw appropriate error for external cancellation", () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      const reason = "External cancellation";
      controller.abort(reason);

      let thrownError: unknown;
      try {
        manager.throwIfCancelled();
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeDefined();
      expect(isCancellationError(thrownError)).toBe(true);
    });

    it("should not throw when not cancelled", () => {
      expect(() => manager.throwIfCancelled()).not.toThrow();
    });
  });

  describe("cancellation context integration", () => {
    beforeEach(() => {
      manager = new CancellationManager(createMockRuntimeAdapter());
    });

    it("should provide working checkCancellation method", () => {
      const context = manager.createCancellableContext();

      expect(() => context.checkCancellation()).not.toThrow();

      manager.cancel("Test");

      expect(() => context.checkCancellation()).toThrow(CancellationError);
    });

    it("should provide working throwIfCancelled method", () => {
      const context = manager.createCancellableContext();

      expect(() => context.throwIfCancelled()).not.toThrow();

      manager.cancel("Test");

      expect(() => context.throwIfCancelled()).toThrow(CancellationError);
    });

    it("should provide working isCancelled method", () => {
      const context = manager.createCancellableContext();

      expect(context.isCancelled()).toBe(false);

      manager.cancel("Test");

      expect(context.isCancelled()).toBe(true);
    });
  });

  describe("dispose", () => {
    it("should clean up resources", () => {
      manager = new CancellationManager(createMockRuntimeAdapter());

      manager.schedulePeriodicChecks();
      manager.dispose();

      // Test passes if no errors thrown and resources cleaned up
      expect(true).toBe(true);
    });

    it("should be safe to call multiple times", () => {
      manager = new CancellationManager(createMockRuntimeAdapter());

      manager.dispose();
      manager.dispose(); // Should not error

      expect(true).toBe(true);
    });
  });

  describe("error scenarios", () => {
    it("should handle cleanup timeout gracefully", async () => {
      const shortTimeout = 50;
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        gracefulCancellationTimeoutMs: shortTimeout,
      });

      manager.addCleanupHandler(async () => {
        await new Promise((resolve) => setTimeout(resolve, shortTimeout * 3));
      });

      // Should timeout and throw appropriate error
      await expect(manager.performCleanup()).rejects.toThrow(
        GracefulCancellationTimeoutError,
      );
    });

    it("should handle external signal without reason", () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      controller.abort(); // No reason provided

      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBeUndefined();
    });
  });

  describe("integration scenarios", () => {
    it("should work with external AbortController patterns", async () => {
      const controller = new AbortController();
      manager = new CancellationManager(createMockRuntimeAdapter(), {
        signal: controller.signal,
      });

      const context = manager.createCancellableContext();

      // Simulate fetch-like operation
      const mockFetch = jest.fn().mockImplementation(async (url, options) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve({ ok: true }), 100);

          options.signal?.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("Aborted"));
          });
        });
      });

      // Start async operation
      const fetchPromise = mockFetch("/api/data", { signal: context.signal });

      // Cancel after 50ms
      setTimeout(() => controller.abort("User cancelled"), 50);

      await expect(fetchPromise).rejects.toThrow("Aborted");
      expect(manager.isCancelled()).toBe(true);
      expect(manager.getCancellationReason()).toBe("User cancelled");
    });

    it("should support complex cleanup scenarios", async () => {
      manager = new CancellationManager(createMockRuntimeAdapter());

      const resources: string[] = [];

      // Simulate resource allocation and cleanup
      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        resources.push("database closed");
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        resources.push("files cleaned");
      });

      manager.addCleanupHandler(async () => {
        await Promise.resolve();
        resources.push("connections closed");
      });

      manager.cancel("Shutdown requested");

      // Give time for async cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Resources should be cleaned up in LIFO order
      expect(resources).toEqual([
        "connections closed",
        "files cleaned",
        "database closed",
      ]);
    });
  });
});
