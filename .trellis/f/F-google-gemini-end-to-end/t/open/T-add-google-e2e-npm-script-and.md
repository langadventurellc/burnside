---
id: T-add-google-e2e-npm-script-and
title: Add Google E2E NPM script and environment documentation
status: open
priority: low
parent: F-google-gemini-end-to-end
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T07:03:15.495Z
updated: 2025-09-17T07:03:15.495Z
---

# Add Google E2E NPM Script and Environment Documentation

## Context

Add NPM script for running Google E2E tests and update environment documentation to include Google-specific variables. This follows the exact pattern used for OpenAI and Anthropic providers to maintain consistency.

## Reference Implementation

Follow the patterns in:

- `package.json` - Existing `test:e2e:openai` and `test:e2e:anthropic` scripts
- `.env.example` - Existing OpenAI and Anthropic environment documentation

## Specific Implementation Requirements

### 1. Add NPM Script

Add to `package.json` scripts section:

```json
{
  "scripts": {
    "test:e2e:google": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPatterns=google"
  }
}
```

### 2. Update Environment Documentation

Add to `.env.example`:

```bash
# Google E2E Testing (optional - only needed for Google E2E tests)
GOOGLE_API_KEY=your-google-api-key-here
E2E_GOOGLE_MODEL=google:gemini-2.5-flash

# Note: E2E_TEST_ENABLED=true is required for OpenAI, Anthropic, and Google E2E tests
```

### 3. Update Usage Instructions

Update the usage section in `.env.example`:

```bash
# Usage:
# 1. Copy this file: cp .env.example .env
# 2. Add your actual API keys (OpenAI, Anthropic, and/or Google)
# 3. Run E2E tests: npm run test:e2e
# 4. Run OpenAI-specific tests: npm run test:e2e:openai
# 5. Run Anthropic-specific tests: npm run test:e2e:anthropic
# 6. Run Google-specific tests: npm run test:e2e:google
```

## Acceptance Criteria

### NPM Script Requirements

- `npm run test:e2e:google` runs only Google E2E tests
- Script uses same Jest configuration as other providers (`jest.e2e.config.mjs`)
- Script uses same NODE_OPTIONS for dotenv loading as other providers
- Script filters tests using `--testPathPatterns=google` to match Google test directory

### Environment Documentation

- `GOOGLE_API_KEY` documented with clear description
- `E2E_GOOGLE_MODEL` documented with default value (`google:gemini-2.5-flash`)
- Documentation explains Google variables are optional (only needed for Google tests)
- Usage instructions updated to include Google E2E test command
- Format consistency maintained with existing provider documentation

### Integration Requirements

- New script follows exact pattern of existing provider scripts
- Environment documentation maintains same structure as existing providers
- No breaking changes to existing scripts or documentation
- Provider isolation maintained (Google tests don't require other provider credentials)

## Technical Approach

1. **Copy existing NPM script pattern** from OpenAI/Anthropic scripts
2. **Replace provider name** in testPathPatterns filter
3. **Add Google environment variables** following existing documentation format
4. **Update usage instructions** to include Google script
5. **Maintain consistency** with existing documentation structure

## Dependencies

- None - this task can be completed independently

## Out of Scope

- Jest configuration changes (jest.e2e.config.mjs already supports Google tests)
- Package.json structure changes beyond adding the script
- Environment variable validation (handled by setup files)
- Test execution optimization

## Files to Modify

- `package.json` - Add `test:e2e:google` script
- `.env.example` - Add Google environment variable documentation and update usage instructions

## Testing Requirements

### Validation

- NPM script executes correctly when run
- Script isolates to only Google test files
- Environment documentation is clear and accurate
- Usage instructions work as documented

### Integration Testing

- Script works with existing Jest E2E configuration
- Script respects provider credential isolation
- Script follows same patterns as existing provider scripts

## Integration Notes

This task completes the infrastructure setup for Google E2E tests by providing the command-line interface that developers will use to run the tests and clear documentation for environment setup. It maintains consistency with the existing provider patterns while enabling Google-specific test execution.
