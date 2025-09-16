---
id: T-integrate-tool-system-with
title: Integrate tool system with BridgeClient
status: open
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-update-bridgeconfig-with-tool
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:31:53.717Z
updated: 2025-09-16T00:31:53.717Z
---

# Integrate Tool System with BridgeClient

## Context

Connect the tool system with BridgeClient's chat and stream methods to enable end-to-end tool execution through the main client interface. This completes the integration specified in the feature requirements.

Modifies existing BridgeClient in `src/client/bridgeClient.ts` and related client infrastructure to support tool execution alongside existing chat functionality.

Reference feature F-tool-system-core-openai-tool for complete context and integration requirements.

## Implementation Requirements

### Files to Modify

```
src/client/
  bridgeClient.ts                    # Add tool system integration
  chatRequest.ts                     # Add tools field to chat requests
  streamRequest.ts                   # Add tools field to stream requests
  bridgeClientConfig.ts              # Add tool router configuration
  __tests__/bridgeClient.test.ts     # Add tool integration tests
```

### Files to Create

```
src/client/
  toolIntegration.ts                 # Tool system integration logic
  __tests__/toolIntegration.test.ts  # Integration tests
```

### Specific Implementation Details

1. **BridgeClient Extension** (`src/client/bridgeClient.ts`):

```typescript
export class BridgeClient {
  private toolRouter?: ToolRouter;
  private agentLoop?: AgentLoop;

  constructor(config: BridgeClientConfig) {
    // ... existing initialization

    // Initialize tool system if enabled
    if (this.isToolsEnabled()) {
      this.initializeToolSystem();
    }
  }

  // Enhanced chat method with tool support
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // If tools provided, include in provider request
    if (request.tools && this.toolRouter) {
      const enhancedRequest = await this.enhanceRequestWithTools(request);
      const response = await this.executeWithTools(enhancedRequest);
      return response;
    }

    // Fallback to existing chat behavior
    return this.executeChatWithoutTools(request);
  }

  // Enhanced stream method with tool support
  stream(request: StreamRequest): Stream<StreamDelta> {
    if (request.tools && this.toolRouter) {
      return this.createToolEnabledStream(request);
    }

    // Fallback to existing stream behavior
    return this.createRegularStream(request);
  }

  private initializeToolSystem(): void;
  private isToolsEnabled(): boolean;
  private enhanceRequestWithTools(
    request: ChatRequest,
  ): Promise<EnhancedChatRequest>;
  private executeWithTools(request: EnhancedChatRequest): Promise<ChatResponse>;
}
```

2. **Request Enhancement** (`src/client/toolIntegration.ts`):

```typescript
// Enhance chat/stream requests with tool definitions
export async function enhanceRequestWithTools(
  request: ChatRequest | StreamRequest,
  toolRouter: ToolRouter,
): Promise<EnhancedRequest> {
  // Validate tool names against registered tools
  const toolDefinitions = validateAndGetToolDefinitions(
    request.tools,
    toolRouter,
  );

  // Add tool definitions to provider request
  return {
    ...request,
    toolDefinitions,
    toolsEnabled: true,
  };
}

// Handle tool call responses from providers
export async function handleToolCallResponse(
  response: ProviderResponse,
  toolRouter: ToolRouter,
  agentLoop: AgentLoop,
): Promise<ToolEnhancedResponse> {
  // Extract tool calls from provider response
  const toolCalls = extractToolCalls(response);

  if (toolCalls.length > 0) {
    // Execute tool calls through agent loop
    const toolResults = await executeToolCalls(
      toolCalls,
      toolRouter,
      agentLoop,
    );

    // Format enhanced response with tool results
    return formatResponseWithToolResults(response, toolResults);
  }

  return response;
}
```

3. **Streaming Tool Integration**:
   - Detect tool calls in streaming deltas
   - Pause stream when tool call detected
   - Execute tool through agent loop
   - Resume stream with tool result
   - Handle streaming interruption as specified in requirements

4. **Feature Flag Integration**:
   - Check TOOLS_ENABLED feature flag before tool system initialization
   - Graceful degradation when tools disabled
   - Error handling when tools requested but not enabled
   - Configuration precedence (feature flags override config)

## Technical Approach

- **Non-Breaking Integration**: Tool functionality is additive to existing chat/stream methods
- **Graceful Degradation**: Client works normally when tools not enabled or provided
- **Provider Agnostic**: Tool integration works with any provider that supports tools
- **Streaming Interruption**: Handle mid-stream tool calls as specified in requirements

## Acceptance Criteria

### Functional Requirements

- [ ] BridgeClient initializes tool system when enabled in configuration
- [ ] Chat requests with tools include tool definitions in provider requests
- [ ] Stream requests with tools support mid-stream tool call execution
- [ ] Tool calls detected in responses trigger tool execution through agent loop
- [ ] Tool results properly integrated into conversation flow

### Integration Points

- [ ] Tool system respects TOOLS_ENABLED feature flag
- [ ] Configuration validates tool enablement before initialization
- [ ] Provider requests include tool definitions when tools provided
- [ ] Tool calls parsed from provider responses correctly
- [ ] Agent loop integration handles single-turn execution

### Streaming Integration

- [ ] **EXPLICIT REQUIREMENT**: Mid-stream tool call interruption implemented
- [ ] Stream pauses when tool call detected in delta
- [ ] Tool execution completes before stream resumption
- [ ] Tool results appended to conversation and stream continues
- [ ] Streaming performance maintains <100ms overhead for interruption

### Error Handling

- [ ] Invalid tool names in requests result in clear error messages
- [ ] Tool execution failures don't break chat/stream flow
- [ ] Tools disabled but requested results in helpful error message
- [ ] Provider errors during tool calls handled gracefully

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Integration Tests**:
   - BridgeClient initializes tool system correctly when enabled
   - Chat requests with tools execute end-to-end successfully
   - Stream requests with tools handle tool calls correctly
   - Feature flag integration works as expected

2. **Tool Execution Tests**:
   - Tool calls detected in provider responses trigger execution
   - Agent loop integration works for single-turn execution
   - Tool results properly formatted and integrated into responses
   - Multiple tool calls in single response handled correctly

3. **Streaming Interruption Tests**:
   - **CRITICAL**: Mid-stream tool call interruption works end-to-end
   - Stream pause/resume cycle completes successfully
   - Tool execution during stream interruption works correctly
   - Conversation flow maintained after tool execution

4. **Error Handling Tests**:
   - Invalid tool names handled with clear error messages
   - Tool execution failures don't break client operation
   - Tools disabled scenarios handled gracefully
   - Provider errors during tool execution handled appropriately

## Security Considerations

- **Tool Validation**: All tool names validated against registered tools before execution
- **Execution Isolation**: Tool execution isolated from client state
- **Error Sanitization**: Tool execution errors sanitized before client response
- **Feature Gating**: Tool system properly gated by feature flags and configuration

## Out of Scope

- Advanced agent features (multi-turn, planning, memory)
- Tool result caching or persistence
- Complex tool orchestration or dependencies
- Performance optimization beyond basic streaming interruption
- Tool marketplace or dynamic tool loading
