---
id: T-add-openai-tool-format
title: Add OpenAI tool format translation
status: done
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-create-echo-tool-with
affectedFiles:
  src/providers/openai-responses-v1/openAIToolSchema.ts:
    Created comprehensive Zod
    validation schemas for OpenAI function calling format with proper name
    validation and parameter structure
  src/providers/openai-responses-v1/toolTranslator.ts: Implemented main
    translation logic converting ToolDefinition to OpenAI format with Zod schema
    conversion and provider hints support
  src/providers/openai-responses-v1/toolsTranslator.ts:
    Created separate file for
    array translation following one-export-per-file rule with comprehensive
    error handling
  src/providers/openai-responses-v1/requestSchema.ts: Updated request schema to
    include tools and tool_choice fields for OpenAI function calling support
  src/providers/openai-responses-v1/translator.ts: Integrated tool translation
    with existing request building to include tools when provided in requests
  src/providers/openai-responses-v1/__tests__/fixtures/toolExamples.ts:
    Created comprehensive test fixtures with various ToolDefinition examples and
    expected OpenAI format outputs
  src/providers/openai-responses-v1/__tests__/toolTranslator.test.ts:
    Implemented extensive unit test suite with 20 test cases covering schema
    conversion, provider hints, error handling, and edge cases
log:
  - >-
    Successfully implemented OpenAI tool format translation that converts
    unified ToolDefinition format to OpenAI's function calling format. The
    implementation includes comprehensive Zod schema validation for OpenAI
    formats, translation functions for schema conversion, and seamless
    integration with existing request building.


    Key features implemented:

    - OpenAI tool format schemas with strict validation

    - Zod to JSON Schema conversion supporting common types (string, number,
    boolean, object, array, optional, enum, default)

    - Provider hints support for custom OpenAI function definitions

    - Comprehensive error handling with ValidationError

    - Integration with existing OpenAI request translator

    - Full test coverage with 20 test cases covering all functionality


    The solution enables OpenAI provider to use tools defined in the unified
    format while maintaining backward compatibility and following project
    security standards.
schema: v1.0
childrenIds: []
created: 2025-09-16T00:29:34.228Z
updated: 2025-09-16T00:29:34.228Z
---

# Add OpenAI Tool Format Translation

## Context

Implement translation between unified ToolDefinition format and OpenAI's function/tool calling format. This enables OpenAI provider to use tools defined in the unified format.

Extends the existing OpenAI provider in `src/providers/openai-responses-v1/` following established patterns from `translator.ts` and `responseParser.ts`.

Reference feature F-tool-system-core-openai-tool for complete context.

## Implementation Requirements

### Files to Create

```
src/providers/openai-responses-v1/
  toolTranslator.ts                    # Main translation logic
  openAIToolSchema.ts                  # OpenAI format schemas
  __tests__/toolTranslator.test.ts     # Unit tests
  __tests__/fixtures/toolExamples.ts   # Test fixtures
```

### Specific Implementation Details

1. **OpenAI Tool Format Schema** (`src/providers/openai-responses-v1/openAIToolSchema.ts`):

```typescript
// OpenAI function calling format
export const OpenAIFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
  }),
});

// OpenAI tool format (newer API)
export const OpenAIToolSchema = z.object({
  type: z.literal("function"),
  function: OpenAIFunctionSchema,
});
```

2. **Translation Functions** (`src/providers/openai-responses-v1/toolTranslator.ts`):

