---
id: F-context-management-and-token
title: Context Management and Token Budget
status: open
priority: medium
parent: E-agent-loop-robustness-and
prerequisites:
  - F-multi-turn-loop-foundation
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:19:32.701Z
updated: 2025-09-18T02:19:32.701Z
---

# Context Management and Token Budget Feature

## Overview

Implement intelligent context management strategies and comprehensive token budget accounting to optimize conversation efficiency while maintaining context relevance. This feature provides sophisticated conversation trimming with anchor preservation and precise token tracking with provider-reported usage when available.

## Purpose and Functionality

Deliver robust context management capabilities that:

- Preserve essential conversation anchors while trimming efficiently
- Track token usage with high accuracy across all providers
- Enforce configurable token budgets with graceful degradation
- Support the frozen heads/tails trimming strategy with optional summarization
- Optimize conversation length for performance and cost efficiency

## Key Components to Implement

### 1. Core Context Strategy Framework

```typescript
interface ContextStrategy {
  name: string;
  description: string;

  shouldTrim(context: ConversationContext, tokenBudget: TokenBudget): boolean;
  trimMessages(messages: Message[], targetTokens: number): TrimResult;
  preserveAnchors(messages: Message[]): AnchorPreservationResult;
  estimateTokenSavings(messages: Message[], trimCount: number): number;
}

interface TrimResult {
  trimmedMessages: Message[];
  removedCount: number;
  tokensSaved: number;
  anchorsPreserved: string[];
  summary?: string;
}

// Required implementation
class FrozenHeadsTailsStrategy implements ContextStrategy;

// Optional implementations (stretch goals)
class SummarizationStrategy implements ContextStrategy;
```

### 2. Token Budget Accounting

```typescript
interface TokenBudget {
  input: {
    limit: number;
    used: number;
    remaining: number;
    approximate: boolean;
  };
  output: {
    limit: number;
    used: number;
    remaining: number;
    approximate: boolean;
  };
  total: {
    limit: number;
    used: number;
    remaining: number;
  };
  overhead: {
    systemMessages: number;
    toolDefinitions: number;
    formatting: number;
  };
}

class TokenBudgetManager {
  private budget: TokenBudget;
  private providers: Map<string, TokenCounter>;

  trackUsage(providerId: string, usage: ProviderUsage): void;
  estimateUsage(messages: Message[], providerId: string): TokenEstimate;
  checkBudgetViolation(plannedUsage: TokenEstimate): BudgetViolation | null;
  createBudgetSnapshot(): TokenBudgetSnapshot;
  generateBudgetReport(): TokenBudgetReport;
}
```

### 3. Provider-Aware Token Counting

```typescript
interface TokenCounter {
  providerId: string;
  accuracy: 'exact' | 'approximate' | 'heuristic';

  countTokens(messages: Message[]): TokenCount;
  estimateCompletion(prompt: string, maxTokens: number): TokenEstimate;
  getCountingAccuracy(): TokenCountingAccuracy;
}

// Provider-specific implementations
class OpenAITokenCounter implements TokenCounter; // tiktoken-based
class AnthropicTokenCounter implements TokenCounter; // API-based when available
class GeminiTokenCounter implements TokenCounter; // Approximate counting
class XAITokenCounter implements TokenCounter; // Same as OpenAI
class FallbackTokenCounter implements TokenCounter; // Character-based heuristics
```

### 4. Anchor Preservation System

```typescript
interface AnchorDefinition {
  type:
    | "system_message"
    | "latest_tool_result"
    | "instruction_anchor"
    | "custom";
  priority: number;
  selector: (message: Message, index: number, messages: Message[]) => boolean;
  description: string;
}

class AnchorPreservationManager {
  private anchors: AnchorDefinition[];

  identifyAnchors(messages: Message[]): IdentifiedAnchor[];
  preserveAnchors(messages: Message[], anchors: IdentifiedAnchor[]): Message[];
  validateAnchorPreservation(
    original: Message[],
    trimmed: Message[],
  ): ValidationResult;
}
```

### 5. Context Optimization Engine

```typescript
class ContextOptimizationEngine {
  optimizeContext(
    messages: Message[],
    budget: TokenBudget,
    strategy: ContextStrategy,
    options: OptimizationOptions,
  ): OptimizationResult;

  selectOptimalStrategy(
    context: ConversationContext,
    constraints: ContextConstraints,
  ): ContextStrategy;

  previewOptimization(
    messages: Message[],
    strategy: ContextStrategy,
    targetTokens: number,
  ): OptimizationPreview;
}
```

## Detailed Acceptance Criteria

### Functional Requirements

1. **Context Anchor Preservation**
   - ✅ **System Messages**: Always preserved regardless of trimming strategy
   - ✅ **Latest Tool Results**: Most recent tool execution results preserved
   - ✅ **Instruction Anchors**: Custom instruction messages marked for preservation
   - ✅ **Conversation Boundaries**: Preserve user-assistant turn boundaries
   - ✅ **Priority-Based Preservation**: Configurable priority system for anchor types

