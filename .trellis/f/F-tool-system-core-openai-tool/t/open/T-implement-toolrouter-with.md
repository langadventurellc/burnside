---
id: T-implement-toolrouter-with
title: Implement ToolRouter with execution pipeline
status: open
priority: high
parent: F-tool-system-core-openai-tool
prerequisites:
  - T-create-toolregistry-with
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T00:28:17.155Z
updated: 2025-09-16T00:28:17.155Z
---

# Implement ToolRouter with Execution Pipeline

## Context

Create the central ToolRouter class that orchestrates tool execution with validation, routing, timeout handling, and result normalization. This is the main entry point for all tool execution in the system.

Follows the API signature defined in feature F-tool-system-core-openai-tool and integrates with ToolRegistry and error handling systems.

## Implementation Requirements

### Files to Create

```
src/core/tools/
  toolRouter.ts                    # Main ToolRouter implementation
  toolExecutionPipeline.ts         # Execution pipeline stages
  __tests__/toolRouter.test.ts     # Unit tests
  __tests__/toolExecutionPipeline.test.ts # Pipeline tests
```

### Required API Implementation

1. **ToolRouter Class** (`src/core/tools/toolRouter.ts`):

```typescript
export class ToolRouter {
  private registry: ToolRegistry;
  private defaultTimeoutMs: number;

  constructor(registry: ToolRegistry, defaultTimeoutMs = 5000) {
    this.registry = registry;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  // Tool registration (delegates to registry)
  register(
    toolName: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void;

  // Core execution method
  async execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
    timeoutMs?: number,
  ): Promise<ToolResult>;

  // Tool discovery (delegates to registry)
  getRegisteredTools(): ToolDefinition[];
  hasTool(toolName: string): boolean;
}
```

2. **Execution Pipeline** (`src/core/tools/toolExecutionPipeline.ts`):
   - **Validation Stage**: Validate ToolCall against schema and tool definition
   - **Preparation Stage**: Prepare execution context and parameters
   - **Execution Stage**: Execute tool handler with timeout protection
   - **Normalization Stage**: Convert handler result to ToolResult format
   - **Error Handling**: Convert any errors to ToolResult with error state

3. **Timeout Implementation**:
   - Use AbortController for execution cancellation
   - Default timeout of 5 seconds (configurable)
   - Clean timeout handling with proper resource cleanup
   - Timeout errors converted to ToolResult format

4. **Error Handling**:
   - Catch all execution errors and convert to ToolResult
   - Use ToolError for system errors (tool not found, validation failures)
   - Preserve original error information in ToolResult.error.details
   - Never throw during execute() - always return ToolResult

## Technical Approach

- **Pipeline Pattern**: Implement execution as pipeline stages for clarity
- **Error Boundaries**: All errors caught and converted to ToolResult format
- **Timeout Protection**: Use AbortController for reliable cancellation
- **Resource Management**: Proper cleanup of execution resources

## Acceptance Criteria

### Functional Requirements

- [ ] Execute registered tools with parameter validation
- [ ] Handle tool not found gracefully (return error ToolResult)
- [ ] Apply timeout protection with configurable duration
- [ ] Convert all execution outcomes to ToolResult format
- [ ] Delegate registration and discovery to ToolRegistry

### Error Handling

- [ ] Tool not found returns ToolResult with error state
- [ ] Parameter validation failures return ToolResult with validation error
- [ ] Execution timeouts return ToolResult with timeout error
- [ ] Handler exceptions converted to ToolResult with execution error
- [ ] Never throw exceptions from execute() method

### Performance Requirements

- [ ] Tool lookup and validation under 1ms
- [ ] Execution overhead under 5ms (excluding tool handler time)
- [ ] Proper resource cleanup on timeout or error
- [ ] Memory usage minimal and bounded

### Integration Points

- [ ] Seamless integration with ToolRegistry for registration/discovery
- [ ] Proper use of ToolExecutionContext for handler execution
- [ ] Error results use ToolError patterns for consistency
- [ ] Pipeline stages are composable and testable independently

## Testing Requirements

Include comprehensive unit tests in the same task:

1. **Registration Tests**:
   - Register tools successfully through router
   - Tool discovery works correctly
   - Registry integration functions properly

2. **Execution Tests**:
   - Execute valid tool calls successfully
   - Handle tool not found gracefully
   - Parameter validation on execution
   - Proper ToolResult formatting for success cases

3. **Error Handling Tests**:
   - Tool handler exceptions converted to ToolResult
   - Invalid parameters return validation error ToolResult
   - Non-existent tools return not found error ToolResult
   - All error states include proper error context

4. **Timeout Tests**:
   - Tool execution respects timeout limits
   - Timeout errors converted to ToolResult format
   - Resource cleanup occurs on timeout
   - Custom timeout values override defaults

5. **Pipeline Tests**:
   - Each pipeline stage functions correctly in isolation
   - Pipeline handles errors at each stage appropriately
   - Resource management works across all stages

## Security Considerations

- **Input Validation**: All tool calls validated before execution
- **Execution Isolation**: Tool handlers executed with proper boundaries
- **Timeout Protection**: Prevents runaway tool execution
- **Error Sanitization**: Error details don't expose sensitive system information

## Out of Scope

- Built-in tool implementations (handled by Echo tool task)
- Provider-specific integration (handled by OpenAI tasks)
- Agent loop integration (handled by agent loop task)
- Advanced features (concurrent execution, retry logic)
