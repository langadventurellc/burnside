---
id: T-add-tool-execution-cancellatio
title: Add tool execution cancellation support
status: open
priority: medium
parent: F-cancellation-infrastructure
prerequisites:
  - T-integrate-cancellation
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T23:31:33.963Z
updated: 2025-09-18T23:31:33.963Z
---

# Add tool execution cancellation support

## Context

Enable cancellation of individual tool executions and coordinated cancellation of multiple tool calls (both sequential and parallel execution strategies).

## Implementation Requirements

### 1. Enhance ToolRouter with Cancellation

Update `src/core/tools/toolRouter.ts`:

- Accept AbortSignal in executeMultiple() method
- Pass cancellation signal to execution strategies
- Handle partial tool execution results during cancellation
- Clean up tool execution contexts and resources

### 2. Update Execution Strategies

Enhance both sequential and parallel execution strategies:

**Sequential Strategy** (`src/core/tools/sequentialExecutionStrategy.ts`):

- Check cancellation before each tool execution
- Allow running tool to complete gracefully (with timeout)
- Handle partial results when cancellation occurs

**Parallel Strategy** (`src/core/tools/parallelExecutionStrategy.ts`):

- Propagate cancellation to all running tool executions
- Cancel pending tools immediately
- Wait for running tools to complete gracefully (with timeout)
- Collect partial results from completed tools

### 3. Tool Execution Cancellation Modes

Support both cancellation approaches:

- **Graceful**: Allow current tool to complete, cancel pending tools
- **Immediate**: Cancel all tools immediately, perform cleanup

### 4. Result Handling for Cancelled Tools

- Preserve results from completed tools before cancellation
- Mark cancelled tools with appropriate status
- Include cancellation reason in execution metadata
- Maintain execution order consistency in results

## Acceptance Criteria

### Functional Requirements

- ✅ ToolRouter accepts AbortSignal in executeMultiple() method
- ✅ Sequential strategy checks cancellation before each tool execution
- ✅ Parallel strategy propagates cancellation to all running tools
- ✅ Graceful cancellation allows current tools to complete (with timeout)
- ✅ Immediate cancellation terminates all tools quickly

### Result Handling Requirements

- ✅ Completed tool results preserved during cancellation
- ✅ Cancelled tools marked with appropriate status in results
- ✅ Cancellation reason included in execution metadata
- ✅ Execution order consistency maintained in partial results

### Timeout Handling Requirements

- ✅ Tool execution graceful shutdown timeout (default: 5000ms)
- ✅ Forced termination after graceful timeout expires
- ✅ Individual tool timeout handling during cancellation
- ✅ Overall cancellation timeout enforcement

### Error Handling Requirements

- ✅ Partial tool execution errors handled gracefully
- ✅ Tool resource cleanup on cancellation
- ✅ Error context includes cancellation information
- ✅ No resource leaks when tools are cancelled

### Testing Requirements

- ✅ Unit tests for ToolRouter cancellation integration
- ✅ Sequential strategy cancellation timing tests
- ✅ Parallel strategy coordination tests with cancellation
- ✅ Graceful vs immediate cancellation behavior tests
- ✅ Partial result preservation and consistency tests
- ✅ Resource cleanup validation tests

## Dependencies

- Requires AgentLoop cancellation integration (T-integrate-cancellation)
- Integrates with existing tool execution infrastructure

## Out of Scope

- Individual tool implementation cancellation handling
- Tool-specific resource cleanup (tool responsibility)
- New tool execution strategies beyond sequential/parallel
