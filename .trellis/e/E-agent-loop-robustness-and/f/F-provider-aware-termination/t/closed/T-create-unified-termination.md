---
id: T-create-unified-termination
title: Create unified termination model and enhanced ProviderPlugin interface
status: done
priority: high
parent: F-provider-aware-termination
prerequisites: []
affectedFiles:
  src/core/agent/enhancedTerminationReason.ts: Created enhanced termination
    reasons extending base TerminationReason with provider-specific cases
  src/core/agent/terminationConfidence.ts: Created confidence level enum for termination signal reliability
  src/core/agent/unifiedTerminationSignal.ts: Created main
    UnifiedTerminationSignal interface for normalized completion detection
  src/core/agent/isUnifiedTerminationSignal.ts: Created type guard function for UnifiedTerminationSignal validation
  src/core/agent/createTerminationSignal.ts: Created utility function to build
    UnifiedTerminationSignal from minimal information
  src/core/agent/calculateTerminationConfidence.ts: Created helper function to
    extract confidence levels from termination indicators
  src/core/providers/providerPlugin.ts: Enhanced interface with optional
    detectTermination() method and comprehensive JSDoc documentation
  src/core/providers/defaultTerminationDetection.ts:
    Created intelligent fallback
    implementation that analyzes provider responses and overrides decisions for
    high-confidence metadata signals
  src/core/providers/index.ts:
    Added exports for defaultDetectTermination function
    and UnifiedTerminationSignal type
  src/core/agent/index.ts: Added exports for all new termination types and utility functions
  src/core/agent/__tests__/unifiedTerminationSignal.test.ts: Created comprehensive unit tests for unified termination model utilities
  src/core/providers/__tests__/defaultTerminationDetection.test.ts:
    Created extensive unit tests for default termination detection with 23 test
    cases covering all scenarios
log:
  - Successfully implemented unified termination model and enhanced
    ProviderPlugin interface with intelligent fallback detection. Created
    modular type system with 9 new files following project conventions, enhanced
    ProviderPlugin interface with optional detectTermination() method, and built
    smart default implementation that overrides provider decisions when
    high-confidence metadata signals are detected. All 23 unit tests pass,
    demonstrating robust backward compatibility and enhanced termination
    detection capabilities.
schema: v1.0
childrenIds: []
created: 2025-09-18T19:39:44.980Z
updated: 2025-09-18T19:39:44.980Z
---

# Create Unified Termination Model and Enhanced ProviderPlugin Interface

## Context

Enhance the existing ProviderPlugin interface to support provider-aware termination detection while maintaining backward compatibility. The current `isTerminal()` method only returns a boolean, but multi-turn loops need termination reasons and confidence levels.

## Implementation Requirements

### 1. Create Unified Termination Model

Create `src/core/agent/unifiedTerminationModel.ts` with:

```typescript
export interface UnifiedTerminationSignal {
  shouldTerminate: boolean;
  reason: TerminationReason;
  confidence: "high" | "medium" | "low";
  providerSpecific: {
    originalField: string;
    originalValue: string;
    metadata?: Record<string, unknown>;
  };
  message?: string;
}

export enum TerminationReason {
  NATURAL_COMPLETION = "natural_completion",
  TOKEN_LIMIT_REACHED = "token_limit_reached",
  CONTENT_FILTERED = "content_filtered",
  STOP_SEQUENCE = "stop_sequence",
  ERROR_TERMINATION = "error_termination",
  UNKNOWN = "unknown",
}
```

### 2. Enhance ProviderPlugin Interface

Update `src/core/providers/providerPlugin.ts`:

- Keep existing `isTerminal()` method for backward compatibility
- Add new optional `detectTermination()` method that returns `UnifiedTerminationSignal`
- Add comprehensive JSDoc explaining the relationship between both methods
- Providers that implement `detectTermination()` should have `isTerminal()` delegate to it

### 3. Default Implementation Helper

Create `src/core/providers/defaultTerminationDetection.ts`:

- Fallback logic for providers that don't implement `detectTermination()`
- Converts simple boolean `isTerminal()` results to `UnifiedTerminationSignal`
- Maps to `UNKNOWN` reason with `low` confidence for backward compatibility

## Detailed Acceptance Criteria

✅ **Unified Model Creation**

- `UnifiedTerminationSignal` interface provides all required fields
- `TerminationReason` enum covers all provider termination scenarios
- TypeScript types are properly exported and documented

✅ **Provider Interface Enhancement**

- `detectTermination()` method is optional for backward compatibility
- Method signature matches feature specification exactly
- JSDoc provides clear usage examples for both streaming and non-streaming

✅ **Backward Compatibility**

- Existing `isTerminal()` method unchanged
- All existing provider implementations continue to work
- No breaking changes to public APIs

✅ **Default Implementation**

- Helper function converts boolean to `UnifiedTerminationSignal`
- Proper confidence levels assigned based on available information
- Provider-specific metadata preserved when available

## Implementation Approach

1. **Start with types**: Define interfaces and enums first
2. **Enhance interface**: Add optional method to ProviderPlugin
3. **Create helper**: Build default implementation for backward compatibility
4. **Update exports**: Add to `src/core/agent/index.ts` and `src/core/providers/index.ts`

## Testing Requirements

Include comprehensive unit tests covering:

- Interface type safety and proper exports
- Default implementation fallback logic
- Backward compatibility with existing boolean returns
- Provider-specific metadata preservation

## Files to Modify

- `src/core/agent/unifiedTerminationModel.ts` (new)
- `src/core/providers/providerPlugin.ts` (enhance interface)
- `src/core/providers/defaultTerminationDetection.ts` (new)
- `src/core/agent/index.ts` (add exports)
- `src/core/providers/index.ts` (add exports)

## Out of Scope

- Provider-specific implementations (handled by separate tasks)
- Agent loop integration (handled by separate tasks)
- Registry or detection engine (kept simple per requirements)
