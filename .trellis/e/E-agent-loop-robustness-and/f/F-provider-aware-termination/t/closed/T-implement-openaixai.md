---
id: T-implement-openaixai
title: Implement OpenAI/xAI termination detection with finish_reason mapping
status: done
priority: high
parent: F-provider-aware-termination
prerequisites:
  - T-create-unified-termination
affectedFiles:
  src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:
    Enhanced provider with detectTermination() method implementing comprehensive
    finish_reason mapping (stop→natural_completion, length→token_limit_reached,
    content_filter→content_filtered,
    function_call/tool_calls→natural_completion, unknown values→unknown). Added
    createOpenAITerminationSignal() helper method for standardized termination
    signal creation. Updated isTerminal() method to delegate to
    detectTermination() while maintaining backward compatibility. Added
    necessary imports for UnifiedTerminationSignal and createTerminationSignal
    types.
  src/providers/openai-responses-v1/__tests__/terminationDetection.test.ts:
    Created comprehensive test suite with 23 test cases covering
    detectTermination() method functionality including all OpenAI finish_reason
    values, streaming/non-streaming response handling, edge cases with malformed
    data, metadata preservation, isTerminal() integration with conversation
    context support, and error handling scenarios. Tests verify proper
    termination reason mapping, confidence level assignment, and
    provider-specific metadata handling.
log:
  - Successfully implemented OpenAI/xAI termination detection with comprehensive
    finish_reason mapping to unified termination signals. Added
    detectTermination() method that maps all OpenAI finish_reason values (stop,
    length, content_filter, function_call, tool_calls) to appropriate
    TerminationReason enum values with high confidence levels. Updated
    isTerminal() method to delegate to detectTermination() for backward
    compatibility. Created comprehensive test suite with 23 test cases covering
    all finish_reason scenarios, streaming/non-streaming responses, edge cases,
    and error handling. All tests pass and code meets quality standards.
schema: v1.0
childrenIds: []
created: 2025-09-18T19:40:11.415Z
updated: 2025-09-18T19:40:11.415Z
---

# Implement OpenAI/xAI Termination Detection

## Context

Enhance the existing OpenAI provider to implement the new `detectTermination()` method while maintaining backward compatibility. OpenAI and xAI use the same API format with `finish_reason` field in responses.

## Implementation Requirements

### 1. Add detectTermination Method

Update `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`:

```typescript
detectTermination(
  deltaOrResponse: StreamDelta | UnifiedResponse,
  isStreaming: boolean
): UnifiedTerminationSignal {
  // Implementation here
}
```

### 2. OpenAI finish_reason Mapping

Based on research, implement precise mapping:

```typescript
const openAITerminationMap = {
  stop: { reason: TerminationReason.NATURAL_COMPLETION, confidence: "high" },
  length: { reason: TerminationReason.TOKEN_LIMIT_REACHED, confidence: "high" },
  content_filter: {
    reason: TerminationReason.CONTENT_FILTERED,
    confidence: "high",
  },
  function_call: {
    reason: TerminationReason.NATURAL_COMPLETION,
    confidence: "high",
  },
  tool_calls: {
    reason: TerminationReason.NATURAL_COMPLETION,
    confidence: "high",
  },
  null: { reason: TerminationReason.UNKNOWN, confidence: "low" },
  undefined: { reason: TerminationReason.UNKNOWN, confidence: "low" },
};
```

### 3. Streaming vs Non-streaming Handling

- **Non-streaming**: Extract `finish_reason` from response metadata
- **Streaming**: Check final delta for completion indicators and extract `finish_reason`
- **Partial streams**: Handle gracefully with appropriate confidence levels

### 4. Update isTerminal Method

Modify existing `isTerminal()` to delegate to `detectTermination()`:

```typescript
isTerminal(deltaOrResponse, conversationContext?): boolean {
  return this.detectTermination(deltaOrResponse, this.isStreaming(deltaOrResponse)).shouldTerminate;
}
```

## Detailed Acceptance Criteria

✅ **finish_reason Mapping**

- All OpenAI finish_reason values correctly mapped to TerminationReason
- High confidence assigned to well-defined reasons (stop, length, content_filter)
- Low confidence for null/undefined finish_reason

✅ **Streaming Support**

- Correctly detects termination in streaming responses
- Handles partial streams and incomplete data gracefully
- Preserves original OpenAI metadata in providerSpecific field

✅ **Non-streaming Support**

- Immediate termination detection from complete responses
- Proper extraction of finish_reason from response metadata
- Consistent behavior with streaming mode

✅ **Backward Compatibility**

- Existing `isTerminal()` method behavior unchanged
- All existing tests continue to pass
- No breaking changes to method signatures

✅ **Provider Metadata Preservation**

- Original `finish_reason` value stored in `providerSpecific.originalValue`
- Field name "finish_reason" stored in `providerSpecific.originalField`
- Additional OpenAI metadata preserved in `providerSpecific.metadata`

## Implementation Approach

1. **Add termination mapping**: Create const mapping object for finish_reason values
2. **Implement detectTermination**: Add method to provider class with full logic
3. **Update isTerminal**: Modify to delegate to new method
4. **Handle edge cases**: Null values, malformed responses, missing metadata
5. **Preserve metadata**: Store original OpenAI response data for debugging

## Testing Requirements

Create comprehensive tests in `src/providers/openai-responses-v1/__tests__/`:

- All finish_reason values mapped correctly
- Streaming vs non-streaming response handling
- Edge cases (null, undefined, malformed responses)
- Backward compatibility with existing isTerminal tests
- Provider metadata preservation
- Confidence level assignment accuracy

## Integration Notes

- **xAI Provider**: Since xAI uses OpenAI-compatible API, this implementation will work for both
- **Response Types**: Handle both ChatCompletion and ChatCompletionChunk formats
- **Error Handling**: Graceful fallback when finish_reason is missing or invalid

## Files to Modify

- `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` (enhance)
- `src/providers/openai-responses-v1/__tests__/terminationDetection.test.ts` (new)
- Update existing termination tests to verify new functionality

## Out of Scope

- Changes to xAI provider (will inherit OpenAI implementation)
- Agent loop integration (handled separately)
- Provider registration changes
