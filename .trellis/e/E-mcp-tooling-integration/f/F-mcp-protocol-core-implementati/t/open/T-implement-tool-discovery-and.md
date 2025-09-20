---
id: T-implement-tool-discovery-and
title: Implement tool discovery and MCP-to-Bridge schema translation
status: open
priority: high
parent: F-mcp-protocol-core-implementati
prerequisites:
  - T-create-mcp-client-class-with
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T22:55:15.482Z
updated: 2025-09-20T22:55:15.482Z
---

# Implement tool discovery and MCP-to-Bridge schema translation

## Context

Implement tool discovery from MCP servers and bidirectional schema translation between MCP JSON Schema format and the unified `ToolDefinition` format used by the LLM Bridge library. This enables MCP tools to integrate seamlessly with the existing tool system.

**Related Issues:**

- Parent Feature: F-mcp-protocol-core-implementati
- Epic: E-mcp-tooling-integration
- Prerequisite: T-create-mcp-client-class-with (MCP client connection)

**Existing Infrastructure:**

- `ToolDefinition` interface in `src/core/tools/toolDefinition.ts`
- `ToolDefinitionSchema` Zod schema in `src/core/tools/toolDefinitionSchema.ts`
- Validation framework in `src/core/validation/`

## Implementation Requirements

### File Locations

Extend `src/tools/mcp/mcpClient.ts` with tool discovery methods and create helper modules:

- `src/tools/mcp/mcpSchemaTranslator.ts` - Schema translation utilities
- `src/tools/mcp/mcpToolTypes.ts` - MCP-specific type definitions

### Tool Discovery Implementation

Add to `McpClient` class:

```typescript
export class McpClient {
  // ... existing connection methods

  // Tool discovery
  async discoverTools(): Promise<ToolDefinition[]>;
  async refreshTools(): Promise<ToolDefinition[]>;

  // Individual tool operations
  async getToolDefinition(toolName: string): Promise<ToolDefinition | null>;

  private async listToolsFromServer(): Promise<McpToolSchema[]>;
  private translateMcpTool(mcpTool: McpToolSchema): ToolDefinition;
}
```

### Schema Translation Logic

1. **MCP to Bridge Translation**
   - Convert MCP JSON Schema parameters to Zod schemas where possible
   - Handle complex JSON Schema constructs with runtime validation
   - Maintain parameter validation integrity
   - Preserve tool metadata (name, description)

2. **Bridge to MCP Translation** (for future tool execution)
   - Convert unified tool call format to MCP tool call format
   - Handle parameter serialization and type conversion
   - Maintain response format compatibility

### MCP Tool Discovery Protocol

1. **Tool Listing Request**
   - Send `tools/list` JSON-RPC request to MCP server
   - Parse response containing available tool definitions
   - Validate tool schema format before translation

2. **Tool Schema Validation**
   - Validate MCP tool schemas against MCP specification
   - Ensure required fields (name, description, inputSchema) are present
   - Handle optional fields (outputSchema) appropriately

3. **Error Handling**
   - Handle server errors during tool discovery
   - Provide clear error messages for invalid tool schemas
   - Gracefully handle partial tool discovery failures

## Technical Approach

### MCP Tool Types

Create `src/tools/mcp/mcpToolTypes.ts`:

```typescript
export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: JSONSchema; // JSON Schema format
  outputSchema?: JSONSchema;
}

export interface McpToolListResponse {
  tools: McpToolSchema[];
}
```

### Schema Translator

Create `src/tools/mcp/mcpSchemaTranslator.ts`:

```typescript
export class McpSchemaTranslator {
  // Convert MCP JSON Schema to Zod schema
  static translateInputSchema(jsonSchema: JSONSchema): z.ZodSchema;

  // Convert MCP tool to Bridge ToolDefinition
  static translateMcpTool(mcpTool: McpToolSchema): ToolDefinition;

  // Validate schema translation accuracy
  static validateTranslation(
    original: JSONSchema,
    translated: z.ZodSchema,
  ): boolean;
}
```

### JSON Schema to Zod Conversion

Handle common JSON Schema patterns:

