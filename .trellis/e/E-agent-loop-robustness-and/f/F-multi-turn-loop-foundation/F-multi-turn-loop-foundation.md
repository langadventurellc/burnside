---
id: F-multi-turn-loop-foundation
title: Multi-Turn Loop Foundation
status: in-progress
priority: medium
parent: E-agent-loop-robustness-and
prerequisites: []
affectedFiles:
  src/core/agent/agentExecutionOptions.ts:
    Extended interface with 5 new optional
    multi-turn properties and comprehensive JSDoc documentation with examples
  src/core/agent/agentLoop.ts: Updated constructor to initialize new multi-turn
    options with proper defaults and fixed TypeScript typing for
    Required<AgentExecutionOptions>; Added executeMultiTurn() method with
    complete multi-turn orchestration logic including iteration management,
    state tracking, timeout enforcement, and helper methods for state
    initialization, termination handling, and metrics calculation
  src/core/agent/__tests__/agentExecutionOptions.test.ts: Created comprehensive
    test suite with 19 tests covering backward compatibility, type safety,
    documentation examples, and edge cases
  src/core/agent/multiTurnState.ts:
    Created new MultiTurnState interface extending
    AgentExecutionState with comprehensive multi-turn conversation state
    tracking including iteration counts, streaming state, tool call management,
    and termination reasons
  src/core/agent/streamingState.ts: Created StreamingState union type with 5
    literal values for streaming state machine transitions during multi-turn
    conversations
  src/core/agent/terminationReason.ts:
    Created TerminationReason union type with 5
    literal values defining possible conversation termination scenarios
  src/core/agent/__tests__/multiTurnState.test.ts: Created comprehensive test
    suite with 17 tests covering interface extension, type safety, union type
    constraints, documentation examples, and edge cases
  src/core/agent/index.ts: Updated module exports to include MultiTurnState,
    StreamingState, and TerminationReason types, and updated module
    documentation to mention multi-turn capabilities; Updated module exports to
    include new IterationManager class and related interfaces; Updated module
    exports to include StreamingResult interface and StreamingStateMachine class
    in alphabetical order following existing patterns
  src/core/agent/__tests__/agentLoop.test.ts: Added comprehensive test suite for
    executeMultiTurn() method with 12 test cases covering state management,
    iteration limits, timeout scenarios, metrics calculation, error handling,
    conversation history preservation, and edge cases
  src/core/agent/iterationManager.ts: Created new IterationManager class with
    iteration tracking, timeout enforcement, limit validation, termination
    detection, and execution metrics
  src/core/agent/iterationResult.ts: Created new IterationResult interface for iteration completion results
  src/core/agent/timeoutStatus.ts: Created new TimeoutStatus interface for timeout monitoring
  src/core/agent/executionMetrics.ts: Created new ExecutionMetrics interface for performance monitoring
  src/core/agent/__tests__/iterationManager.test.ts: Created comprehensive test
    suite with 26 tests covering all functionality including edge cases
  src/core/agent/streamingResult.ts: Created new StreamingResult interface
    defining return type for streaming operations with state, content, tool
    calls, success status, execution metrics, and optional error/metadata fields
  src/core/agent/streamingStateMachine.ts:
    Created new StreamingStateMachine class
    implementing complete state machine for streaming interruption handling with
    handleStreamingResponse(), state transition validation, tool call detection
    infrastructure, and buffer management
  src/core/agent/__tests__/streamingResult.test.ts: Created comprehensive test
    suite with 15 tests covering StreamingResult interface validation, streaming
    states, execution metrics, and error handling scenarios
  src/core/agent/__tests__/streamingStateMachine.test.ts: Created comprehensive
    test suite with 16 tests covering state transitions, streaming response
    processing, tool execution coordination, buffer management, and error
    handling with mock async iterables
log: []
schema: v1.0
childrenIds:
  - T-create-comprehensive-multi
  - T-create-streaming-state
  - T-enhance-chatrequest-and
  - T-extend-provider-plugins-with
  - T-implement-tool-execution
  - T-integrate-multi-turn
  - T-integrate-streaming-1
  - T-integrate-streaming
  - T-create-iteration-manager-for
  - T-create-multiturnstate
  - T-extend-agentexecutionoptions
  - T-implement-core-multi-turn
created: 2025-09-18T02:16:38.173Z
updated: 2025-09-18T02:16:38.173Z
---

# Multi-Turn Loop Foundation Feature

## Overview

