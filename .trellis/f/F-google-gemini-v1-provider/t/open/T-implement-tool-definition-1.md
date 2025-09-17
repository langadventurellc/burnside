---
id: T-implement-tool-definition-1
title: Implement tool definition translator for function calling
status: open
priority: high
parent: F-google-gemini-v1-provider
prerequisites:
  - T-create-gemini-api-request-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T03:27:55.416Z
updated: 2025-09-17T03:27:55.416Z
---

# Implement Tool Definition Translator for Function Calling

## Context

This task implements the tool translation system that converts unified LLM Bridge tool definitions (with Zod schemas) into Google Gemini function declaration format. This enables function calling capabilities by translating between the bridge's tool system and Gemini's function calling API.

**Related Feature**: F-google-gemini-v1-provider - Google Gemini v1 Provider Implementation
**Reference Implementation**: `src/providers/openai-responses-v1/toolTranslator.ts`

## Implementation Requirements

### 1. Create Tool Translator

Create `src/providers/google-gemini-v1/toolTranslator.ts` with:

- `translateToolDefinitions()` function converting `ToolDefinition[]` to Gemini format
- Zod schema to JSON Schema conversion for function parameters
- Tool name and description mapping
- Function declaration structure for Gemini API
- Validation and error handling for invalid tool definitions

### 2. Schema Conversion Logic

- Convert Zod schemas to JSON Schema format for Gemini function parameters
- Handle primitive types (string, number, boolean)
- Handle complex types (objects, arrays, enums)
- Handle optional vs required fields
- Preserve validation constraints and descriptions

### 3. Tool Definition Mapping

- Map `ToolDefinition.name` to Gemini function name
- Map `ToolDefinition.description` to Gemini function description
- Convert `ToolDefinition.inputSchema` to Gemini function parameters
- Handle tool hints and metadata appropriately
- Validate tool definitions before translation

### 4. Function Call Response Parsing

- Parse Gemini `function_call` responses back to unified format
- Extract function name and arguments correctly
- Validate function call arguments against schemas
- Handle multiple function calls in single response
- Error handling for malformed function calls

## Technical Approach

### Step 1: Study Existing Patterns

- Analyze `src/providers/openai-responses-v1/toolTranslator.ts` for structure
- Analyze `src/providers/anthropic-2023-06-01/toolTranslator.ts` for alternatives
- Study how other providers handle Zod→JSON Schema conversion
- Follow established tool system integration patterns

### Step 2: Implement Schema Conversion

```typescript
// src/providers/google-gemini-v1/toolTranslator.ts
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { z } from "zod";

export function translateToolDefinitions(
  tools: ToolDefinition[],
): GeminiFunctionDeclaration[] {
  // Implementation here
}

function zodSchemaToJsonSchema(schema: z.ZodTypeAny): object {
  // Zod to JSON Schema conversion logic
}
```

### Step 3: Implement Function Call Parsing

```typescript
export function parseFunctionCall(
  functionCall: GeminiFunctionCall,
): UnifiedFunctionCall {
  // Parse Gemini function call to unified format
}
```

### Step 4: Create Unit Tests

Write comprehensive unit tests in `src/providers/google-gemini-v1/__tests__/toolTranslator.test.ts`:

- Test tool definition translation for various schema types
- Test Zod to JSON Schema conversion accuracy
- Test function call parsing from Gemini responses
- Test error handling for invalid tool definitions
- Test edge cases (empty tools, complex schemas, nested objects)

## Acceptance Criteria

### Functional Requirements

- ✅ translateToolDefinitions() converts unified tools to Gemini format
- ✅ Tool names and descriptions map correctly
- ✅ Zod schemas convert accurately to JSON Schema format
- ✅ Function declarations follow Gemini API specification
- ✅ Tool validation prevents invalid definitions from translation
- ✅ Function call parsing extracts name and arguments correctly

### Schema Conversion Requirements

- ✅ Primitive types (string, number, boolean) convert correctly
- ✅ Object schemas with nested properties convert accurately
- ✅ Array schemas with item types convert properly
- ✅ Optional vs required field distinction preserved
- ✅ Enum values and constraints maintained in conversion
- ✅ Complex nested schemas handle without loss of information

### Function Calling Requirements

- ✅ Gemini function_call responses parse to unified format
- ✅ Function arguments validate against original schemas
- ✅ Multiple function calls in response handled correctly
- ✅ Error handling for malformed function calls
- ✅ Function execution context preserved through translation

### Technical Requirements

- ✅ Type safety with proper TypeScript interfaces
- ✅ Error handling with meaningful error messages
- ✅ Performance optimized for typical tool sets
- ✅ No 'any' types - all properly typed
- ✅ Integration with unified tool system

### Testing Requirements

- ✅ Unit tests cover all schema conversion scenarios
- ✅ Tests verify tool definition translation accuracy
- ✅ Tests check function call parsing correctness
- ✅ Tests validate error handling for edge cases
- ✅ Tests verify complex schema conversion fidelity
- ✅ Test coverage meets project standards (>90%)
- ✅ All tests pass with zero TypeScript errors

### Code Quality

- ✅ Module stays under 400 logical LOC limit
- ✅ Single responsibility: tool translation only
- ✅ No 'any' types - all properly typed
- ✅ Follows project linting and formatting standards
- ✅ Clear documentation and examples in code comments

## Files to Create/Modify

- Create: `src/providers/google-gemini-v1/toolTranslator.ts`
- Create: `src/providers/google-gemini-v1/__tests__/toolTranslator.test.ts`

## Dependencies

- Requires: T-create-gemini-api-request-and (request/response schemas)
- Requires: Core ToolDefinition types from unified tool system
- Requires: Zod library for schema manipulation
- Blocks: Provider implementation and tool integration tasks

## Out of Scope

- Tool execution logic (handled by core tool system)
- Tool registration and discovery (handled by tool router)
- Request translation (handled by main translator task)
- Response parsing for non-tool content (handled by response parser tasks)
