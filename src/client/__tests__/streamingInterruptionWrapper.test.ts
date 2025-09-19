import { StreamingInterruptionWrapper } from "../streamingInterruptionWrapper";
import { StreamingStateMachine } from "../../core/agent/streamingStateMachine";
import type { StreamDelta } from "../streamDelta";
import type { ToolCall } from "../../core/tools/toolCall";
import type { ToolResult } from "../../core/tools/toolResult";
import type { ToolRouter } from "../../core/tools/toolRouter";
import type { ToolExecutionContext } from "../../core/tools/toolExecutionContext";
import { BridgeError } from "../../core/errors/bridgeError";

// Mock StreamingStateMachine
jest.mock("../../core/agent/streamingStateMachine");

describe("StreamingInterruptionWrapper", () => {
  let mockToolRouter: jest.Mocked<ToolRouter>;
  let mockContext: ToolExecutionContext;
  let mockStateMachine: jest.Mocked<StreamingStateMachine>;
  let wrapper: StreamingInterruptionWrapper;

  beforeEach(() => {
    mockToolRouter = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ToolRouter>;

    mockContext = {
      userId: "test-user",
      sessionId: "test-session",
      environment: "test",
      permissions: ["read", "write"],
      metadata: { test: true },
    };

    mockStateMachine = {
      handleStreamingResponse: jest.fn(),
    } as unknown as jest.Mocked<StreamingStateMachine>;

    wrapper = new StreamingInterruptionWrapper(
      mockToolRouter,
      mockContext,
      mockStateMachine,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("wrap()", () => {
    it("should pass through stream without interruption when no tool calls detected", async () => {
      // Arrange
      const mockStreamDeltas: StreamDelta[] = [
        {
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Hello" }] },
          finished: false,
        },
        {
          id: "chunk-2",
          delta: { content: [{ type: "text", text: " world" }] },
          finished: true,
        },
      ];

      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        for (const delta of mockStreamDeltas) {
          yield await Promise.resolve(delta);
        }
      })();

      const mockStreamingResult = {
        state: "idle" as const,
        content: "Hello world",
        detectedToolCalls: [],
        success: true,
        executionMetrics: {
          streamingDuration: 100,
          chunksProcessed: 2,
          toolCallsDetected: 0,
        },
      };

      mockStateMachine.handleStreamingResponse.mockResolvedValue(
        mockStreamingResult,
      );

      // Act
      const result = [];
      for await (const delta of wrapper.wrap(mockStream)) {
        result.push(delta);
      }

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].delta.content?.[0]).toEqual({
        type: "text",
        text: "Hello world",
      });
      expect(result[1].finished).toBe(true);
    });

    it("should handle tool execution during streaming interruption", async () => {
      // Arrange
      const mockToolCall: ToolCall = {
        id: "tool-1",
        name: "test-tool",
        parameters: { param: "value" },
      };

      const mockToolResult: ToolResult = {
        callId: "tool-1",
        success: true,
        data: { result: "tool executed successfully" },
      };

      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        yield await Promise.resolve({
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Processing" }] },
          finished: false,
        } as StreamDelta);
      })();

      const mockStreamingResult = {
        state: "paused" as const,
        content: "Processing",
        detectedToolCalls: [mockToolCall],
        success: true,
        executionMetrics: {
          streamingDuration: 150,
          chunksProcessed: 1,
          toolCallsDetected: 1,
        },
      };

      mockStateMachine.handleStreamingResponse.mockResolvedValue(
        mockStreamingResult,
      );
      mockToolRouter.execute.mockResolvedValue(mockToolResult);

      // Act
      const result = [];
      for await (const delta of wrapper.wrap(mockStream)) {
        result.push(delta);
      }

      // Assert
      expect(result).toHaveLength(4); // content + tool progress + tool result + final
      expect(mockToolRouter.execute).toHaveBeenCalledWith(
        mockToolCall,
        mockContext,
      );
      expect(result[1].delta.content?.[0]).toEqual({
        type: "text",
        text: "[Tool: test-tool executed]",
      });
      expect(result[2].delta.content?.[0]).toEqual({
        type: "text",
        text: 'Tool result: {"result":"tool executed successfully"}',
      });
    });

    it("should handle tool execution errors gracefully", async () => {
      // Arrange
      const mockToolCall: ToolCall = {
        id: "tool-1",
        name: "failing-tool",
        parameters: {},
      };

      const mockToolResult: ToolResult = {
        callId: "tool-1",
        success: false,
        error: {
          code: "execution_error",
          message: "Tool execution failed",
        },
      };

      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        yield await Promise.resolve({
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Processing" }] },
          finished: false,
        } as StreamDelta);
      })();

      const mockStreamingResult = {
        state: "paused" as const,
        content: "Processing",
        detectedToolCalls: [mockToolCall],
        success: true,
        executionMetrics: {
          streamingDuration: 100,
          chunksProcessed: 1,
          toolCallsDetected: 1,
        },
      };

      mockStateMachine.handleStreamingResponse.mockResolvedValue(
        mockStreamingResult,
      );
      mockToolRouter.execute.mockResolvedValue(mockToolResult);

      // Act
      const result = [];
      for await (const delta of wrapper.wrap(mockStream)) {
        result.push(delta);
      }

      // Assert
      expect(result[2].delta.content?.[0]).toEqual({
        type: "text",
        text: "Tool result: Error: Tool execution failed",
      });
    });

    it("should handle streaming state machine errors", async () => {
      // Arrange
      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        yield await Promise.resolve({
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Test" }] },
          finished: false,
        } as StreamDelta);
      })();

      mockStateMachine.handleStreamingResponse.mockRejectedValue(
        new Error("State machine error"),
      );

      // Act & Assert
      await expect(async () => {
        for await (const _delta of wrapper.wrap(mockStream)) {
          // This should throw
        }
      }).rejects.toThrow(BridgeError);
    });

    it("should handle tool execution errors during streaming", async () => {
      // Arrange
      const mockToolCall: ToolCall = {
        id: "tool-1",
        name: "test-tool",
        parameters: {},
      };

      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        yield await Promise.resolve({
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Processing" }] },
          finished: false,
        } as StreamDelta);
      })();

      const mockStreamingResult = {
        state: "paused" as const,
        content: "Processing",
        detectedToolCalls: [mockToolCall],
        success: true,
        executionMetrics: {
          streamingDuration: 100,
          chunksProcessed: 1,
          toolCallsDetected: 1,
        },
      };

      mockStateMachine.handleStreamingResponse.mockResolvedValue(
        mockStreamingResult,
      );
      mockToolRouter.execute.mockRejectedValue(new Error("Tool router error"));

      // Act & Assert
      await expect(async () => {
        for await (const _delta of wrapper.wrap(mockStream)) {
          // This should throw
        }
      }).rejects.toThrow(BridgeError);
    });

    it("should handle multiple tool calls sequentially", async () => {
      // Arrange
      const mockToolCalls: ToolCall[] = [
        { id: "tool-1", name: "tool-one", parameters: {} },
        { id: "tool-2", name: "tool-two", parameters: {} },
      ];

      const mockToolResults: ToolResult[] = [
        { callId: "tool-1", success: true, data: { result: "first" } },
        { callId: "tool-2", success: true, data: { result: "second" } },
      ];

      const mockStream = (async function* (): AsyncGenerator<StreamDelta> {
        yield await Promise.resolve({
          id: "chunk-1",
          delta: { content: [{ type: "text", text: "Processing" }] },
          finished: false,
        } as StreamDelta);
      })();

      const mockStreamingResult = {
        state: "paused" as const,
        content: "Processing",
        detectedToolCalls: mockToolCalls,
        success: true,
        executionMetrics: {
          streamingDuration: 200,
          chunksProcessed: 1,
          toolCallsDetected: 2,
        },
      };

      mockStateMachine.handleStreamingResponse.mockResolvedValue(
        mockStreamingResult,
      );
      mockToolRouter.execute
        .mockResolvedValueOnce(mockToolResults[0])
        .mockResolvedValueOnce(mockToolResults[1]);

      // Act
      const result = [];
      for await (const delta of wrapper.wrap(mockStream)) {
        result.push(delta);
      }

      // Assert
      expect(mockToolRouter.execute).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(6); // content + 2*(progress + result) + final
    });
  });

  describe("shouldEnableInterruption()", () => {
    it("should return true when tools are present", () => {
      expect(StreamingInterruptionWrapper.shouldEnableInterruption(true)).toBe(
        true,
      );
    });

    it("should return false when no tools are present", () => {
      expect(StreamingInterruptionWrapper.shouldEnableInterruption(false)).toBe(
        false,
      );
    });
  });
});
