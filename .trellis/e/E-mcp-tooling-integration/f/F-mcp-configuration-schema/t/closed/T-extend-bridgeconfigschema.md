---
id: T-extend-bridgeconfigschema
title: Extend BridgeConfigSchema with MCP server configuration field
status: done
priority: high
parent: F-mcp-configuration-schema
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Extended tools object schema with
    optional mcpServers field including name/URL validation, HTTP/HTTPS protocol
    enforcement, and server name uniqueness constraints
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added comprehensive unit
    tests for MCP server validation covering valid/invalid configurations,
    protocol validation, duplicate name detection, and integration scenarios
log:
  - Successfully extended BridgeConfigSchema with MCP server configuration field
    in the tools section. Added comprehensive Zod validation including
    remote-only URL constraints (HTTP/HTTPS only), server name uniqueness
    validation, and proper error messaging. Maintained complete backward
    compatibility with existing configurations. Added extensive unit test
    coverage (19 new test cases) covering valid configurations, invalid inputs,
    edge cases, and type inference verification. All quality checks pass
    including linting, formatting, and type checking.
schema: v1.0
childrenIds: []
created: 2025-09-20T19:37:10.173Z
updated: 2025-09-20T19:37:10.173Z
---

# Extend BridgeConfigSchema with MCP Server Configuration Field

## Context

This task extends the existing `BridgeConfigSchema` in `/src/core/config/bridgeConfigSchema.ts` to support MCP server definitions within the `tools` configuration section. This follows the established Zod validation patterns and maintains type safety across the configuration system.

## Technical Approach

1. **Add MCP Server Schema Definition**:
   - Create Zod schema for individual MCP server configuration
   - Include `name` (string, required) and `url` (string, required) fields
   - Add URL format validation for HTTP/HTTPS protocols only
   - Ensure server name uniqueness validation

2. **Extend Tools Configuration**:
   - Add optional `mcpServers` field to the existing `tools` object schema (lines 86-112)
   - Use array of MCP server objects with proper validation
   - Maintain backward compatibility (field is optional, defaults to empty array)

## Detailed Implementation Requirements

### Schema Structure

```typescript
// URL validation that enforces remote-only constraint
const remoteUrlSchema = z
  .string()
  .url("MCP server URL must be valid")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "MCP server URL must use HTTP or HTTPS protocol",
  );

// Add to tools object in BridgeConfigSchema
mcpServers: z.array(
  z.object({
    name: z.string().min(1, "MCP server name cannot be empty"),
    url: remoteUrlSchema,
  }),
)
  .optional()
  .default([])
  .refine((servers) => {
    const names = servers.map((s) => s.name);
    return names.length === new Set(names).size;
  }, "MCP server names must be unique");
```

### Remote-Only Enforcement Strategy

- **Deterministic validation**: No runtime platform detection during config parsing
- **Scheme validation**: Only HTTP/HTTPS protocols allowed
- **Future compatibility**: Environment-specific validation can be added later if needed

### Error Handling

- Include server name in validation error context
- Clear messaging for remote-only requirement
- Handle edge cases (empty arrays, duplicate names, malformed URLs)

## Acceptance Criteria

**Schema Extensions**:

- [ ] `BridgeConfigSchema.tools` extended with optional `mcpServers` field
- [ ] MCP server configuration supports `name` and `url` fields with proper validation
- [ ] URL validation ensures HTTP/HTTPS format only
- [ ] Server name uniqueness validation implemented
- [ ] Remote-only constraint enforced through deterministic host validation

**URL Validation Implementation**:

- [ ] Only remote HTTP/HTTPS URLs accepted
- [ ] Invalid configurations produce clear, actionable error messages

**Backward Compatibility**:

- [ ] Existing `BridgeConfig` schemas continue to validate successfully
- [ ] New `mcpServers` field is optional and defaults to empty array
- [ ] No breaking changes to existing configuration interfaces

**Type Safety**:

- [ ] TypeScript interfaces properly inferred from updated schema
- [ ] Configuration types integrate with existing `BridgeConfig` interface
- [ ] No `any` types used in new configuration schemas

## Unit Testing Requirements

Include comprehensive unit tests covering:

- Valid remote MCP server configurations (public domain names)
- Non-HTTP/HTTPS protocol rejection (ftp://, file://, custom schemes)
- Empty array and missing field handling
- Type inference correctness

## Files to Modify

- `/src/core/config/bridgeConfigSchema.ts` - Add MCP server schema to tools section

## Dependencies

- **Prerequisites**: None (first task in feature)
- **Required by**: All subsequent MCP configuration tasks depend on this schema foundation

## Out of Scope

- MCP client implementation or connection logic
- Tool registration or discovery mechanisms
- Authentication or advanced connection parameters
- Configuration loading or merging logic
- Runtime platform-specific behavior (handled at connection time, not config validation)
