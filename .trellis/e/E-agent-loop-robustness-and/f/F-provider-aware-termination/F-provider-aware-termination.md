---
id: F-provider-aware-termination
title: Provider-Aware Termination Detection
status: done
priority: medium
parent: E-agent-loop-robustness-and
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
  src/core/agent/index.ts:
    Added exports for all new termination types and utility
    functions; Added export for analyzeConversationTermination function to make
    termination analysis available for external consumption.
  src/core/agent/__tests__/unifiedTerminationSignal.test.ts: Created comprehensive unit tests for unified termination model utilities
  src/core/providers/__tests__/defaultTerminationDetection.test.ts:
    Created extensive unit tests for default termination detection with 23 test
    cases covering all scenarios
  src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:
    Enhanced with detectTermination() method implementing Anthropic stop_reason
    mapping to UnifiedTerminationSignal. Added
    createAnthropicTerminationSignal() helper method. Updated isTerminal() to
    delegate to detectTermination() for backward compatibility. Added necessary
    imports for termination detection types.
  src/providers/anthropic-2023-06-01/__tests__/termination.test.ts:
    Created comprehensive test suite with 22 test cases covering
    detectTermination() and isTerminal() integration. Tests all Anthropic
    stop_reason values, streaming/non-streaming scenarios, edge cases, and
    conversation context integration.
  src/providers/anthropic-2023-06-01/__tests__/anthropicMessagesV1Provider.test.ts:
    Added integration tests for detectTermination() method including stop_reason
    detection, streaming delta handling, isTerminal() integration, and
    conversation context parameter support.
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
  src/core/agent/terminationAnalyzer.ts:
    Created centralized termination analysis
    logic that works with or without provider plugins, providing intelligent
    conversation termination decisions based on UnifiedTerminationSignal
    analysis and conversation context.
  src/core/agent/multiTurnState.ts:
    Added UnifiedTerminationSignal tracking fields
    including terminationSignalHistory, currentTerminationSignal, and
    providerTerminationMetadata for comprehensive termination state management.
  src/core/agent/agentLoop.ts: Replaced boolean termination logic with
    provider-aware detection, implemented smart continuation decisions based on
    termination reasons and confidence levels, and added fallback to original
    logic for uncertain cases.
  src/core/agent/__tests__/terminationAnalyzer.test.ts:
    Created comprehensive unit
    tests covering edge cases, provider detection scenarios, conversation
    context creation, and assistant message finding functionality.
  src/core/agent/__tests__/agentLoop.test.ts:
    Added integration tests for enhanced
    termination detection including intelligent continuation decisions, content
    filtering, token limits, and fallback behavior.
  src/core/agent/__tests__/fixtures/geminiResponses.ts: Fixed Gemini provider
    fixtures to include finishReason at top level of metadata for proper
    detection
  src/core/agent/__tests__/fixtures/xaiResponses.ts: Fixed xAI provider fixtures
    to include status field and eventType for streaming responses to match
    provider expectations
  src/core/agent/__tests__/terminationConsistency.test.ts: Created comprehensive
    cross-provider consistency tests with realistic expectations for provider
    differences
  src/core/agent/__tests__/terminationIntegration.test.ts: Created end-to-end
    integration tests for multi-turn loops, streaming coordination, fallback
    behavior, and error scenarios
  src/providers/xai-v1/xaiV1Provider.ts: Enhanced xAI provider to properly
    normalize content filtering finish_reason to content_filtered termination
    reason
log:
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-create-comprehensive
  - T-create-unified-termination
  - T-implement-anthropic
  - T-implement-google-gemini
  - T-implement-openaixai
  - T-integrate-termination
created: 2025-09-18T02:18:25.836Z
updated: 2025-09-18T02:18:25.836Z
---

# Provider-Aware Termination Detection Feature

## Overview

Implement a unified termination detection system that normalizes completion signals across OpenAI, Anthropic, Google Gemini, and xAI providers. This feature ensures consistent conversation termination behavior regardless of the underlying provider, supporting both streaming and non-streaming responses.

## Purpose and Functionality

Create a comprehensive termination detection framework that:

