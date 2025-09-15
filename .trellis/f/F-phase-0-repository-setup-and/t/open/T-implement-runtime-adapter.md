---
id: T-implement-runtime-adapter
title: Implement runtime adapter system with Node.js adapter
status: open
priority: high
parent: F-phase-0-repository-setup-and
prerequisites:
  - T-create-base-directory
  - T-create-transport-interfaces
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T04:02:49.701Z
updated: 2025-09-15T04:02:49.701Z
---

# Implement Runtime Adapter System with Node.js Adapter

Create the platform abstraction layer with runtime adapters for HTTP, timers, and file access, including a default Node.js implementation as specified in Phase 0 requirements.

## Context

This task implements the runtime adapter system that abstracts platform differences across Node.js, Electron, and React Native environments. For Phase 0, we focus on the adapter interfaces and Node.js implementation, with extension points for other platforms in Phase 11.

Reference: Feature F-phase-0-repository-setup-and - Phase 0: Repository Setup and Scaffolding
Depends on: T-create-base-directory, T-create-transport-interfaces

## Specific Implementation Requirements

Create runtime adapter system in `src/core/runtime/`:

### 1. Runtime Adapter Interface (`src/core/runtime/interface.ts`)

- `RuntimeAdapter` interface defining platform abstraction contracts
- HTTP client abstraction (fetch function injection)
- Timer operations (setTimeout, setInterval, clearTimeout, clearInterval)
- Basic file access operations interface (read, write, exists)
- Platform identification and capability detection

### 2. Node.js Adapter Implementation (`src/core/runtime/adapters/node.ts`)

- `NodeRuntimeAdapter` class implementing RuntimeAdapter interface
- Node.js fetch integration (using global fetch or node-fetch compatibility)
- Node.js timer operations using built-in timers
- Node.js file system operations using fs/promises
- Platform capability detection for Node.js environment

### 3. Adapter Registry (`src/core/runtime/registry.ts`)

- `AdapterRegistry` for managing and selecting runtime adapters
- Automatic adapter detection and selection logic
- Manual adapter injection and override capabilities
- Default adapter fallback patterns

### 4. Platform Detection (`src/core/runtime/detection.ts`)

- Platform detection utilities (Node.js, browser, Electron, React Native)
- Environment capability checking
- Runtime feature detection helpers

## Technical Approach

1. **Interface-First Design**: Define RuntimeAdapter interface before implementations
2. **Platform Abstraction**: Hide platform specifics behind consistent interfaces
3. **Dependency Injection**: Support manual adapter injection for testing
4. **Feature Detection**: Detect platform capabilities at runtime
5. **Graceful Fallbacks**: Handle missing platform features appropriately

## Detailed Acceptance Criteria

### Functional Requirements

- [ ] RuntimeAdapter interface defines all platform abstraction contracts
- [ ] NodeRuntimeAdapter implements all interface methods correctly
- [ ] HTTP operations work with both global fetch and Node.js fetch
- [ ] Timer operations work correctly across all Node.js versions
- [ ] File access operations support basic read/write/exists operations
- [ ] Adapter registry correctly selects and manages runtime adapters
- [ ] Platform detection accurately identifies Node.js environment

### Code Quality Requirements

- [ ] All adapter code compiles without TypeScript errors
- [ ] No `any` types used in adapter implementations
- [ ] Proper error handling for platform-specific operations
- [ ] Consistent interface implementations across all methods
- [ ] Clean separation between adapter interface and implementations

### Testing Requirements (included in this task)

- [ ] Unit tests for RuntimeAdapter interface compliance
- [ ] Node.js adapter implementation tests with mocked dependencies
- [ ] Adapter registry selection and injection tests
- [ ] Platform detection tests for Node.js environment
- [ ] Feature detection and fallback tests

### Integration Requirements

- [ ] All adapter components exported from src/core/runtime/index.ts
- [ ] Adapter system integrates with transport layer
- [ ] No circular dependencies between adapter modules
- [ ] Clean integration points for future platform adapters

### Performance Requirements

- [ ] Adapter selection completes in <10ms
- [ ] Platform detection is efficient and cached
- [ ] HTTP operations have minimal adapter overhead
- [ ] File operations perform comparably to native Node.js operations

## Security Considerations

- File access operations respect system permissions
- HTTP operations support secure header handling
- No hard-coded file paths or system configuration
- Adapter isolation prevents cross-platform data leakage

## Testing Requirements (included in this task)

Create comprehensive adapter tests in `src/core/runtime/`:

- `interface.test.ts` - Test RuntimeAdapter interface contracts
- `adapters/node.test.ts` - Test Node.js adapter implementation
- `registry.test.ts` - Test adapter registry functionality
- `detection.test.ts` - Test platform detection utilities

Test coverage should include:

- Interface contract compliance
- Node.js adapter functionality with mocked fs/timers/fetch
- Adapter registry selection logic
- Platform detection accuracy
- Error handling for missing platform features

## Out of Scope

- Electron adapter implementation (Phase 11)
- React Native adapter implementation (Phase 11)
- Complex file system operations beyond basic read/write
- Advanced HTTP client features (Phase 2+)
- Performance optimization and caching (Phase 10+)

## Dependencies

- Requires T-create-base-directory for module structure
- Requires T-create-transport-interfaces for HTTP integration
- Can be developed in parallel with T-define-core-type-interfaces and T-implement-basic-error

## Implementation Notes

1. Design RuntimeAdapter interface to support all target platforms
2. Use Node.js built-in modules (fs, timers) for the Node adapter
3. Handle both global fetch and Node.js fetch compatibility
4. Create clean extension points for Electron and React Native adapters
5. Implement platform detection that works reliably across environments
6. Keep adapter implementations focused and platform-specific

## Example Interface Structure

```typescript
// Example from src/core/runtime/interface.ts
export interface RuntimeAdapter {
  // Platform identification
  readonly platform: "node" | "browser" | "electron" | "react-native";

  // HTTP operations
  fetch(input: string | Request, init?: RequestInit): Promise<Response>;

  // Timer operations
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(timeoutId: unknown): void;

  // Basic file operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
}

// Example from src/core/runtime/adapters/node.ts
export class NodeRuntimeAdapter implements RuntimeAdapter {
  readonly platform = "node" as const;

  async fetch(input: string | Request, init?: RequestInit): Promise<Response> {
    // Use global fetch or provide Node.js compatibility
    return globalThis.fetch(input, init);
  }

  // Additional method implementations...
}
```
