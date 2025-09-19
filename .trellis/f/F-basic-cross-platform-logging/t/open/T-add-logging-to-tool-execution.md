---
id: T-add-logging-to-tool-execution
title: Add logging to tool execution and registration
status: open
priority: medium
parent: F-basic-cross-platform-logging
prerequisites:
  - T-integrate-logging-configuratio
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-19T18:10:56.081Z
updated: 2025-09-19T18:10:56.081Z
---

# Add Logging to Tool Execution and Registration

## Context

Add logging to tool registration, execution, and error scenarios to help debug tool-related issues. This is particularly important since tools can fail silently and cause confusing behavior like the Google "UNEXPECTED_TOOL_CALL" issue we recently debugged.

**Feature Context**: Part of F-basic-cross-platform-logging - Basic Cross-Platform Logging System
**Prerequisites**: T-integrate-logging-configuratio (logger must be configured in BridgeClient first)
**Target Issue**: Provide visibility into tool registration failures and execution problems

## Specific Implementation Requirements

### Tool Logging Points

Add logging to key tool system locations:

1. **Tool Registration**: Log successful and failed tool registrations
2. **Tool Execution**: Log tool calls, arguments, results, and failures
3. **Tool Validation**: Log tool definition validation issues
4. **Tool Call Parsing**: Log tool call parsing from provider responses

### Implementation Files and Locations

**Tool Registration** (`src/client/bridgeClient.ts`):

- **registerTool method**: Log successful registrations and failures
- **Tool validation**: Log validation failures with tool details

**Tool Execution** (`src/core/tools/` directory):

- **Tool execution strategy**: Log execution start, results, and failures
- **Tool call handling**: Log when tools are called during chat responses

**Tool Call Parsing** (provider-specific):

- **Google**: `src/providers/google-gemini-v1/responseParser.ts` in extractToolCalls function
- **OpenAI**: `src/providers/openai-responses-v1/toolCallParser.ts`
- **Anthropic**: `src/providers/anthropic-2023-06-01/responseParser.ts`
- **xAI**: `src/providers/xai-v1/toolCallParser.ts`

**Tool Call Extraction** (`src/client/extractToolCallsFromMessage.ts`):

- **Tool extraction**: Log when tool calls are found and processed

### Technical Approach

**Logging Strategy:**

1. **Info Level**: Use logger.info() for successful tool operations
2. **Warn Level**: Use logger.warn() for tool validation issues
3. **Error Level**: Use logger.error() for tool execution failures
4. **Debug Level**: Use logger.debug() for detailed tool call data

**Example Logging Implementation:**

```typescript
// Tool registration
logger.info("Tool registered successfully", {
  toolName: toolDef.name,
  description: toolDef.description,
  inputSchema: toolDef.inputSchema ? "defined" : "undefined",
});

// Tool execution
logger.debug("Executing tool call", {
  toolName: toolCall.name,
  arguments: toolCall.parameters,
  executionId: toolCall.id,
});

// Tool execution result
logger.info("Tool execution completed", {
  toolName: toolCall.name,
  executionId: toolCall.id,
  success: true,
  executionTime: duration,
});

// Tool execution failure
logger.error("Tool execution failed", {
  toolName: toolCall.name,
  executionId: toolCall.id,
  error: error.message,
  arguments: toolCall.parameters,
});
```

### Detailed Acceptance Criteria

**Tool Registration Logging:**

- **Successful Registration**: Log tool name, description, and basic schema info
- **Registration Failures**: Log validation errors and tool definition issues
- **Duplicate Registration**: Log when tools are re-registered or overwritten
- **Tool Discovery**: Log when tools are available for use

**Tool Execution Logging:**

- **Execution Start**: Log tool call initiation with name and arguments
- **Execution Success**: Log successful completion with results summary
- **Execution Failure**: Log errors with tool context and error details
- **Execution Timing**: Include execution duration for performance awareness

**Tool Call Parsing Logging:**

- **Provider Responses**: Log when providers return tool calls in responses
- **Parsing Success**: Log successful extraction of tool calls from provider format
- **Parsing Failures**: Log when tool call parsing fails with response context
- **Tool Call Validation**: Log validation of tool call format and arguments

**Cross-Provider Consistency:**

- **Unified Format**: Same logging format across all providers for tool calls
- **Provider Context**: Include provider name in all tool-related logs
- **Model Context**: Include model name when available
- **Request Context**: Include request ID or conversation context when available

## Dependencies on Other Tasks

- **T-integrate-logging-configuratio**: Logger must be configured and available for import

## Security Considerations

**Data Protection:**

- **Argument Filtering**: Don't log sensitive tool arguments (passwords, API keys, personal data)
- **Result Filtering**: Don't log sensitive tool results or user content
- **Size Limits**: Truncate large tool arguments and results to prevent log flooding
- **Error Safety**: Tool logging failures don't prevent tool execution

## Testing Requirements

**Unit Tests** (include in same task):

1. **Registration Logging**: Test that tool registration events are logged
2. **Execution Logging**: Test tool execution success and failure logging
3. **Parsing Logging**: Test tool call parsing from provider responses
4. **Level Configuration**: Test that logging respects configured levels
5. **Data Safety**: Test that sensitive arguments are not logged
6. **Error Safety**: Test that logging failures don't break tool functionality

**Test Files:**

- **Tool Tests**: Add to existing tool system test files
- **Integration Tests**: Test tool logging during actual tool execution

**Key Test Scenarios:**

- Tool registration with valid and invalid definitions
- Tool execution with various argument types and result types
- Tool execution failures and error scenarios
- Tool call parsing from different provider response formats
- Tool system behavior with logging at different levels

## Implementation Guidance

**Integration Approach:**

1. **Import Logger**: Add `import { logger } from '../core/logging/simpleLogger'` to each file
2. **Existing Operations**: Add logging calls to existing tool operations
3. **Minimal Changes**: Don't change existing tool logic, just add logging
4. **Consistent Format**: Use same log message format across all tool operations

**Tool Context Pattern:**

```typescript
logger.info("Tool operation completed", {
  operation: "register" | "execute" | "parse",
  toolName: toolName,
  provider: providerName,
  success: boolean,
  context: additionalContext,
});
```

**Keep It Simple:**

- **Add to Existing**: Don't create new tool tracking, add to existing operations
- **No Infrastructure**: Don't create new tool monitoring systems
- **Console Only**: Use the simple logger, no external services
- **Performance Safe**: Use appropriate log levels based on operation criticality

## Out of Scope

- Complex tool performance monitoring or metrics
- Tool usage analytics or statistics
- Integration with external tool management systems
- Detailed tool argument validation logging
- Tool result caching or persistence logging
- Custom tool formatting or structured tool data

This task provides visibility into tool system operations to help debug tool-related issues and understand when tools are working correctly versus encountering problems.