- Normalizes provider-specific completion signals to a unified model
- Handles both streaming and non-streaming termination detection
- Provides detailed termination context for decision making
- Supports provider-specific termination nuances while maintaining consistency
- Enables intelligent conversation flow control based on termination reasons

## Key Components to Implement

### 1. Unified Termination Model

```typescript
interface UnifiedTerminationSignal {
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

enum TerminationReason {
  NATURAL_COMPLETION = "natural_completion", // Provider signaled natural end
  TOKEN_LIMIT_REACHED = "token_limit_reached", // Hit token budget
  CONTENT_FILTERED = "content_filtered", // Safety/content filter triggered
  STOP_SEQUENCE = "stop_sequence", // Custom stop sequence matched
  ERROR_TERMINATION = "error_termination", // Error-based termination
  UNKNOWN = "unknown", // Unrecognized termination signal
}
```

### 2. Provider-Specific Termination Detectors

```typescript
interface ProviderTerminationDetector {
  detectTermination(response: ProviderResponse, isStreaming: boolean): UnifiedTerminationSignal;
  extractTerminationContext(response: ProviderResponse): TerminationContext;
  validateTerminationSignal(signal: UnifiedTerminationSignal): boolean;
}

// Specific implementations for each provider
class OpenAITerminationDetector implements ProviderTerminationDetector;
class AnthropicTerminationDetector implements ProviderTerminationDetector;
class GeminiTerminationDetector implements ProviderTerminationDetector;
class XAITerminationDetector implements ProviderTerminationDetector; // Same as OpenAI
```

### 3. Termination Detection Registry

```typescript
class TerminationDetectionRegistry {
  private detectors: Map<string, ProviderTerminationDetector>;

  registerDetector(
    providerId: string,
    detector: ProviderTerminationDetector,
  ): void;
  getDetector(providerId: string): ProviderTerminationDetector;
  detectTermination(
    providerId: string,
    response: ProviderResponse,
    isStreaming: boolean,
  ): UnifiedTerminationSignal;
}
```

### 4. Streaming Termination Handler

```typescript
interface StreamingTerminationHandler {
  processStreamChunk(
    chunk: unknown,
    providerId: string,
  ): {
    termination?: UnifiedTerminationSignal;
    shouldContinue: boolean;
    bufferedContent?: string;
  };

  finalizeStream(providerId: string): UnifiedTerminationSignal;
  resetStreamState(): void;
}
```

### 5. Termination Decision Engine

```typescript
class TerminationDecisionEngine {
  shouldContinueConversation(
    signal: UnifiedTerminationSignal,
    context: ConversationContext,
    options: TerminationOptions,
  ): TerminationDecision;

  generateTerminationReport(
    signal: UnifiedTerminationSignal,
    executionContext: AgentExecutionContext,
  ): TerminationReport;
}

interface TerminationDecision {
  shouldContinue: boolean;
  reason: string;
  suggestedAction?: "retry" | "modify_prompt" | "increase_budget" | "stop";
  metadata: Record<string, unknown>;
}
```

## Detailed Acceptance Criteria

### Functional Requirements

1. **Provider-Specific Detection**
   - ✅ **OpenAI/xAI Detection**: Correctly interprets `finish_reason` field
     - `stop` → NATURAL_COMPLETION (high confidence)
     - `length` → TOKEN_LIMIT_REACHED (high confidence)
     - `content_filter` → CONTENT_FILTERED (high confidence)
     - `null`/undefined → UNKNOWN (low confidence)
   - ✅ **Anthropic Detection**: Correctly interprets `stop_reason` field
     - `end_turn` → NATURAL_COMPLETION (high confidence)
     - `stop_sequence` → STOP_SEQUENCE (high confidence)
     - `max_tokens` → TOKEN_LIMIT_REACHED (high confidence)
     - Other values → mapped appropriately
   - ✅ **Google Gemini Detection**: Correctly interprets `finishReason` field
     - `STOP` → NATURAL_COMPLETION (high confidence)
     - `MAX_TOKENS` → TOKEN_LIMIT_REACHED (high confidence)
     - `SAFETY` → CONTENT_FILTERED (high confidence)
     - Other values → mapped appropriately

