---
id: F-multi-turn-e2e-test-suite
title: Basic Multi-Turn E2E Tests
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T16:50:43.296Z
updated: 2025-09-18T16:50:43.296Z
---

# Basic Multi-Turn E2E Tests Feature

## Overview

Add simple end-to-end tests for multi-turn conversation functionality across all LLM providers (OpenAI, Anthropic, Google, xAI). This feature adds basic multi-turn test coverage alongside the existing E2E test structure with minimal scope - just a couple of basic tests per provider to ensure the multi-turn execution path works correctly.

## Purpose and Functionality

Create lightweight E2E tests that validate:

- Basic multi-turn conversation execution (2-3 iterations)
- Simple configuration option validation (maxIterations)
- Multi-turn execution path is triggered correctly with tools and multiTurn config

## Key Components to Implement

### 1. Multi-Turn Test Files per Provider

- `src/__tests__/e2e/openai/multiTurn.e2e.test.ts`
- `src/__tests__/e2e/anthropic/multiTurn.e2e.test.ts`
- `src/__tests__/e2e/google/multiTurn.e2e.test.ts`
- `src/__tests__/e2e/xai/multiTurn.e2e.test.ts`

### 2. Minimal Shared Helpers (if needed)

- Reuse existing shared infrastructure where possible
- Add only minimal multi-turn request creation helper if beneficial
- Keep new infrastructure to absolute minimum

## Detailed Acceptance Criteria

### Functional Requirements

1. **Basic Multi-Turn Test Coverage**
   - ✅ Test file created for each of the 4 providers
   - ✅ Each provider has 2 simple test scenarios maximum
   - ✅ Tests validate basic multi-turn execution with tools
   - ✅ Tests use existing shared infrastructure (createTestClient, createTestTool, etc.)

2. **Simple Test Scenarios per Provider**
   - ✅ **Test 1**: Basic multi-turn flow - Simple 2-3 iteration conversation that completes naturally
   - ✅ **Test 2**: MaxIterations limit - Test that conversation stops at configured maxIterations limit

3. **Integration with Existing Infrastructure**
   - ✅ Reuse existing test helpers (withTimeout, ensureModelRegistered, validateMessageSchema)
   - ✅ Use existing tool infrastructure (createTestTool, testToolHandler)
   - ✅ Follow established test patterns and naming conventions
   - ✅ Filter models based on toolCalls capability from defaultLlmModels

## Implementation Guidance

### Technical Approach

1. **Keep It Simple**
   - Follow exact same patterns as existing tools.e2e.test.ts files
   - Minimal new code - reuse everything possible from shared/
   - Just add multiTurn configuration to existing chat request patterns
   - No new complex infrastructure or abstractions

2. **Basic Test Structure**

   ```typescript
   // Test 1: Basic multi-turn flow
   const messages = createTestMessages(
     "Use the tool multiple times to complete a task",
   );
   const response = await client.chat({
     messages,
     model: testModel,
     tools: [tool],
     multiTurn: { maxIterations: 3 },
   });

   // Test 2: MaxIterations enforcement
   const response = await client.chat({
     messages,
     model: testModel,
     tools: [tool],
     multiTurn: { maxIterations: 2 },
   });
   ```

3. **Reuse Existing Patterns**
   - Copy structure from tools.e2e.test.ts files
   - Use same beforeAll setup, model filtering, timeout handling
   - Same validation patterns for responses
   - Same error handling approaches

### File Structure

```
src/__tests__/e2e/
├── openai/multiTurn.e2e.test.ts (new - ~100 lines)
├── anthropic/multiTurn.e2e.test.ts (new - ~100 lines)
├── google/multiTurn.e2e.test.ts (new - ~100 lines)
├── xai/multiTurn.e2e.test.ts (new - ~100 lines)
└── shared/ (minimal changes if any)
```

## Testing Requirements

### Test Scenarios per Provider (2 tests total)

1. **Basic Multi-Turn Execution**
   - Create simple conversation with tool calls
   - Set multiTurn: { maxIterations: 3 }
   - Validate response is well-formed
   - Ensure multi-turn execution path was used

2. **MaxIterations Limit Validation**
   - Create conversation that would continue beyond limit
   - Set multiTurn: { maxIterations: 2 }
   - Validate conversation stops at iteration limit
   - Ensure proper termination

### Constraints

- **NO performance testing** - no timing measurements, memory checks, overhead validation
- **NO comprehensive scenarios** - just basic happy path + one limit test
- **NO streaming complexity** - basic multi-turn only, no streaming interruption testing
- **NO error type validation** - leave error testing to unit tests
- **NO parallel strategy testing** - use default sequential only

## Success Metrics

- **Simplicity**: Each provider test file ~100 lines, following existing patterns exactly
- **Coverage**: Multi-turn execution path validated across all 4 providers
- **Integration**: Zero new complex infrastructure, maximum reuse of existing helpers
- **Reliability**: Tests pass consistently with basic multi-turn scenarios
