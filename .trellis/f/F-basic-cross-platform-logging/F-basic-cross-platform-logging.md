---
id: F-basic-cross-platform-logging
title: Basic Cross-Platform Logging System
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/core/logging/logLevel.ts: Created LogLevel type definition with error, warn, info, debug levels
  src/core/logging/loggingConfig.ts: Created LoggingConfig interface with optional enabled and level fields
  src/core/logging/simpleLogger.ts: Created SimpleLogger class with level-based
    filtering, safe serialization, cross-platform console method mapping, and
    default logger instance
  src/core/logging/__tests__/simpleLogger.test.ts: Created comprehensive test
    suite with 31 tests covering all functionality including edge cases
  src/core/logging/index.ts: Created barrel export file providing clean module interface
  src/core/index.ts: Added logging module exports to core library exports
  src/core/config/loggingConfigHelpers.ts: Created type-safe utilities for
    accessing and validating logging configuration with default fallbacks and
    warning for invalid log levels
  src/core/config/index.ts: Added export for loggingConfigHelpers to make
    utilities available to BridgeClient
  src/core/config/bridgeConfig.ts:
    Updated JSDoc documentation to include logging
    configuration examples showing config.options.logging structure
  src/client/bridgeClient.ts: Added configureLogger method and integration in
    constructor to initialize logger with user settings during client
    construction
  src/client/__tests__/bridgeClient.test.ts:
    Added comprehensive tests for logging
    configuration including valid configs, invalid configs, different log
    levels, and backwards compatibility
  src/client/__tests__/bridgeClientConfig.test.ts: Added tests for logging
    configuration structure preservation and various log level configurations
  src/core/config/__tests__/loggingConfigHelpers.test.ts: Created comprehensive
    unit tests for all helper functions covering edge cases, validation, and
    type safety
log: []
schema: v1.0
childrenIds:
  - T-add-logging-to-provider-error
  - T-add-logging-to-tool-execution
  - T-integrate-logging-configuratio
  - T-create-basic-cross-platform
created: 2025-09-19T17:59:24.678Z
updated: 2025-09-19T17:59:24.678Z
---

# Basic Cross-Platform Logging System

## Purpose and Functionality

Add simple console-based logging to help debug intermittent test failures and provider issues. The logging system provides basic error visibility across Node.js, browser, and React Native environments without adding complexity or performance overhead.

## Key Components to Implement

### 1. Simple Console Logger

- Four log levels: error, warn, info, debug
- Default behavior: log warnings and errors
- Uses native console API available in all environments
- Basic message formatting with timestamps and levels

### 2. Configuration Integration

- Add logging options to existing BridgeConfig structure
- Simple enable/disable and level configuration
- No new schema changes - use existing config patterns

### 3. Essential Logging Points

- Provider error details when errors occur
- HTTP request/response basics for API debugging
- Tool execution failures and results
- Response validation errors with context

## Detailed Acceptance Criteria

### Functional Behavior

- **Default Logging**: Shows warnings and errors without any configuration
- **Debug Mode**: Info and debug messages only appear when explicitly enabled in config
- **Cross-Platform**: Same console output across Node.js, browser, and React Native
- **Safe Operation**: Logging never crashes or blocks the main application

### Configuration Requirements

- **Simple Config**: Add logging settings to BridgeConfig.options (following existing patterns)
- **Level Setting**: Support 'error', 'warn', 'info', 'debug' string values
- **Enable/Disable**: Boolean flag to turn logging on/off completely
- **Backwards Compatible**: Works with existing configurations, logging is optional

### Essential Logging Coverage

- **Provider Errors**: Log the actual error details when API calls fail
- **Request Issues**: Basic HTTP method, URL, and status when requests fail
- **Tool Problems**: Log tool call failures and execution errors
- **Validation Failures**: Show validation error details with response context

## Technical Requirements

### Simple Implementation

- **Console Only**: Use console.error(), console.warn(), console.info(), console.log()
- **No Dependencies**: Built-in APIs only (console, Date, JSON.stringify)
- **Minimal Code**: Small logger utility that can be imported where needed
- **Environment Safe**: Works the same in all three target environments

### Integration Approach

- **Error Catch Points**: Add logging where errors are already being handled
- **Existing Patterns**: Follow current codebase patterns for optional features
- **No Hooks**: Don't create new infrastructure - add calls to existing error paths
- **Opt-in**: Logging calls only where they provide debugging value

## Dependencies on Other Features

- None - standalone feature using existing error handling points

## Implementation Guidance

### Keep It Simple

- **Single File Logger**: One small utility file with the logger implementation
- **Direct Console**: No abstraction layers or complex formatting
- **Config Integration**: Add to BridgeConfig.options following existing optional feature patterns
- **Minimal Changes**: Add logging calls to existing catch blocks and error handlers

### Basic Integration Points

- **Provider normalizeError()**: Log raw error before normalizing
- **Response validation failures**: Log validation errors with response data
- **Tool execution**: Log when tool calls fail or succeed
- **HTTP transport errors**: Log basic request details when network calls fail

## Testing Requirements

### Basic Testing

- **Logger Function**: Test that log levels work correctly
- **Configuration**: Test enabling/disabling through config
- **Cross-Platform**: Verify console calls work in Node.js environment
- **Error Scenarios**: Test logging during actual error conditions

## Security Considerations

### Simple Safety

- **No Sensitive Data**: Avoid logging API keys or user content by default
- **Console Only**: No file writing or network calls
- **Error Safe**: Logging failures don't affect main application

This simplified feature focuses on the core need: basic error visibility for debugging without adding complexity or performance concerns.