2. **Streaming vs Non-Streaming Support**
   - ✅ Non-streaming responses: Immediate termination detection from final response
   - ✅ Streaming responses: Progressive termination detection from stream chunks
   - ✅ Final chunk processing: Definitive termination signal from stream completion
   - ✅ Partial stream handling: Graceful handling of incomplete streams

3. **Unified Termination Processing**
   - ✅ Consistent termination signal format across all providers
   - ✅ Provider-specific metadata preservation for debugging
   - ✅ Confidence levels for termination signal reliability
   - ✅ Detailed termination context and reasoning

4. **Decision Engine Integration**
   - ✅ Intelligent continuation decisions based on termination signals
   - ✅ Context-aware termination handling (conversation length, token usage)
   - ✅ Configurable termination policies per use case
   - ✅ Actionable suggestions for termination scenarios

5. **Error Handling and Fallbacks**
   - ✅ Graceful handling of missing or malformed termination signals
   - ✅ Default termination behavior for unknown providers
   - ✅ Fallback termination detection based on response patterns
   - ✅ Error reporting for termination detection failures

### Integration Requirements

1. **Agent Loop Integration**
   - ✅ Seamless integration with multi-turn loop foundation
   - ✅ Termination checking after each provider response
   - ✅ Streaming termination detection during response processing
   - ✅ Conversation flow control based on termination decisions

2. **Provider Plugin Integration**
   - ✅ Provider plugin registration of termination detectors
   - ✅ Automatic detector selection based on active provider
   - ✅ Version-specific termination handling for provider API changes
   - ✅ Provider capability discovery for termination features

3. **Observability Integration**
   - ✅ Termination event emission for monitoring
   - ✅ Termination signal logging with sanitized metadata
   - ✅ Performance metrics for termination detection
   - ✅ Debugging information for termination failures

### Performance Requirements

1. **Detection Performance**
   - Termination detection processing < 10ms per response
   - Streaming termination checking < 5ms per chunk
   - Provider detector registration overhead < 1ms
   - Memory usage linear with conversation length

2. **Accuracy Requirements**
   - 99.9% correct termination detection for well-formed responses
   - 95% accuracy for edge cases and malformed responses
   - < 0.1% false positive termination detection
   - Graceful degradation for unknown termination signals

## Implementation Guidance

### Technical Approach

1. **Factory Pattern for Detectors**
   - Use factory pattern to create provider-specific detectors
   - Enable runtime detector registration and replacement
   - Support versioned detectors for API evolution

2. **Strategy Pattern for Decision Making**
   - Pluggable termination decision strategies
   - Context-aware decision making with configurable policies
   - Support for custom decision logic per application

3. **Observer Pattern for Integration**
   - Event-driven termination signal propagation
   - Loose coupling between detection and decision making
   - Extensible termination event handling

4. **Provider-Specific Response Mapping**
   - Detailed mapping of provider response fields to unified model
   - Version-aware field interpretation
   - Backward compatibility for deprecated termination fields

### Research Integration

Based on previous research, implement these specific mappings:

**OpenAI/xAI (finish_reason field):**

```typescript
const openAITerminationMap = {
  stop: { reason: TerminationReason.NATURAL_COMPLETION, confidence: "high" },
  length: { reason: TerminationReason.TOKEN_LIMIT_REACHED, confidence: "high" },
  content_filter: {
    reason: TerminationReason.CONTENT_FILTERED,
    confidence: "high",
  },
  null: { reason: TerminationReason.UNKNOWN, confidence: "low" },
};
```

