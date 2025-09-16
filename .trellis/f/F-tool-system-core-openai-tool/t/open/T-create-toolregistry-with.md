---
id: T-create-toolregistry-with
title: Create ToolRegistry with registration and discovery
status: open
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-implement-core-tool-types-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:27:44.430Z
updated: 2025-09-16T00:27:44.430Z
---

# Create ToolRegistry with Registration and Discovery

## Context

Implement the ToolRegistry class for managing tool registration, discovery, and lifecycle. This provides the core registry functionality that ToolRouter will use for tool management.

Follows registry patterns established in `src/core/providers/inMemoryProviderRegistry.ts` and `src/core/models/inMemoryModelRegistry.ts`.

Reference feature F-tool-system-core-openai-tool for complete context.

## Implementation Requirements

### Files to Create

```
src/core/tools/
  toolRegistry.ts           # Main ToolRegistry interface
  inMemoryToolRegistry.ts   # In-memory implementation
  __tests__/toolRegistry.test.ts # Unit tests
```

### Specific Implementation Details

1. **Create ToolRegistry Interface** (`src/core/tools/toolRegistry.ts`):

```typescript
export interface ToolRegistry {
  // Registration
  register(
    name: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void;
  unregister(name: string): boolean;

  // Discovery
  has(name: string): boolean;
  get(
    name: string,
  ): { definition: ToolDefinition; handler: ToolHandler } | undefined;
  getAll(): Map<string, { definition: ToolDefinition; handler: ToolHandler }>;
  getNames(): string[];

  // Metadata
  size(): number;
  clear(): void;
}
```

2. **Create In-Memory Implementation** (`src/core/tools/inMemoryToolRegistry.ts`):
   - Use Map<string, RegistryEntry> for storage
   - Validate tool definitions on registration using ToolDefinitionSchema
   - Prevent duplicate registrations (throw ToolError)
   - Include registration metadata (timestamp, source)

3. **Registration Validation**:
   - Validate ToolDefinition against schema before registration
   - Validate ToolHandler is a function
   - Ensure tool names are unique (case-sensitive)
   - Sanitize tool names (alphanumeric, underscore, dash only)

4. **Error Handling**:
   - Use existing ToolError class for all registry errors
   - Provide specific error messages for different failure cases
   - Include context information in error details

## Technical Approach

- **Follow existing registry patterns** from provider and model registries
- **Use Map for O(1) lookup performance** on tool discovery
- **Implement defensive validation** on all inputs
- **Include comprehensive error handling** with ToolError

## Acceptance Criteria

### Functional Requirements

- [ ] Register tools with name, definition, and handler successfully
- [ ] Prevent duplicate tool registration with clear error messages
- [ ] Discover registered tools by name with O(1) performance
- [ ] List all registered tools and get registry metadata
- [ ] Unregister tools and handle non-existent tool cases gracefully

### Data Validation

- [ ] Tool definitions validated against ToolDefinitionSchema on registration
- [ ] Tool names validated for allowed characters (alphanumeric, underscore, dash)
- [ ] Tool handlers validated as callable functions
- [ ] Registration prevents overwriting existing tools

### Error Handling

- [ ] ToolError thrown for invalid tool definitions
- [ ] ToolError thrown for duplicate registrations
- [ ] ToolError thrown for invalid tool names
- [ ] Error context includes tool name and validation details

### Performance Requirements

- [ ] Tool lookup under 1ms for registries with 100+ tools
- [ ] Memory usage scales linearly with number of registered tools
- [ ] Registration operations under 5ms each

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Registration Tests**:
   - Register valid tools successfully
   - Reject duplicate tool names
   - Validate tool definitions on registration
   - Handle invalid tool handlers

2. **Discovery Tests**:
   - Find registered tools by name
   - Return undefined for non-existent tools
   - List all registered tools correctly
   - Get accurate registry size and metadata

3. **Validation Tests**:
   - Reject invalid tool names (special characters, empty strings)
   - Validate ToolDefinition schema compliance
   - Handle edge cases (null/undefined inputs)

4. **Error Handling Tests**:
   - ToolError thrown for all error conditions
   - Error messages are descriptive and actionable
   - Error context includes relevant debugging information

## Security Considerations

- **Input Validation**: All registration inputs validated against schemas
- **Name Sanitization**: Tool names sanitized to prevent injection attacks
- **Handler Validation**: Tool handlers validated as callable functions only
- **Error Information**: Error messages don't expose sensitive registry internals

## Out of Scope

- Tool execution logic (handled by ToolRouter task)
- Provider-specific tool registration (handled by OpenAI integration tasks)
- Persistent storage (in-memory only for Phase 5)
- Advanced registry features (versioning, namespaces)
