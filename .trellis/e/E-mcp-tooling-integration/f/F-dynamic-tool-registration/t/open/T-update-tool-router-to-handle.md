---
id: T-update-tool-router-to-handle
title: Update tool router to handle connection loss via failure strategy
status: open
priority: medium
parent: F-dynamic-tool-registration
prerequisites:
  - T-implement-tool-failure
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T00:43:59.893Z
updated: 2025-09-21T00:43:59.893Z
---

# Update ToolRouter to Handle Connection Loss via Failure Strategy

## Context

Modify the `ToolRouter` class to work seamlessly with MCP tool failure strategies, ensuring that tool execution properly handles connection loss scenarios according to the configured strategy.

## Implementation Requirements

### ToolRouter Integration

- Ensure `ToolRouter.execute()` works correctly with both failure strategies
- For `immediate_unregister`: tools are removed and return "tool not found" errors
- For `mark_unavailable`: tools exist but return connection errors from handlers
- No changes to core execution logic needed - rely on existing error handling

### Error Handling Enhancement

- Verify existing error handling properly propagates MCP connection errors
- Ensure `McpConnectionError` types are handled consistently in execution pipeline
- Maintain existing error response format and logging patterns

### Files to Review/Modify

- `src/core/tools/toolRouter.ts` - Review execute method and error handling
- Potential minor updates to error handling if needed

## Technical Approach

### Strategy Integration

- `immediate_unregister`: Tools removed from registry, router returns "tool_not_found"
- `mark_unavailable`: Tools remain in registry, handlers throw `McpConnectionError`
- Existing router error handling should propagate these errors correctly

### Verification Focus

- Test that existing `execute()` method handles MCP connection errors properly
- Verify error response format matches existing patterns
- Ensure logging integration works with MCP errors

## Acceptance Criteria

- [ ] `ToolRouter.execute()` works correctly with immediate unregister strategy
- [ ] `ToolRouter.execute()` works correctly with mark unavailable strategy
- [ ] MCP connection errors properly propagated through execution pipeline
- [ ] Error responses maintain consistent format with existing tool errors
- [ ] Logging integration works properly for MCP tool connection failures
- [ ] No breaking changes to existing tool execution behavior
- [ ] Both strategies provide clear, actionable error messages to users
- [ ] Unit tests verify router behavior with both failure strategies

## Testing Requirements (Include in Implementation)

- Test router execution when MCP tools are unregistered (immediate strategy)
- Test router execution when MCP tools throw connection errors (mark unavailable)
- Test error response format consistency between strategies
- Test logging output for MCP connection failures
- Mock scenarios with both failure strategies

## Dependencies

- Existing `ToolRouter.execute()` method and error handling
- `McpConnectionError` and existing error taxonomy
- Tool failure strategy implementation in `McpToolRegistry`
- Existing logging infrastructure

## Technical Notes

- This may be primarily a verification task if existing error handling is sufficient
- Focus on integration testing to ensure strategies work with router
- Any changes should be minimal and follow existing patterns
- Preserve all existing execution pipeline functionality

## Expected Outcome

The ToolRouter should require minimal or no changes since:

1. `immediate_unregister` removes tools → router returns existing "tool_not_found" error
2. `mark_unavailable` keeps tools → tool handlers throw connection errors → router propagates them

## Out of Scope

- Changes to core tool execution pipeline logic
- New error types or handling mechanisms
- Performance optimizations
- Changes to tool validation or security guardrails