- **Object types**: Convert to `z.object()`
- **Primitive types**: Map to `z.string()`, `z.number()`, `z.boolean()`
- **Arrays**: Convert to `z.array()`
- **Enums**: Convert to `z.enum()` or `z.union()`
- **Required fields**: Use Zod's required/optional patterns
- **Complex schemas**: Fall back to runtime validation with `z.any().refine()`

### Integration with Tool System

- Follow existing patterns from `src/core/tools/toolDefinition.ts`
- Ensure translated tools are compatible with `ToolDefinitionSchema`
- Maintain type safety throughout translation process
- Preserve all validation semantics from original MCP schemas

## Detailed Acceptance Criteria

### Tool Discovery

- [ ] Successfully sends `tools/list` requests to MCP server
- [ ] Parses tool list responses according to MCP specification
- [ ] Handles empty tool lists gracefully
- [ ] Provides error handling for discovery failures
- [ ] Supports tool list refresh functionality

### Schema Translation

- [ ] **Converts MCP JSON Schema to compatible Zod schemas**
- [ ] **Maintains parameter validation integrity across translation**
- [ ] Handles all common JSON Schema types (object, string, number, boolean, array)
- [ ] Supports optional and required field translation
- [ ] Preserves enum and union type constraints
- [ ] **Bidirectional translation maintains data integrity**

### MCP Tool Format Support

- [ ] Correctly parses MCP tool name and description
- [ ] Handles inputSchema validation and conversion
- [ ] Supports optional outputSchema fields
- [ ] Validates tool schemas before translation
- [ ] Rejects malformed tool definitions with clear errors

### Integration Compliance

- [ ] Translated tools pass `ToolDefinitionSchema` validation
- [ ] Generated `ToolDefinition` objects are compatible with existing tool system
- [ ] Maintains type safety throughout translation process
- [ ] Follows established validation patterns from existing codebase

### Error Handling

- [ ] Gracefully handles tool discovery failures
- [ ] Provides actionable error messages for schema translation failures
- [ ] Handles partial tool list responses
- [ ] Integrates with existing error taxonomy

## Testing Requirements

### Unit Tests

Create comprehensive test suites:

- `src/tools/mcp/__tests__/mcpSchemaTranslator.test.ts`
- Add tool discovery tests to `src/tools/mcp/__tests__/mcpClient.test.ts`

### Test Coverage Areas

- **Schema Translation**: All JSON Schema type conversions
- **Tool Discovery**: Success, failure, and edge cases
- **Validation**: Schema validation and error handling
- **Integration**: Compatibility with existing tool system
- **Round-trip**: MCP → Bridge → validation consistency

### Mock Server Testing

- Mock MCP server responses for tool discovery
- Various tool schema formats (simple, complex, edge cases)
- Error responses and malformed schemas
- Empty tool lists and partial failures

## Security Considerations

### Schema Validation

- Validate all MCP tool schemas before translation
- Sanitize tool names and descriptions to prevent injection
- Limit schema complexity to prevent DoS attacks
- Apply size limits to tool definitions and parameters

### Parameter Safety

- Ensure translated schemas maintain original validation semantics
- Prevent code injection through parameter validation
- Validate response data types and formats
- Apply consistent validation across all tool interactions

## Performance Requirements

### Translation Performance

- Tool discovery completes within 2 seconds for typical servers
- Schema translation overhead less than 10ms per tool
- Efficient caching for repeated schema validations
- Memory usage scales linearly with number of tools

### Resource Efficiency

- Cache translated schemas to avoid repeated conversion
- Efficient JSON Schema parsing and validation
- Minimal memory footprint for tool definitions
- Cleanup of unused tool definitions

## Dependencies

- `src/core/tools/toolDefinition.ts` - Target tool format
- `src/core/tools/toolDefinitionSchema.ts` - Validation schema
- `src/core/validation/` - Validation framework
- `zod` library for schema conversion
- JSON Schema validation library

## Out of Scope

- Tool execution logic (handled by tool registry integration)
- Complex JSON Schema features (anyOf, oneOf, conditionals)
- Custom validation rules beyond standard JSON Schema
- Performance optimization for large tool sets (future enhancement)
- Tool versioning and schema evolution (future enhancement)
