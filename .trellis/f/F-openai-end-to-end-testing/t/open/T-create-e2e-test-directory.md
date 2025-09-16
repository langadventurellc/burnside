---
id: T-create-e2e-test-directory
title: Create E2E test directory structure and setup files
status: open
priority: high
parent: F-openai-end-to-end-testing
prerequisites:
  - T-create-jest-e2e-configuration
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T06:21:51.301Z
updated: 2025-09-16T06:21:51.301Z
---

# Create E2E Test Directory Structure and Setup Files

## Context

Create the foundational directory structure and Jest setup files for end-to-end testing. This task establishes the organization and lifecycle management for E2E tests.

Related to feature: F-openai-end-to-end-testing

## Specific Implementation Requirements

### 1. Create Directory Structure

Create the following directory structure under `src/__tests__/e2e/`:

```
src/__tests__/e2e/
├── openai/
├── shared/
└── setup/
```

### 2. Implement Jest Setup Files

Create three Jest lifecycle files:

- `globalSetup.ts`: One-time initialization before all tests
- `globalTeardown.ts`: One-time cleanup after all tests
- `setupEnv.ts`: Per-test environment setup

### 3. Environment Variable Validation

Implement environment variable validation in globalSetup that checks for required variables, validates API key format, and fails gracefully with clear error messages.

## Technical Approach

### Directory Organization

- `openai/`: OpenAI-specific E2E test files (created empty for other tasks)
- `shared/`: Shared utilities and helpers (created empty for other tasks)
- `setup/`: Jest lifecycle management files

### GlobalSetup Implementation

```typescript
// globalSetup.ts - One-time async initialization
export default async function globalSetup() {
  // Validate required environment variables
  const requiredVars = ["OPENAI_API_KEY", "E2E_TEST_ENABLED"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Validate API key format
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
    throw new Error(
      "OPENAI_API_KEY must be a valid OpenAI API key (starts with sk- and proper length)",
    );
  }

  // Validate E2E_TEST_ENABLED
  if (process.env.E2E_TEST_ENABLED !== "true") {
    throw new Error('E2E_TEST_ENABLED must be set to "true" to run E2E tests');
  }

  console.log("E2E Test Environment Initialized");
}
```

### GlobalTeardown Implementation

```typescript
// globalTeardown.ts - One-time cleanup
export default async function globalTeardown() {
  // Clean up any global resources
  console.log("E2E Test Environment Cleaned Up");
}
```

### SetupEnv Implementation

```typescript
// setupEnv.ts - Per-test environment setup
// This runs via setupFilesAfterEnv for each test file
// globalSetup runs once before all tests
// setupEnv runs once per test file
// Use this for test-specific environment configuration
```

## Detailed Acceptance Criteria

### Functional Requirements

1. **Directory Structure**
   - ✅ `src/__tests__/e2e/openai/` directory exists (empty)
   - ✅ `src/__tests__/e2e/shared/` directory exists (empty)
   - ✅ `src/__tests__/e2e/setup/` directory exists with setup files

2. **Jest Setup Files**
   - ✅ `globalSetup.ts` validates environment variables and initializes
   - ✅ `globalTeardown.ts` performs cleanup
   - ✅ `setupEnv.ts` provides per-test environment setup
   - ✅ All files export functions compatible with Jest lifecycle

3. **Environment Validation**
   - ✅ Clear error messages when required environment variables are missing
   - ✅ Validation checks for `OPENAI_API_KEY` and `E2E_TEST_ENABLED`
   - ✅ API key format validation (sk- prefix and minimum length)
   - ✅ Graceful failure with actionable error messages

### Technical Requirements

1. **Jest Compatibility**
   - ✅ Setup files work with Jest globalSetup/globalTeardown configuration
   - ✅ Proper TypeScript/ESM module exports
   - ✅ No interference with existing test infrastructure

2. **Error Handling**
   - ✅ Missing environment variables cause clear test failure
   - ✅ Invalid API key format detected and reported
   - ✅ Setup failures prevent test execution with clear messages

3. **Lifecycle Timing**
   - ✅ globalSetup runs once before all tests for environment validation
   - ✅ setupEnv runs via setupFilesAfterEnv for each test file
   - ✅ Clear distinction between one-time and per-file setup

## Dependencies

- T-create-jest-e2e-configuration must complete first (Jest config references these files)

## Security Considerations

1. **Environment Variable Validation**
   - Validate API key format without logging actual values
   - Ensure sensitive data is never exposed in logs or error messages
   - Fail securely if credentials are missing or invalid

## Testing Requirements

1. **Setup Validation**
   - Verify globalSetup runs and validates environment variables
   - Test error handling with missing environment variables
   - Test error handling with invalid API key format
   - Verify setupEnv is available to test files
   - Confirm teardown runs after tests complete

## Out of Scope

- Actual test helper implementations (handled by other tasks)
- OpenAI-specific test files (handled by other tasks)
- Shared utility implementations (handled by other tasks)

## Files to Create

- `src/__tests__/e2e/setup/globalSetup.ts`
- `src/__tests__/e2e/setup/globalTeardown.ts`
- `src/__tests__/e2e/setup/setupEnv.ts`
- Directory structure (empty directories for future tasks)
