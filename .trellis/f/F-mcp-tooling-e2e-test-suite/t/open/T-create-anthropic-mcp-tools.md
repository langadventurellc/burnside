---
id: T-create-anthropic-mcp-tools
title: Create Anthropic MCP Tools E2E Test
status: open
priority: medium
parent: F-mcp-tooling-e2e-test-suite
prerequisites:
  - T-create-openai-mcp-tools-e2e
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-21T02:42:57.478Z
updated: 2025-09-21T02:42:57.478Z
---

# Create Anthropic MCP Tools E2E Test

## Context

Create end-to-end tests to validate MCP tooling integration with Anthropic provider. This test follows the same pattern as the OpenAI MCP test to provide basic smoke testing for MCP tool discovery and execution.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**Dependencies**: T-create-openai-mcp-tools-e2e (Template pattern for provider MCP tests)
**Pattern Reference**: `src/__tests__/e2e/anthropic/tools.e2e.test.ts`

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/anthropic/mcpTools.e2e.test.ts`
- **Pattern**: Follow OpenAI MCP test structure from T-create-openai-mcp-tools-e2e
- **Anthropic Specifics**: Use Anthropic-specific helpers and configurations

### Test Structure

Mirror OpenAI MCP test structure with Anthropic-specific setup:

```typescript
describe("Anthropic MCP Tool Basic Validation E2E", () => {
  let client: BridgeClient;
  let mcpServer: MockMcpServer;
  let testModel: string;

  beforeAll(async () => {
    // Use Anthropic test config and helpers
    // Setup MCP server and configuration
  });

  // Same test cases as OpenAI but with Anthropic provider
});
```

### Model Selection

- **Single Model**: Use one representative Anthropic model that supports tool calls
- **Model Source**: Get from `defaultLlmModels.ts` Anthropic provider models with `toolCalls: true`
- **Helper Integration**: Use existing `getAnthropicTestModel()` patterns

## Specific Implementation Requirements

### Anthropic-Specific Setup

1. **Environment Validation**: Use existing `ANTHROPIC_API_KEY` validation patterns
2. **Client Creation**: Use Anthropic test helpers from `anthropicModelHelpers.ts`
3. **Configuration**: Use `anthropicTestConfig.ts` patterns for provider setup
4. **Model Selection**: Use `getAnthropicTestModel()` for model selection

### Test Cases (Identical to OpenAI)

- **MCP Tool Discovery**: Verify MCP tools are discovered during initialization
- **MCP Tool Execution**: Execute MCP tool through Anthropic model

### Anthropic-Specific Considerations

- **API Differences**: Account for any Anthropic-specific API patterns
- **Response Format**: Ensure Anthropic responses follow same validation patterns
- **Timeout Handling**: Use Anthropic-appropriate timeouts (may be different from OpenAI)

## Detailed Acceptance Criteria

### Functional Requirements

- **Tool Discovery**: MCP tools discovered and registered for Anthropic models
- **Tool Execution**: MCP tools execute correctly through Anthropic chat requests
- **Response Validation**: Anthropic + MCP responses pass existing validation

### Test Environment Requirements

- **API Key**: Must respect `ANTHROPIC_API_KEY` environment variable
- **E2E Flag**: Must respect `E2E_TEST_ENABLED=true` requirement
- **Provider Detection**: Work with existing provider-specific test detection
- **Timeouts**: Use appropriate timeouts for Anthropic API calls

## Dependencies on Other Tasks

- **T-create-openai-mcp-tools-e2e**: Use as template for implementation pattern
- **Existing Anthropic Infrastructure**: Build on existing Anthropic E2E test setup

## Implementation Reference Points

Study these files for Anthropic-specific patterns:

- **OpenAI MCP Test**: T-create-openai-mcp-tools-e2e implementation (template)
- `src/__tests__/e2e/anthropic/tools.e2e.test.ts` - Anthropic test patterns
- `src/__tests__/e2e/shared/anthropicModelHelpers.ts` - Anthropic client creation
- `src/__tests__/e2e/shared/anthropicTestConfig.ts` - Anthropic configuration
- `src/__tests__/e2e/shared/getAnthropicTestModel.ts` - Model selection

## Out of Scope

- **Provider-Specific Features**: Focus on MCP integration, not Anthropic-specific features
- **Multiple Models**: Test only one representative Anthropic model
- **Complex Scenarios**: Basic validation matching OpenAI test scope
- **Error Scenarios**: No dedicated error handling tests

## Implementation Steps

1. Copy OpenAI MCP test structure to Anthropic directory
2. Replace OpenAI-specific imports with Anthropic equivalents
3. Update test descriptions and naming for Anthropic
4. Use Anthropic test helpers and configuration patterns
5. Adapt any provider-specific setup requirements
6. Ensure test cases validate same MCP functionality as OpenAI
7. Verify integration with existing Anthropic E2E infrastructure
8. Test with Anthropic API key and model selection

This task ensures MCP tooling works with Anthropic provider using the same basic validation pattern as OpenAI.