Extend the existing single-turn `AgentLoop` implementation to support multi-turn conversations with robust iteration management, timeout controls, and streaming interruption handling. This feature establishes the core multi-turn orchestration capabilities that other robustness features will build upon.

## Purpose and Functionality

Transform the current `executeSingleTurn()` method into a comprehensive multi-turn system that can:

- Orchestrate multiple conversation turns until natural completion
- Handle streaming interruption when tool calls are emitted mid-stream
- Manage conversation state across multiple iterations
- Provide configurable safety limits and timeout controls
- Support both streaming and non-streaming execution modes

## Key Components to Implement

### 1. Enhanced AgentExecutionOptions

```typescript
interface AgentExecutionOptions {
  // Existing single-turn options
  maxToolCalls?: number;
  timeoutMs?: number;
  toolTimeoutMs?: number;
  continueOnToolError?: boolean;

  // New multi-turn options
  maxIterations?: number; // Default: 10
  iterationTimeoutMs?: number; // Per-iteration timeout
  enableStreaming?: boolean; // Default: true
  toolExecutionStrategy?: "sequential" | "parallel"; // Default: 'sequential'
  maxConcurrentTools?: number; // For parallel execution, default: 3
}
```

### 2. Multi-Turn State Management

```typescript
interface MultiTurnState extends AgentExecutionState {
  iteration: number;
  totalIterations: number;
  startTime: number;
  lastIterationTime: number;
  streamingState:
    | "idle"
    | "streaming"
    | "paused"
    | "tool_execution"
    | "resuming";
  pendingToolCalls: ToolCall[];
  completedToolCalls: ToolCall[];
  terminationReason?:
    | "natural_completion"
    | "max_iterations"
    | "timeout"
    | "cancelled"
    | "error";
}
```

### 3. Core Multi-Turn Methods

- `executeMultiTurn()`: Main orchestration method for multi-turn conversations
- `processIteration()`: Handle a single conversation iteration
- `handleStreamingInterruption()`: Manage tool call detection during streaming
- `resumeAfterTools()`: Continue conversation after tool execution
- `determineTermination()`: Check if conversation should continue

### 4. Streaming State Machine

Implement the streaming interruption semantics:

```
streaming_response → tool_call_emitted → pause_stream → execute_tools → append_tool_results → resume_next_turn
```

### 5. Parallel Tool Execution Support

- Sequential execution (default for safety)
- Parallel execution with configurable concurrency
- Stable ordering of tool results in conversation history
- Partial failure handling

## Detailed Acceptance Criteria

### Functional Requirements

1. **Multi-Turn Orchestration**
   - ✅ `executeMultiTurn()` method conducts conversations with 2+ iterations
   - ✅ Maintains conversation state across all iterations
   - ✅ Supports configurable maximum iterations (default: 10)
   - ✅ Provides per-iteration and overall timeout enforcement
   - ✅ Backward compatible with existing single-turn usage

2. **Streaming Interruption Handling**
   - ✅ Detects tool calls emitted during streaming responses
   - ✅ Pauses stream gracefully when tool calls are detected
   - ✅ Executes tools while maintaining stream state
   - ✅ Resumes conversation flow after tool execution completion
   - ✅ Handles streaming errors and partial responses

3. **Tool Execution Strategies**
   - ✅ Sequential tool execution (default behavior)
   - ✅ Parallel tool execution with configurable max concurrency
   - ✅ Stable ordering of tool results in message history
   - ✅ Graceful handling of partial failures in parallel execution
   - ✅ Timeout enforcement for individual and batch tool execution

4. **Termination Detection**
   - ✅ Natural completion detection (no more tool calls)
   - ✅ Maximum iteration limit enforcement
   - ✅ Overall timeout detection and graceful termination
   - ✅ Error-based termination with proper cleanup
   - ✅ Clear termination reason reporting

5. **State Management**
   - ✅ Comprehensive iteration tracking and metadata
   - ✅ Conversation history preservation across turns
   - ✅ Streaming state tracking for interruption handling
   - ✅ Tool execution status tracking
   - ✅ Performance metrics collection (iteration times, tool counts)

### Error Handling Requirements

1. **New Error Types**
   - ✅ `MaxIterationsExceededError` with iteration context
   - ✅ `IterationTimeoutError` with timing information
   - ✅ `StreamingInterruptionError` for stream handling failures
   - ✅ Enhanced error context for debugging

2. **Graceful Degradation**
   - ✅ Continue on tool execution errors (configurable)
   - ✅ Fallback to single-turn mode on multi-turn failures
   - ✅ Stream resumption failure handling
   - ✅ Partial tool execution result handling

