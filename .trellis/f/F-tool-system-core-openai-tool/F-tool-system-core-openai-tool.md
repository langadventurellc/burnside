---
id: F-tool-system-core-openai-tool
title: Tool System Core + OpenAI Tool Calls
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/tools/toolCall.ts: Created ToolCall interface with id, name,
    parameters, and optional metadata fields for tracking tool execution
    requests
  src/core/tools/toolResult.ts: Created ToolResult interface with discriminated
    success/error states, comprehensive metadata, and clear documentation
  src/core/tools/toolCallSchema.ts: Implemented comprehensive Zod validation
    schema for ToolCall with strict validation, parameter validation, and
    metadata validation
  src/core/tools/toolResultSchema.ts: Implemented discriminated union Zod schema
    for ToolResult ensuring mutually exclusive success/error states with
    comprehensive validation
  src/core/tools/index.ts: Updated exports to include new ToolCall, ToolResult
    interfaces and their corresponding Zod schemas; Updated exports to include
    ToolRegistry interface, RegistryEntry interface, and InMemoryToolRegistry
    implementation for public API access; Updated exports to include the new
    ToolRouter class
  src/core/tools/__tests__/toolCallSchema.test.ts: Created comprehensive test
    suite with 32 test cases covering all validation scenarios, edge cases, and
    error conditions
  src/core/tools/__tests__/toolResultSchema.test.ts: Created comprehensive test
    suite with 24 test cases covering discriminated union behavior,
    success/error state validation, and all field validation rules
  src/core/tools/toolRegistry.ts: Created ToolRegistry interface defining the
    contract for tool registration, discovery, and lifecycle management with
    comprehensive documentation and examples
  src/core/tools/registryEntry.ts: Created RegistryEntry interface for unified
    storage of tool definitions and handlers in registry systems
  src/core/tools/inMemoryToolRegistry.ts: Implemented InMemoryToolRegistry class
    with Map-based storage, comprehensive validation, tool name sanitization,
    registration metadata tracking, and defensive error handling using ToolError
  src/core/tools/__tests__/toolRegistry.test.ts: Created comprehensive unit test
    suite with 53 test cases covering registration, unregistration, discovery,
    validation, error handling, edge cases, and performance requirements
  src/core/tools/toolRouter.ts: Implemented the main ToolRouter class that
    orchestrates tool execution through the pipeline
  src/core/tools/toolExecutionPipeline.ts: Core pipeline orchestrator that
    coordinates all 4 execution stages with comprehensive error handling
  src/core/tools/pipelineValidation.ts: Validation stage that validates ToolCall
    format and parameter compatibility with tool definitions
  src/core/tools/pipelinePreparation.ts:
    Preparation stage that sets up execution
    context and validates required inputs
  src/core/tools/pipelineExecution.ts: Execution stage with Promise.race timeout
    protection and proper AbortController handling
  src/core/tools/pipelineNormalization.ts: Normalization stage that ensures consistent ToolResult format and metadata
  src/core/tools/preparedContext.ts: Interface for prepared execution context
    after validation and preparation stages
  src/core/tools/executionContext.ts: Interface for complete execution context
    with handler and timeout configuration
  src/core/tools/__tests__/toolExecutionPipeline.test.ts: Comprehensive test suite for all pipeline stages with 19 passing tests
  src/core/tools/__tests__/toolRouter.test.ts:
    Complete test suite for ToolRouter
    with 13 passing tests covering all functionality and error scenarios
  src/tools/builtin/echo/echoInputSchema.ts: Created Zod validation schema for
    Echo tool input parameters using z.record(z.unknown()) for flexible
    JSON-serializable data
  src/tools/builtin/echo/echoOutputSchema.ts: Created Zod validation schema for
    Echo tool output with structured format including echoed data and metadata
    fields
  src/tools/builtin/echo/echoInputType.ts:
    Created TypeScript type definition for
    Echo tool input parameters inferred from Zod schema
  src/tools/builtin/echo/echoOutputType.ts:
    Created TypeScript type definition for
    Echo tool output structure inferred from Zod schema
  src/tools/builtin/echo/echoTool.ts:
    Implemented Echo tool definition and handler
    with comprehensive validation, metadata generation, and error handling
  src/tools/builtin/echo/index.ts: Created module exports barrel file for Echo
    tool components following project patterns
  src/tools/builtin/index.ts: Created built-in tools aggregator module exporting all Echo tool components
  src/tools/index.ts:
    Updated main tools entry point to export built-in tools and
    remove TODO comments
  src/tools/builtin/echo/__tests__/echoTool.test.ts: Created comprehensive test
    suite with 33 test cases covering functionality, validation, integration,
    and error handling
  src/providers/openai-responses-v1/openAIToolSchema.ts:
    Created comprehensive Zod
    validation schemas for OpenAI function calling format with proper name
    validation and parameter structure
  src/providers/openai-responses-v1/toolTranslator.ts: Implemented main
    translation logic converting ToolDefinition to OpenAI format with Zod schema
    conversion and provider hints support
  src/providers/openai-responses-v1/toolsTranslator.ts:
    Created separate file for
    array translation following one-export-per-file rule with comprehensive
    error handling
  src/providers/openai-responses-v1/requestSchema.ts: Updated request schema to
    include tools and tool_choice fields for OpenAI function calling support
  src/providers/openai-responses-v1/translator.ts: Integrated tool translation
    with existing request building to include tools when provided in requests
  src/providers/openai-responses-v1/__tests__/fixtures/toolExamples.ts:
    Created comprehensive test fixtures with various ToolDefinition examples and
    expected OpenAI format outputs
  src/providers/openai-responses-v1/__tests__/toolTranslator.test.ts:
    Implemented extensive unit test suite with 20 test cases covering schema
    conversion, provider hints, error handling, and edge cases
  src/providers/openai-responses-v1/toolCallParser.ts: Created core tool call
    parsing logic with comprehensive Zod validation, JSON parsing, error
    handling, and conversion to unified ToolCall format
  src/providers/openai-responses-v1/responseSchema.ts: Extended response message
    schema to include optional tool_calls array with OpenAI tool call format
    validation
  src/providers/openai-responses-v1/responseParser.ts: Integrated tool call
    parsing into non-streaming response handling with error handling and
    extended return type
  src/providers/openai-responses-v1/__tests__/toolCallParser.test.ts:
    Created comprehensive unit test suite with 20 test cases covering
    validation, conversion, and error handling scenarios
  src/providers/openai-responses-v1/__tests__/fixtures/toolCallResponses.ts:
    Created extensive test fixtures covering success cases, error cases, and
    edge cases for tool call responses
  src/providers/openai-responses-v1/__tests__/responseParser.test.ts:
    Added 6 test cases for tool call parsing integration in non-streaming
    responses
  src/core/agent/agentExecutionState.ts: Created AgentExecutionState interface
    defining execution state with messages, tool calls, results, and
    continuation status
  src/core/agent/agentExecutionOptions.ts:
    Created AgentExecutionOptions interface
    for execution configuration with timeouts and error handling policies
  src/core/agent/agentExecutionContext.ts: Implemented createExecutionContext
    utility function to generate ToolExecutionContext from message history with
    metadata extraction
  src/core/agent/agentLoop.ts: Implemented main AgentLoop class with
    executeSingleTurn method, tool result message formatting, error handling,
    and conversation continuation logic
  src/core/agent/__tests__/agentLoop.test.ts: Created comprehensive test suite
    with 18 test cases covering successful execution, error handling, message
    formatting, and edge cases
  src/core/agent/index.ts:
    Updated module exports to include all agent loop types
    and functionality following project patterns
  src/core/config/bridgeConfigSchema.ts: Added comprehensive tools configuration
    schema with enabled toggle, builtinTools array validation,
    executionTimeoutMs (1000-300000ms), and maxConcurrentTools (1-10) fields
    with detailed error messages
  src/core/config/toolsConfig.ts: Created separate ToolsConfig type definition
    following one-export-per-file rule with proper JSDoc documentation and
    example usage
  src/core/config/bridgeConfig.ts: Extended BridgeConfig interface to include
    optional tools configuration field with updated example showing tool system
    usage
  src/core/config/index.ts: Added ToolsConfig type export to public API for external consumption
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added 13 comprehensive
    test cases covering valid/invalid configurations, integration with existing
    BridgeConfig, backward compatibility, and type inference validation
  src/client/chatRequest.ts: Added optional tools array to ChatRequest interface
    with proper JSDoc examples using inputSchema
  src/client/streamRequest.ts: Enhanced StreamRequest with tool support
    documentation including streaming interruption behavior
  src/client/bridgeClientConfig.ts: Extended BridgeClientConfig with tools
    configuration and toolSystemInitialized tracking
  src/client/toolExecutionRequest.ts: Created internal interface for tool
    execution requests with conversation state tracking
  src/client/toolExecutionStreamRequest.ts: Created streaming tool execution
    interface with interruption and resumption support
  src/client/extractToolCallsFromMessage.ts: Implemented type-safe tool call
    extraction from message metadata with OpenAI format support
  src/client/formatToolResultsAsMessages.ts: Created tool result to message
    conversion with proper error handling and metadata
  src/client/shouldExecuteTools.ts: Simple utility function to determine tool execution eligibility
  src/client/validateToolDefinitions.ts: Comprehensive tool definition validation with clear error messages
  src/client/bridgeClient.ts: Integrated tool system with constructor
    initialization, tool registration API, and chat method tool execution
  src/client/index.ts: Added exports for all new tool-related interfaces and utility functions
  src/client/__tests__/bridgeClientToolIntegration.test.ts: Comprehensive test
    suite covering tool system initialization, registration, validation, and
    configuration with 10 passing tests
