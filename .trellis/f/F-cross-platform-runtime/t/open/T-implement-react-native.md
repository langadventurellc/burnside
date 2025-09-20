---
id: T-implement-react-native
title: Implement React Native runtime adapter
status: open
priority: medium
parent: F-cross-platform-runtime
prerequisites:
  - T-improve-react-native-platform
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T04:33:01.356Z
updated: 2025-09-20T04:33:01.356Z
---

# Implement React Native Runtime Adapter

## Context

Create the `ReactNativeRuntimeAdapter` class following the `RuntimeAdapter` interface pattern. This adapter enables the LLM Bridge library to work in React Native environments using React Native-specific APIs and handles streaming via `react-native-sse`.

## Implementation Requirements

### Create ReactNativeRuntimeAdapter Class

- Implement all methods from `RuntimeAdapter` interface (`src/core/runtime/runtimeAdapter.ts`)
- Use React Native fetch implementation for HTTP operations
- Handle streaming using `react-native-sse` library
- Use React Native timer APIs with proper handle management
- Report correct platform capabilities

### Technical Approach

#### HTTP Operations

```typescript
async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
  // Use React Native's fetch implementation
  // Handle potential streaming with react-native-sse integration
  // Wrap in try-catch with RuntimeError for consistency
}
```

#### Timer Operations

```typescript
// Use React Native timer APIs
// Handle React Native-specific timer handle types
// Ensure proper cleanup to prevent memory leaks
```

#### File Operations

```typescript
// All file methods throw RuntimeError with message:
// "File operations not supported on this platform"
```

### Dependencies

- Add `react-native-sse` as peer dependency for streaming support
- Document streaming limitations vs Node implementation

### Files to Create

- `src/core/runtime/adapters/reactNativeRuntimeAdapter.ts` - Main adapter implementation
- `src/core/runtime/adapters/__tests__/reactNativeRuntimeAdapter.test.ts` - Unit tests

### Files to Modify

- `src/core/runtime/adapters/index.ts` - Export new adapter
- `package.json` - Add react-native-sse as peer dependency

## Detailed Implementation

### Platform Info Setup

```typescript
constructor() {
  this.platformInfo = {
    platform: "react-native",
    version: "react-native", // or get from RN constants
    capabilities: {
      platform: "react-native",
      hasHttp: true,
      hasTimers: true,
      hasFileSystem: false,
      features: {
        streaming: true, // via react-native-sse
        sse: true
      }
    }
  };
}
```

### Streaming Considerations

- Document that streaming uses `react-native-sse` library
- Handle cases where streaming might have different behavior than Node
- Provide clear error messages if streaming dependencies are missing

## Acceptance Criteria

- **Interface Compliance**: Implements complete `RuntimeAdapter` interface
- **HTTP Operations**: Successfully makes HTTP requests using React Native fetch
- **Streaming Support**: Works with react-native-sse for SSE parsing
- **Timer Operations**: setTimeout/setInterval work with React Native timer APIs
- **File Operations**: All file methods throw appropriate RuntimeError
- **Platform Detection**: Reports "react-native" platform correctly
- **Error Handling**: All operations wrapped with consistent RuntimeError patterns
- **Memory Management**: No timer handle leaks in React Native environment

## Testing Requirements

- **Unit Tests**: Mock React Native APIs and verify adapter behavior
- **HTTP Tests**: Mock React Native fetch and verify request handling
- **Timer Tests**: Verify React Native timer creation and cleanup
- **Error Tests**: Verify file operations throw correct errors
- **Platform Tests**: Verify platform info is correctly populated
- **Streaming Tests**: Mock react-native-sse and verify integration

## Out of Scope

- Integration with adapter registry (handled by separate task)
- Platform detection logic (handled by separate task)
- Complex streaming optimization (basic SSE support only)