### Performance Requirements

1. **Execution Overhead**
   - Multi-turn coordination overhead < 50ms per iteration
   - Streaming interruption detection < 100ms
   - Tool execution batching efficiency for parallel mode
   - Memory usage growth linear with conversation length

2. **Timeout Handling**
   - Precise timeout enforcement at iteration and overall levels
   - Graceful timeout with proper cleanup and state preservation
   - Configurable timeout strategies (strict vs graceful)

## Implementation Guidance

### Technical Approach

1. **Extend Existing AgentLoop Class**
   - Add new multi-turn methods alongside existing single-turn methods
   - Maintain backward compatibility with current API
   - Reuse existing context creation and message formatting logic

2. **State Machine Pattern**
   - Use clear state transitions for streaming and tool execution phases
   - Implement state validation and transition guards
   - Provide state introspection for debugging and monitoring

3. **Composition Over Inheritance**
   - Compose single-turn operations into multi-turn orchestration
   - Maintain single responsibility for each operation phase
   - Enable testing of individual components in isolation

4. **Streaming Buffer Management**
   - Efficient buffering of partial streaming responses
   - Clean buffer management during interruption and resumption
   - Memory-efficient handling of large streaming responses

### File Structure

```
src/core/agent/
├── agentLoop.ts (enhanced with multi-turn methods)
├── agentExecutionOptions.ts (extended with new options)
├── agentExecutionState.ts (enhanced with multi-turn state)
├── multiTurnOrchestrator.ts (new - core multi-turn logic)
├── streamingStateMachine.ts (new - streaming interruption handling)
├── toolExecutionStrategy.ts (new - parallel/sequential execution)
├── iterationManager.ts (new - iteration tracking and limits)
└── __tests__/
    ├── multiTurnLoop.test.ts (comprehensive multi-turn tests)
    ├── streamingInterruption.test.ts (streaming state machine tests)
    ├── toolExecutionStrategy.test.ts (parallel/sequential execution tests)
    └── iterationManager.test.ts (iteration limit and timeout tests)
```

## Testing Requirements

### Unit Tests

1. **Multi-Turn Orchestration Tests**
   - Successful multi-turn conversations (2-5 iterations)
   - Maximum iteration limit enforcement
   - Timeout handling at iteration and overall levels
   - Natural termination detection

2. **Streaming Interruption Tests**
   - Tool call detection during streaming
   - Stream pause and resumption mechanics
   - Error handling during stream interruption
   - Partial response handling

3. **Tool Execution Strategy Tests**
   - Sequential execution with various tool counts
   - Parallel execution with different concurrency levels
   - Mixed success/failure scenarios in parallel execution
   - Tool result ordering validation

4. **State Management Tests**
   - State transitions during multi-turn execution
   - State preservation across interruptions
   - Error state handling and recovery
   - Memory cleanup on completion/cancellation

### Contract Tests

1. **Provider Response Validation**
   - Use recorded provider response fixtures to validate multi-turn behavior
   - Test streaming and non-streaming response patterns
   - Validate termination detection with known response formats
   - Test error scenarios with recorded error responses

2. **Tool Integration Validation**
   - Mock tool implementations with predictable responses
   - Test tool execution patterns and result formatting
   - Validate tool error handling and recovery

## Security Considerations

1. **State Sanitization**
   - Clean sensitive data from state objects
   - Secure handling of tool execution context
   - Memory cleanup on early termination

2. **Input Validation**
   - Validate iteration and timeout configurations
   - Sanitize tool execution parameters
   - Prevent injection through streaming data

3. **Resource Protection**
   - Prevent resource exhaustion through iteration limits
   - Monitor memory usage during long conversations
   - Implement circuit breakers for repeated failures

## Dependencies

### Internal Dependencies

- Enhanced `AgentExecutionOptions` interface
- Extended `AgentExecutionState` interface
- Existing `ToolRouter` and tool execution infrastructure
- Provider plugin streaming capabilities

### External Dependencies

- AbortSignal support for cancellation (next feature)
- Provider-specific termination detection (next feature)
- Token budget tracking utilities (future feature)

## Success Metrics

- **Functionality**: Multi-turn conversations execute successfully end-to-end
- **Performance**: Iteration overhead meets < 50ms benchmark
- **Reliability**: 99.5% success rate for valid multi-turn scenarios
- **Compatibility**: Zero breaking changes to existing single-turn API
- **Test Coverage**: 95%+ coverage for all new multi-turn logic
