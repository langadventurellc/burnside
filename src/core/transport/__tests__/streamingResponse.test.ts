/**
 * Streaming Response Interface Tests
 *
 * Tests for the StreamingResponse interface to ensure proper
 * type compatibility and structure validation.
 */
import type { StreamingResponse } from "../streamingResponse";

describe("StreamingResponse", () => {
  it("should accept streaming response with all properties", () => {
    const response: StreamingResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "text/event-stream" },
      stream: {
        [Symbol.asyncIterator]() {
          let index = 0;
          const chunks = [new Uint8Array([65, 66, 67])];

          return {
            next() {
              if (index < chunks.length) {
                return Promise.resolve({ value: chunks[index++], done: false });
              }
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      },
    };

    expect(response.status).toBe(200);
    expect(response.statusText).toBe("OK");
    expect(response.headers).toHaveProperty(
      "content-type",
      "text/event-stream",
    );
    expect(response.stream).toBeDefined();
    expect(typeof response.stream[Symbol.asyncIterator]).toBe("function");
  });

  it("should support error status codes", () => {
    const errorResponse: StreamingResponse = {
      status: 429,
      statusText: "Too Many Requests",
      headers: { "retry-after": "60" },
      stream: {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      },
    };

    expect(errorResponse.status).toBe(429);
    expect(errorResponse.statusText).toBe("Too Many Requests");
    expect(errorResponse.headers).toHaveProperty("retry-after", "60");
  });

  it("should be iterable with for-await-of", async () => {
    const response: StreamingResponse = {
      status: 200,
      statusText: "OK",
      headers: {},
      stream: {
        [Symbol.asyncIterator]() {
          let index = 0;
          const chunks = [
            new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
            new Uint8Array([32, 87, 111, 114, 108, 100]), // " World"
          ];

          return {
            next() {
              if (index < chunks.length) {
                return Promise.resolve({ value: chunks[index++], done: false });
              }
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      },
    };

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.stream) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    expect(chunks[1]).toEqual(new Uint8Array([32, 87, 111, 114, 108, 100]));
  });

  it("should support empty streams", async () => {
    const response: StreamingResponse = {
      status: 204,
      statusText: "No Content",
      headers: {},
      stream: {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      },
    };

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.stream) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });

  it("should support various content types", () => {
    const contentTypes = [
      "text/event-stream",
      "application/x-ndjson",
      "text/plain",
      "application/octet-stream",
    ];

    contentTypes.forEach((contentType) => {
      const response: StreamingResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": contentType },
        stream: {
          [Symbol.asyncIterator]() {
            return {
              next() {
                return Promise.resolve({ value: undefined, done: true });
              },
            };
          },
        },
      };

      expect(response.headers).toHaveProperty("content-type", contentType);
    });
  });
});
