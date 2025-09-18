---
id: T-implement-anthropic
title: Implement Anthropic termination detection with stop_reason mapping
status: open
priority: high
parent: F-provider-aware-termination
prerequisites:
  - T-create-unified-termination
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T19:40:35.459Z
updated: 2025-09-18T19:40:35.459Z
---

# Implement Anthropic Termination Detection

## Context

Enhance the existing Anthropic provider to implement the new `detectTermination()` method. Anthropic uses `stop_reason` field in responses with different values than OpenAI.

## Implementation Requirements

### 1. Add detectTermination Method

Update `src/providers/anthropic-2023-06-01/anthropicProvider.ts`:

```typescript
detectTermination(
  deltaOrResponse: StreamDelta | UnifiedResponse,
  isStreaming: boolean
): UnifiedTerminationSignal {
  // Implementation here
}
```

### 2. Anthropic stop_reason Mapping

Based on research, implement precise mapping:

```typescript
const anthropicTerminationMap = {
  end_turn: {
    reason: TerminationReason.NATURAL_COMPLETION,
    confidence: "high",
  },
  stop_sequence: {
    reason: TerminationReason.STOP_SEQUENCE,
    confidence: "high",
  },
  max_tokens: {
    reason: TerminationReason.TOKEN_LIMIT_REACHED,
    confidence: "high",
  },
  tool_use: {
    reason: TerminationReason.NATURAL_COMPLETION,
    confidence: "high",
  },
  null: { reason: TerminationReason.UNKNOWN, confidence: "low" },
  undefined: { reason: TerminationReason.UNKNOWN, confidence: "low" },
};
```

### 3. Anthropic-Specific Handling

- **Message Blocks**: Handle Anthropic's block-based content structure
- **Tool Use Blocks**: Detect termination when tool_use blocks are complete
- **Streaming Events**: Process Anthropic's streaming event types properly
- **Token Usage**: Extract accurate token usage from Anthropic responses

### 4. Update isTerminal Method

Modify existing `isTerminal()` to delegate to `detectTermination()`:

```typescript
isTerminal(deltaOrResponse, conversationContext?): boolean {
  return this.detectTermination(deltaOrResponse, this.isStreaming(deltaOrResponse)).shouldTerminate;
}
```

## Detailed Acceptance Criteria

✅ **stop_reason Mapping**

- All Anthropic stop_reason values correctly mapped to TerminationReason
- High confidence for well-defined reasons (end_turn, stop_sequence, max_tokens)
- Proper handling of tool_use completion scenarios

✅ **Streaming Support**

- Correctly processes Anthropic streaming events
- Handles message_start, content_block_start, content_block_delta, content_block_stop, message_stop
- Detects termination from message_stop events with proper stop_reason

✅ **Non-streaming Support**

- Immediate termination detection from complete Message responses
- Proper extraction of stop_reason from response metadata
- Consistent behavior with streaming mode

✅ **Anthropic Block Structure**

- Handles text blocks, tool_use blocks properly
- Detects completion when all blocks are finished
- Preserves block-level metadata for debugging

✅ **Provider Metadata Preservation**

- Original `stop_reason` value stored in `providerSpecific.originalValue`
- Field name "stop_reason" stored in `providerSpecific.originalField`
- Anthropic-specific metadata (usage, model, etc.) preserved

## Implementation Approach

1. **Add termination mapping**: Create const mapping for Anthropic stop_reason values
2. **Implement detectTermination**: Handle both streaming events and complete responses
3. **Update isTerminal**: Delegate to new method for consistency
4. **Handle blocks**: Process Anthropic's content block structure properly
5. **Extract metadata**: Preserve Anthropic response data for debugging

## Testing Requirements

Create comprehensive tests in `src/providers/anthropic-2023-06-01/__tests__/`:

- All stop_reason values mapped correctly
- Streaming event processing (message_stop, content_block_stop)
- Non-streaming Message response handling
- Block structure parsing (text, tool_use blocks)
- Edge cases and malformed responses
- Provider metadata preservation
- Backward compatibility with existing isTerminal behavior

## Anthropic-Specific Considerations

- **Streaming Events**: Anthropic uses different event types than OpenAI
- **Content Blocks**: Text and tool_use blocks have different completion semantics
- **Token Counting**: Anthropic provides detailed token usage in responses
- **Error Handling**: Anthropic error format differs from OpenAI

## Files to Modify

- `src/providers/anthropic-2023-06-01/anthropicProvider.ts` (enhance)
- `src/providers/anthropic-2023-06-01/__tests__/terminationDetection.test.ts` (new)
- Update existing tests to verify new functionality

## Integration Notes

- **Message Format**: Work with Anthropic's Message format (not ChatCompletion)
- **Tool Use**: Handle Anthropic's tool_use block completion properly
- **Streaming**: Process Anthropic's streaming event sequence correctly

## Out of Scope

- Changes to message parsing logic (use existing)
- Agent loop integration (handled separately)
- Cross-provider compatibility concerns