**Anthropic (stop_reason field):**

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
};
```

**Google Gemini (finishReason field):**

```typescript
const geminiTerminationMap = {
  STOP: { reason: TerminationReason.NATURAL_COMPLETION, confidence: "high" },
  MAX_TOKENS: {
    reason: TerminationReason.TOKEN_LIMIT_REACHED,
    confidence: "high",
  },
  SAFETY: { reason: TerminationReason.CONTENT_FILTERED, confidence: "high" },
};
```

### File Structure

```
src/core/agent/
├── termination/
│   ├── terminationDetectionRegistry.ts (central registry)
│   ├── unifiedTerminationModel.ts (shared types and interfaces)
│   ├── terminationDecisionEngine.ts (decision logic)
│   ├── streamingTerminationHandler.ts (streaming-specific logic)
│   ├── providers/
│   │   ├── openAITerminationDetector.ts
│   │   ├── anthropicTerminationDetector.ts
│   │   ├── geminiTerminationDetector.ts
│   │   └── xaiTerminationDetector.ts (alias to OpenAI)
│   └── __tests__/
│       ├── terminationDetectors.test.ts
│       ├── streamingTermination.test.ts
│       ├── terminationDecisionEngine.test.ts
│       └── terminationRegistry.test.ts
└── agentLoop.ts (integration with termination detection)
```

## Testing Requirements

### Unit Tests

1. **Provider Detector Tests**
   - Response parsing for each provider's termination signals
   - Edge cases and malformed response handling
   - Streaming vs non-streaming response processing
   - Provider-specific metadata extraction

2. **Unified Model Tests**
   - Termination signal normalization across providers
   - Confidence level assignment accuracy
   - Metadata preservation and sanitization
   - Error handling for invalid signals

3. **Decision Engine Tests**
   - Continuation decision logic for various termination reasons
   - Context-aware decision making
   - Policy-based termination handling
   - Suggestion generation for different scenarios

### Contract Tests

1. **Provider Response Fixtures**
   - Use recorded provider response fixtures for each termination scenario
   - Test with known response formats from existing provider test suites
   - Validate termination detection with recorded streaming responses
   - Test error scenarios with recorded error responses

2. **Cross-Provider Consistency Tests**
   - Verify identical termination behavior across providers for equivalent scenarios
   - Test streaming vs non-streaming consistency within providers
   - Validate termination confidence levels across different response types

## Security Considerations

1. **Response Sanitization**
   - Sanitize provider-specific metadata for logging
   - Prevent sensitive information leakage through termination signals
   - Secure handling of error messages in termination context

2. **Input Validation**
   - Validate provider response structure before processing
   - Prevent injection attacks through malformed termination signals
   - Rate limiting for termination detection operations

## Integration Requirements

### Provider Plugin Integration

**Critical**: This feature must integrate with existing provider plugins without breaking changes:

- **Extend existing ProviderPlugin interface** with termination detection capabilities
  - Optional `detectTermination(response: ProviderResponse, isStreaming: boolean): UnifiedTerminationSignal` method
  - Integration with existing `parseResponse()` method for termination context
  - Enhance existing `isTerminal()` method with conversation context awareness

- **Provider implementation updates**
  - Update existing OpenAI provider plugin with enhanced termination detection
  - Update existing Anthropic provider plugin with termination mapping
  - Update existing Google Gemini provider plugin with termination processing
  - Update existing xAI provider plugin (leveraging OpenAI compatibility)

### BridgeClient Integration

- **Termination detection in execution flow**
  - Integrate termination detection into `BridgeClient.chat()` multi-turn execution
  - Integrate termination detection into `BridgeClient.stream()` streaming responses
  - Provide termination decision feedback through response metadata

- **Configuration integration**
  - Optional termination policy configuration in `BridgeClientConfig`
  - Provider-specific termination customization support
  - Termination decision callbacks for application-level control

### Multi-Turn Integration

- **AgentLoop termination integration**
  - Replace basic continuation logic with provider-aware termination detection
  - Integrate termination confidence levels with iteration decision making
  - Provider termination signals influence multi-turn flow control

### Streaming Integration

- **Streaming termination detection**
  - Integrate with existing streaming state machine for real-time termination
  - Provider-specific streaming termination signal processing
  - Coordination with streaming interruption for tool execution

## Dependencies

### Internal Dependencies

- Provider plugin system for response parsing
- Streaming infrastructure for real-time termination detection
- Agent loop foundation for termination integration
- Observability framework for termination event emission
- **Existing provider plugin implementations (OpenAI, Anthropic, Google, xAI)**
- **BridgeClient execution flow (existing)**
- **Multi-turn loop foundation (prerequisite)**

### External Dependencies

- Provider-specific response types and schemas
- Logging and monitoring utilities
- Performance measurement tools

## Success Metrics

- **Accuracy**: 99.9% correct termination detection for standard responses
- **Consistency**: Identical termination behavior across all providers
- **Performance**: < 10ms termination detection processing time
- **Reliability**: Zero false positive terminations in production
- **Maintainability**: Easy addition of new providers and termination signals