```typescript
// Convert unified ToolDefinition to OpenAI function format
export function translateToolDefinitionToOpenAI(
  toolDef: ToolDefinition,
): OpenAITool {
  // Extract JSON Schema from Zod schema or use provided JSON Schema
  const jsonSchema = extractJSONSchema(toolDef.inputSchema);

  return {
    type: "function",
    function: {
      name: toolDef.name,
      description: toolDef.description || `Execute ${toolDef.name} tool`,
      parameters: {
        type: "object",
        properties: jsonSchema.properties || {},
        required: jsonSchema.required || [],
        additionalProperties: false,
      },
    },
  };
}

// Convert multiple tool definitions for OpenAI request
export function translateToolsForOpenAI(tools: ToolDefinition[]): OpenAITool[] {
  return tools.map(translateToolDefinitionToOpenAI);
}

// Extract JSON Schema from Zod schema
function extractJSONSchema(zodSchema: z.ZodTypeAny): JSONSchema {
  // Implementation to convert Zod schemas to JSON Schema format
  // Handle common Zod types: string, number, boolean, object, array
  // Use hints from ToolDefinition.hints.openai if available
}
```

3. **Schema Extraction Logic**:
   - Convert Zod schemas to JSON Schema format for OpenAI
   - Handle common Zod types (string, number, boolean, object, array)
   - Support optional fields and default values
   - Include validation constraints (min/max, enum values)
   - Fallback to hints.openai.function when schema conversion fails

4. **Integration Points**:
   - Extend existing translator.ts to include tool definitions in requests
   - Update request building to include tools array when tools provided
   - Ensure backward compatibility with non-tool requests

## Technical Approach

- **Schema Mapping**: Convert Zod schemas to OpenAI JSON Schema format
- **Error Handling**: Graceful fallback when schema conversion fails
- **Type Safety**: Full TypeScript types for OpenAI formats
- **Provider Integration**: Seamless integration with existing OpenAI provider

## Acceptance Criteria

### Functional Requirements

- [ ] Convert ToolDefinition to valid OpenAI function format
- [ ] Handle various Zod schema types (primitives, objects, arrays)
- [ ] Support optional parameters and required field validation
- [ ] Generate proper JSON Schema from Zod schemas
- [ ] Integrate with existing OpenAI request translation

### Schema Translation

- [ ] Zod string schemas convert to JSON Schema string type
- [ ] Zod number schemas convert with proper constraints
- [ ] Zod object schemas convert with nested properties
- [ ] Zod array schemas convert with item type definitions
- [ ] Optional fields marked correctly in required array

### OpenAI Compatibility

- [ ] Generated function schemas validate against OpenAI API requirements
- [ ] Tool names follow OpenAI naming conventions (alphanumeric, underscore)
- [ ] Descriptions provide helpful context for LLM tool selection
- [ ] Parameter schemas include proper type and constraint information

### Error Handling

- [ ] Unsupported Zod types handled gracefully with clear errors
- [ ] Invalid tool names sanitized or rejected with helpful messages
- [ ] Schema conversion failures fall back to hints when available
- [ ] Translation errors don't break request processing

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Schema Translation Tests**:
   - Convert simple Zod schemas (string, number, boolean)
   - Convert complex objects with nested properties
   - Convert arrays with various item types
   - Handle optional vs required field designation

2. **OpenAI Format Tests**:
   - Generated functions validate against OpenAI schema
   - Tool names conform to OpenAI naming requirements
   - Parameter schemas include proper constraints
   - Output format matches OpenAI API documentation

3. **Edge Case Tests**:
   - Empty tool definitions handled gracefully
   - Unsupported Zod types fall back appropriately
   - Invalid tool names sanitized or rejected
   - Large/complex schemas convert without errors

4. **Integration Tests**:
   - Translation integrates with existing request building
   - Multiple tools converted correctly in batch
   - Hints override schema conversion when present

## Security Considerations

- **Input Validation**: Tool definitions validated before translation
- **Name Sanitization**: Tool names sanitized for OpenAI compatibility
- **Schema Safety**: Generated schemas don't expose sensitive information
- **Error Handling**: Translation errors don't expose internal state

## Out of Scope

- Response parsing (handled by separate tool call parser task)
- Tool execution (handled by ToolRouter)
- Advanced schema features (custom validators, complex unions)
- Performance optimization for large tool sets
