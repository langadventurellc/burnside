---
id: T-create-google-mcp-tools-e2e
title: Create Google MCP Tools E2E Test
status: done
priority: medium
parent: F-mcp-tooling-e2e-test-suite
prerequisites:
  - T-create-openai-mcp-tools-e2e
affectedFiles:
  src/__tests__/e2e/google/mcpTools.e2e.test.ts: "New E2E test file implementing
    Google MCP tool integration validation with two test suites: MCP Tool
    Discovery (validates client configuration) and MCP Tool Execution (validates
    tool execution through Google chat API). Follows existing Google E2E test
    patterns with proper timeout handling, validation, and cleanup. Uses
    GoogleGeminiV1Provider with proper initialization and leverages shared MCP
    test utilities."
log:
  - Successfully implemented Google MCP Tools E2E test following the OpenAI
    template pattern. Created comprehensive test file with MCP tool discovery
    and execution validation through Google Gemini models. The test verifies
    that MCP tools can be discovered and executed through Google chat requests
    with proper response formatting. Used existing Google test helpers and
    configuration patterns from the E2E infrastructure. All quality checks pass
    (lint, format, type-check) and E2E tests are green with 2 passing test
    cases. Google provider now has full MCP integration validation matching
    other providers in the suite.
schema: v1.0
childrenIds: []
created: 2025-09-21T02:43:14.879Z
updated: 2025-09-21T02:43:14.879Z
---

# Create Google MCP Tools E2E Test

## Context

Create end-to-end tests to validate MCP tooling integration with Google provider. This test follows the same pattern as the OpenAI MCP test to provide basic smoke testing for MCP tool discovery and execution.

**Related Feature**: F-mcp-tooling-e2e-test-suite - Basic MCP Tooling E2E Validation
**Dependencies**: T-create-openai-mcp-tools-e2e (Template pattern for provider MCP tests)
**Pattern Reference**: `src/__tests__/e2e/google/tools.e2e.test.ts`

## Technical Approach

### Implementation Location

- **File**: `src/__tests__/e2e/google/mcpTools.e2e.test.ts`
- **Pattern**: Follow OpenAI MCP test structure from T-create-openai-mcp-tools-e2e
- **Google Specifics**: Use Google-specific helpers and configurations

### Test Structure

Mirror OpenAI MCP test structure with Google-specific setup:

```typescript
describe("Google MCP Tool Basic Validation E2E", () => {
  let client: BridgeClient;
  let mcpServer: MockMcpServer;
  let testModel: string;

  beforeAll(async () => {
    // Use Google test config and helpers
    // Setup MCP server and configuration
  });

  // Same test cases as OpenAI but with Google provider
});
```

### Model Selection

- **Single Model**: Use one representative Google model that supports tool calls
- **Model Source**: Get from `defaultLlmModels.ts` Google provider models with `toolCalls: true`
- **Helper Integration**: Use existing `getGoogleTestModel()` patterns

## Specific Implementation Requirements

### Google-Specific Setup

1. **Environment Validation**: Use existing `GOOGLE_API_KEY` validation patterns
2. **Client Creation**: Use Google test helpers from `googleModelHelpers.ts`
3. **Configuration**: Use `googleTestConfig.ts` patterns for provider setup
4. **Model Selection**: Use `getGoogleTestModel()` for model selection

### Test Cases (Identical to OpenAI)

- **MCP Tool Discovery**: Verify MCP tools are discovered during initialization
- **MCP Tool Execution**: Execute MCP tool through Google model

### Google-Specific Considerations

- **API Differences**: Account for any Google-specific API patterns or requirements
- **Response Format**: Ensure Google responses follow same validation patterns
- **Tool Call Format**: Handle any Google-specific tool calling patterns
- **Timeout Handling**: Use Google-appropriate timeouts and retry patterns

## Detailed Acceptance Criteria

### Functional Requirements

- **Tool Discovery**: MCP tools discovered and registered for Google models
- **Tool Execution**: MCP tools execute correctly through Google chat requests
- **Response Validation**: Google + MCP responses pass existing validation

### Test Environment Requirements

- **API Key**: Must respect `GOOGLE_API_KEY` environment variable
- **E2E Flag**: Must respect `E2E_TEST_ENABLED=true` requirement
- **Provider Detection**: Work with existing provider-specific test detection
- **Timeouts**: Use appropriate timeouts for Google API calls

## Dependencies on Other Tasks

- **T-create-openai-mcp-tools-e2e**: Use as template for implementation pattern
- **Existing Google Infrastructure**: Build on existing Google E2E test setup

## Implementation Reference Points

Study these files for Google-specific patterns:

- **OpenAI MCP Test**: T-create-openai-mcp-tools-e2e implementation (template)
- `src/__tests__/e2e/google/tools.e2e.test.ts` - Google test patterns
- `src/__tests__/e2e/shared/googleModelHelpers.ts` - Google client creation
- `src/__tests__/e2e/shared/googleTestConfig.ts` - Google configuration
- `src/__tests__/e2e/shared/getGoogleTestModel.ts` - Model selection

## Out of Scope

- **Provider-Specific Features**: Focus on MCP integration, not Google-specific features
- **Multiple Models**: Test only one representative Google model
- **Complex Scenarios**: Basic validation matching OpenAI test scope
- **Error Scenarios**: No dedicated error handling tests

## Implementation Steps

1. Copy OpenAI MCP test structure to Google directory
2. Replace OpenAI-specific imports with Google equivalents
3. Update test descriptions and naming for Google
4. Use Google test helpers and configuration patterns
5. Adapt any provider-specific setup requirements (Google API key format, etc.)
6. Ensure test cases validate same MCP functionality as OpenAI
7. Verify integration with existing Google E2E infrastructure
8. Test with Google API key and model selection

This task ensures MCP tooling works with Google provider using the same basic validation pattern as OpenAI.
