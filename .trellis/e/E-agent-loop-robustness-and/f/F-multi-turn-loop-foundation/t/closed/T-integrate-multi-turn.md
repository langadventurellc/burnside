---
id: T-integrate-multi-turn
title: Integrate multi-turn execution into BridgeClient.chat() method
status: done
priority: high
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-implement-core-multi-turn
  - T-integrate-streaming
affectedFiles:
  src/client/shouldExecuteMultiTurn.ts: Created utility function to detect when
    multi-turn execution should be enabled based on request configuration and
    tool presence
  src/client/createConversationContext.ts: Created utility function to build
    ConversationContext from request data for provider integration during
    multi-turn execution
  src/client/bridgeClient.ts: Integrated multi-turn execution path in chat()
    method with detection logic, proper error handling for agent loop
    initialization, timeout integration, and backward compatibility preservation
  src/client/__tests__/shouldExecuteMultiTurn.test.ts:
    Created comprehensive unit
    tests for multi-turn detection logic covering all configuration combinations
    and backward compatibility scenarios
  src/client/__tests__/createConversationContext.test.ts: Created unit tests for
    conversation context creation utility covering all context building
    scenarios and edge cases
log:
  - Successfully integrated multi-turn conversation capabilities into
    BridgeClient.chat() method, replacing the limited single-turn tool execution
    with full multi-turn orchestration while maintaining backward compatibility.
    Implemented detection logic to automatically enable multi-turn execution
    when tools and multiTurn config are provided, with proper error handling and
    timeout integration. All tests pass and quality standards are met.
schema: v1.0
childrenIds: []
created: 2025-09-18T02:57:48.994Z
updated: 2025-09-18T02:57:48.994Z
---

# Integrate Multi-Turn Execution into BridgeClient.chat() Method

## Context

This task integrates the multi-turn orchestration capabilities directly into the existing `BridgeClient.chat()` method, replacing the current TODO comment and limited tool execution with full multi-turn conversation support. This is the critical integration point where users will access multi-turn capabilities.

## Related Files

- `src/client/bridgeClient.ts` - Main BridgeClient class requiring integration (lines 240-325)
- `src/core/agent/agentLoop.ts` - Multi-turn orchestration (from previous tasks)

## Current Integration Point

In `BridgeClient.chat()` method, lines 302-310:

```typescript
// Check for tool calls and execute if needed
if (request.tools && request.tools.length > 0 && this.isToolsEnabled()) {
  const toolResultMessages = await this.executeToolCallsInResponse(
    result.message,
  );
  if (toolResultMessages.length > 0) {
    // For now, return the original message. Full conversation continuation would need more complex logic
    return result.message; // ← REPLACE THIS WITH MULTI-TURN EXECUTION
  }
}
```

## Implementation Requirements

Replace the limited single-turn tool execution with full multi-turn orchestration:

1. **Add multi-turn execution path** when tools are present
2. **Integrate with existing provider resolution** and initialization
3. **Maintain backward compatibility** for requests without tools
4. **Handle multi-turn options** from request configuration
5. **Return final conversation result** from multi-turn execution

## Technical Approach

1. **Extend ChatRequest interface** with optional multi-turn options
2. **Detect multi-turn scenarios** based on tool presence and configuration
3. **Orchestrate multi-turn execution** using AgentLoop.executeMultiTurn()
4. **Integrate provider plugins** with multi-turn state management
5. **Preserve existing single-turn behavior** for backward compatibility

## Detailed Acceptance Criteria

✅ **Multi-Turn Detection**

- Automatically enables multi-turn execution when tools are provided
- Supports explicit multi-turn configuration in request options
- Falls back to single-turn execution for requests without tools
- Maintains existing behavior for backward compatibility

✅ **Provider Integration**

- Reuses existing provider resolution and initialization logic
- Integrates provider responses with multi-turn state management
- Handles provider-specific responses within multi-turn context
- Maintains existing timeout and configuration handling

✅ **Tool Execution Integration**

- Replaces limited `executeToolCallsInResponse()` with full multi-turn orchestration
- Integrates with existing tool router and tool registration
- Handles tool execution strategies (sequential/parallel) within provider context
- Maintains tool execution security and validation patterns

✅ **Response Handling**

- Returns final message from completed multi-turn conversation
- Includes execution metadata and metrics in response
- Handles partial results on timeout or cancellation
- Preserves conversation history and state information

✅ **Error Handling**

- Integrates multi-turn error types with existing error handling
- Maintains provider error normalization patterns
- Handles multi-turn specific errors (iteration limits, timeouts)
- Provides clear error context for debugging

## Testing Requirements

**Integration Tests** (include in this task):

- Multi-turn execution through BridgeClient.chat() with various tool scenarios
- Backward compatibility with existing single-turn usage patterns
- Provider integration with multi-turn state management
- Error handling and timeout scenarios through public API
- Tool execution strategies integration with provider responses

## Out of Scope

- Streaming integration (separate task)
- Advanced configuration options (handled by other features)
- Provider plugin modifications (separate integration tasks)
- BridgeClient.stream() integration (separate task)

## Dependencies

- T-implement-core-multi-turn (core multi-turn orchestration)
- T-integrate-streaming (streaming interruption integration)

## Security Considerations

- Maintain existing authentication and authorization patterns
- Preserve tool execution security constraints
- Ensure conversation state doesn't leak sensitive information
- Validate multi-turn configuration parameters

## Performance Requirements

- Multi-turn overhead < 50ms compared to equivalent single-turn requests
- Memory usage scales linearly with conversation length
- Provider integration overhead minimal
- Timeout handling accurate and responsive

## Implementation Notes

- Preserve all existing BridgeClient.chat() functionality and contracts
- Design for clean separation between single-turn and multi-turn paths
- Ensure integration doesn't break existing client applications
- Provide comprehensive error messages for configuration issues