log: []
schema: v1.0
childrenIds:
  - T-create-e2e-test-user-message
  - T-integrate-tool-system-with
  - T-add-openai-tool-format
  - T-create-basic-agent-loop-with
  - T-create-echo-tool-with
  - T-create-toolregistry-with
  - T-implement-core-tool-types-and
  - T-implement-openai-tool-call
  - T-implement-toolrouter-with
  - T-update-bridgeconfig-with-tool
created: 2025-09-16T00:17:03.570Z
updated: 2025-09-16T00:17:03.570Z
---

# Tool System Core + OpenAI Tool Calls

## Purpose and Functionality

Implement the complete tool system infrastructure for the LLM Bridge library, enabling unified tool definition, execution, and OpenAI provider integration. This feature establishes the foundation for tool-enabled conversations across all supported providers.

## Key Components to Implement

### 1. ToolRouter System

- **ToolRouter class**: Central routing and dispatching system for tool execution
- **Tool registration mechanism**: Registry for built-in and custom tools
- **Execution pipeline**: Validation → routing → execution → result normalization
- **Error handling**: Comprehensive tool execution error management

### 2. Built-in Test Tool (Echo Tool)

- **Echo tool implementation**: Simple test tool that returns input parameters
- **Zod schema validation**: Complete input/output validation schemas
- **Tool registration**: Integration with ToolRouter system
- **Testing infrastructure**: Unit tests for tool execution pipeline

