---
id: E-agent-loop-robustness-and
title: Agent Loop Robustness and Safety
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/agent/agentExecutionOptions.ts:
    Extended interface with 5 new optional
    multi-turn properties and comprehensive JSDoc documentation with examples
  src/core/agent/agentLoop.ts: "Updated constructor to initialize new multi-turn
    options with proper defaults and fixed TypeScript typing for
    Required<AgentExecutionOptions>; Added executeMultiTurn() method with
    complete multi-turn orchestration logic including iteration management,
    state tracking, timeout enforcement, and helper methods for state
    initialization, termination handling, and metrics calculation; Enhanced
    AgentLoop with streaming integration: added handleStreamingTurn() method,
    coordinateToolExecutionDuringStreaming() method,
    createMockStreamingResponse() method with empty message handling, and
    updated executeIteration() to support streaming when enabled with fallback
    to non-streaming mode; Enhanced executeMultiTurn() and
    executeIterationWithTimeout() methods with specific multi-turn error
    handling, added buildExecutionMetrics() helper method, improved streaming
    error handling with multi-turn context, and fixed critical iteration limit
    logic bug where max iterations check was unreachable due to loop condition"
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
    in alphabetical order following existing patterns; Updated module exports to
    include StreamingTurnResult interface and StreamingIntegrationError class,
    and enhanced module documentation to mention streaming interruption
    capabilities; Updated module exports to include all new error types and
    related interfaces, enhanced module documentation to mention multi-turn
    error handling capabilities
  src/core/agent/__tests__/agentLoop.test.ts: Added comprehensive test suite for
    executeMultiTurn() method with 12 test cases covering state management,
    iteration limits, timeout scenarios, metrics calculation, error handling,
    conversation history preservation, and edge cases; Added comprehensive
    integration test suite for multi-turn error handling with 6 test cases
    covering max iterations, timeouts, general errors, serialization, error
    causes, and instanceof checks with proper mocking to trigger error
    conditions
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
  src/client/chatRequest.ts: Added import for AgentExecutionOptions, enhanced
    JSDoc with multi-turn documentation and examples, added optional multiTurn
    property of type Partial<AgentExecutionOptions>
  src/client/streamRequest.ts: Enhanced JSDoc documentation with
    streaming-specific multi-turn behavior explanation, added examples for
    streaming interruption handling and tool execution during streaming
    (multiTurn property inherited from ChatRequest)
  src/client/__tests__/chatRequest.test.ts: Added comprehensive multi-turn
    configuration test suite with 7 test cases covering partial configuration,
    comprehensive configuration, empty objects, backward compatibility,
    documentation examples, and type safety validation
  src/client/__tests__/streamRequest.test.ts: Added comprehensive multi-turn
    configuration test suite with 8 test cases covering inheritance,
    streaming-specific combinations, enableStreaming/stream interactions,
    assignability, documentation examples, comprehensive configuration, type
    safety, and backward compatibility
  src/client/index.ts: Updated module documentation to mention multi-turn agent
    conversation capabilities and added example showing multi-turn configuration
    usage; Added export for StreamingInterruptionWrapper to enable internal
    access to streaming interruption infrastructure while maintaining existing
    public API contracts.
  src/core/agent/conversationContext.ts:
    Created new ConversationContext interface
    with comprehensive conversation metadata including message history,
    iteration tracking, streaming state, tool execution history, and token usage
    estimation for multi-turn provider awareness
  src/core/providers/providerPlugin.ts: "Extended ProviderPlugin interface with
    optional multi-turn parameters: added conversationContext parameter to
    translateRequest() and isTerminal(), multiTurnState parameter to
    parseResponse(), and new optional methods estimateTokenUsage() and
    shouldContinueConversation() with comprehensive documentation and examples"
  src/core/providers/defaultEstimateTokenUsage.ts: Created default token usage
    estimation helper function that integrates with model registry
    configuration, provides accurate token estimation based on content types,
    conversation context, and model capabilities from defaultLlmModels
  src/core/providers/defaultShouldContinueConversation.ts: Created default
    conversation continuation logic helper that analyzes termination reasons,
    iteration limits, completion signals in response content, and tool execution
    state to provide intelligent continuation recommendations
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Enhanced OpenAI provider with multi-turn awareness by updating method
    signatures to accept optional multi-turn parameters, implementing
    estimateTokenUsage() and shouldContinueConversation() methods using default
    helpers, maintaining full backward compatibility with existing single-turn
    usage
  src/core/tools/toolExecutionStrategy.ts: Created core strategy interface
    defining pluggable execution patterns for multiple tool calls
  src/core/tools/toolExecutionOptions.ts: Created configuration interface for
    strategy behavior including error handling and concurrency options
  src/core/tools/toolExecutionResult.ts: Created result interface for strategy
    execution with ordered results and performance metadata
  src/core/tools/sequentialExecutionStrategy.ts:
    Implemented sequential execution
    strategy with ordered processing, fail-fast/continue-on-error modes, and
    comprehensive error handling
  src/core/tools/parallelExecutionStrategy.ts: Implemented parallel execution
    strategy with configurable concurrency limiting, stable result ordering, and
    performance metrics
  src/core/tools/toolRouter.ts:
    Extended ToolRouter with executeMultiple() method,
    strategy selection, caching, and validation while maintaining backward
    compatibility
  src/core/tools/index.ts: Updated module exports to include all strategy
    interfaces and implementations with proper documentation
  src/core/tools/__tests__/sequentialExecutionStrategy.test.ts:
    Created comprehensive unit tests for sequential strategy covering all
    execution modes and performance requirements
  src/core/tools/__tests__/parallelExecutionStrategy.test.ts: Created
    comprehensive unit tests for parallel strategy covering concurrency limiting
    and result ordering
  src/core/tools/__tests__/toolExecutionStrategy.test.ts: Created integration
    tests for strategy pattern, ToolRouter integration, and configuration
    validation
  src/core/agent/streamingTurnResult.ts:
    Created StreamingTurnResult interface for
    coordinating between streaming state machine and multi-turn orchestration,
    with comprehensive properties for final messages, updated state, execution
    metrics, and streaming results
  src/core/agent/streamingIntegrationError.ts: Created StreamingIntegrationError
    class with specialized error handling for streaming integration failures,
    including factory methods for different error scenarios and comprehensive
    debugging context
  src/core/agent/__tests__/streamingTurnResult.test.ts:
    Created comprehensive unit
    test suite with 12 test cases covering interface structure, property types,
    integration scenarios, and type compatibility for StreamingTurnResult
    interface
  src/core/agent/__tests__/streamingIntegrationError.test.ts: Created
    comprehensive unit test suite with 19 test cases covering constructor,
    factory methods, serialization, recovery actions, streaming states, and
    error inheritance for StreamingIntegrationError class
  src/client/shouldExecuteMultiTurn.ts: Created utility function to detect when
    multi-turn execution should be enabled based on request configuration and
    tool presence
  src/client/createConversationContext.ts: Created utility function to build
    ConversationContext from request data for provider integration during
    multi-turn execution
  src/client/bridgeClient.ts: Integrated multi-turn execution path in chat()
    method with detection logic, proper error handling for agent loop
    initialization, timeout integration, and backward compatibility
    preservation; Enhanced stream() method to conditionally wrap provider
    streams with StreamingInterruptionWrapper when tools are present in the
    request. Maintains backward compatibility by only enabling interruption for
    tool-enabled requests. Added proper type checking and context creation for
    tool execution.
  src/client/__tests__/shouldExecuteMultiTurn.test.ts:
    Created comprehensive unit
    tests for multi-turn detection logic covering all configuration combinations
    and backward compatibility scenarios
  src/client/__tests__/createConversationContext.test.ts: Created unit tests for
    conversation context creation utility covering all context building
    scenarios and edge cases
  src/client/streamingInterruptionWrapper.ts: Created new
    StreamingInterruptionWrapper class that wraps provider streams with
    interruption handling capabilities. Integrates with StreamingStateMachine
    for tool call detection and ToolRouter for execution. Provides transparent
    streaming interruption with error handling and proper StreamDelta
    formatting.
  src/client/__tests__/streamingInterruptionWrapper.test.ts:
    Created comprehensive
    test suite with 8 test cases covering stream wrapping without tool calls,
    tool execution during interruption, error handling scenarios, and multiple
    tool call processing. Includes proper mocking of StreamingStateMachine and
    ToolRouter dependencies with full async iterable support.
  src/core/agent/executionPhase.ts: Created new ExecutionPhase type definition
    with 8 specific phase values for multi-turn error context tracking
  src/core/agent/multiTurnContext.ts: Created new MultiTurnContext interface
    providing comprehensive context information for multi-turn error debugging
    and analysis
  src/core/agent/multiTurnErrors.ts: Created base MultiTurnExecutionError class
    with comprehensive multi-turn context, recovery strategies, and secure error
    serialization
  src/core/agent/maxIterationsExceededError.ts:
    Created MaxIterationsExceededError
    class for iteration limit violations with detailed iteration context and
    timing information
  src/core/agent/iterationTimeoutError.ts:
    Created IterationTimeoutError class for
    individual iteration timeouts with precise timing information and execution
    context
  src/core/agent/multiTurnStreamingInterruptionError.ts: Created
    MultiTurnStreamingInterruptionError class for streaming interruption
    failures with streaming state context and factory methods
  src/core/agent/__tests__/multiTurnErrors.test.ts: Created comprehensive test
    suite with 21 test cases covering error creation, inheritance,
    serialization, integration scenarios, and type safety
