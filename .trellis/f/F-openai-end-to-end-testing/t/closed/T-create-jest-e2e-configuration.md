---
id: T-create-jest-e2e-configuration
title: Create Jest E2E configuration and NPM scripts
status: done
priority: high
parent: F-openai-end-to-end-testing
prerequisites: []
affectedFiles:
  jest.e2e.config.mjs: Created dedicated Jest configuration for E2E tests with
    ESM/TS settings, 30s timeout, and test pattern targeting *.e2e.test.ts files
  package.json: Added test:e2e and test:e2e:openai NPM scripts with NODE_OPTIONS
    for environment variable loading
  .env.example: Created comprehensive environment variable documentation with
    OpenAI API key setup, E2E test enablement, and usage instructions
log:
  - Successfully implemented Jest E2E configuration and NPM scripts with
    complete environment variable documentation. Created isolated E2E testing
    infrastructure that mirrors existing Jest ESM/TypeScript settings while
    ensuring proper separation from unit tests. All quality checks pass and E2E
    scripts are functional.
schema: v1.0
childrenIds: []
created: 2025-09-16T06:21:26.951Z
updated: 2025-09-16T06:21:26.951Z
---

# Create Jest E2E Configuration and NPM Scripts

## Context

Implement the foundational Jest configuration and NPM scripts needed to run end-to-end tests separately from unit tests. This task establishes the testing infrastructure that allows E2E tests to run only when explicitly requested.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Jest E2E Configuration

Create `jest.e2e.config.mjs` in the project root with:

- Mirror base Jest ESM/TS settings from `jest.config.mjs`
- Include `extensionsToTreatAsEsm`, `transform`, and `moduleNameMapper`
- Test pattern to only include `*.e2e.test.ts` files
- Extended timeout of 30 seconds for API calls
- Jest lifecycle configuration for setup/teardown

### 2. Add NPM Scripts

Add scripts to `package.json`:

- `test:e2e`: Run all E2E tests with environment variable loading
- `test:e2e:openai`: Run only OpenAI-specific E2E tests

### 3. Create Example Environment File

Create `.env.example` with required environment variables and documentation.

## Technical Approach

### Jest Configuration Structure

```javascript
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.e2e.test.ts"],
  testTimeout: 30000,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globalSetup: "<rootDir>/src/__tests__/e2e/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/src/__tests__/e2e/setup/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/e2e/setup/setupEnv.ts"],
};
```

### NPM Scripts to Add

```json
{
  "test:e2e": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs",
  "test:e2e:openai": "NODE_OPTIONS='--import=dotenv/config' jest --config jest.e2e.config.mjs --testPathPattern=openai"
}
```

## Detailed Acceptance Criteria

### Functional Requirements

1. **Jest Configuration**
   - ✅ `jest.e2e.config.mjs` exists in project root
   - ✅ Configuration only runs `*.e2e.test.ts` files
   - ✅ ESM/TS settings match base Jest configuration
   - ✅ Timeout set to 30 seconds for API calls
   - ✅ Global setup/teardown and per-test setup configured

2. **NPM Scripts**
   - ✅ `npm run test:e2e` command runs E2E tests with environment loading
   - ✅ `npm run test:e2e:openai` command runs only OpenAI E2E tests
   - ✅ Scripts include NODE_OPTIONS for .env loading
   - ✅ E2E tests do NOT run during regular `npm test`

3. **Environment Configuration**
   - ✅ `.env.example` file exists with required variables documented
   - ✅ Documentation includes usage instructions

### Technical Requirements

1. **Configuration Isolation**
   - ✅ E2E configuration completely separate from unit test configuration
   - ✅ No interference with existing `npm test` command
   - ✅ Proper ESM module resolution for TypeScript files

2. **Environment Variable Loading**
   - ✅ `.env` file automatically loaded when running E2E tests
   - ✅ Environment variables available to all test files
   - ✅ Clear documentation for setup

## Dependencies

- Existing Jest configuration in `jest.config.mjs` (reference for ESM/TS settings)
- Package.json for script addition
- No other tasks need to complete first

## Security Considerations

1. **Environment Variables**
   - Never commit actual API keys to repository
   - `.env.example` should contain placeholder values only
   - Clear documentation about sensitive data handling

## Testing Requirements

1. **Validation Tests**
   - Verify `npm run test:e2e` command exists and runs
   - Verify regular `npm test` does not include E2E tests
   - Verify environment variable loading works correctly
   - Test with a simple placeholder E2E test file

## Out of Scope

- Actual test implementation (handled by other tasks)
- Test helper utilities (handled by other tasks)
- Global setup/teardown implementation (handled by other tasks)

## Files to Create/Modify

- `jest.e2e.config.mjs` (create)
- `package.json` (modify - add scripts)
- `.env.example` (create)
