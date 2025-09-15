---
id: T-create-bridgeclient-class
title: Create BridgeClient class with method signatures and feature flags
status: open
priority: high
parent: F-phase-1-core-domain-and
prerequisites:
  - T-define-message-zod-schema
  - T-define-contentpart-union
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T05:36:47.664Z
updated: 2025-09-15T05:36:47.664Z
---

## Context

This task implements the core BridgeClient class that provides the primary public API for the LLM Bridge Library. The class will include method signatures for chat and streaming operations with no-op implementations behind feature flags, as specified in Phase 1 requirements.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - Public API Surface (lines 198-209)
- Implementation Plan: `/docs/implementation-plan.md` - Phase 1 requirements (lines 25-34)

## Specific Implementation Requirements

### 1. Create BridgeClient Module Structure

- Create `src/client/` directory for client implementation
- Create `src/client/bridgeClient.ts` for the main client class
- Create `src/client/types.ts` for client-specific type definitions
- Create `src/client/featureFlags.ts` for feature flag management
- Create `src/client/index.ts` for module exports

### 2. BridgeClient Class Implementation

- **Constructor**: Accept validated BridgeConfig, initialize with feature flags
- **chat() Method**: Accept ChatRequest, return Promise<Message> (no-op with feature flag)
- **stream() Method**: Accept StreamRequest, return AsyncIterable<StreamDelta> (no-op with feature flag)
- **Configuration Management**: Access to current configuration and provider settings
- **Error Handling**: Proper error types when feature flags disabled

### 3. Feature Flag System

- Create internal feature flag mechanism for progressive enablement
- Flags for: `CHAT_ENABLED`, `STREAMING_ENABLED`, `TOOLS_ENABLED`
- Default all flags to `false` for Phase 1 (no-op implementations)
- Clear error messages when features are disabled
- Easy configuration override for testing and development

### 4. Type Definitions

- **ChatRequest**: Messages array, model selection, options
- **StreamRequest**: Same as ChatRequest with streaming-specific options
- **StreamDelta**: Incremental response structure for streaming
- **BridgeClientConfig**: Internal configuration after validation

## Technical Approach

### File Structure

```
src/client/
├── bridgeClient.ts       # Main BridgeClient class
├── types.ts              # Client-specific types
├── featureFlags.ts       # Feature flag management
├── __tests__/           # Unit tests
│   ├── bridgeClient.test.ts
│   ├── featureFlags.test.ts
│   └── types.test.ts
└── index.ts             # Module exports
```

### Implementation Steps

1. Create client module directory structure
2. Define client-specific types (ChatRequest, StreamRequest, StreamDelta)
3. Implement feature flag system with clear defaults
4. Create BridgeClient class with constructor and configuration
5. Implement chat() method with feature flag check and no-op
6. Implement stream() method with feature flag check and no-op
7. Add comprehensive unit tests for all methods and feature flags
8. Add JSDoc documentation with usage examples

### Class Structure

```typescript
export class BridgeClient {
  private config: BridgeClientConfig;
  private featureFlags: FeatureFlags;

  constructor(config: BridgeConfig) {
    this.config = this.validateAndTransformConfig(config);
    this.featureFlags = this.initializeFeatureFlags();
  }

  async chat(request: ChatRequest): Promise<Message> {
    if (!this.featureFlags.CHAT_ENABLED) {
      throw new BridgeError(
        "Chat functionality not yet implemented",
        "FEATURE_DISABLED",
      );
    }
    // No-op implementation for Phase 1
    throw new BridgeError(
      "Chat implementation coming in Phase 2",
      "NOT_IMPLEMENTED",
    );
  }

  async *stream(request: StreamRequest): AsyncIterable<StreamDelta> {
    if (!this.featureFlags.STREAMING_ENABLED) {
      throw new BridgeError(
        "Streaming functionality not yet implemented",
        "FEATURE_DISABLED",
      );
    }
    // No-op implementation for Phase 1
    throw new BridgeError(
      "Streaming implementation coming in Phase 2",
      "NOT_IMPLEMENTED",
    );
  }
}
```

## Detailed Acceptance Criteria

### Class Construction

- ✅ BridgeClient constructor accepts BridgeConfig and validates it
- ✅ Constructor initializes feature flags with proper defaults
- ✅ Invalid configuration throws clear validation errors
- ✅ Configuration transformation works correctly

### Method Signatures

- ✅ chat() method accepts ChatRequest and returns Promise<Message>
- ✅ stream() method accepts StreamRequest and returns AsyncIterable<StreamDelta>
- ✅ Both methods throw appropriate errors when feature flags disabled
- ✅ Method signatures match TypeScript interface definitions

### Feature Flag Behavior

- ✅ All feature flags default to disabled (false) in Phase 1
- ✅ Feature flag checks happen before any processing
- ✅ Clear error messages when features are disabled
- ✅ Feature flags can be overridden for testing purposes

### Error Handling

- ✅ Configuration validation errors use existing error taxonomy
- ✅ Feature disabled errors are clear and helpful
- ✅ Not implemented errors distinguish from disabled features
- ✅ All errors include proper context and error codes

### Type Safety

- ✅ Full TypeScript compilation without errors
- ✅ Proper type inference for all method parameters and returns
- ✅ Generic constraints work correctly
- ✅ Interface compatibility with expected public API

## Dependencies

**Prerequisites:**

- `T-define-message-zod-schema` - Need Message validation
- `T-define-contentpart-union` - Need ContentPart for messages
- Existing BridgeConfig interface and error types

**Blocks:**

- `T-implement-createclient-factory` - Factory function needs this class
- Future Phase 2 implementation tasks

## Security Considerations

### Configuration Security

- Safe handling of API keys and sensitive configuration
- No logging or exposure of sensitive configuration data
- Proper validation of configuration without leaking values

### Error Information

- Error messages don't expose sensitive system information
- Feature flag states logged appropriately without data leakage
- Validation errors provide helpful info without security risks

## Testing Requirements

### Unit Tests (Include in this task)

- **Constructor Tests**: Valid/invalid configuration, feature flag initialization
- **Chat Method Tests**: Feature flag behavior, error handling, method signature
- **Stream Method Tests**: Feature flag behavior, error handling, method signature
- **Configuration Tests**: Config validation, transformation, access methods
- **Feature Flag Tests**: Default states, override behavior, error messages
- **Type Tests**: TypeScript compilation, type inference, interface compatibility

### Test Files

```
src/client/__tests__/
├── bridgeClient.test.ts     # Main class tests
├── featureFlags.test.ts     # Feature flag system tests
└── types.test.ts            # Type definition tests
```

### Example Test Cases

```typescript
describe("BridgeClient", () => {
  describe("constructor", () => {
    it("accepts valid configuration", () => {
      const validConfig = {
        /* valid BridgeConfig */
      };
      expect(() => new BridgeClient(validConfig)).not.toThrow();
    });

    it("rejects invalid configuration", () => {
      const invalidConfig = {
        /* invalid config */
      };
      expect(() => new BridgeClient(invalidConfig)).toThrow();
    });
  });

  describe("chat method", () => {
    it("throws feature disabled error by default", async () => {
      const client = new BridgeClient(validConfig);
      const request = { messages: [], model: "test-model" };
      await expect(client.chat(request)).rejects.toThrow("FEATURE_DISABLED");
    });
  });
});
```

## Out of Scope

- Actual chat or streaming implementation (Phase 2)
- Provider integration (Phase 3+)
- Tool execution (Phase 5+)
- Advanced configuration options (future phases)
