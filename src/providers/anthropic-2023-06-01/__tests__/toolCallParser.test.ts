/**
 * Tool Call Parser Tests
 *
 * Tests for parsing Anthropic tool calls from response content blocks
 */

import { parseAnthropicToolCalls } from "../toolCallParser.js";

describe("parseAnthropicToolCalls", () => {
  it("should parse single tool call", () => {
    const contentBlocks = [
      {
        type: "tool_use",
        id: "call_123",
        name: "get_weather",
        input: { location: "San Francisco" },
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "call_123",
      name: "get_weather",
      parameters: { location: "San Francisco" },
      metadata: {
        providerId: "anthropic",
        timestamp: expect.any(String),
      },
    });
  });

  it("should parse multiple tool calls", () => {
    const contentBlocks = [
      {
        type: "tool_use",
        id: "call_1",
        name: "get_weather",
        input: { location: "New York" },
      },
      {
        type: "tool_use",
        id: "call_2",
        name: "get_time",
        input: { timezone: "UTC" },
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("get_weather");
    expect(result[1]?.name).toBe("get_time");
  });

  it("should filter out non-tool content blocks", () => {
    const contentBlocks = [
      {
        type: "text",
        text: "Here's the weather information:",
      },
      {
        type: "tool_use",
        id: "call_123",
        name: "get_weather",
        input: { location: "Boston" },
      },
      {
        type: "image",
        source: { type: "base64", data: "..." },
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("get_weather");
  });

  it("should handle empty content blocks array", () => {
    const result = parseAnthropicToolCalls([]);
    expect(result).toEqual([]);
  });

  it("should handle content blocks with no tool calls", () => {
    const contentBlocks = [
      { type: "text", text: "Hello world" },
      { type: "image", source: { type: "base64", data: "..." } },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);
    expect(result).toEqual([]);
  });

  it("should generate ID when missing", () => {
    const contentBlocks = [
      {
        type: "tool_use",
        name: "test_tool",
        input: { param: "value" },
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result[0]?.id).toMatch(/^tool_\d+$/);
  });

  it("should handle complex tool input", () => {
    const contentBlocks = [
      {
        type: "tool_use",
        id: "call_complex",
        name: "complex_tool",
        input: {
          string_param: "value",
          number_param: 42,
          boolean_param: true,
          array_param: ["a", "b", "c"],
          object_param: {
            nested: "data",
            count: 5,
          },
        },
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result[0]?.parameters).toEqual({
      string_param: "value",
      number_param: 42,
      boolean_param: true,
      array_param: ["a", "b", "c"],
      object_param: {
        nested: "data",
        count: 5,
      },
    });
  });

  it("should include proper metadata", () => {
    const contentBlocks = [
      {
        type: "tool_use",
        id: "call_meta",
        name: "meta_tool",
        input: {},
      },
    ];

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result[0]?.metadata).toEqual({
      providerId: "anthropic",
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
  });

  it("should handle mixed content blocks efficiently", () => {
    const contentBlocks = Array(1000)
      .fill(null)
      .map((_, i) => {
        if (i % 10 === 0) {
          return {
            type: "tool_use",
            id: `call_${i}`,
            name: "batch_tool",
            input: { index: i },
          };
        }
        return {
          type: "text",
          text: `Text block ${i}`,
        };
      });

    const result = parseAnthropicToolCalls(contentBlocks);

    expect(result).toHaveLength(100); // Every 10th item
    expect(result[0]?.parameters).toEqual({ index: 0 });
    expect(result[99]?.parameters).toEqual({ index: 990 });
  });
});
