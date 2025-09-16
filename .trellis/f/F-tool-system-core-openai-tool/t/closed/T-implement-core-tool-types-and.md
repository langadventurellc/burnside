---
id: T-implement-core-tool-types-and
title: Implement core tool types and schemas
status: done
priority: high
parent: F-tool-system-core-openai-tool
prerequisites: []
affectedFiles:
  src/core/tools/toolCall.ts: Created ToolCall interface with id, name,
    parameters, and optional metadata fields for tracking tool execution
    requests
  src/core/tools/toolResult.ts: Created ToolResult interface with discriminated
    success/error states, comprehensive metadata, and clear documentation
  src/core/tools/toolCallSchema.ts: Implemented comprehensive Zod validation
    schema for ToolCall with strict validation, parameter validation, and
    metadata validation
  src/core/tools/toolResultSchema.ts: Implemented discriminated union Zod schema
    for ToolResult ensuring mutually exclusive success/error states with
    comprehensive validation
  src/core/tools/index.ts: Updated exports to include new ToolCall, ToolResult
    interfaces and their corresponding Zod schemas
  src/core/tools/__tests__/toolCallSchema.test.ts: Created comprehensive test
    suite with 32 test cases covering all validation scenarios, edge cases, and
    error conditions
  src/core/tools/__tests__/toolResultSchema.test.ts: Created comprehensive test
    suite with 24 test cases covering discriminated union behavior,
    success/error state validation, and all field validation rules
log:
  - Implemented comprehensive core tool types and schemas for the LLM Bridge
    tool system, including ToolCall and ToolResult interfaces with full Zod
    validation schemas. Created mutually exclusive success/error states using
    discriminated unions, comprehensive test suites with 56 passing tests, and
    integrated with existing codebase patterns. All quality checks pass
    including TypeScript strict mode, ESLint, and Prettier formatting.
schema: v1.0
childrenIds: []
created: 2025-09-16T00:27:16.073Z
updated: 2025-09-16T00:27:16.073Z
---

# Implement Core Tool Types and Schemas

## Context

Create the fundamental types and Zod schemas needed for the tool system, including ToolCall, ToolResult, and related core interfaces. This provides the foundation for all tool-related functionality.

Builds on existing tool infrastructure in `src/core/tools/` and follows patterns established in `src/core/messages/` and `src/core/providers/`.

Reference feature F-tool-system-core-openai-tool for complete context.

## Implementation Requirements

### Files to Create/Modify

```
src/core/tools/
  toolCall.ts              # ToolCall interface and schema
  toolResult.ts            # ToolResult interface and schema
  toolCallSchema.ts        # Zod validation schemas
  toolResultSchema.ts      # Zod validation schemas
  index.ts                 # Export new types
```

### Specific Implementation Details

1. **Create ToolCall Interface and Schema** (`src/core/tools/toolCall.ts`):

```typescript
export interface ToolCall {
  id: string; // Unique identifier for this tool call
  name: string; // Tool name to execute
  parameters: Record<string, unknown>; // Tool input parameters
  metadata?: {
    providerId?: string; // Which provider initiated the call
    timestamp?: string; // When the call was made
    contextId?: string; // Conversation/session context
  };
}
```

2. **Create ToolResult Interface and Schema** (`src/core/tools/toolResult.ts`):

```typescript
export interface ToolResult {
  callId: string; // Links back to ToolCall.id
  success: boolean; // Whether execution succeeded
  data?: unknown; // Tool output data (when successful)
  error?: {
    code: string; // Error category (validation, execution, timeout)
    message: string; // Human-readable error message
    details?: unknown; // Additional error context
  };
  metadata?: {
    executionTime?: number; // Execution time in milliseconds
    memoryUsage?: number; // Memory used during execution
    retryCount?: number; // Number of retry attempts
  };
}
```

3. **Create Comprehensive Zod Schemas**:
   - ToolCallSchema with strict validation for all fields
   - ToolResultSchema with conditional validation (success vs error states)
   - Export both schemas from main index

4. **Update Main Index** (`src/core/tools/index.ts`):
   - Export new interfaces and schemas
   - Maintain existing exports
   - Follow established export patterns

## Technical Approach

- **Follow Zod patterns** from `src/core/messages/messageSchema.ts`
- **Use TypeScript strict mode** for all type definitions
- **Validate schema composition** to ensure runtime type safety
- **Include JSON schema metadata** for OpenAPI documentation

## Acceptance Criteria

### Functional Requirements

- [ ] ToolCall interface supports all provider formats (OpenAI, Anthropic, etc.)
- [ ] ToolResult interface handles both success and error states gracefully
- [ ] Zod schemas provide comprehensive runtime validation
- [ ] Type exports work correctly with existing tool system

### Data Validation

- [ ] ToolCall parameters validate as Record<string, unknown>
- [ ] ToolResult success/error states are mutually exclusive
- [ ] Metadata fields are optional and properly typed
- [ ] Schema validation fails gracefully with clear error messages

### Integration Points

- [ ] Types integrate seamlessly with existing ToolDefinition
- [ ] Schemas compose correctly with provider-specific formats
- [ ] Error handling aligns with existing ToolError patterns

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Schema Validation Tests**:
   - Valid ToolCall objects pass validation
   - Invalid ToolCall objects fail with specific errors
   - ToolResult success/error state validation
   - Metadata field validation (optional vs required)

2. **Type Safety Tests**:
   - TypeScript compilation with strict mode
   - Runtime type checking with Zod
   - Edge cases (empty parameters, null values)

3. **Integration Tests**:
   - Compatibility with existing ToolDefinition
   - Schema composition with provider formats

## Security Considerations

- **Input Sanitization**: ToolCall parameters undergo strict validation
- **Data Validation**: All fields validated against schema before processing
- **Error Information**: Error details don't expose sensitive internal state
- **Type Safety**: Strict typing prevents runtime type errors

## Out of Scope

- Tool execution logic (handled by separate tasks)
- Provider-specific translation (handled by OpenAI integration tasks)
- Agent loop integration (handled by agent loop tasks)
- Performance optimization beyond basic validation
