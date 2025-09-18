---
id: T-build-xai-tool-translator-for
title: Build xAI tool translator for function calling
status: done
priority: medium
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-implement-xai-request-and
affectedFiles:
  src/providers/xai-v1/toolTranslator.ts: Created comprehensive single tool
    translation functionality with proper Zod-to-JSON Schema conversion,
    provider hints support, and validation following OpenAI patterns
  src/providers/xai-v1/toolsTranslator.ts:
    Created array wrapper for multiple tool
    translation with detailed error handling and context for failed conversions
  src/providers/xai-v1/xaiTool.ts: Created XAITool interface type definition
    following OpenAI compatibility format
  src/providers/xai-v1/xaiToolFunction.ts: Created XAIToolFunction interface type definition for tool function structure
  src/providers/xai-v1/translator.ts:
    Extracted tool translation functionality to
    dedicated modules and updated imports to use new toolsTranslator
  src/providers/xai-v1/__tests__/fixtures/toolExamples.ts: Created comprehensive
    test fixtures with tool definitions and expected xAI formats for testing
  src/providers/xai-v1/__tests__/toolTranslator.test.ts: Created comprehensive
    unit test suite with 22 test cases covering schema conversion, error
    handling, and type validation
  src/providers/xai-v1/__tests__/toolsTranslator.test.ts:
    Created unit test suite
    with 11 test cases covering array translation, error handling, and
    performance testing
  src/providers/xai-v1/__tests__/translator.test.ts: Updated existing test
    expectation to match improved Zod schema conversion instead of placeholder
    behavior
log:
  - Successfully implemented xAI tool translator following OpenAI patterns.
    Created dedicated tool translation modules with comprehensive Zod-to-JSON
    Schema conversion, extracted existing functionality from translator.ts, and
    provided full test coverage. Fixed existing test that was expecting
    placeholder behavior to match the new working implementation. All quality
    checks pass and 59 tests are passing.
schema: v1.0
childrenIds: []
created: 2025-09-17T19:59:45.387Z
updated: 2025-09-17T19:59:45.387Z
---

# Build xAI Tool Translator for Function Calling

## Context

This task creates a dedicated tool translator for xAI's Responses API that follows the established patterns from the OpenAI provider. Currently, tool translation functionality is embedded in `translator.ts`, but it needs to be extracted and enhanced to properly handle xAI's Responses API format while maintaining consistency with the codebase architecture.

## Problem Statement

The existing `translator.ts` contains basic tool translation, but:

1. Tool functionality should be separated into dedicated files (following OpenAI pattern)
2. Current implementation has placeholder Zod-to-JSON conversion
3. xAI's Responses API format differs from standard OpenAI chat format
4. Missing tool result formatting for conversation continuity

## Reference Implementation

Follow these established patterns:

- **Primary Reference**: `src/providers/openai-responses-v1/toolTranslator.ts` - Single tool translation
- **Array Translation**: `src/providers/openai-responses-v1/toolsTranslator.ts` - Multiple tools
- **Tool Call Parsing**: `src/providers/openai-responses-v1/toolCallParser.ts` - Response parsing (already exists for xAI)
- **Core Interface**: `src/core/tools/toolDefinition.ts` - Unified tool format

## xAI Responses API Format

Based on the provided API documentation, xAI uses this format:

**Request Structure:**

- `tools`: Array of tool definitions (similar to OpenAI)
- `tool_choice`: Tool selection strategy

**Response Structure:**

- `output`: Array containing messages (not `choices` like OpenAI)
- `output[].tool_calls`: Tool calls within messages
- Tool calls follow OpenAI format: `{id, type: "function", function: {name, arguments}}`

## Implementation Requirements

Create `src/providers/xai-v1/toolTranslator.ts` following OpenAI patterns:

### 1. Single Tool Translation (like OpenAI)

```typescript
export function translateToolDefinitionToXAI(toolDef: ToolDefinition): XAITool;
```

- Convert ToolDefinition to xAI function format
- Handle Zod schema to JSON Schema conversion (improve existing placeholder)
- Support provider hints for custom xAI function definitions
- Follow exact pattern from `openai-responses-v1/toolTranslator.ts`

### 2. Multiple Tools Translation

```typescript
export function translateToolsForXAI(tools: ToolDefinition[]): XAITool[];
```

- Convert arrays of tools with proper error handling
- Follow pattern from `openai-responses-v1/toolsTranslator.ts`

### 3. Tool Result Formatting (Missing Functionality)

```typescript
export function formatToolResultsForXAI(
  toolResults: ToolResult[],
): MessageInput[];
```

- Format tool execution results for follow-up requests
- Convert to xAI's expected message format for conversation continuity
- Handle multiple tool results in single request

### 4. Extract from translator.ts

- Move existing `translateTools()` function from `translator.ts` to new file
- Update `translator.ts` to import from `toolTranslator.ts`
- Maintain backward compatibility

## Acceptance Criteria

### Core Functionality

✅ **Tool Definition Translation**: Single and multiple tool conversion following OpenAI patterns
✅ **Zod Schema Conversion**: Proper Zod-to-JSON Schema conversion (fix current placeholder)
✅ **Tool Result Formatting**: Format tool execution results for conversation continuity
✅ **Error Handling**: Comprehensive validation with clear error messages
✅ **Provider Hints**: Support xAI-specific tool customizations

### Architecture Alignment

✅ **File Organization**: Separate tool translation from main translator (follow OpenAI pattern)
✅ **Function Naming**: Consistent with OpenAI patterns (`translateToolDefinitionToXAI`)
✅ **Import Structure**: Clean imports, proper type exports
✅ **Backward Compatibility**: Existing translator.ts continues to work

### Testing Requirements

✅ **Unit Tests**: Test coverage for all translation functions
✅ **Schema Validation**: Test Zod schema conversion edge cases
✅ **Error Scenarios**: Test invalid tool definitions and malformed input
✅ **Integration**: Verify with actual xAI tool calling workflow

## Implementation Steps

1. **Create toolTranslator.ts**: Set up new file with OpenAI-style structure
2. **Implement Single Tool Translation**: `translateToolDefinitionToXAI()`
3. **Implement Multiple Tools**: `translateToolsForXAI()` wrapper
4. **Add Tool Result Formatting**: New functionality for conversation continuity
5. **Improve Zod Conversion**: Replace placeholder with proper implementation
6. **Extract from translator.ts**: Move existing functionality and update imports
7. **Add Comprehensive Tests**: Cover all functions and edge cases
8. **Update Integration**: Ensure main provider uses new tool translator

## Dependencies

- **Uses**: Existing toolCallParser.ts for response parsing
- **Prerequisites**: Request/response schemas (already implemented)
- **Updates**: translator.ts imports (maintain compatibility)

## Success Criteria

- Tool translation follows OpenAI patterns exactly
- Zod-to-JSON conversion works for complex schemas
- Tool results format correctly for conversation flow
- All existing functionality continues to work
- Comprehensive test coverage with real xAI examples
