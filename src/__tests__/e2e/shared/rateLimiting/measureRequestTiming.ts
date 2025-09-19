/**
 * Executes multiple requests and measures their timing for rate limiting analysis
 *
 * @param requestFunction - Async function that makes a single request
 * @param requestCount - Number of requests to execute
 * @returns Array of request start timestamps in milliseconds
 *
 * @example
 * ```typescript
 * const timestamps = await measureRequestTiming(
 *   () => client.chat({ model: "gpt-4", messages }),
 *   4
 * );
 * ```
 */
export async function measureRequestTiming(
  requestFunction: () => Promise<unknown>,
  requestCount: number,
): Promise<number[]> {
  const timestamps: number[] = [];
  const requests: Promise<unknown>[] = [];

  // Start all requests rapidly and capture timestamps
  for (let i = 0; i < requestCount; i++) {
    const startTime = Date.now();
    timestamps.push(startTime);
    requests.push(requestFunction());
  }

  // Wait for all requests to complete
  await Promise.allSettled(requests);

  return timestamps;
}
