---
id: T-add-npm-script-and-environment
title: Add NPM script and environment documentation
status: done
priority: low
parent: F-anthropic-end-to-end-testing
prerequisites:
  - T-extend-shared-helpers-for
affectedFiles:
  package.json:
    Added test:e2e:anthropic NPM script following OpenAI pattern with
    NODE_OPTIONS dotenv loading and Jest testPathPatterns filter
  .env.example: Added Anthropic environment variable documentation with API key
    format, default model, and updated usage instructions
log:
  - Successfully implemented NPM script and environment documentation for
    Anthropic E2E tests following the exact OpenAI patterns. Added
    `test:e2e:anthropic` script to package.json using Jest v30 syntax with
    `--testPathPatterns=anthropic` filter. Updated .env.example with
    comprehensive Anthropic environment variable documentation including proper
    API key format (sk-ant- prefix), default model (claude-3-5-haiku-latest),
    and clear usage instructions. Both OpenAI and Anthropic test suites now work
    independently with proper credential isolation. All quality checks pass and
    47 Anthropic E2E tests execute successfully.
schema: v1.0
childrenIds: []
created: 2025-09-17T00:51:35.179Z
updated: 2025-09-17T00:51:35.179Z
---

# Add NPM Script and Environment Documentation

## Context

This task adds the NPM script for running Anthropic E2E tests and documents the required environment variables in .env.example, following the exact same patterns established for OpenAI E2E testing.

## Implementation Requirements

### 1. Add NPM Script (`package.json`)

Add the Anthropic E2E script following the OpenAI pattern:

```json
{
  "scripts": {
    "test:e2e:anthropic": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPattern=anthropic"
  }
}
```

**Pattern Details**:

- Use same `NODE_OPTIONS` for dotenv loading as OpenAI
- Use existing `jest.e2e.config.mjs` configuration
- Use `--testPathPattern=anthropic` to filter only Anthropic tests
- Follow exact naming convention: `test:e2e:anthropic`

### 2. Update Environment Documentation (`.env.example`)

Add Anthropic environment variables alongside existing OpenAI documentation:

```bash
# Anthropic E2E Testing (optional - only needed for Anthropic E2E tests)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
E2E_ANTHROPIC_MODEL=anthropic:claude-3-5-haiku-latest

# Note: E2E_TEST_ENABLED=true is required for both OpenAI and Anthropic E2E tests
```

**Documentation Requirements**:

- Mark Anthropic variables as optional (only needed for Anthropic tests)
- Show proper API key format with sk-ant- prefix
- Include default model example
- Reference that E2E_TEST_ENABLED applies to all E2E tests
- Maintain existing OpenAI documentation unchanged

### 3. Verify Jest Configuration Compatibility

Ensure `jest.e2e.config.mjs` supports the new testPathPattern without modifications:

- Confirm existing `testMatch: ["<rootDir>/src/**/*.e2e.test.ts"]` pattern includes Anthropic tests
- Verify `--testPathPattern=anthropic` correctly filters to Anthropic directory
- Test that OpenAI tests continue to work with `--testPathPattern=openai`

## Acceptance Criteria

- [ ] NPM script `test:e2e:anthropic` runs only Anthropic E2E tests
- [ ] Script uses same NODE_OPTIONS and Jest config as OpenAI equivalent
- [ ] Environment variables documented in .env.example with proper format examples
- [ ] Anthropic variables marked as optional and provider-specific
- [ ] Existing OpenAI documentation remains unchanged
- [ ] Jest configuration supports testPathPattern filtering correctly
- [ ] Script integration tested with sample environment variables

## Dependencies

- Requires T-extend-shared-helpers-for for config loading functions
- Uses existing jest.e2e.config.mjs without modifications
- Follows OpenAI NPM script patterns

## Security Considerations

- Document API key format clearly to prevent format errors
- Mark credentials as optional to avoid unnecessary exposure
- Maintain secure environment variable patterns

## Testing Requirements

Test that:

- `npm run test:e2e:anthropic` runs only Anthropic tests when environment is configured
- Script fails gracefully with clear messages when credentials missing
- OpenAI tests continue to work independently
- Jest path filtering works correctly

## Technical Approach

1. Add NPM script to package.json following OpenAI pattern exactly
2. Update .env.example with clear Anthropic variable documentation
3. Test script execution with valid and missing credentials
4. Verify Jest path filtering isolates Anthropic tests correctly
5. Ensure no breaking changes to existing OpenAI script

## Out of Scope

- Modifying Jest configuration files (not needed)
- Adding additional NPM scripts beyond the core test:e2e:anthropic
- Creating CI/CD integration (separate concern)
- Modifying existing OpenAI documentation or scripts
