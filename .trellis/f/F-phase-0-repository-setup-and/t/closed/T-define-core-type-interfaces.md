---
id: T-define-core-type-interfaces
title: Define core type interfaces for messages, tools, and providers
status: done
priority: high
parent: F-phase-0-repository-setup-and
prerequisites:
  - T-create-base-directory
affectedFiles:
  src/core/messages/role.ts: Created Role type for message participant roles
  src/core/messages/contentPart.ts: Created ContentPart interface for multi-modal message content
  src/core/messages/sourceRef.ts: Created SourceRef interface for citation tracking
  src/core/messages/message.ts: Created Message interface for unified message representation
  src/core/messages/index.ts: Updated to export all message types
  src/core/tools/toolDefinition.ts: Created ToolDefinition interface for tool metadata
  src/core/tools/toolHandler.ts: Created ToolHandler interface for tool execution
  src/core/tools/toolExecutionContext.ts: Created ToolExecutionContext interface for execution environment
  src/core/tools/index.ts: Updated to export all tool types
  src/core/providers/modelCapabilities.ts: Created ModelCapabilities interface for model feature description
  src/core/providers/modelInfo.ts: Created ModelInfo interface for model metadata
  src/core/providers/providerPlugin.ts: Created ProviderPlugin interface for provider implementations
  src/core/providers/index.ts: Updated to export all provider types
  src/core/config/bridgeConfig.ts: Created BridgeConfig interface for top-level library configuration
  src/core/config/providerConfig.ts: Created ProviderConfig interface for provider-specific settings
  src/core/config/modelConfig.ts: Created ModelConfig interface for model-specific parameters
  src/core/config/index.ts: Updated to export all configuration types
  src/core/messages/__tests__/types.test.ts: Created comprehensive tests for message type interfaces
  src/core/tools/__tests__/types.test.ts: Created comprehensive tests for tool type interfaces
  src/core/providers/__tests__/types.test.ts: Created comprehensive tests for provider type interfaces
  src/core/config/__tests__/types.test.ts: Created comprehensive tests for configuration type interfaces
log:
  - Successfully implemented core type interfaces for messages, tools,
    providers, and configuration. Created separate TypeScript interface files to
    comply with the one-export-per-file linting rule. All interfaces include
    comprehensive TSDoc documentation and follow Phase 0 requirements for
    minimal placeholders. Implemented comprehensive test coverage for all
    interfaces. All quality checks pass (linting, formatting, type checking) and
    tests pass successfully.
schema: v1.0
childrenIds: []
created: 2025-09-15T04:00:59.249Z
updated: 2025-09-15T04:00:59.249Z
---

# Define Core Type Interfaces for Messages, Tools, and Providers

Create minimal TypeScript interface placeholders for the core domain types needed for Phase 0 scaffolding without full implementation.

## Context

This task implements the minimal type placeholders as specified in Phase 0 requirements. These interfaces provide the foundation for subsequent phases while keeping Phase 0 scope minimal and focused on scaffolding.

Reference: Feature F-phase-0-repository-setup-and - Phase 0: Repository Setup and Scaffolding
Depends on: T-create-base-directory

## Specific Implementation Requirements

Define basic TypeScript interfaces in the appropriate modules:

### 1. Message & Content Model (`src/core/messages/`)

Create `types.ts` with:

- `Role` type for message roles
- `ContentPart` interface for different content types
- `SourceRef` interface for citations
- `Message` interface with basic structure

### 2. Tool Model (`src/core/tools/`)

Create `types.ts` with:

- `ToolDefinition` interface outline
- `ToolHandler` interface shape
- `ToolExecutionContext` interface placeholder

### 3. Provider Model (`src/core/providers/`)

Create `types.ts` with:

- `ModelCapabilities` interface for provider features
- `ModelInfo` interface for model metadata
- `ProviderPlugin` interface shape (generic placeholder)

### 4. Configuration Model (`src/core/config/`)

Create `types.ts` with:

- `BridgeConfig` interface structure
- Basic provider/model configuration interfaces

## Technical Approach

1. **Interface-First Design**: Define TypeScript interface shapes only
2. **Minimal Scope**: Include only structure needed for Phase 0
3. **No Implementation**: Avoid any logic or full implementation
4. **Export Organization**: Update index.ts files to export new types
5. **Documentation**: Add TSDoc comments for all public interfaces

## Detailed Acceptance Criteria

### Functional Requirements

- [ ] All core interfaces defined as TypeScript shapes
- [ ] Message model includes Role, ContentPart, SourceRef, Message interfaces
- [ ] Tool model includes ToolDefinition, ToolHandler, ToolExecutionContext interfaces
- [ ] Provider model includes ModelCapabilities, ModelInfo, ProviderPlugin interfaces
- [ ] Configuration model includes BridgeConfig and provider config interfaces
- [ ] All interfaces properly exported from module index.ts files

### Code Quality Requirements

- [ ] All TypeScript interfaces compile without errors
- [ ] No `any` types used in any interface
- [ ] Proper TSDoc documentation for all public interfaces
- [ ] Consistent naming conventions across all types
- [ ] Interface organization follows single-responsibility principle

### Testing Requirements (included in this task)

- [ ] Create basic unit tests for type checking in each module
- [ ] Verify all interfaces can be imported correctly
- [ ] Test that TypeScript compilation succeeds for all type definitions

### Integration Requirements

- [ ] All interface exports available from module index files
- [ ] No circular dependencies between type definitions
- [ ] Main src/index.ts can export key types

### Documentation Requirements

- [ ] TSDoc comments on all public interfaces
- [ ] Clear description of interface purpose and usage
- [ ] Parameter and return type documentation where applicable

## Security Considerations

- No sensitive data in type definitions
- Interface shapes support secure configuration injection patterns
- No hard-coded values or credentials in type definitions

## Testing Requirements (included in this task)

Create basic type checking tests:

- `src/core/messages/types.test.ts`
- `src/core/tools/types.test.ts`
- `src/core/providers/types.test.ts`
- `src/core/config/types.test.ts`

Each test file should verify:

- Interfaces can be imported successfully
- Basic type compatibility works as expected
- No TypeScript compilation errors

## Out of Scope

- Full implementation of interface methods
- Zod schema validation (Phase 1+)
- Complex type transformations
- Provider-specific implementations
- Advanced type utilities

## Dependencies

- Requires T-create-base-directory to be completed
- Uses the directory structure created in the previous task

## Implementation Notes

1. Keep interfaces minimal and focused on shape definition
2. Use standard TypeScript patterns for interface design
3. Avoid complex generics or advanced TypeScript features
4. Focus on establishing the foundation for future phases
5. Maintain consistency with library architecture patterns
6. Each type file should be ≤100 lines to keep focused

## Example Interface Structure

```typescript
// Example from src/core/messages/types.ts
export type Role = "system" | "user" | "assistant" | "tool";

export interface ContentPart {
  type: string;
  // Additional properties defined per content type
}

export interface Message {
  id?: string;
  role: Role;
  content: ContentPart[];
  // Additional core message properties
}
```
