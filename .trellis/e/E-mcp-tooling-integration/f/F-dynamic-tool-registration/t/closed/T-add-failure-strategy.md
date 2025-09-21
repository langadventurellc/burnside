---
id: T-add-failure-strategy
title: Add failure strategy configuration to tools schema
status: done
priority: medium
parent: F-dynamic-tool-registration
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Added mcpToolFailureStrategy optional
    field with Zod enum validation for 'immediate_unregister' and
    'mark_unavailable' strategies, including comprehensive describe()
    documentation
  src/core/config/toolsConfig.ts: Updated JSDoc example to include
    mcpToolFailureStrategy field with explanatory comment showing default usage
    pattern
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added comprehensive test
    coverage for mcpToolFailureStrategy including valid enum values, invalid
    value rejection, undefined handling, integration with complete tools
    configuration, and TypeScript type inference verification
log:
  - Successfully implemented MCP tool failure strategy configuration in the
    tools schema. Added optional `mcpToolFailureStrategy` field supporting
    'immediate_unregister' and 'mark_unavailable' strategies with Zod enum
    validation. The field is properly optional (allowing backward
    compatibility), includes comprehensive documentation explaining each
    strategy's behavior, and defaults to 'immediate_unregister' when not
    specified (documented behavior, not schema default). Added complete test
    coverage including valid/invalid value validation, type inference
    verification, and integration with existing tools configuration. All quality
    checks pass including TypeScript compilation, linting, formatting, and full
    test suite.
schema: v1.0
childrenIds: []
created: 2025-09-21T00:42:22.129Z
updated: 2025-09-21T00:42:22.129Z
---

# Add MCP Tool Failure Strategy Configuration

## Context

Extend the existing tools configuration schema to support configurable failure handling strategies for MCP tools when connections are lost. This provides control over whether tools should be immediately unregistered or kept with error responses.

## Implementation Requirements

### Schema Extension

- Add `mcpToolFailureStrategy` optional field to tools configuration in `BridgeConfigSchema`
- Support two strategies: `"immediate_unregister"` and `"mark_unavailable"`
- Default strategy should be `"immediate_unregister"` for simplicity
- Use Zod enum validation for strategy values

### Files to Modify

- `src/core/config/bridgeConfigSchema.ts` - Add the new field around line 110 near mcpServers configuration
- `src/core/config/toolsConfig.ts` - Update JSDoc documentation with examples

### Validation Requirements

- Strategy field must be optional with appropriate default
- Only allow the two specified string values
- Include descriptive error messages for invalid values
- Follow existing schema patterns in the file

## Acceptance Criteria

- [ ] `mcpToolFailureStrategy` field added to tools schema with proper Zod validation
- [ ] Enum validation accepts only `"immediate_unregister"` and `"mark_unavailable"` values
- [ ] Default value is `"immediate_unregister"` when not specified
- [ ] Schema validation provides clear error messages for invalid strategy values
- [ ] JSDoc documentation includes examples of both strategy options
- [ ] Unit tests verify strategy validation and default behavior
- [ ] TypeScript types properly infer the strategy union type

## Testing Requirements (Include in Implementation)

- Test valid strategy values are accepted
- Test invalid strategy values are rejected with clear errors
- Test default behavior when field is omitted
- Test schema parsing with both strategy options
- Verify TypeScript type safety for strategy values

## Technical Notes

- Follow existing patterns in `bridgeConfigSchema.ts` for optional enum fields
- Place the new field logically near other tool-related configuration
- Use descriptive enum values that clearly indicate the behavior
- Ensure the configuration integrates with existing tool validation patterns

## Out of Scope

- Implementation of the actual failure strategy logic (handled by other tasks)
- Connection monitoring or health checking systems
- Runtime behavior changes (configuration only)