2. **Frozen Heads/Tails Strategy Implementation (Required)**
   - ✅ Preserve first N messages (head) containing system prompts and initial context
   - ✅ Preserve last M messages (tail) containing recent conversation
   - ✅ Trim middle conversation bands first when budget constraints exist
   - ✅ Configurable head/tail sizes based on conversation type
   - ✅ Intelligent boundary detection to avoid breaking conversation flow

3. **Token Budget Management**
   - ✅ **Provider-Reported Usage**: Use actual token counts from OpenAI, Anthropic, xAI when available
   - ✅ **Fallback Estimation**: Approximate counting for providers without usage reporting
   - ✅ **Accuracy Flagging**: Clear indication of exact vs approximate token counts
   - ✅ **Budget Enforcement**: Prevent execution when budget would be exceeded
   - ✅ **Graceful Degradation**: Context trimming when approaching budget limits

4. **Token Counting Accuracy**
   - ✅ **OpenAI/xAI**: tiktoken-based counting with 99%+ accuracy
   - ✅ **Anthropic**: API-reported usage when available, fallback to approximation
   - ✅ **Google Gemini**: Character-based approximation with reasonable accuracy
   - ✅ **General Fallback**: Conservative character-to-token ratio estimation
   - ✅ **Accuracy Tracking**: Monitor and report counting accuracy over time

5. **Optional Summarization Strategy (Stretch Goal)**
   - ✅ Conversation summarization for older message segments
   - ✅ Integration with frozen heads/tails for comprehensive optimization
   - ✅ Configurable summarization triggers and policies

6. **Budget Violation Handling**
   - ✅ **BudgetExceededError**: Clear error with budget details and suggestions
   - ✅ **Preventive Trimming**: Automatic context optimization before budget exceeded
   - ✅ **Emergency Trimming**: Aggressive trimming as last resort
   - ✅ **User Notification**: Clear feedback about budget constraints and actions taken

### Performance Requirements

1. **Token Counting Performance**
   - Token counting for 100 messages < 100ms
   - Provider-specific counting accuracy within 5% of actual usage (where verifiable)
   - Memory usage linear with message count
   - Caching of token counts for repeated content

2. **Context Optimization Performance**
   - Context trimming for 1000 messages < 500ms
   - Anchor identification < 50ms for typical conversations
   - Strategy selection < 10ms based on conversation analysis
   - Memory efficiency during large conversation processing

3. **Budget Tracking Performance**
   - Budget calculation and validation < 20ms
   - Real-time budget monitoring without measurable overhead
   - Efficient budget snapshot creation and reporting

### Error Handling Requirements

1. **Budget Error Types**
   - ✅ **BudgetExceededError**: Input, output, or total budget violation
   - ✅ **ContextOptimizationError**: Failure to trim within budget constraints
   - ✅ **TokenCountingError**: Failure in token counting operation
   - ✅ **AnchorPreservationError**: Failure to preserve required anchors

2. **Graceful Degradation**
   - ✅ Fallback to simpler trimming strategies on optimization failure
   - ✅ Conservative token estimation when exact counting fails
   - ✅ Emergency context truncation to prevent hard failures
   - ✅ Clear error reporting with recovery suggestions

## Implementation Guidance

### Technical Approach

1. **Strategy Pattern Implementation**
   - Clean separation between strategy interface and implementations
   - Runtime strategy registration and selection
   - Performance monitoring and strategy effectiveness tracking

2. **Token Counting Architecture**
   - Provider-specific counter registration
   - Graceful fallback chain for token counting
   - Caching layer for repeated token count operations
   - Accuracy tracking and reporting

3. **Anchor Preservation Logic**
   - Rule-based anchor identification system
   - Priority-based preservation during trimming
   - Validation of anchor preservation post-trimming

4. **Budget Tracking Design**
   - Real-time budget monitoring with minimal overhead
   - Snapshot-based budget reporting for debugging
   - Predictive budget violation detection

### Context Strategy Implementations

1. **Frozen Heads/Tails Strategy (Required)**

   ```typescript
   class FrozenHeadsTailsStrategy implements ContextStrategy {
     private headSize: number = 3; // Preserve first 3 messages
     private tailSize: number = 5; // Preserve last 5 messages

     trimMessages(messages: Message[], targetTokens: number): TrimResult {
       // Implementation preserves head/tail, trims middle
     }
   }
   ```

2. **Summarization Strategy (Optional)**
   ```typescript
   class SummarizationStrategy implements ContextStrategy {
     trimMessages(messages: Message[], targetTokens: number): TrimResult {
       // Implementation with conversation summarization
     }
   }
   ```

### File Structure

