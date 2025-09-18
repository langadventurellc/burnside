---
id: T-implement-google-gemini
title: Implement Google Gemini termination detection with finishReason mapping
status: done
priority: high
parent: F-provider-aware-termination
prerequisites:
  - T-create-unified-termination
affectedFiles:
  src/providers/google-gemini-v1/googleGeminiV1Provider.ts: Enhanced with
    detectTermination() method implementing comprehensive Gemini finishReason
    mapping (STOP→natural_completion, MAX_TOKENS→token_limit_reached,
    SAFETY/RECITATION→content_filtered, OTHER→unknown). Added
    createGeminiTerminationSignal() helper method. Updated isTerminal() to
    delegate to detectTermination() with conversation context support. Added
    necessary imports for UnifiedTerminationSignal and ConversationContext.
  src/providers/google-gemini-v1/__tests__/terminationDetection.test.ts:
    Created comprehensive test suite with 25 test cases covering
    detectTermination() method for all finishReason values,
    streaming/non-streaming scenarios, edge cases, metadata preservation, and
    isTerminal() integration. Tests verify proper termination reason mapping,
    confidence levels, and provider-specific metadata handling.
  src/providers/google-gemini-v1/__tests__/googleGeminiV1Provider.test.ts:
    Added detectTermination() integration tests including
    non-streaming/streaming response handling, conversation context support,
    delegation verification, and finishReason mapping consistency. Updated
    existing isTerminal() tests to match new implementation behavior with proper
    Gemini finishReason values (MAX_TOKENS instead of LENGTH, STOP as natural
    completion).
log:
  - Implemented Google Gemini termination detection with comprehensive
    finishReason mapping. Added detectTermination() method that maps all Gemini
    finishReason values (STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER,
    FINISH_REASON_UNSPECIFIED) to unified termination signals with appropriate
    confidence levels. Updated existing isTerminal() method to delegate to
    detectTermination() for backward compatibility. Created comprehensive test
    suite with 25 test cases covering all termination scenarios,
    streaming/non-streaming responses, edge cases, and metadata preservation.
    All tests passing and quality checks successful.
schema: v1.0
childrenIds: []
created: 2025-09-18T19:40:58.926Z
updated: 2025-09-18T19:40:58.926Z
---

# Implement Google Gemini Termination Detection

## Context

Enhance the existing Google Gemini provider to implement the new `detectTermination()` method. Gemini uses `finishReason` field with its own set of values.

## Implementation Requirements

### 1. Add detectTermination Method

Update `src/providers/google-gemini-v1/geminiProvider.ts`:

```typescript
detectTermination(
  deltaOrResponse: StreamDelta | UnifiedResponse,
  isStreaming: boolean
): UnifiedTerminationSignal {
  // Implementation here
}
```

### 2. Gemini finishReason Mapping

Based on research, implement precise mapping:

```typescript
const geminiTerminationMap = {
  STOP: { reason: TerminationReason.NATURAL_COMPLETION, confidence: "high" },
  MAX_TOKENS: {
    reason: TerminationReason.TOKEN_LIMIT_REACHED,
    confidence: "high",
  },
  SAFETY: { reason: TerminationReason.CONTENT_FILTERED, confidence: "high" },
  RECITATION: {
    reason: TerminationReason.CONTENT_FILTERED,
    confidence: "high",
  },
  OTHER: { reason: TerminationReason.UNKNOWN, confidence: "medium" },
  null: { reason: TerminationReason.UNKNOWN, confidence: "low" },
  undefined: { reason: TerminationReason.UNKNOWN, confidence: "low" },
};
```

### 3. Gemini-Specific Handling

- **Candidate Structure**: Handle Gemini's candidate-based response format
- **Function Calls**: Detect completion when function call responses are complete
- **Safety Filters**: Properly handle SAFETY and RECITATION termination reasons
- **Streaming Chunks**: Process Gemini's streaming chunk format

### 4. Update isTerminal Method

Modify existing `isTerminal()` to delegate to `detectTermination()`:

```typescript
isTerminal(deltaOrResponse, conversationContext?): boolean {
  return this.detectTermination(deltaOrResponse, this.isStreaming(deltaOrResponse)).shouldTerminate;
}
```

## Detailed Acceptance Criteria

✅ **finishReason Mapping**

- All Gemini finishReason values correctly mapped to TerminationReason
- High confidence for well-defined reasons (STOP, MAX_TOKENS, SAFETY)
- Proper handling of RECITATION (copyright) and OTHER scenarios

✅ **Streaming Support**

- Correctly processes Gemini streaming response chunks
- Handles partial candidates and incremental content updates
- Detects termination from final chunk with finishReason

✅ **Non-streaming Support**

- Immediate termination detection from complete GenerateContentResponse
- Proper extraction of finishReason from candidate metadata
- Consistent behavior with streaming mode

✅ **Gemini Response Structure**

- Handles candidates array properly (typically single candidate)
- Processes content parts within candidates correctly
- Preserves Gemini-specific metadata (usage metrics, safety ratings)

✅ **Provider Metadata Preservation**

- Original `finishReason` value stored in `providerSpecific.originalValue`
- Field name "finishReason" stored in `providerSpecific.originalField`
- Gemini-specific metadata (safety ratings, usage) preserved

## Implementation Approach

1. **Add termination mapping**: Create const mapping for Gemini finishReason values
2. **Implement detectTermination**: Handle both streaming chunks and complete responses
3. **Update isTerminal**: Delegate to new method for consistency
4. **Handle candidates**: Process Gemini's candidate array structure
5. **Extract metadata**: Preserve Gemini response data including safety ratings

## Testing Requirements

Create comprehensive tests in `src/providers/google-gemini-v1/__tests__/`:

- All finishReason values mapped correctly
- Streaming chunk processing with incremental updates
- Non-streaming GenerateContentResponse handling
- Candidate array processing (single and multiple candidates)
- Safety filter scenarios (SAFETY, RECITATION)
- Function calling completion detection
- Edge cases and malformed responses
- Provider metadata preservation

## Gemini-Specific Considerations

- **Candidate Array**: Responses contain candidates array, typically with one candidate
- **Safety Ratings**: Gemini provides detailed safety ratings that should be preserved
- **Function Calling**: Gemini's function calling format differs from OpenAI
- **Content Parts**: Content is structured as parts array within candidates
- **Usage Metrics**: Gemini provides detailed token usage information

## Files to Modify

- `src/providers/google-gemini-v1/geminiProvider.ts` (enhance)
- `src/providers/google-gemini-v1/__tests__/terminationDetection.test.ts` (new)
- Update existing tests to verify new functionality

## Integration Notes

- **Response Format**: Work with Gemini's GenerateContentResponse format
- **Safety Handling**: Preserve safety ratings and filter information
- **Token Counting**: Use Gemini's accurate token usage when available
- **Function Calls**: Handle Gemini's function calling completion properly

## Out of Scope

- Changes to existing response parsing logic
- Safety rating interpretation beyond termination detection
- Agent loop integration (handled separately)
