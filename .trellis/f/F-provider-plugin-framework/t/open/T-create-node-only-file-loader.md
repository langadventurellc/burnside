---
id: T-create-node-only-file-loader
title: Create Node-only file loader utility
status: open
priority: medium
parent: F-provider-plugin-framework
prerequisites:
  - T-implement-json-to-modelinfo
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T17:04:18.510Z
updated: 2025-09-15T17:04:18.510Z
---

# Create Node-only File Loader Utility

## Context

While the core mapping layer handles platform-agnostic JSON-to-ModelInfo conversion, this task creates a Node.js-specific utility for loading `docs/defaultLlmModels.json` from the file system. This utility is isolated to maintain cross-platform compatibility while enabling tooling and testing scenarios.

**Related Feature**: F-provider-plugin-framework - Provider Plugin Framework  
**Depends On**: T-implement-json-to-modelinfo (provides `mapJsonToModelInfo` function)  
**Usage**: Tooling, testing, and development scenarios requiring file system access

## Specific Implementation Requirements

### 1. Create Node File Loader (`src/runtime/node/modelLoader.ts`)

````typescript
import { readFileSync } from "node:fs";
import {
  mapJsonToModelInfo,
  DefaultLlmModelsSchema,
} from "../../core/models/modelLoader.js";
import { validateOrThrow } from "../../core/validation/validateOrThrow.js";
import type { ModelInfo } from "../../core/providers/modelInfo.js";
import type { DefaultLlmModelsJson } from "../../core/models/modelLoader.js";

/**
 * Node.js-specific utility to load and parse defaultLlmModels.json from file system
 *
 * @param filePath - Path to the defaultLlmModels.json file
 * @returns Array of ModelInfo objects with default capabilities
 * @throws ValidationError if file contains invalid JSON structure
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * // Load default models for testing
 * const models = loadDefaultModels('./docs/defaultLlmModels.json');
 * console.log(\`Loaded \${models.length} models\`);
 * ```
 */
export function loadDefaultModels(filePath: string): ModelInfo[] {
  try {
    // Read and parse JSON file
    const fileContent = readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(fileContent) as unknown;

    // Validate structure with Zod schema
    const validatedData = validateOrThrow(DefaultLlmModelsSchema, jsonData, {
      message: `Invalid defaultLlmModels.json structure in ${filePath}`,
    });

    // Convert to ModelInfo array using platform-agnostic mapper
    return mapJsonToModelInfo(validatedData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError(
        `Invalid JSON syntax in ${filePath}: ${error.message}`,
        { cause: error },
      );
    }
    throw error; // Re-throw ValidationError or file system errors
  }
}

/**
 * Convenience function to load default models from standard location
 *
 * @returns Array of ModelInfo objects loaded from docs/defaultLlmModels.json
 */
export function loadStandardDefaultModels(): ModelInfo[] {
  return loadDefaultModels("./docs/defaultLlmModels.json");
}
````

### 2. Directory Structure Setup

- Ensure `src/runtime/node/` directory exists
- Add proper TypeScript configuration for Node.js-specific modules
- Update exports in `src/runtime/node/index.ts`

### 3. Error Handling Strategy

- **File System Errors**: Pass through Node.js file system errors (permissions, not found)
- **JSON Parsing Errors**: Convert `SyntaxError` to `ValidationError` with context
- **Schema Validation Errors**: Use existing `validateOrThrow` with custom error message
- **Path Resolution**: Use relative paths for standard location, absolute for custom

## Detailed Acceptance Criteria

### File Loading Function

- ✅ `loadDefaultModels(filePath)` successfully reads JSON from file system
- ✅ Function uses Node.js `readFileSync` with UTF-8 encoding
- ✅ File path parameter accepts both relative and absolute paths
- ✅ JSON parsing handled with proper error conversion
- ✅ Uses platform-agnostic `mapJsonToModelInfo` for actual conversion

### Validation Integration

- ✅ JSON content validated with `DefaultLlmModelsSchema` before processing
- ✅ Uses existing `validateOrThrow` utility with custom error context
- ✅ Validation errors include file path information for debugging
- ✅ Schema validation occurs after JSON parsing but before mapping

### Error Handling

- ✅ File system errors (ENOENT, EACCES) propagate with original error details
- ✅ JSON syntax errors converted to `ValidationError` with file context
- ✅ Schema validation errors include file path in error message
- ✅ All error types follow existing codebase error handling patterns

### Convenience Functions

- ✅ `loadStandardDefaultModels()` provides zero-config loading from standard path
- ✅ Standard path resolves to `./docs/defaultLlmModels.json`
- ✅ Function handles relative path resolution from project root

### Node.js Integration

- ✅ Uses `node:fs` import syntax for Node.js built-in modules
- ✅ Function is properly typed for Node.js environment
- ✅ File system operations are synchronous (appropriate for initialization)
- ✅ No dependencies on browser or React Native APIs

### Testing Requirements

- ✅ Unit tests with actual `docs/defaultLlmModels.json` file
- ✅ Error handling tests with invalid file paths
- ✅ JSON syntax error handling tests with malformed files
- ✅ Schema validation error tests with invalid JSON structure
- ✅ Standard path loading tests
- ✅ File system permission error handling tests

## Technical Approach

### File Organization

- **New File**: `src/runtime/node/modelLoader.ts`
- **Update**: `src/runtime/node/index.ts` (add export)
- **Imports**: Platform-agnostic mapping function, validation utilities, type definitions

### Node.js Patterns

- Use `node:fs` import syntax for built-in modules
- Synchronous file operations for simplicity (initialization use case)
- UTF-8 encoding for JSON file reading
- Standard Node.js error propagation

### Integration Points

- **Core Mapping**: Uses `mapJsonToModelInfo` from platform-agnostic layer
- **Validation**: Integrates with existing `validateOrThrow` utility
- **Error Handling**: Uses existing `ValidationError` class
- **TypeScript**: Proper typing for Node.js-specific functionality

### Path Resolution

- Support both relative and absolute file paths
- Default to `./docs/defaultLlmModels.json` for standard use case
- Resolve paths relative to current working directory

## Dependencies

- **Prerequisite**: T-implement-json-to-modelinfo (provides `mapJsonToModelInfo` and schema)
- **Uses**: Node.js `fs` module, existing validation utilities
- **Blocks**: None (leaf task)

## Out of Scope

- File watching or automatic reloading (static initialization use case)
- Asynchronous file operations (synchronous is appropriate here)
- Browser or React Native compatibility (Node.js specific by design)
- Complex path resolution or configuration management
- Caching or memoization of loaded models

## Security Considerations

- File path validation to prevent directory traversal attacks
- Error messages should not leak sensitive file system information
- JSON parsing should not execute arbitrary code
- File system access limited to read operations only
- Use synchronous operations to avoid race conditions

## Usage Examples

```typescript
// In tests or tooling
import {
  loadDefaultModels,
  loadStandardDefaultModels,
} from "src/runtime/node/modelLoader.js";

// Load from specific path
const customModels = loadDefaultModels("./config/custom-models.json");

// Load from standard location
const defaultModels = loadStandardDefaultModels();

// Use in ModelRegistry initialization
modelRegistry.registerBatch(defaultModels);
```
