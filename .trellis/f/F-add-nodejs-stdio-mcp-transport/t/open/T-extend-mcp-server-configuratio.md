---
id: T-extend-mcp-server-configuratio
title: Extend MCP server configuration schema for STDIO support
status: open
priority: high
parent: F-add-nodejs-stdio-mcp-transport
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T14:13:58.234Z
updated: 2025-09-21T14:13:58.234Z
---

# Extend MCP Server Configuration Schema for STDIO Support

## Context

This task implements the configuration schema changes needed to support STDIO MCP servers alongside existing HTTP servers. The current schema in `src/core/config/bridgeConfigSchema.ts` only supports URL-based HTTP servers and needs to be extended to support command-based STDIO servers.

**Related Feature**: F-add-nodejs-stdio-mcp-transport

## Specific Implementation Requirements

### Schema Changes

- Modify the MCP server configuration schema around line 120 in `src/core/config/bridgeConfigSchema.ts`
- Make the `url` field optional (currently required)
- Add optional `command` field (string) for STDIO server executable path
- Add optional `args` field (string array) for STDIO server command arguments
- Add validation to ensure either `url` OR `command` is present (not both, not neither)

### Configuration Structure

The updated schema should support these configurations:

```typescript
// HTTP server (existing, unchanged)
{ name: "github-api", url: "https://api.github.com/mcp" }

// STDIO server (new)
{ name: "local-tools", command: "/usr/local/bin/mcp-tools", args: ["--config", "dev.json"] }
{ name: "simple-tools", command: "mcp-tools" } // args optional
```

## Technical Approach

1. **Update Zod Schema Definition**:
   - Change `url` from required to optional with existing validation
   - Add `command` as optional string with path validation
   - Add `args` as optional string array
   - Add custom validation using `.refine()` to ensure mutual exclusivity

2. **Validation Logic**:
   - Ensure exactly one of `url` or `command` is present
   - Validate `command` paths are non-empty strings
   - Validate `args` array contains only strings if present
   - Maintain existing `url` validation (HTTP/HTTPS protocol check)

3. **TypeScript Type Updates**:
   - Update the inferred TypeScript types to reflect optional `url`
   - Ensure type safety for the new `command` and `args` fields

## Detailed Acceptance Criteria

### Schema Validation

- ✅ Accepts valid HTTP configurations with `url` field (existing behavior)
- ✅ Accepts valid STDIO configurations with `command` field
- ✅ Accepts STDIO configurations with both `command` and `args` fields
- ✅ Rejects configurations with both `url` and `command` present
- ✅ Rejects configurations with neither `url` nor `command` present
- ✅ Rejects invalid URLs in `url` field (existing validation)
- ✅ Rejects empty or invalid `command` strings
- ✅ Rejects non-string values in `args` array

### Backward Compatibility

- ✅ All existing HTTP server configurations continue to work unchanged
- ✅ Existing validation error messages remain consistent
- ✅ TypeScript compilation succeeds without breaking changes

### Type Safety

- ✅ TypeScript types correctly reflect optional `url` field
- ✅ New `command` and `args` fields are properly typed
- ✅ Configuration objects can be discriminated by presence of `url` vs `command`

## Dependencies

**Prerequisites**: None (foundational schema change)

**Dependent Tasks**: All other tasks in this feature depend on this schema change

## Security Considerations

- Validate `command` field is a non-empty string
- Ensure `args` array contains only string values
- Maintain existing URL validation security for HTTP servers

## Testing Requirements

### Unit Tests (included in this task)

- Test valid HTTP server configurations (existing tests still pass)
- Test valid STDIO server configurations with `command` only
- Test valid STDIO server configurations with `command` and `args`
- Test rejection of configurations with both `url` and `command`
- Test rejection of configurations with neither `url` nor `command`
- Test rejection of invalid `command` values (empty string, null, etc.)
- Test rejection of invalid `args` values (non-array, non-string elements)
- Test TypeScript type inference for new configuration shapes

## Out of Scope

- Runtime adapter changes (handled by other tasks)
- Client integration updates (handled by other tasks)
- Actual STDIO connection implementation (handled by other tasks)

## Files to Modify

- `src/core/config/bridgeConfigSchema.ts` - Main schema definition
- `src/core/config/__tests__/bridgeConfigSchema.test.ts` - Schema validation tests (if exists)
- Related TypeScript type exports that depend on the schema