### 3. OpenAI Tool Integration

- **Request translation**: Convert unified ToolDefinition to OpenAI function/tool format
- **Response parsing**: Parse OpenAI tool calls from streaming and non-streaming responses
- **Tool call detection**: Identify when LLM requests tool execution
- **Result formatting**: Format tool results back to OpenAI continuation format

### 4. Agent Loop Foundation

- **Single-turn execution**: Execute one tool call and resume conversation
- **State management**: Track conversation state during tool execution
- **Flow control**: Pause → execute → resume conversation flow
- **Integration points**: Connect with existing BridgeClient chat/stream methods

## Detailed Acceptance Criteria

### Functional Behavior

- **Tool Registration**: Successfully register and discover tools in ToolRouter
- **Echo Tool Execution**: Execute echo tool with various input types and receive identical output
- **OpenAI Tool Calls**: Generate valid OpenAI function/tool call requests from unified definitions
- **Tool Response Parsing**: Parse OpenAI tool call responses and extract parameters correctly
- **Agent Flow**: Complete E2E test: user message → tool call → tool execution → assistant response
- **Error Handling**: Graceful handling of invalid tool calls, execution failures, and parsing errors
- **Streaming Interruption**: **EXPLICIT TEST CASE**: Mid-stream tool call interruption - when streaming response contains tool call, pause stream, execute tool with timeout, append tool result to conversation, resume with next turn, validate complete flow works end-to-end

### User Interface Requirements

- **Programmatic API**: Clean TypeScript interfaces for tool registration and execution
- **Configuration**: Tool system configurable through BridgeConfig
- **Debugging**: Clear error messages and validation feedback for tool developers

### Data Validation and Error Handling

- **Input Validation**: Zod schema validation for all tool inputs and outputs
- **Parameter Validation**: Strict validation of tool call parameters from LLM
- **Execution Safety**: Sandbox tool execution with timeout and error boundaries
- **Graceful Degradation**: Continue conversation flow even if tool execution fails
- **Error Integration**: Use existing `ToolError` class from `src/core/errors/toolError.ts` for consistent error handling

### Integration Points

- **BridgeClient Integration**: Seamless integration with existing chat/stream methods
- **Provider Plugin**: OpenAI provider supports tool calls in both streaming and non-streaming modes
- **Transport Layer**: Tool execution works with existing HTTP transport and error handling
- **Message System**: Tool calls and results integrate with unified message format
- **Feature Flag Integration**: Respect existing feature flag system for tool enablement/disablement

### Performance Requirements

- **Tool Execution**: Tool calls execute within 5 seconds default timeout
- **Memory Usage**: Tool registry and execution state use minimal memory footprint
- **Streaming Support**: Tool calls work seamlessly with streaming responses
- **Concurrent Execution**: Support multiple concurrent tool executions (future-ready)

### Security Considerations

