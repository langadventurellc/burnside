---
id: T-update-toolsconfig-type-to
title: Update ToolsConfig type to include MCP server definitions
status: open
priority: medium
parent: F-mcp-configuration-schema
prerequisites:
  - T-extend-bridgeconfigschema
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-20T19:37:34.491Z
updated: 2025-09-20T19:37:34.491Z
---

# Update ToolsConfig Type to Include MCP Server Definitions

## Context

This task updates the `ToolsConfig` type in `/src/core/config/toolsConfig.ts` to properly reflect the new MCP server configuration field added to the BridgeConfigSchema. This ensures type safety and IntelliSense support across the configuration system.

## Technical Approach

The `ToolsConfig` type is currently inferred from the BridgeConfigSchema tools section:

```typescript
export type ToolsConfig = z.infer<typeof BridgeConfigSchema>["tools"];
```

After Task T-extend-bridgeconfigschema is completed, this type will automatically include the new `mcpServers` field through Zod type inference. This task validates that inference and adds proper JSDoc documentation.

## Detailed Implementation Requirements

1. **Verify Type Inference**:
   - Confirm `ToolsConfig` type correctly includes optional `mcpServers` field
   - Validate that MCP server object structure is properly typed
   - Ensure platform constraint logic doesn't affect type inference

2. **Update Documentation**:
   - Add JSDoc examples showing MCP server configuration usage
   - Update existing example to include `mcpServers` field
   - Document platform-specific constraints in type comments

3. **Type Export Validation**:
   - Ensure MCP server types are accessible for other modules
   - Validate TypeScript compilation succeeds with new fields
   - Check that IDE IntelliSense works correctly for new configuration

## Implementation Details

### Updated JSDoc Example

````typescript
/**
 * Type for tool system configuration
 *
 * Inferred from the tools section of the BridgeConfig schema to ensure
 * type safety for tool system configuration options including MCP servers.
 *
 * @example
 * ```typescript
 * const toolsConfig: ToolsConfig = {
 *   enabled: true,
 *   builtinTools: ["echo"],
 *   executionTimeoutMs: 5000,
 *   maxConcurrentTools: 1,
 *   mcpServers: [
 *     {
 *       name: "weather-service",
 *       url: "https://api.weather.com/mcp"
 *     }
 *   ]
 * };
 * ```
 */
````

### Type Safety Validation

- Verify that `ToolsConfig` includes `mcpServers?: Array<{name: string, url: string}>`
- Confirm optional nature of field (undefined allowed)
- Validate that type checking catches invalid configurations

## Acceptance Criteria

**Type Integration**:

- [ ] `ToolsConfig` type correctly includes optional `mcpServers` field through inference
- [ ] MCP server object structure properly typed with `name` and `url` string fields
- [ ] TypeScript compilation succeeds with updated schema and types

**Documentation Updates**:

- [ ] JSDoc updated with MCP server configuration examples
- [ ] Type comments document platform-specific constraints
- [ ] Usage examples show proper MCP server configuration structure

**Development Experience**:

- [ ] IDE IntelliSense provides autocomplete for `mcpServers` field
- [ ] Type checking catches invalid MCP server configurations at compile time
- [ ] No `any` types introduced in configuration interfaces

**Validation Testing**:

- [ ] TypeScript compiler validates MCP server configurations
- [ ] Invalid configurations (wrong types, missing fields) cause compile errors
- [ ] Optional field behavior works correctly (undefined/empty array)

## Unit Testing Requirements

Include tests that verify:

- Type inference correctly includes MCP server configurations
- TypeScript compilation succeeds with valid configurations
- Invalid configurations are caught at compile time (type-level tests)
- JSDoc examples compile and represent valid usage

## Files to Modify

- `/src/core/config/toolsConfig.ts` - Update JSDoc documentation and examples

## Dependencies

- **Prerequisites**: T-extend-bridgeconfigschema (must be completed first)
- **Required by**: MCP client implementation tasks that use ToolsConfig

## Out of Scope

- Runtime configuration validation (handled by Zod schemas)
- Configuration loading or parsing logic
- MCP connection implementation
- Tool registration mechanisms
