---
id: T-define-tooldefinition-schema
title: Define ToolDefinition schema with nested validation
status: done
priority: high
parent: F-phase-1-core-domain-and
prerequisites:
  - T-add-zod-dependency-and
affectedFiles:
  src/core/validation/commonSchemas.ts: Added toolName and toolDescription
    validation schemas following existing patterns with regex validation and
    length constraints
  src/core/tools/toolDefinitionSchema.ts: Created comprehensive Zod schema for
    ToolDefinition with discriminated union support for both Zod schemas and
    JSON Schema objects, strict validation rules, and security considerations
  src/core/tools/toolDefinition.ts: Updated to use Zod-derived types while
    maintaining backward compatibility, enhanced JSDoc with examples for both
    Zod and JSON Schema usage patterns
  src/core/tools/index.ts: Added export for ToolDefinitionSchema to make schema
    validation available to external consumers
  src/core/tools/__tests__/toolDefinitionSchema.test.ts:
    Implemented comprehensive
    test suite with 37 tests covering all validation rules, error cases, edge
    conditions, and type inference verification
log:
  - Successfully implemented comprehensive ToolDefinition Zod schema with nested
    validation supporting both Zod schemas and JSON Schema objects for maximum
    flexibility. The implementation includes strict tool name validation
    (alphanumeric, underscore, hyphen patterns, 1-50 chars), optional
    description validation (max 500 chars), robust input/output schema
    validation supporting both Zod schemas and JSON Schema objects, and flexible
    hints/metadata object support. Created comprehensive test suite with 37
    passing tests covering all validation scenarios, error cases, and edge
    conditions. All quality checks (linting, formatting, type checking) pass
    successfully.
schema: v1.0
childrenIds: []
created: 2025-09-15T05:36:07.052Z
updated: 2025-09-15T05:36:07.052Z
---

## Context

This task implements comprehensive Zod validation for the ToolDefinition interface, enhancing the existing interface in `src/core/tools/toolDefinition.ts` with runtime validation and nested schema support. The schema will support both JSON Schema-style parameters and Zod schema definitions as specified in the library architecture.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - ToolDefinition interface (lines 112-120)
- Existing Interface: `src/core/tools/toolDefinition.ts` - Current ToolDefinition interface

## Specific Implementation Requirements

### 1. Create ToolDefinition Zod Schema

- Create `src/core/tools/toolDefinitionSchema.ts`
- Define comprehensive schema that validates:
  - `name`: Required string with valid identifier pattern (alphanumeric, underscore, hyphen)
  - `description`: Optional string with reasonable length limits
  - `inputSchema`: Required Zod schema for tool input validation
  - `outputSchema`: Optional Zod schema for tool output validation
  - `hints`: Optional record for provider-specific mapping hints
  - `metadata`: Optional record for additional tool metadata

### 2. Schema Validation Rules

- **Name Validation**: Valid tool identifier pattern, 1-50 characters
- **Description Validation**: Optional string, max 500 characters
- **Input Schema**: Must be valid Zod schema with proper structure
- **Output Schema**: Optional valid Zod schema
- **Hints**: Object with string keys and unknown values for provider flexibility
- **Metadata**: Object with string keys and unknown values

### 3. Nested Schema Support

- Support for Zod schemas as first-class values in inputSchema/outputSchema
- Validation that ensures inputSchema is a proper Zod schema
- Type inference that maintains Zod schema types
- Integration with existing toolHandler.ts patterns

## Technical Approach

### File Structure

```
src/core/tools/
├── toolDefinition.ts        # Update to use Zod types
├── toolDefinitionSchema.ts  # New Zod schema (this task)
├── toolHandler.ts           # Existing ToolHandler interface
├── toolExecutionContext.ts  # Existing context interface
└── index.ts                 # Updated exports
```

### Implementation Steps

1. Create base ToolDefinition schema with string validations
2. Add Zod schema validation for inputSchema/outputSchema fields
3. Implement helper functions for schema validation
4. Create validation functions for tool registration
5. Update existing toolDefinition.ts to export Zod-derived types
6. Implement comprehensive unit tests with schema examples
7. Add JSDoc documentation with tool definition examples

### Schema Structure

