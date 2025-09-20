/**
 * Promise-based delay utility with AbortSignal support
 * @param ms - Delay in milliseconds
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after the delay or rejects if aborted
 */
export function delayPromise(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Delay was aborted"));
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
      resolve();
    }, ms);

    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(new Error("Delay was aborted"));
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
}