log: []
schema: v1.0
childrenIds:
  - F-cancellation-infrastructure
  - F-context-management-and-token
  - F-multi-turn-loop-foundation
  - F-observability-and-safety
  - F-provider-aware-termination
created: 2025-09-18T02:14:48.566Z
updated: 2025-09-18T02:14:48.566Z
---

# Agent Loop Robustness and Safety Epic

## Overview

Transform the existing single-turn agent loop into a robust multi-turn system with comprehensive safety controls, cancellation mechanisms, and intelligent context management. This epic implements Phase 9 of the LLM Bridge Library implementation plan, building upon the solid foundation of single-turn tool execution to create a production-ready agent orchestration system.

## Goals and Objectives

- **Multi-Turn Conversation Management**: Enable agents to conduct extended conversations with multiple tool calls across multiple turns
- **Robust Safety Controls**: Implement comprehensive safeguards against runaway executions, infinite loops, and resource exhaustion
- **Intelligent Context Management**: Provide sophisticated strategies for managing conversation history within token budget constraints
- **Provider-Aware Termination**: Normalize termination detection across OpenAI, Anthropic, Google Gemini, and xAI providers
- **Advanced Cancellation**: Support graceful cancellation at any point during agent execution, including mid-stream scenarios
- **Comprehensive Observability**: Enable detailed monitoring and debugging of agent execution with secure, redacted telemetry

