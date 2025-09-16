---
id: T-create-echo-tool-with
title: Create Echo tool with comprehensive validation
status: open
priority: medium
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-implement-toolrouter-with
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:28:55.619Z
updated: 2025-09-16T00:28:55.619Z
---

# Create Echo Tool with Comprehensive Validation

## Context

Implement the Echo built-in tool as specified in Phase 5 requirements. This serves as both a test tool for the system and a reference implementation for future built-in tools.

Creates the first concrete tool in `src/tools/builtin/echo/` following the architectural patterns established for the tool system.

Reference feature F-tool-system-core-openai-tool for complete context.

## Implementation Requirements

### Files to Create

```
src/tools/builtin/echo/
  echoTool.ts              # Tool definition and handler
  echoSchema.ts            # Zod validation schemas
  index.ts                 # Module exports
  __tests__/echoTool.test.ts # Unit tests

src/tools/builtin/
  index.ts                 # Export all built-in tools
```

### Specific Implementation Details

1. **Echo Tool Definition** (`src/tools/builtin/echo/echoTool.ts`):

```typescript
export const echoToolDefinition: ToolDefinition = {
  name: "echo",
  description: "Echo back the input parameters for testing and validation",
  inputSchema: EchoInputSchema,
  outputSchema: EchoOutputSchema,
  hints: {
    // OpenAI function calling hints
    openai: {
      function: {
        name: "echo",
        description: "Echo back input for testing",
      },
    },
  },
};

export const echoToolHandler: ToolHandler = async (
  parameters: unknown,
  context: ToolExecutionContext,
): Promise<EchoOutput> => {
  // Validate input parameters against schema
  const validatedInput = EchoInputSchema.parse(parameters);

  // Echo back with metadata
  return {
    echoed: validatedInput,
    metadata: {
      timestamp: new Date().toISOString(),
      contextId: context.contextId || "unknown",
    },
  };
};
```

2. **Zod Schemas** (`src/tools/builtin/echo/echoSchema.ts`):

```typescript
// Flexible input schema that accepts any structure
export const EchoInputSchema = z
  .record(z.unknown())
  .describe("Input parameters to echo back");

// Structured output schema with metadata
export const EchoOutputSchema = z.object({
  echoed: z.record(z.unknown()).describe("Echoed input parameters"),
  metadata: z.object({
    timestamp: z.string().describe("Execution timestamp"),
    contextId: z.string().describe("Execution context identifier"),
  }),
});

export type EchoInput = z.infer<typeof EchoInputSchema>;
export type EchoOutput = z.infer<typeof EchoOutputSchema>;
```

3. **Module Organization**:
   - Export tool definition and handler from echo/index.ts
   - Export echo tool from builtin/index.ts
   - Update main tools/index.ts to export builtin tools

4. **Integration with Registry**:
   - Provide registration helper function
   - Include proper error handling for registration failures
   - Support both automatic and manual registration

## Technical Approach

- **Schema-First Design**: Use Zod schemas for all validation
- **Type Safety**: Full TypeScript types generated from schemas
- **Error Handling**: Comprehensive error cases with ToolError
- **Metadata Enrichment**: Include execution context in results

## Acceptance Criteria

### Functional Requirements

- [ ] Echo tool accepts any JSON-serializable input parameters
- [ ] Tool returns identical input data in structured output format
- [ ] Input validation using Zod schema with helpful error messages
- [ ] Output includes execution metadata (timestamp, context)
- [ ] Tool registration works with ToolRegistry

### Data Validation

- [ ] Input parameters validated against flexible record schema
- [ ] Invalid inputs result in clear validation error messages
- [ ] Output format matches EchoOutputSchema exactly
- [ ] Schema validation errors include parameter-specific details

### Integration Points

- [ ] Tool integrates seamlessly with ToolRouter execution
- [ ] Registration works with ToolRegistry without errors
- [ ] ToolExecutionContext properly utilized for metadata
- [ ] Error handling follows ToolError patterns

### Testing Requirements

- [ ] Test with various input types (strings, numbers, objects, arrays)
- [ ] Test validation error cases (invalid input formats)
- [ ] Test metadata generation (timestamp, context)
- [ ] Test integration with ToolRouter execution pipeline

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Input/Output Tests**:
   - Echo simple values (strings, numbers, booleans)
   - Echo complex objects with nested structures
   - Echo arrays with mixed content types
   - Verify output format matches schema exactly

2. **Validation Tests**:
   - Valid inputs pass validation successfully
   - Invalid inputs (null, undefined) handled gracefully
   - Schema validation errors include helpful messages
   - Edge cases (empty objects, large data structures)

3. **Integration Tests**:
   - Registration with ToolRegistry works correctly
   - Execution through ToolRouter produces expected results
   - Context information properly passed and utilized
   - Error handling integrates with ToolError system

4. **Metadata Tests**:
   - Timestamp generation in valid ISO format
   - Context ID propagation from execution context
   - Metadata structure matches schema requirements

## Security Considerations

- **Input Sanitization**: All inputs validated against schema before processing
- **Output Safety**: Echo output structure prevents injection attacks
- **Context Isolation**: Tool execution isolated from system state
- **Data Privacy**: No logging or persistence of echoed data

## Out of Scope

- Advanced echo features (transformation, filtering)
- Persistent storage of echo results
- Network operations or external system integration
- Complex error recovery or retry logic
