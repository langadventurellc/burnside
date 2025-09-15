---
id: T-implement-termination
title: Implement termination detection for streaming responses
status: done
priority: medium
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-implement-sse-streaming
  - T-implement-response-parser-for
affectedFiles:
  src/providers/openai-responses-v1/index.ts: Implemented isTerminal method with
    proper type discrimination between StreamDelta and UnifiedResponse, checking
    finished flag and response.completed event type
  src/providers/openai-responses-v1/__tests__/termination.test.ts:
    Created comprehensive unit tests covering terminal and non-terminal
    StreamDeltas, UnifiedResponse handling, and edge cases with 17 test
    scenarios
  src/providers/openai-responses-v1/__tests__/index.test.ts: Updated placeholder
    test to verify actual isTerminal functionality instead of expecting
    NOT_IMPLEMENTED error
log:
  - Successfully implemented termination detection for streaming responses in
    the OpenAI Responses v1 provider. The isTerminal() method now correctly
    detects when streaming responses have completed by checking the finished
    flag as primary indicator and response.completed event type as secondary
    indicator. Added comprehensive unit tests covering all termination scenarios
    including edge cases. All quality checks pass and existing tests remain
    compatible.
schema: v1.0
childrenIds: []
created: 2025-09-15T19:40:07.856Z
updated: 2025-09-15T19:40:07.856Z
---

# Implement Termination Detection for Streaming Responses

Implement the `isTerminal()` method that detects when OpenAI streaming responses have completed or terminated.

## Context

This task implements the termination detection logic for the OpenAI Responses v1 provider plugin. The `isTerminal()` method is crucial for determining when streaming responses have finished, enabling proper cleanup and final processing.

Based on OpenAI Responses API documentation, termination is indicated by specific semantic events rather than simple markers.

## Implementation Requirements

### File to Modify

- Update `src/providers/openai-responses-v1/index.ts` - Implement isTerminal method

### 1. Termination Detection Logic

**Method Implementation:**

```typescript
isTerminal(deltaOrResponse: StreamDelta | UnifiedResponse): boolean
```

**Termination Conditions:**

- **StreamDelta with `finished: true`** → Terminal
- **StreamDelta with event type `"response.completed"`** → Terminal
- **StreamDelta with event type `"error"`** → Terminal (error termination)
- **Non-streaming response** → Always terminal
- **All other cases** → Not terminal

**Event-Based Detection:**

- Check StreamDelta metadata for OpenAI event types
- `response.completed` event indicates successful termination
- `error` event indicates error termination
- Use `finished` flag as primary indicator

### 2. Implementation Details

**Type Guard Logic:**

```typescript
isTerminal(deltaOrResponse: StreamDelta | UnifiedResponse): boolean {
  // Check if it's a non-streaming response (always terminal)
  if ('message' in deltaOrResponse) {
    return true;
  }

  // Check StreamDelta for termination indicators
  const delta = deltaOrResponse as StreamDelta;

  // Primary indicator: finished flag
  if (delta.finished) {
    return true;
  }

  // Secondary indicator: OpenAI event types
  const eventType = delta.metadata?.eventType;
  if (eventType === 'response.completed' || eventType === 'error') {
    return true;
  }

  return false;
}
```

**Edge Case Handling:**

- Handle malformed or missing metadata gracefully
- Default to `finished` flag when event type is unavailable
- Never return true for partial content deltas
- Ensure consistent behavior across different response types

### 3. Integration with Streaming Parser

**Consistency with StreamDelta Creation:**

- Ensure streaming parser sets `finished: true` for terminal events
- Maintain consistency between event type metadata and finished flag
- Handle cases where both indicators might conflict

**Error Termination:**

- Detect error events as terminal conditions
- Allow error handling upstream while marking as terminal
- Preserve error information in metadata

## Technical Approach

1. **Type Safety**: Use proper type guards to distinguish response types
2. **Multi-layered Detection**: Check both `finished` flag and event metadata
3. **Graceful Degradation**: Handle missing or malformed metadata
4. **Consistency**: Align with streaming parser implementation
5. **Performance**: Keep detection logic lightweight and fast

## Acceptance Criteria

### Functional Requirements

- [ ] Correctly identifies terminal StreamDeltas (finished: true)
- [ ] Recognizes completion events (response.completed) as terminal
- [ ] Recognizes error events as terminal conditions
- [ ] Always returns true for non-streaming responses
- [ ] Returns false for partial content deltas

### Event Detection Requirements

- [ ] Handles `response.completed` event type correctly
- [ ] Handles `error` event type as termination
- [ ] Ignores non-terminal event types (response.created, response.output_text.delta)
- [ ] Works when event type metadata is missing

### Edge Case Handling Requirements

- [ ] Graceful handling of malformed StreamDelta objects
- [ ] Proper behavior when metadata is missing or null
- [ ] Consistent results for same input across multiple calls
- [ ] No false positives on partial content

### Integration Requirements

- [ ] Consistent with streaming parser StreamDelta creation
- [ ] Compatible with both successful and error termination scenarios
- [ ] Works correctly with unified response format
- [ ] Maintains backward compatibility with existing patterns

### Testing Requirements (Include in this task)

- [ ] Unit tests for terminal StreamDeltas (finished: true)
- [ ] Unit tests for completion event detection
- [ ] Unit tests for error event detection
- [ ] Unit tests for non-terminal deltas (text content, partial responses)
- [ ] Unit tests for non-streaming responses
- [ ] Unit tests for edge cases (missing metadata, malformed objects)
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/termination.test.ts`

## Dependencies

- Task: "Implement SSE streaming parser for OpenAI semantic events"
- Task: "Implement response parser for non-streaming OpenAI responses"
- StreamDelta type definition
- Event metadata structure from streaming parser

## Out of Scope

- Cleanup or resource management after termination (handled by higher-level code)
- Error handling for terminated streams (handled by error normalizer)
- Retry logic for failed streams (handled by transport layer)
- Performance optimization for termination detection