## Technical Architecture

### Core Components

1. **Multi-Turn Orchestrator**: Central loop managing conversation flow across multiple iterations
2. **Provider-Aware Termination Detection**: Unified termination model normalizing provider-specific completion signals
3. **Parallel Tool Execution Engine**: Support for concurrent tool calls within a single turn
4. **Context Strategy Framework**: Pluggable strategies for conversation trimming and summarization
5. **Token Budget Accounting**: Comprehensive token tracking and budget enforcement
6. **Cancellation Infrastructure**: AbortSignal-based cancellation with streaming support
7. **Observability Framework**: Secure event emission for monitoring and debugging

### Provider Termination Detection Strategy

Based on research, implement unified termination detection that normalizes:

- **OpenAI/xAI**: `finish_reason` field (`stop` = natural completion, `length` = token limit)
- **Anthropic**: `stop_reason` field (`end_turn` = natural completion, `max_tokens` = budget exceeded)
- **Google Gemini**: `finishReason` field (`STOP` = natural completion, `MAX_TOKENS` = budget exceeded)

### Parallel Tool Call Strategy

Support both execution patterns:

- **Sequential Execution**: Execute tool calls one after another (default for safety)
- **Parallel Execution**: Execute multiple tool calls concurrently with configurable max concurrency and stable result ordering

### Streaming State Machine

Implement robust streaming interruption semantics:

```
streaming_response → tool_call_emitted → pause_stream → execute_tools → append_tool_results → resume_next_turn
```

## Acceptance Criteria

### Functional Requirements

1. **Multi-Turn Execution**
   - ✅ Agent can conduct conversations with 2+ iterations
   - ✅ Supports both streaming and non-streaming modes
   - ✅ Handles mixed content and tool calls across turns
   - ✅ Maintains conversation state throughout execution

2. **Safety Controls**
   - ✅ Configurable maximum iterations (default: 10)
   - ✅ Overall execution timeout enforcement
   - ✅ Token budget limits with graceful degradation
   - ✅ Protection against infinite loops and runaway executions

3. **Provider-Aware Termination**
   - ✅ Correctly detects completion for OpenAI, Anthropic, Gemini, and xAI
   - ✅ Handles both streaming and non-streaming termination signals
   - ✅ Normalizes provider-specific completion reasons to unified model

