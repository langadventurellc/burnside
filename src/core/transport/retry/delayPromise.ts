import type { RuntimeAdapter } from "../../runtime/runtimeAdapter";

/**
 * Promise-based delay utility with AbortSignal support using runtime adapter
 * @param ms - Delay in milliseconds
 * @param runtimeAdapter - Runtime adapter for cross-platform timer operations
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the delay or rejects if aborted
 */
export function delayPromise(
  ms: number,
  runtimeAdapter: RuntimeAdapter,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Delay was aborted"));
      return;
    }

    const timeoutHandle = runtimeAdapter.setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
      resolve();
    }, ms);

    const abortHandler = () => {
      runtimeAdapter.clearTimeout(timeoutHandle);
      reject(new Error("Delay was aborted"));
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
}
