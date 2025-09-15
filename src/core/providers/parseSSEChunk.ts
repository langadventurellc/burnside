/**
 * Parse Server-Sent Events (SSE) chunks for streaming responses.
 *
 * Utility for parsing SSE data chunks commonly used by LLM provider APIs
 * for streaming responses.
 *
 * @param chunk - Raw SSE chunk data
 * @returns Parsed data objects from the chunk
 *
 * @example
 * ```typescript
 * const data = parseSSEChunk("data: {'delta': {'content': 'Hello'}}\n\n");
 * console.log(data); // [{ delta: { content: "Hello" } }]
 * ```
 */
export function parseSSEChunk(chunk: string): unknown[] {
  const lines = chunk.split("\n");
  const results: unknown[] = [];

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();

      // Skip control messages
      if (data === "[DONE]" || data === "") {
        continue;
      }

      try {
        const parsed: unknown = JSON.parse(data);
        results.push(parsed);
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }
  }

  return results;
}