4. **Parallel Tool Execution**
   - ✅ Supports sequential tool execution (default)
   - ✅ Supports parallel tool execution with configurable concurrency
   - ✅ Maintains stable ordering of tool results in conversation history
   - ✅ Handles partial failures in parallel execution scenarios

5. **Context Management**
   - ✅ Preserves system messages, latest tool results, and instruction anchors
   - ✅ Implements "frozen heads/tails" trimming strategy
   - ✅ Supports optional conversation summarization
   - ✅ Provides token budget accounting with provider-reported usage when available

6. **Cancellation Support**
   - ✅ Graceful cancellation via AbortSignal at any execution point
   - ✅ Mid-stream cancellation with proper cleanup
   - ✅ Cancellation status propagation through observability callbacks

7. **Error Handling**
   - ✅ New error types: `MaxIterationsExceededError`, `BudgetExceededError`
   - ✅ Graceful error recovery with continuation options
   - ✅ Comprehensive error context and debugging information

### Non-Functional Requirements

1. **Performance**
   - Multi-turn execution overhead < 50ms per iteration
   - Context trimming performance scales linearly with message count
   - Token counting accuracy within 5% of provider-reported values

2. **Security**
   - All observability data is redacted by default (API keys, sensitive tool args)
   - Secure cleanup of sensitive data on cancellation
   - No sensitive information in error messages or logs

3. **Reliability**
   - 99.9% successful completion rate for valid multi-turn scenarios
   - Graceful degradation when context strategies fail
   - No memory leaks during extended conversations

4. **Observability**
   - Comprehensive event emission for all execution phases
   - Secret-safe telemetry with configurable redaction rules
   - Performance metrics for optimization and debugging

## User Stories

### As a Developer

- I want to create agents that can conduct multi-turn conversations so that I can build sophisticated AI workflows
- I want configurable safety limits so that I can prevent runaway executions in production
- I want detailed observability so that I can debug and optimize agent performance
- I want graceful cancellation so that I can interrupt long-running agent tasks

### As a System Administrator

- I want token budget controls so that I can manage API costs and resource usage
- I want comprehensive error handling so that I can quickly diagnose and resolve issues
- I want secure telemetry so that I can monitor system health without exposing sensitive data

### As an End User

- I want responsive agent interactions so that I can get quick feedback during conversations
- I want reliable agent behavior so that conversations complete successfully or fail gracefully

## Dependencies

### Internal Dependencies

- Existing AgentLoop implementation (foundation)
- ToolRouter and tool execution infrastructure
- Provider plugin system with streaming support
- Transport layer with cancellation support

### External Dependencies

- Provider APIs (OpenAI, Anthropic, Google, xAI)
- Token counting utilities (tiktoken for OpenAI, approximate counting for others)
- AbortSignal polyfill for Node.js environments

## Technical Considerations

### Token Counting Strategy

- **Prefer provider-reported usage** when available (OpenAI, Anthropic, xAI)
- **Fallback to approximation** using lightweight tokenizers or character heuristics
- **Expose accuracy flag** in budget accounting to indicate approximation level

### Context Preservation Strategy

- **Always retain**: System messages, latest tool results, instruction anchors
- **Trim middle bands first**: Remove older conversation turns while preserving context anchors
- **Graceful degradation**: Fall back to simple truncation if advanced strategies fail

### Streaming Architecture

- **State machine approach**: Clear transitions between streaming, tool execution, and resumption
- **Buffering strategy**: Accumulate partial responses during tool execution
- **Error recovery**: Handle stream interruption and resumption gracefully

## Estimated Scale

This epic encompasses approximately 4-6 features:

1. **Multi-Turn Loop Foundation** (Sub-phase 9.1)
2. **Cancellation Infrastructure** (Sub-phase 9.2)
3. **Context Management** (Sub-phase 9.3)
4. **Observability and Safety** (Sub-phase 9.4)
5. **Provider-Aware Termination** (Cross-cutting)
6. **Parallel Tool Execution** (Enhancement)

Each feature represents 2-4 weeks of development work including implementation, testing, and documentation.

## Success Metrics

- **Functionality**: All acceptance criteria met with comprehensive test coverage
- **Performance**: Multi-turn execution meets performance benchmarks
- **Reliability**: Production deployment with < 0.1% error rate
- **Developer Experience**: Clear APIs and comprehensive documentation
- **Security**: All security requirements validated through audit