- **Input Sanitization**: All tool inputs validated and sanitized before execution
- **Execution Isolation**: Tool execution isolated from core library state
- **Parameter Validation**: Strict validation prevents injection attacks through tool parameters
- **Error Information**: Tool execution errors don't leak sensitive internal information

### Testing Requirements

- **Unit Tests**: Comprehensive test coverage for ToolRouter, tool registration, and execution
- **Integration Tests**: E2E tests covering full tool execution flow with OpenAI provider
- **Schema Tests**: Validation tests for Zod schemas and tool definition formats
- **Error Tests**: Tests for all error conditions and edge cases using `ToolError` class
- **Contract Tests**: OpenAI format compatibility tests with recorded fixtures
- **Streaming Interruption Tests**: Dedicated tests for mid-stream tool call pause/resume cycle

## Implementation Guidance

### Required API Signatures

#### ToolRouter Core API

```typescript
interface ToolRouter {
  // Tool registration
  register(
    toolName: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void;

  // Tool execution with context and timeout
  execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
    timeoutMs?: number,
  ): Promise<ToolResult>;

  // Tool discovery
  getRegisteredTools(): ToolDefinition[];
  haseTool(toolName: string): boolean;
}

// Use existing ToolError from src/core/errors/toolError.ts
import { ToolError } from "../errors/toolError.js";
```

#### Agent Loop API

```typescript
interface AgentLoopExecutor {
  // Single tool execution turn
  executeSingleTurn(
    messages: Message[],
    toolCall: ToolCall,
    router: ToolRouter,
  ): Promise<{ updatedMessages: Message[]; shouldContinue: boolean }>;
}
```

### Configuration Integration

#### BridgeConfig Tool System Integration

```typescript
// Update BridgeConfig to include tool system configuration
interface BridgeConfig {
  // ... existing config
  tools?: {
    enabled: boolean; // Master toggle for tool system
    builtinTools: string[]; // List of enabled built-in tools
    executionTimeoutMs?: number; // Default tool execution timeout
    maxConcurrentTools?: number; // Future: concurrent execution limit
  };
}
```

#### Feature Flag Integration

- **Respect existing feature flags**: Check current feature flag implementation in `src/client/featureFlagsInterface.ts`
- **Tool system gating**: Ensure tool calls are properly gated by feature flags
- **Backward compatibility**: Tool system disabled by default until explicitly enabled
- **Configuration precedence**: Feature flags override config-level enablement

### Technical Approach

- **Build on Existing Infrastructure**: Leverage existing validation, transport, and provider systems
- **Zod-First Design**: Use Zod schemas throughout for type safety and validation
- **Provider Agnostic Core**: Keep tool system core independent of specific provider formats
- **Translation Layer**: Implement clean translation between unified and provider-specific formats
- **Error Consistency**: Use existing `ToolError` class for all tool-related errors

### Architecture Patterns

- **Registry Pattern**: Use registry pattern for tool discovery and management
- **Strategy Pattern**: Support multiple tool execution strategies (built-in, provider-native, MCP)
- **Pipeline Pattern**: Implement execution pipeline with clear stages and error handling
- **Observer Pattern**: Enable hooks and callbacks for tool execution monitoring

### File Organization

```
src/core/tools/
  toolRouter.ts           # Central tool routing and execution
  toolRegistry.ts         # Tool registration and discovery
  toolExecutor.ts         # Tool execution pipeline
  agentLoop.ts           # Basic agent loop with tool support

src/tools/builtin/
  echo/                  # Echo tool implementation
    echoTool.ts          # Tool definition and handler
    echoSchema.ts        # Zod validation schemas

src/providers/openai-responses-v1/
  toolTranslator.ts      # OpenAI tool format translation
  toolCallParser.ts      # Parse tool calls from responses
```

### Dependencies

- **Core Infrastructure**: Builds on existing validation, transport, and provider systems
- **OpenAI Provider**: Extends existing OpenAI provider with tool call support
- **Message System**: Integrates with unified message and content part system
- **Error System**: Uses existing `ToolError` class from `src/core/errors/toolError.ts`
- **Feature Flags**: Integrates with existing feature flag system for enablement control

## Security Considerations

- **Validation**: All tool inputs undergo strict Zod validation
- **Execution Boundaries**: Tool execution isolated with proper error boundaries
- **Parameter Sanitization**: Tool parameters sanitized to prevent injection attacks
- **Error Handling**: Tool errors handled securely without exposing internal state using `ToolError` class

## Performance Requirements

- **Execution Speed**: Tool registration and lookup under 1ms for typical use cases
- **Memory Efficiency**: Tool registry uses minimal memory footprint
- **Streaming Integration**: Zero impact on streaming performance when tools not used
- **Error Recovery**: Fast error recovery and continuation of conversation flow
- **Interruption Performance**: Streaming interruption and resumption under 100ms overhead
