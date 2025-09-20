---
id: T-add-mcp-server-configuration
title: Add MCP server configuration type exports and interfaces
status: open
priority: medium
parent: F-mcp-configuration-schema
prerequisites:
  - T-extend-bridgeconfigschema
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T19:38:37.161Z
updated: 2025-09-20T19:38:37.161Z
---

# Add MCP Server Configuration Type Exports and Interfaces

## Context

This task creates dedicated TypeScript interfaces and type exports for MCP server configuration, deriving them directly from the Zod schema to maintain a single source of truth. This provides better developer experience while ensuring type definitions stay synchronized with validation rules.

## Technical Approach

Extract and export types directly from the Zod schema rather than manually duplicating interface definitions. This ensures type definitions automatically stay in sync with schema validation rules and prevents desynchronization issues.

## Detailed Implementation Requirements

### 1. Schema-Derived Type Extraction

Create type extractions that properly handle optional fields and maintain schema synchronization:

```typescript
// Extract the MCP server schema for reuse
const McpServerSchema = z.object({
  name: z.string().min(1, "MCP server name cannot be empty"),
  url: remoteUrlSchema, // Uses the same remote URL validation as the main schema
});

// Extract individual MCP server type
export type McpServerConfig = z.infer<typeof McpServerSchema>;

// Extract MCP servers array type with proper optional handling
export type McpServerConfigs = NonNullable<
  z.infer<typeof BridgeConfigSchema>["tools"]
>["mcpServers"];
```

### 2. Schema Component Export

Export the schema components for reuse in other modules:

```typescript
/**
 * Zod schema for individual MCP server configuration
 *
 * Provides runtime validation for MCP server definitions including
 * remote-only URL constraints and proper naming validation.
 */
export const McpServerSchema = z.object({
  name: z.string().min(1, "MCP server name cannot be empty"),
  url: remoteUrlSchema,
});

/**
 * Zod schema for MCP servers array with uniqueness validation
 */
export const McpServersArraySchema = z
  .array(McpServerSchema)
  .optional()
  .default([])
  .refine((servers) => {
    const names = servers.map((s) => s.name);
    return names.length === new Set(names).size;
  }, "MCP server names must be unique");
```

### 3. Validated Type Helpers

Create utility types that work with validated configurations:

```typescript
/**
 * Helper type for validated tools configuration with MCP servers
 */
export type ToolsConfigWithMcp = NonNullable<ValidatedBridgeConfig["tools"]>;

/**
 * Type guard that validates MCP server configuration using the Zod schema
 *
 * This provides proper validation that aligns exactly with schema rules
 * rather than loose type checking.
 */
export function validateMcpServerConfig(obj: unknown): obj is McpServerConfig {
  try {
    McpServerSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard that validates MCP servers array using the Zod schema
 */
export function validateMcpServerConfigs(
  arr: unknown,
): arr is McpServerConfig[] {
  try {
    McpServersArraySchema.parse(arr);
    return true;
  } catch {
    return false;
  }
}
```

### 4. Update Type Exports

Ensure all MCP-related types are properly exported:

```typescript
// Add to existing exports
export { McpServerSchema, McpServersArraySchema };

export type { McpServerConfig, McpServerConfigs, ToolsConfigWithMcp };

export { validateMcpServerConfig, validateMcpServerConfigs };
```

## Implementation Details

### Schema Synchronization Strategy

- **Single source of truth**: All types derived from Zod schemas
- **Component reuse**: Extract and reuse schema components between main schema and exports
- **Automatic updates**: Type changes automatically propagate when schema changes
- **Validation alignment**: Type guards use schema validation instead of manual checks

### Type Safety Considerations

- **Optional field handling**: Use `NonNullable` to properly extract types from optional schema fields
- **Strict validation**: Type guards use schema parsing to ensure complete validation
- **Schema-first design**: Types follow schema structure exactly
- **No manual duplication**: Eliminate risk of type/schema desynchronization

### Developer Experience

- **Direct schema imports**: Other modules can import schemas for validation
- **Consistent validation**: All validation uses the same schema rules
- **Clear type names**: Follow existing configuration type naming conventions
- **IDE support**: Full IntelliSense support with schema-derived types

## Acceptance Criteria

**Schema-Derived Types**:

- [ ] `McpServerConfig` type extracted directly from Zod schema
- [ ] `McpServerConfigs` type properly handles optional tools field with `NonNullable`
- [ ] All types stay synchronized with schema validation rules automatically
- [ ] No manual interface duplication that can become stale

**Schema Component Exports**:

- [ ] `McpServerSchema` exported for use in other modules
- [ ] `McpServersArraySchema` exported with uniqueness validation
- [ ] Schema components can be imported and reused for validation
- [ ] Remote URL validation reused from main schema implementation

**Validation Functions**:

- [ ] Type guards use Zod schema parsing instead of manual type checking
- [ ] Validation functions align exactly with schema validation rules
- [ ] Type guards provide proper TypeScript type narrowing
- [ ] Schema validation errors properly handled in type guard functions

**Type Safety Integration**:

- [ ] TypeScript compilation succeeds with all new type definitions
- [ ] No `any` types used in type definitions
- [ ] Proper handling of optional fields in type extraction
- [ ] IDE IntelliSense works correctly with schema-derived types

## Unit Testing Requirements

Include tests that verify:

- Schema-derived types properly infer from Zod schemas
- Type guards correctly validate configurations using schema rules
- Type guards reject configurations that fail schema validation
- Exported schemas can be used independently for validation
- Optional field handling works correctly with `NonNullable`

Test examples:

```typescript
describe("MCP configuration types", () => {
  it("should validate MCP server configurations with schema-based type guards", () => {
    expect(
      validateMcpServerConfig({ name: "test", url: "https://api.com" }),
    ).toBe(true);
    expect(validateMcpServerConfig({ name: "", url: "https://api.com" })).toBe(
      false,
    );
    expect(
      validateMcpServerConfig({ name: "test", url: "localhost:8080" }),
    ).toBe(false);
  });

  it("should validate MCP server arrays with uniqueness checking", () => {
    const validConfigs = [{ name: "test1", url: "https://api.com" }];
    const duplicateConfigs = [
      { name: "test", url: "https://api1.com" },
      { name: "test", url: "https://api2.com" },
    ];

    expect(validateMcpServerConfigs(validConfigs)).toBe(true);
    expect(validateMcpServerConfigs(duplicateConfigs)).toBe(false);
  });
});
```

## Files to Modify

- `/src/core/config/bridgeConfigSchema.ts` - Add schema-derived type exports
- `/src/core/config/__tests__/bridgeConfigSchema.test.ts` - Add schema-based validation tests

## Dependencies

- **Prerequisites**: T-extend-bridgeconfigschema (schema changes must be completed first)
- **Required by**: MCP client implementation tasks that need to import MCP types

## Out of Scope

- Configuration parsing or loading logic
- MCP client connection implementation
- Runtime configuration transformation
- Complex type utilities beyond schema-derived interfaces
