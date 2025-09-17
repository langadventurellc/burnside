/**
 * Tool Result Formatter Tests
 *
 * Tests for formatting tool execution results as Anthropic messages
 */

import { formatToolResultMessage } from "../toolResultFormatter";
import type { ToolCall } from "../../../core/tools/toolCall";

describe("formatToolResultMessage", () => {
  const mockToolCall: ToolCall = {
    id: "call_123",
    name: "test_tool",
    parameters: { param: "value" },
    metadata: {
      providerId: "anthropic",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  };

  it("should format string result", () => {
    const result = formatToolResultMessage(
      mockToolCall,
      "Success: Operation completed",
    );

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "Success: Operation completed",
        },
      ],
    });
  });

  it("should format object result as JSON", () => {
    const objectResult = {
      status: "success",
      data: { temperature: 72, humidity: 45 },
      timestamp: "2024-01-01T12:00:00Z",
    };

    const result = formatToolResultMessage(mockToolCall, objectResult);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: JSON.stringify(objectResult),
        },
      ],
    });
  });

  it("should format number result as JSON", () => {
    const result = formatToolResultMessage(mockToolCall, 42);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "42",
        },
      ],
    });
  });

  it("should format boolean result as JSON", () => {
    const result = formatToolResultMessage(mockToolCall, true);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "true",
        },
      ],
    });
  });

  it("should format array result as JSON", () => {
    const arrayResult = ["item1", "item2", "item3"];

    const result = formatToolResultMessage(mockToolCall, arrayResult);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: JSON.stringify(arrayResult),
        },
      ],
    });
  });

  it("should format null result as JSON", () => {
    const result = formatToolResultMessage(mockToolCall, null);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "null",
        },
      ],
    });
  });

  it("should format undefined result as JSON", () => {
    const result = formatToolResultMessage(mockToolCall, undefined);

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "undefined",
        },
      ],
    });
  });

  it("should handle empty string result", () => {
    const result = formatToolResultMessage(mockToolCall, "");

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_123",
          content: "",
        },
      ],
    });
  });

  it("should handle complex nested object", () => {
    const complexResult = {
      users: [
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false },
      ],
      pagination: {
        page: 1,
        total: 2,
        hasMore: false,
      },
      metadata: {
        query: "active users",
        timestamp: "2024-01-01T12:00:00Z",
      },
    };

    const result = formatToolResultMessage(mockToolCall, complexResult);

    expect(result.content[0]?.content).toBe(JSON.stringify(complexResult));
  });

  it("should preserve tool call ID in message", () => {
    const customToolCall: ToolCall = {
      id: "custom_call_456",
      name: "custom_tool",
      parameters: {},
    };

    const result = formatToolResultMessage(customToolCall, "result");

    expect(result.content[0]?.tool_use_id).toBe("custom_call_456");
  });

  it("should always use user role", () => {
    const result = formatToolResultMessage(mockToolCall, "any result");
    expect(result.role).toBe("user");
  });

  it("should always use tool_result type", () => {
    const result = formatToolResultMessage(mockToolCall, "any result");
    expect(result.content[0]?.type).toBe("tool_result");
  });

  it("should handle error objects", () => {
    const errorResult = {
      error: "Tool execution failed",
      code: "TOOL_ERROR",
      details: {
        reason: "Invalid parameters",
        suggestion: "Check parameter format",
      },
    };

    const result = formatToolResultMessage(mockToolCall, errorResult);

    expect(result.content[0]?.content).toBe(JSON.stringify(errorResult));
  });

  it("should handle large result objects", () => {
    const largeResult = {
      data: Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: i,
          value: `item_${i}`,
          enabled: i % 2 === 0,
        })),
      summary: {
        total: 1000,
        enabled: 500,
        disabled: 500,
      },
    };

    const result = formatToolResultMessage(mockToolCall, largeResult);

    expect(result.content[0]?.content).toBe(JSON.stringify(largeResult));
    expect(typeof result.content[0]?.content).toBe("string");
  });
});