```typescript
const ToolNameSchema = z
  .string()
  .min(1, "Tool name is required")
  .max(50, "Tool name must be 50 characters or less")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Tool name must contain only alphanumeric characters, underscores, and hyphens",
  );

export const ToolDefinitionSchema = z.object({
  name: ToolNameSchema,
  description: z.string().max(500).optional(),
  inputSchema: z.instanceof(z.ZodType),
  outputSchema: z.instanceof(z.ZodType).optional(),
  hints: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
```

## Detailed Acceptance Criteria

### Tool Validation Requirements

- ✅ Valid tool names accepted (alphanumeric, underscore, hyphen patterns)
- ✅ Invalid tool names rejected (spaces, special characters, empty strings)
- ✅ Description length limits enforced (500 character maximum)
- ✅ Input schema must be valid Zod schema instance
- ✅ Output schema validation optional but must be valid Zod schema when provided

### Schema Integration Requirements

- ✅ Zod schemas properly validated as first-class values
- ✅ Type inference maintains Zod schema types
- ✅ Integration with tool handler patterns works correctly
- ✅ Tool registration validation prevents invalid tools

### Metadata Validation

- ✅ Hints object accepts provider-specific mapping data
- ✅ Metadata object accepts arbitrary tool metadata
- ✅ Both optional fields handle undefined/null values correctly
- ✅ Object validation prevents prototype pollution

### Error Handling

- ✅ Clear error messages for each validation failure
- ✅ Field-level error reporting with specific validation issues
- ✅ Helpful suggestions for fixing common validation errors

## Dependencies

**Prerequisites:**

- `T-add-zod-dependency-and` - Zod infrastructure must be available
- Existing ToolHandler and ToolExecutionContext interfaces

**Blocks:**

- BridgeClient tool integration
- Tool router implementation (future phases)

## Security Considerations

### Input Validation

- Strict tool name validation to prevent injection attacks
- Description length limits to prevent DoS attacks
- Safe handling of hints and metadata objects
- Prevention of prototype pollution through object validation

### Schema Security

- Validation that inputSchema/outputSchema are genuine Zod schemas
- Prevention of malicious schema injection
- Safe handling of nested schema validation

## Testing Requirements

### Unit Tests (Include in this task)

- **Tool Name Tests**: Valid names, invalid characters, length limits
- **Description Tests**: Valid descriptions, length limits, optional handling
- **Input Schema Tests**: Valid Zod schemas, invalid schema objects
- **Output Schema Tests**: Valid Zod schemas, optional handling, invalid types
- **Hints Tests**: Valid hint objects, edge cases, optional handling
- **Metadata Tests**: Valid metadata objects, edge cases, optional handling
- **Integration Tests**: Complete tool definition validation
- **Error Message Tests**: Clear, helpful validation error messages

### Test File: `src/core/tools/__tests__/toolDefinitionSchema.test.ts`

### Example Test Cases

```typescript
describe("ToolDefinitionSchema", () => {
  describe("tool name validation", () => {
    it("accepts valid tool names", () => {
      const validTool = {
        name: "weather_forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(validTool)).not.toThrow();
    });

    it("rejects invalid tool names with spaces", () => {
      const invalidTool = {
        name: "weather forecast",
        inputSchema: z.object({ location: z.string() }),
      };
      expect(() => ToolDefinitionSchema.parse(invalidTool)).toThrow();
    });
  });

  describe("schema validation", () => {
    it("accepts valid Zod input schema", () => {
      const toolWithSchema = {
        name: "test_tool",
        inputSchema: z.object({
          param1: z.string(),
          param2: z.number().optional(),
        }),
      };
      expect(() => ToolDefinitionSchema.parse(toolWithSchema)).not.toThrow();
    });

    it("rejects non-Zod input schema", () => {
      const toolWithInvalidSchema = {
        name: "test_tool",
        inputSchema: { type: "object" }, // Plain object, not Zod schema
      };
      expect(() => ToolDefinitionSchema.parse(toolWithInvalidSchema)).toThrow();
    });
  });
});
```

## Out of Scope

- Tool handler implementation (separate interfaces exist)
- Tool execution and routing (future phases)
- Provider-specific tool format translation (future phases)
- Built-in tool definitions (future phases)
