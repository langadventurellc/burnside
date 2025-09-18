---
id: T-add-xai-e2e-test-configuration
title: Add xAI E2E test configuration and NPM scripts
status: open
priority: low
parent: F-xai-grok-provider-e2e-testing
prerequisites:
  - T-implement-xai-chat-completion
  - T-implement-xai-streaming-e2e
  - T-implement-xai-tool-execution
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T00:13:33.284Z
updated: 2025-09-18T00:13:33.284Z
---

# Add xAI E2E Test Configuration and NPM Scripts

## Context

This task adds the final configuration pieces to enable isolated execution of xAI E2E tests, following the patterns established by the OpenAI E2E testing infrastructure. This includes NPM scripts and environment documentation.

## Reference Implementation

Follow these existing patterns:

- `package.json` - Existing `test:e2e:openai` script for OpenAI-specific E2E tests
- `.env.example` - Environment variable documentation patterns

## Implementation Requirements

### 1. Add NPM Script for xAI E2E Tests

Update `package.json` to include xAI-specific E2E test execution:

```json
{
  "scripts": {
    "test:e2e:xai": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPattern=xai"
  }
}
```

This follows the exact pattern of the OpenAI E2E script but targets xAI test files.

### 2. Update Environment Documentation

Add xAI configuration to `.env.example`:

```bash
# xAI E2E Testing Configuration
# Required for running xAI end-to-end tests
XAI_API_KEY=xai-your-actual-api-key-here

# Optional: Override default test model (default: xai:grok-3-mini)
# Available models: xai:grok-3-mini, xai:grok-3, xai:grok-4-0709
E2E_XAI_MODEL=xai:grok-3-mini

# Note: E2E_TEST_ENABLED=true is required for all E2E tests
```

### 3. Verify Jest Configuration Integration

Ensure the existing `jest.e2e.config.mjs` properly supports xAI tests:

- **Test pattern**: `testMatch: ["<rootDir>/src/**/*.e2e.test.ts"]` should include xAI tests
- **Timeout**: `testTimeout: 30000` should be sufficient for xAI API calls
- **Environment**: Global setup should work with xAI configuration

The existing Jest configuration should work without modification since it targets all `*.e2e.test.ts` files.

### 4. Validation and Testing

Test the complete configuration:

#### NPM Script Validation

```bash
# Should run only xAI E2E tests
npm run test:e2e:xai

# Should find and execute:
# - src/__tests__/e2e/xai/chat.e2e.test.ts
# - src/__tests__/e2e/xai/streaming.e2e.test.ts
# - src/__tests__/e2e/xai/tools.e2e.test.ts
```

#### Environment Configuration

- Verify XAI_API_KEY validation works correctly
- Test E2E_XAI_MODEL override functionality
- Ensure E2E_TEST_ENABLED requirement is enforced

#### Integration Testing

- Confirm xAI tests run in isolation (don't execute OpenAI tests)
- Validate Jest configuration supports xAI test execution
- Test with valid and invalid environment configurations

## Technical Approach

1. **Follow established patterns**: Mirror the OpenAI E2E script structure exactly
2. **Minimal configuration**: Leverage existing Jest E2E configuration
3. **Isolated execution**: Ensure xAI tests run independently
4. **Clear documentation**: Provide comprehensive environment setup guidance

## Acceptance Criteria

### NPM Script Requirements

- ✅ `test:e2e:xai` script added to package.json
- ✅ Script uses NODE_OPTIONS for dotenv configuration loading
- ✅ Script targets jest.e2e.config.mjs for E2E test configuration
- ✅ Script uses --testPathPattern=xai to isolate xAI tests
- ✅ Script follows exact pattern of existing OpenAI E2E script

### Environment Documentation

- ✅ XAI_API_KEY documentation added to .env.example
- ✅ API key format requirements documented ("xai-" prefix)
- ✅ E2E_XAI_MODEL override documentation with available models
- ✅ Reference to E2E_TEST_ENABLED requirement included
- ✅ Clear usage instructions provided

### Configuration Integration

- ✅ Existing Jest E2E configuration supports xAI tests without modification
- ✅ Test timeout (30000ms) sufficient for xAI API calls
- ✅ Global setup/teardown infrastructure works with xAI configuration
- ✅ Test isolation works correctly (only xAI tests execute)

### Validation Requirements

- ✅ NPM script executes only xAI E2E tests
- ✅ Environment validation works correctly
- ✅ Invalid configuration produces clear error messages
- ✅ Test execution completes successfully with valid configuration

## Dependencies

- Previous tasks: All xAI E2E test implementation tasks must be complete
- Existing Jest E2E configuration infrastructure
- Node.js dotenv support for environment variable loading
- Valid XAI_API_KEY for testing script functionality

## Files to Modify

**Modified Files:**

- `package.json` - Add test:e2e:xai script
- `.env.example` - Add xAI environment documentation

**No New Files Required**

## Testing Strategy

### Configuration Testing

1. **Script Execution**: Verify NPM script runs correctly
2. **Test Isolation**: Confirm only xAI tests execute
3. **Environment Loading**: Test with various environment configurations
4. **Error Scenarios**: Invalid API key, missing environment variables

### Documentation Validation

1. **Clarity**: Environment documentation clear and complete
2. **Examples**: Valid example values provided
3. **Requirements**: All required configuration documented
4. **Integration**: Documentation matches implementation requirements

## Technical Notes

### NPM Script Design

- Use `--testPathPattern=xai` to filter for xAI-specific tests
- Maintain consistency with existing OpenAI E2E script pattern
- Ensure NODE_OPTIONS properly loads .env files
- Leverage existing jest.e2e.config.mjs without modification

### Environment Documentation

- Follow existing documentation patterns in .env.example
- Provide clear setup instructions for new users
- Include all three available Grok models for reference
- Explain relationship to E2E_TEST_ENABLED flag

### Jest Integration

- Existing configuration should work without changes
- Test pattern `src/**/*.e2e.test.ts` includes xAI tests
- Global setup handles environment validation
- Timeout settings appropriate for API calls

## Security Considerations

### API Key Handling

- Document proper API key format requirements
- Never include actual API keys in examples
- Provide clear security guidelines for API key storage
- Reference existing security practices

### Environment Security

- Use environment variables for all sensitive configuration
- Document secure practices for local development
- Ensure no secrets in committed code

## Success Criteria

- ✅ `npm run test:e2e:xai` executes only xAI E2E tests
- ✅ Environment documentation enables easy setup
- ✅ Test isolation works correctly (no OpenAI tests execute)
- ✅ Configuration validation provides clear error messages
- ✅ Integration with existing Jest infrastructure seamless

## Out of Scope

- Jest configuration modifications (existing config sufficient)
- CI/CD integration (beyond local development)
- Test execution optimization or parallelization
- Multi-provider test execution scenarios
