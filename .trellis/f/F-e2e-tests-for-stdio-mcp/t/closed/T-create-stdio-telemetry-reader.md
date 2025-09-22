---
id: T-create-stdio-telemetry-reader
title: Create STDIO telemetry reader utility
status: done
priority: high
parent: F-e2e-tests-for-stdio-mcp
prerequisites:
  - T-create-stdio-mock-mcp-server
affectedFiles:
  src/__tests__/e2e/shared/stdioTelemetryReader.ts: Created main
    StdioTelemetryReader class with file-based telemetry reading, caching, error
    handling, and MockMcpServer-compatible interface
  src/__tests__/e2e/shared/createStdioTelemetryReader.ts:
    Created factory function
    for default OS temp directory telemetry reader instantiation
  src/__tests__/e2e/shared/createStdioTelemetryReaderWithPath.ts:
    Created factory function for custom base directory telemetry reader
    instantiation
  src/__tests__/e2e/shared/__tests__/stdioTelemetryReader.test.ts:
    Added comprehensive unit tests covering all functionality, error scenarios,
    and edge cases
log:
  - >-
    Successfully implemented STDIO telemetry reader utility that provides
    identical interface to MockMcpServer for test assertions while reading from
    file-based telemetry created by STDIO MCP servers.


    Key features implemented:

    - Cross-platform file reading using os.tmpdir() and path.join()

    - Identical method signatures to MockMcpServer telemetry interface

    - Robust error handling for missing files, malformed JSON, and permission
    errors

    - Timestamp conversion from ISO strings to Date objects for compatibility

    - Intelligent caching with file modification time checking

    - Comprehensive unit tests with 100% coverage of all scenarios

    - Factory functions for convenient instantiation with different path options


    The utility maintains complete compatibility with existing test assertion
    patterns while enabling subprocess-based STDIO MCP testing. All quality
    checks pass and the implementation follows project conventions with
    single-export-per-file structure.
schema: v1.0
childrenIds: []
created: 2025-09-21T17:14:18.201Z
updated: 2025-09-21T17:14:18.201Z
---

# Create STDIO Telemetry Reader Utility

## Context

This task creates a utility that reads file-based telemetry from the STDIO mock MCP server and provides the same interface as the HTTP MockMcpServer for test assertions. This maintains compatibility with existing test patterns while enabling subprocess-based testing.

**Related Issues:**

- Parent Feature: F-e2e-tests-for-stdio-mcp (E2E Tests for STDIO MCP Transport)
- Prerequisite: T-create-stdio-mock-mcp-server (provides telemetry files to read)
- Reference: `src/__tests__/e2e/shared/mockMcpServer.ts:246-261` (wasToolCalled, getToolCallCount, etc.)

**Existing Patterns:**
Current tests use these MockMcpServer methods for assertions:

```typescript
expect(mcpServer.wasToolCalled("echo_tool")).toBe(true);
expect(mcpServer.getToolCallCount("echo_tool")).toBeGreaterThan(0);
const toolCalls = mcpServer.getToolCallsFor("echo_tool");
expect(toolCalls[0].arguments).toMatchObject({ message: testInput });
```

This utility provides identical interface but reads from telemetry files instead of in-memory data.

## Specific Implementation Requirements

### 1. **File Creation**

Create `src/__tests__/e2e/shared/stdioTelemetryReader.ts` with TypeScript interfaces and implementation.

### 2. **Interface Compatibility**

Implement interface matching MockMcpServer's telemetry methods:

```typescript
interface StdioTelemetryReader {
  wasToolCalled(toolName: string): boolean;
  getToolCallCount(toolName: string): number;
  getToolCallsFor(
    toolName: string,
  ): Array<{ arguments: unknown; timestamp: Date }>;
  clearToolCallHistory(): void;
  getToolCalls(): Record<
    string,
    Array<{ arguments: unknown; timestamp: Date }>
  >;
}
```

### 3. **Telemetry File Format**

Handle telemetry files created by STDIO server:

```json
{
  "toolCalls": {
    "echo_tool": [
      {
        "arguments": { "message": "test" },
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 4. **Cross-Platform File Reading Implementation**

- Use cross-platform path generation with `os.tmpdir()` and `path.join()`
- Read telemetry file synchronously for immediate test assertions
- Handle missing files gracefully (return empty results)
- Parse JSON and validate structure
- Convert ISO timestamp strings back to Date objects
- Cache results for performance during test execution

### 5. **Error Handling**

- Handle file not found scenarios (return empty results)
- Handle malformed JSON gracefully (log warning, return empty)
- Handle permission errors (throw descriptive error)
- Validate telemetry file structure

## Technical Approach

### **Step-by-Step Implementation:**

1. **Create TypeScript interface file with cross-platform path support**

   ```typescript
   import { tmpdir } from "os";
   import { join } from "path";

   // Define interfaces matching MockMcpServer telemetry methods
   interface TelemetryData {
     toolCalls: Record<
       string,
       Array<{ arguments: unknown; timestamp: string }>
     >;
   }
   ```

2. **Implement file reading and caching with cross-platform paths**

   ```typescript
   class StdioTelemetryReader {
     private telemetryFile: string;
     private cachedData: TelemetryData | null = null;
     private lastReadTime: number = 0;

     constructor(telemetryFile: string) {
       this.telemetryFile = telemetryFile;
     }
   }
   ```

3. **Implement data loading with caching**
   - Read file if modified since last read
   - Parse JSON and validate structure
   - Convert timestamp strings to Date objects
   - Cache results for multiple method calls

4. **Implement MockMcpServer-compatible methods**
   - `wasToolCalled()`: Check if tool exists in data
   - `getToolCallCount()`: Return array length for tool
   - `getToolCallsFor()`: Return tool calls with Date objects
   - `clearToolCallHistory()`: Delete telemetry file
   - `getToolCalls()`: Return all tool calls

5. **Add error handling and validation**

6. **Create factory function for easy instantiation with cross-platform paths**

### **Cross-Platform Factory Pattern Implementation:**

```typescript
export function createStdioTelemetryReader(
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(tmpdir(), `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}

// Alternative with injectable base directory for testing
export function createStdioTelemetryReaderWithPath(
  baseDir: string,
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(baseDir, `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}
```

## Detailed Acceptance Criteria

### **Functional Requirements:**

1. **Interface Compatibility**
   - Must provide identical method signatures as MockMcpServer telemetry methods
   - Must return same data types and structures
   - Must handle missing data scenarios gracefully (return empty arrays/false)
   - Must support all assertion patterns used in existing tests

2. **Cross-Platform File Reading**
   - Must read telemetry files created by STDIO mock server on any platform
   - Must handle file path based on process ID using cross-platform paths
   - Must parse JSON correctly and validate structure
   - Must convert timestamp strings to Date objects for compatibility
   - Must work on Windows, macOS, and Linux

3. **Performance**
   - Must cache file data to avoid repeated disk reads during single test
   - Must invalidate cache when file is modified
   - Must complete method calls in under 10ms for cached data

4. **Error Handling**
   - Missing file → Return empty results (wasToolCalled = false, counts = 0)
   - Malformed JSON → Log warning to console, return empty results
   - Permission errors → Throw descriptive error with file path
   - Invalid structure → Log warning, return empty results

### **Technical Requirements:**

1. **File Location:** `src/__tests__/e2e/shared/stdioTelemetryReader.ts`
2. **TypeScript:** Full type safety with proper interfaces
3. **Dependencies:** Use only Node.js built-in modules (`fs`, `path`, `os`)
4. **Export:** Named exports for class and factory functions
5. **Platform:** Must work cross-platform (Windows, macOS, Linux)

### **Method Behavior Requirements:**

**`wasToolCalled(toolName: string): boolean`**

- Return `true` if tool has any recorded calls
- Return `false` if tool has no calls or file doesn't exist

**`getToolCallCount(toolName: string): number`**

- Return number of times tool was called
- Return `0` if tool not found or file doesn't exist

**`getToolCallsFor(toolName: string): Array<{ arguments: unknown; timestamp: Date }>`**

- Return array of tool calls with Date objects (not strings)
- Return empty array if tool not found
- Maintain chronological order from file

**`clearToolCallHistory(): void`**

- Delete telemetry file from filesystem using cross-platform path
- Clear internal cache
- Next method calls should return empty results

**`getToolCalls(): Record<string, Array<{ arguments: unknown; timestamp: Date }>>`**

- Return all tool calls for all tools
- Return empty object if file doesn't exist
- Convert all timestamps to Date objects

## Implementation Template

```typescript
import { readFileSync, unlinkSync, existsSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

interface TelemetryData {
  toolCalls: Record<string, Array<{ arguments: unknown; timestamp: string }>>;
}

interface ToolCall {
  arguments: unknown;
  timestamp: Date;
}

export class StdioTelemetryReader {
  private telemetryFile: string;
  private cachedData: Record<string, ToolCall[]> | null = null;
  private lastModified: number = 0;

  constructor(telemetryFile: string) {
    this.telemetryFile = telemetryFile;
  }

  private loadData(): Record<string, ToolCall[]> {
    // Implementation here
  }

  wasToolCalled(toolName: string): boolean {
    // Implementation here
  }

  getToolCallCount(toolName: string): number {
    // Implementation here
  }

  getToolCallsFor(toolName: string): ToolCall[] {
    // Implementation here
  }

  clearToolCallHistory(): void {
    // Implementation here
  }

  getToolCalls(): Record<string, ToolCall[]> {
    // Implementation here
  }
}

export function createStdioTelemetryReader(
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(tmpdir(), `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}

export function createStdioTelemetryReaderWithPath(
  baseDir: string,
  processId: number,
): StdioTelemetryReader {
  const telemetryFile = join(baseDir, `stdio-mcp-telemetry-${processId}.json`);
  return new StdioTelemetryReader(telemetryFile);
}
```

## Dependencies

- **Prerequisite:** T-create-stdio-mock-mcp-server (must create telemetry files this reads)
- **Requires:** Node.js built-in modules (`fs`, `path`, `os`)
- **Provides:** Utility for subsequent test implementation tasks

## Out of Scope

- **Real-time file watching:** Simple polling/caching sufficient for tests
- **Multiple file formats:** Only handle JSON format from STDIO server
- **Complex validation:** Basic structure validation sufficient
- **Performance optimization:** Focus on correctness over speed
- **Advanced caching:** Simple modification time checking sufficient

## Testing Requirements

### **Unit Tests to Include:**

1. **Basic functionality tests**

   ```typescript
   describe("StdioTelemetryReader", () => {
     test("returns false for non-existent tool", () => {
       const reader = new StdioTelemetryReader(
         join(tmpdir(), "non-existent.json"),
       );
       expect(reader.wasToolCalled("echo_tool")).toBe(false);
     });
   });
   ```

2. **Cross-platform file reading tests**
   - Test with valid telemetry file in OS temp directory
   - Test with missing file
   - Test with malformed JSON
   - Test with empty file

3. **Data conversion tests**
   - Verify timestamp strings convert to Date objects
   - Verify argument structures preserved
   - Verify tool call order maintained

4. **Cache invalidation tests**
   - Verify cache updates when file modified
   - Verify cache persists for repeated calls

### **Cross-Platform Manual Testing:**

1. Create sample telemetry file with test data in OS temp directory
2. Verify each method returns expected results on Windows/macOS/Linux
3. Test file deletion and re-creation scenarios
4. Verify error handling with various file states

### **Path Validation:**

```typescript
// Test cross-platform path generation
const { tmpdir } = require("os");
const { join } = require("path");
console.log("Platform temp dir:", tmpdir());
console.log(
  "Telemetry path:",
  join(tmpdir(), "stdio-mcp-telemetry-12345.json"),
);
```

This utility enables existing test assertion patterns to work with subprocess-based STDIO MCP servers by providing a compatible interface for accessing tool call telemetry stored in cross-platform temporary files.