```
src/core/agent/
├── context/
│   ├── contextStrategy.ts (strategy interfaces)
│   ├── contextOptimizationEngine.ts (main optimization logic)
│   ├── anchorPreservationManager.ts (anchor management)
│   ├── strategies/
│   │   ├── frozenHeadsTailsStrategy.ts (required)
│   │   └── summarizationStrategy.ts (optional)
│   └── __tests__/
│       ├── frozenHeadsTailsStrategy.test.ts
│       ├── anchorPreservation.test.ts
│       └── contextOptimization.test.ts
├── budget/
│   ├── tokenBudgetManager.ts (budget tracking)
│   ├── tokenCounter.ts (counting interfaces)
│   ├── budgetErrors.ts (budget-specific errors)
│   ├── providers/
│   │   ├── openAITokenCounter.ts
│   │   ├── anthropicTokenCounter.ts
│   │   ├── geminiTokenCounter.ts
│   │   ├── xaiTokenCounter.ts
│   │   └── fallbackTokenCounter.ts
│   └── __tests__/
│       ├── tokenBudgetManager.test.ts
│       ├── tokenCounters.test.ts
│       └── budgetUnit.test.ts
└── agentLoop.ts (integration with context management)
```

## Testing Requirements

### Unit Tests

1. **Context Strategy Tests**
   - Frozen heads/tails strategy with various message patterns
   - Anchor preservation validation across strategies
   - Token target achievement within acceptable ranges
   - Edge cases with very small or very large conversations

2. **Token Counting Tests**
   - Provider-specific token counting accuracy (where verifiable)
   - Fallback counting behavior and accuracy
   - Performance benchmarks for large conversations
   - Caching behavior and cache invalidation

3. **Budget Management Tests**
   - Budget tracking across multiple iterations
   - Budget violation detection and error handling
   - Graceful degradation scenarios
   - Budget reporting accuracy and completeness

4. **Anchor Preservation Tests**
   - Anchor identification across different message types
   - Priority-based preservation under budget pressure
   - Validation of anchor preservation post-trimming
   - Custom anchor definition and preservation

### Contract Tests

1. **Context Management Validation**
   - Mock conversation scenarios with known token patterns
   - Simulated provider responses for budget tracking
   - Strategy effectiveness validation with test conversations
   - Token counting validation against known patterns

## Security Considerations

1. **Data Privacy**
   - Secure handling of conversation content during trimming
   - No logging of sensitive conversation data
   - Memory cleanup after context operations

2. **Budget Security**
   - Prevent budget manipulation through malformed input
   - Secure token counting without external API exposure
   - Rate limiting for context optimization operations

## Integration Requirements

### BridgeClient Integration

**Critical**: This feature must integrate with existing BridgeClient execution to provide automatic context management:

- **Add context management configuration** to `BridgeClientConfig`
  - Optional `contextStrategy?: ContextStrategy` for conversation trimming strategy
  - Optional `tokenBudget?: TokenBudgetOptions` for budget limits and tracking
  - Optional `contextPreservation?: AnchorPreservationRules` for custom anchor rules

- **Integrate with existing execution flow**
  - Automatic context trimming before provider API calls in `BridgeClient.chat()`
  - Budget tracking integration throughout multi-turn conversations
  - Token usage reporting in response metadata

- **Provide context management API**
  - `client.getTokenUsage()` for accessing current conversation token usage
  - `client.trimContext()` for manual context optimization
  - `client.setTokenBudget()` for dynamic budget adjustment

### Provider Plugin Integration

- **Extend existing ProviderPlugin interface** with token counting capabilities
  - Optional `estimateTokenUsage(messages: Message[]): TokenEstimate` method
  - Integration with existing `parseResponse()` for usage reporting
  - Provider-specific token counting strategies (tiktoken for OpenAI, approximation for others)

### Multi-Turn Integration

- **AgentLoop integration** with context management
  - Automatic context trimming between iterations when budget limits approached
  - Budget checking before each iteration with graceful degradation
  - Context preservation during multi-turn state management

### Message System Integration

- **Message interface extension** for context management metadata
  - Optional context anchor marking for preservation priority
  - Token count caching at message level for performance
  - Integration with existing message metadata patterns

## Dependencies

### Internal Dependencies

- Multi-Turn Loop Foundation (prerequisite)
- Provider plugin system for token counting integration
- Message and content type definitions
- Error handling infrastructure
- **BridgeClient execution flow (existing)**
- **Provider plugin interface (existing)**

### External Dependencies

- tiktoken library for OpenAI token counting
- Provider APIs for usage reporting
- Memory management utilities for large conversations

## Success Metrics

- **Accuracy**: Token counting within 5% of provider-reported usage (where available)
- **Efficiency**: Reasonable token savings through intelligent trimming
- **Performance**: Context optimization < 500ms for 1000 messages
- **Preservation**: 100% anchor preservation rate
- **Reliability**: Zero conversation corruption through trimming
- **Cost Optimization**: Measurable reduction in token usage through context management
