---
id: T-update-bridgeconfig-with-tool
title: Update BridgeConfig with tool system configuration
status: done
priority: medium
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-create-basic-agent-loop-with
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Added comprehensive tools configuration
    schema with enabled toggle, builtinTools array validation,
    executionTimeoutMs (1000-300000ms), and maxConcurrentTools (1-10) fields
    with detailed error messages
  src/core/config/toolsConfig.ts: Created separate ToolsConfig type definition
    following one-export-per-file rule with proper JSDoc documentation and
    example usage
  src/core/config/bridgeConfig.ts: Extended BridgeConfig interface to include
    optional tools configuration field with updated example showing tool system
    usage
  src/core/config/index.ts: Added ToolsConfig type export to public API for external consumption
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added 13 comprehensive
    test cases covering valid/invalid configurations, integration with existing
    BridgeConfig, backward compatibility, and type inference validation
log:
  - Successfully extended BridgeConfig interface with comprehensive tool system
    configuration support. Added optional tools configuration section with
    enabled/disabled toggle, builtin tools array, execution timeout, and
    concurrent tool limits. Implemented full Zod schema validation with helpful
    error messages and comprehensive test coverage. All 35 tests pass including
    13 new tools configuration tests covering validation, integration, type
    safety, and backward compatibility.
schema: v1.0
childrenIds: []
created: 2025-09-16T00:31:14.666Z
updated: 2025-09-16T00:31:14.666Z
---

# Update BridgeConfig with Tool System Configuration

## Context

Extend the existing BridgeConfig interface to include tool system configuration options, enabling applications to configure tool behavior through the standard configuration system.

Modifies `src/core/config/bridgeConfig.ts` and related configuration infrastructure following existing patterns established for provider and model configuration.

Reference feature F-tool-system-core-openai-tool for complete context and configuration schema requirements.

## Implementation Requirements

### Files to Modify

```
src/core/config/
  bridgeConfig.ts              # Add tools configuration section
  bridgeConfigSchema.ts        # Add Zod schema for tools config
  __tests__/bridgeConfigSchema.test.ts # Add tests for tools config
```

### Specific Implementation Details

1. **BridgeConfig Extension** (`src/core/config/bridgeConfig.ts`):

```typescript
export interface BridgeConfig {
  // ... existing config fields

  /** Tool system configuration */
  tools?: {
    /** Master toggle for tool system */
    enabled: boolean;
    /** List of enabled built-in tools */
    builtinTools: string[];
    /** Default tool execution timeout in milliseconds */
    executionTimeoutMs?: number;
    /** Maximum concurrent tool executions (future use) */
    maxConcurrentTools?: number;
  };
}
```

2. **Zod Schema Extension** (`src/core/config/bridgeConfigSchema.ts`):

```typescript
// Tool configuration schema
const ToolsConfigSchema = z.object({
  enabled: z.boolean().describe("Enable tool execution functionality"),
  builtinTools: z.array(z.string()).describe("List of enabled built-in tools"),
  executionTimeoutMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Tool execution timeout in milliseconds"),
  maxConcurrentTools: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum concurrent tool executions"),
});

// Update main BridgeConfig schema
export const BridgeConfigSchema = z.object({
  // ... existing schema fields
  tools: ToolsConfigSchema.optional().describe("Tool system configuration"),
});
```

3. **Default Configuration Values**:
   - enabled: false (disabled by default for backward compatibility)
   - builtinTools: [] (no tools enabled by default)
   - executionTimeoutMs: 5000 (5 second default timeout)
   - maxConcurrentTools: 1 (single tool execution for Phase 5)

4. **Validation Rules**:
   - builtinTools array validates against known built-in tool names
   - executionTimeoutMs must be positive integer if provided
   - maxConcurrentTools must be positive integer if provided
   - Configuration validates against schema before use

## Technical Approach

- **Backward Compatibility**: Tool configuration is optional, defaults preserve existing behavior
- **Schema Validation**: Full Zod validation for all tool configuration options
- **Type Safety**: Generated TypeScript types from schemas
- **Integration Ready**: Configuration structured for easy consumption by tool system

## Acceptance Criteria

### Functional Requirements

- [ ] BridgeConfig interface includes optional tools configuration section
- [ ] Tool configuration validates against comprehensive Zod schema
- [ ] Default values provide safe backward-compatible behavior
- [ ] Configuration properly typed with TypeScript interfaces

### Schema Validation

- [ ] Tools configuration validates all field types correctly
- [ ] Built-in tool names validated against known tool registry
- [ ] Timeout values validated as positive integers
- [ ] Optional fields handle undefined values gracefully

### Integration Points

- [ ] Configuration integrates with existing BridgeConfig validation
- [ ] Schema composition works with rest of configuration system
- [ ] Type exports work correctly with tool system components
- [ ] Default values accessible for tool system initialization

### Backward Compatibility

- [ ] Existing configurations continue to work without tools section
- [ ] Tool system disabled by default maintains current behavior
- [ ] Configuration migration path clear for enabling tools
- [ ] No breaking changes to existing BridgeConfig interface

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Schema Validation Tests**:
   - Valid tool configurations pass schema validation
   - Invalid configurations fail with specific error messages
   - Optional fields validate correctly when omitted
   - Default values work as expected

2. **Type Safety Tests**:
   - TypeScript compilation works with new configuration
   - Generated types match expected interfaces
   - Optional fields typed correctly (undefined allowed)
   - Configuration object creation works with new schema

3. **Integration Tests**:
   - Tool configuration integrates with existing BridgeConfig validation
   - Schema composition doesn't break existing validation
   - Configuration loading works with and without tools section

4. **Backward Compatibility Tests**:
   - Existing configurations without tools section validate successfully
   - Default behavior preserved when tools section omitted
   - Migration scenarios (adding tools to existing config) work correctly

## Security Considerations

- **Input Validation**: All tool configuration values validated against schema
- **Safe Defaults**: Default configuration values provide secure baseline
- **Configuration Isolation**: Tool config doesn't affect other system components
- **Validation Errors**: Configuration errors don't expose sensitive information

## Out of Scope

- Feature flag integration (handled by separate task)
- Tool configuration UI or management interfaces
- Advanced configuration features (environment variables, file loading)
- Runtime configuration changes (static configuration only)
