---
id: T-extend-providerplugin
title: Extend ProviderPlugin interface with contract methods
status: open
priority: high
parent: F-provider-plugin-framework
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T17:02:47.460Z
updated: 2025-09-15T17:02:47.460Z
---

# Extend ProviderPlugin Interface with Contract Methods

## Context

The current `ProviderPlugin` interface in `src/core/providers/providerPlugin.ts` is a minimal placeholder. This task extends it with the core contract methods required for Phase 3 of the implementation plan, enabling future provider implementations in vertical slices (OpenAI, Anthropic, Google, xAI).

**Related Feature**: F-provider-plugin-framework - Provider Plugin Framework

## Specific Implementation Requirements

### 1. Add Core Contract Methods

Extend the existing `ProviderPlugin` interface with these required methods:

```typescript
export interface ProviderPlugin {
  // ... existing properties (id, name, version, initialize, supportsModel, metadata)

  /** Convert unified request format to provider-specific HTTP request */
  translateRequest(request: UnifiedRequest): ProviderHttpRequest;

  /** Parse provider HTTP response back to unified format */
  parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
  ): UnifiedResponse | AsyncIterable<UnifiedDelta>;

  /** Detect if streaming response has reached termination */
  isTerminal(deltaOrResponse: UnifiedDelta | UnifiedResponse): boolean;

  /** Normalize provider-specific errors to unified error types */
  normalizeError(error: unknown): BridgeError;

  /** Provider capability descriptors */
  capabilities: ProviderCapabilities;
}
```

### 2. Define Supporting Types

Create the necessary supporting interfaces and types:

```typescript
// Request/Response types for provider communication
export interface UnifiedRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  // ... other unified parameters
}

export interface ProviderHttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export interface ProviderHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string | ReadableStream;
}

export interface UnifiedResponse {
  choices: Choice[];
  usage?: TokenUsage;
  model: string;
}

export interface UnifiedDelta {
  choices: ChoiceDelta[];
  usage?: TokenUsage;
  model: string;
}

export interface ProviderCapabilities {
  streaming: boolean;
  toolCalls: boolean;
  images: boolean;
  documents: boolean;
  maxContextLength: number;
}
```

### 3. Implementation Approach

- **Extend, don't replace**: Build on the existing interface structure
- **Type safety**: Use strict TypeScript types, avoid `any`
- **Documentation**: Add comprehensive JSDoc comments for each method
- **Backward compatibility**: Ensure existing placeholder methods remain functional
- **Import patterns**: Follow existing import patterns in the codebase

## Detailed Acceptance Criteria

### Interface Extension

- ✅ All four contract methods (`translateRequest`, `parseResponse`, `isTerminal`, `normalizeError`) are added to `ProviderPlugin` interface
- ✅ `capabilities` property added with `ProviderCapabilities` type
- ✅ Method signatures match specification exactly (parameters and return types)
- ✅ All methods include comprehensive JSDoc documentation
- ✅ Existing properties and methods remain unchanged

### Type Definitions

- ✅ `UnifiedRequest` interface covers common LLM parameters (model, messages, stream, tokens, temperature)
- ✅ `ProviderHttpRequest` interface includes url, method, headers, body for HTTP communication
- ✅ `ProviderHttpResponse` interface handles both string and streaming responses
- ✅ `UnifiedResponse` and `UnifiedDelta` interfaces provide consistent response format
- ✅ `ProviderCapabilities` interface describes provider feature support
- ✅ All types use strict TypeScript typing (no `any` types)

### Code Quality

- ✅ Interface follows existing code patterns and conventions
- ✅ Import statements follow established patterns in codebase
- ✅ JSDoc examples provided for complex methods
- ✅ Type exports properly declared for external use
- ✅ No breaking changes to existing interface structure

### Testing Requirements

- ✅ Unit tests verify interface contract compliance
- ✅ Type checking tests ensure proper TypeScript compilation
- ✅ Documentation tests validate JSDoc examples
- ✅ Interface can be implemented by mock provider (compilation test)

## Technical Approach

### File Modifications

- **File**: `src/core/providers/providerPlugin.ts`
- **Changes**: Extend existing interface, add supporting types
- **Imports**: Add necessary type imports from unified message/response types
- **Exports**: Export all new interfaces and types

### Integration Points

- **Unified types**: Integrate with existing message and response types from `src/core/messages/`
- **Error types**: Use existing `BridgeError` from `src/core/errors/`
- **Model types**: Reference existing model-related types where applicable

### Documentation Standards

- Each method must include JSDoc with:
  - Purpose description
  - Parameter explanations
  - Return value description
  - Usage example
  - Throws documentation for error cases

## Dependencies

- **Prerequisite**: None (first task in feature)
- **Blocks**: All other Provider Plugin Framework tasks
- **Uses**: Existing error types, message schemas, response types

## Out of Scope

- Implementation of actual provider-specific logic (handled in vertical slice phases)
- Provider registration or validation (handled by other tasks)
- HTTP transport implementation (exists in transport layer)
- Model seeding or configuration (handled by other tasks in this feature)

## Security Considerations

- Input validation should be handled by implementing providers
- Error normalization must not leak sensitive provider details
- HTTP request/response types should support secure header handling
- Interface design enables proper sanitization of provider responses
