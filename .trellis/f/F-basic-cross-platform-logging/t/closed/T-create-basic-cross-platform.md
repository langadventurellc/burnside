---
id: T-create-basic-cross-platform
title: Create basic cross-platform logger utility
status: done
priority: high
parent: F-basic-cross-platform-logging
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
log:
  - Successfully implemented a basic cross-platform logger utility that provides
    level-based filtering, safe serialization, and consistent formatting across
    Node.js, browser, and React Native environments. The implementation includes
    a SimpleLogger class with four log levels (error, warn, info, debug), safe
    circular reference handling, and comprehensive error protection. All 31 unit
    tests pass, covering default configuration, level filtering, runtime
    configuration changes, message formatting, data serialization, error safety,
    console method mapping, performance optimization, and edge cases. The logger
    follows project conventions with separate files for types, interfaces, and
    implementation, plus proper barrel exports.
schema: v1.0
childrenIds: []
created: 2025-09-19T18:08:45.860Z
updated: 2025-09-19T18:08:45.860Z
---

# Create Basic Cross-Platform Logger Utility

## Context

Implement a simple, cross-platform logger utility that works consistently across Node.js, browser, and React Native environments. This logger will provide the foundation for debugging intermittent test failures and provider issues.

**Feature Context**: Part of F-basic-cross-platform-logging - Basic Cross-Platform Logging System
**Reference Implementation**: Follow the simplicity principles outlined in the feature specification

## Specific Implementation Requirements

### Core Logger Implementation

Create a new logger utility file at `src/core/logging/simpleLogger.ts` with the following components:

1. **LogLevel enum/type**: Define 'error', 'warn', 'info', 'debug' levels with numeric priority
2. **LoggingConfig interface**: Configuration structure matching existing patterns in `config.options`
3. **SimpleLogger class**: Main logger implementation with level-based filtering
4. **Default logger instance**: Pre-configured logger that can be imported and used immediately

### Technical Approach

**File Structure:**

```typescript
// src/core/logging/simpleLogger.ts
export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LoggingConfig {
  enabled?: boolean; // Default: true
  level?: LogLevel; // Default: 'warn'
}

export class SimpleLogger {
  // Implementation details below
}

export const logger = new SimpleLogger(); // Default instance
```

**Implementation Details:**

1. **Level Priority**: error=0, warn=1, info=2, debug=3 (lower numbers have higher priority)
2. **Console Mapping**:
   - error → console.error()
   - warn → console.warn()
   - info → console.info()
   - debug → console.log()
3. **Message Format**: `[timestamp] [LEVEL] message` using ISO timestamp
4. **Safe Serialization**: Use JSON.stringify with circular reference protection
5. **Environment Detection**: Auto-detect platform for any platform-specific formatting needs

### Detailed Acceptance Criteria

**Functional Requirements:**

- **Default Behavior**: Logger shows warnings and errors without any configuration
- **Level Filtering**: Only logs messages at configured level and above (e.g., 'warn' shows warn + error)
- **Cross-Platform**: Identical behavior across Node.js, browser, and React Native
- **Safe Operation**: Logger failures never crash or block the application
- **Configuration**: Accept LoggingConfig object to control enabled state and level

**API Requirements:**

- **Log Methods**: `logger.error(message, data?)`, `logger.warn(message, data?)`, `logger.info(message, data?)`, `logger.debug(message, data?)`
- **Configuration**: `logger.configure(config: LoggingConfig)` method to update settings
- **Level Check**: `logger.isLevelEnabled(level: LogLevel)` for performance optimization
- **Message Types**: Support string messages with optional data object

**Output Format:**

```
[2025-01-15T10:30:45.123Z] [ERROR] Provider validation failed: {"error": "UNEXPECTED_TOOL_CALL"}
[2025-01-15T10:30:45.124Z] [WARN] Rate limit approaching threshold
[2025-01-15T10:30:45.125Z] [INFO] Request completed successfully
[2025-01-15T10:30:45.126Z] [DEBUG] Request payload: {"model": "gpt-4", "messages": [...]}
```

## Dependencies on Other Tasks

- None - this is the foundational task that other logging tasks will depend on

## Security Considerations

**Data Safety:**

- **No Sensitive Data**: Never log API keys, passwords, or user content by default
- **Safe Serialization**: Handle circular references and prevent infinite recursion
- **Memory Safety**: Don't accumulate log data in memory or cause memory leaks

## Testing Requirements

**Unit Tests** (include in same task):

1. **Level Filtering**: Test that only appropriate levels are logged
2. **Configuration**: Test enabled/disabled states and level changes
3. **Message Formatting**: Verify timestamp and level formatting
4. **Data Serialization**: Test various data types and circular references
5. **Error Safety**: Test logger behavior when console methods fail
6. **Cross-Platform**: Test in Node.js environment (browser/RN via mocking)

**Test File**: `src/core/logging/__tests__/simpleLogger.test.ts`

**Key Test Scenarios:**

- Default configuration (warn level, enabled)
- All four log levels with various data types
- Level filtering (debug level should show all, error level should show only errors)
- Configuration changes at runtime
- Circular reference handling in data objects
- Logger failures don't crash the application

## Implementation Guidance

**Keep It Simple:**

- **Single File**: All logging logic in one 300-400 line file
- **No Dependencies**: Use only built-in APIs (console, Date, JSON)
- **Direct Console**: No abstraction layers or complex formatting
- **Fail Safe**: Wrap all console operations in try-catch blocks

**Performance Considerations:**

- **Lazy Evaluation**: Don't serialize data unless actually logging
- **Level Check**: Quick level comparison before any processing
- **Minimal Overhead**: Logger should add <1ms to any operation

## Out of Scope

- File system logging (console only)
- Network logging or log aggregation
- Complex formatting or structured logging
- Integration with external logging frameworks
- Log rotation or persistence
- Performance monitoring or metrics

This task creates the foundation logger utility that subsequent tasks will integrate throughout the codebase.
