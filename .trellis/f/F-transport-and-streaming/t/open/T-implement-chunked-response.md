---
id: T-implement-chunked-response
title: Implement Chunked Response Parser
status: open
priority: high
parent: F-transport-and-streaming
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T08:19:51.124Z
updated: 2025-09-15T08:19:51.124Z
---

# Implement Chunked Response Parser

## Context

This task implements chunked response parsing for handling streaming JSON responses that may be split across multiple chunks. This is essential for providers that don't use SSE format but send streaming JSON data using chunked transfer encoding.

**Reference**: Feature F-transport-and-streaming
**File**: `src/core/streaming/chunkParser.ts`  
**Test File**: `src/core/streaming/__tests__/chunkParser.test.ts`

## Implementation Requirements

Create a robust parser that handles JSON objects split across HTTP chunk boundaries:

### Core Functionality

1. **JSON Boundary Detection**: Identify complete JSON objects from partial chunks
2. **Buffer Management**: Accumulate incomplete JSON across chunks
3. **Multiple Object Handling**: Parse streams containing multiple JSON objects
4. **Error Recovery**: Handle malformed JSON gracefully
5. **Async Iteration**: Provide async iterable interface for parsed objects

### Technical Approach

1. Create a `ChunkParser` class that processes `Uint8Array` chunks
2. Implement streaming JSON parsing with boundary detection
3. Use buffer accumulation for incomplete JSON objects
4. Provide configurable parsing strategies for different providers
5. Handle UTF-8 encoding correctly

### API Design

```typescript
interface ParsedChunk {
  data: unknown; // parsed JSON object
  raw: string; // original raw data
}

class ChunkParser {
  static parseJson(
    chunks: AsyncIterable<Uint8Array>,
  ): AsyncIterable<ParsedChunk>;
  static parseJsonLines(
    chunks: AsyncIterable<Uint8Array>,
  ): AsyncIterable<ParsedChunk>;
}
```

## Detailed Acceptance Criteria

### JSON Parsing

- ✅ Parses complete JSON objects from chunk stream
- ✅ Handles JSON objects split across multiple chunks
- ✅ Supports nested JSON objects and arrays
- ✅ Parses multiple JSON objects in sequence
- ✅ Handles JSON with whitespace and formatting

### Buffer Management

- ✅ Accumulates partial JSON across chunk boundaries
- ✅ Memory-efficient buffering (releases completed objects)
- ✅ Handles very large JSON objects without memory exhaustion
- ✅ Proper UTF-8 handling across chunk boundaries

### Format Support

- ✅ Standard JSON object parsing (`{...}`)
- ✅ JSON Lines format parsing (one JSON per line)
- ✅ Configurable parsing modes
- ✅ Provider-specific delimiter handling

### Error Handling

- ✅ Gracefully handles malformed JSON
- ✅ Continues parsing after JSON errors
- ✅ Reports parsing errors with context
- ✅ Handles empty chunks and incomplete data

### Streaming Performance

- ✅ Processes chunks with <50ms latency
- ✅ Minimal memory footprint for buffering
- ✅ Efficient JSON parsing using streaming approach
- ✅ Proper resource cleanup on completion

## Testing Requirements (Include in Same Task)

Create comprehensive unit tests in `src/core/streaming/__tests__/chunkParser.test.ts`:

### Basic JSON Parsing

- Single JSON object in one chunk
- JSON object split across chunks
- Multiple JSON objects in sequence
- Empty JSON objects
- JSON with various data types

### Buffer Management Tests

- Large JSON objects across many chunks
- Partial UTF-8 characters at boundaries
- Mixed chunk sizes
- Memory cleanup verification

### Format Variations

- JSON Lines format
- Formatted JSON with whitespace
- Minified JSON
- JSON with escaped characters

### Error Scenarios

- Malformed JSON syntax
- Incomplete JSON at stream end
- Invalid UTF-8 sequences
- Extremely large objects

### Real-world Scenarios

- Provider-specific chunk patterns
- Network-realistic chunk sizes (512b, 1KB, 4KB)
- Rapid sequential chunks
- Slow trickling data

## Security Considerations

- Prevent JSON bomb attacks (deeply nested objects)
- Limit maximum object size to prevent memory exhaustion
- Validate JSON structure before parsing
- Handle malicious input gracefully

## Dependencies

- Native JSON parsing capabilities
- Jest testing framework
- Standard library text encoding/decoding
- Existing streaming interfaces

## Out of Scope

- Provider-specific JSON schema validation (handled by providers)
- Advanced JSON streaming libraries (use native parsing)
- Complex buffering strategies beyond basic accumulation
- Performance optimization beyond basic requirements
