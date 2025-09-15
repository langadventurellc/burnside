---
id: F-phase-1-core-domain-and
title: "Phase 1: Core Domain and Public API Skeleton"
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T05:30:47.335Z
updated: 2025-09-15T05:30:47.335Z
---

## Purpose and Functionality

This feature implements Phase 1 of the LLM Bridge Library implementation plan, establishing the core domain model with Zod validation and creating the public API skeleton. This builds upon the foundational work completed in Phase 0 to provide a strongly-typed, validated interface for the library's primary functionality.

## Key Components to Implement

### 1. Unified Zod Schemas

- **Message Schema**: Define comprehensive Zod validation for the Message interface including role, content, sources, and metadata validation
- **ContentPart Schema**: Create union schema for different content types (text, image, document, code) with proper validation rules
- **ToolDefinition Schema**: Implement Zod schema for tool definitions with input/output schema validation and metadata

### 2. Public API Client Interface

- **createClient Function**: Main factory function for creating configured BridgeClient instances
- **BridgeClient Class**: Core client class with chat and stream method signatures
- **Feature Flag System**: Implement behind-the-scenes feature flags to enable no-op implementations initially

### 3. Registry Interfaces

- **ProviderRegistry Interface**: Define contract for provider plugin registration and resolution
- **ModelRegistry Interface**: Define contract for model capability and configuration management

## Detailed Acceptance Criteria

### Functional Behavior

- **Schema Validation**: All Zod schemas must validate correct inputs and reject invalid inputs with clear error messages
- **API Surface**: createClient() returns a valid BridgeClient instance with callable chat() and stream() methods
- **Type Safety**: All public interfaces are fully typed with no `any` types used
- **Feature Flags**: Methods return appropriate placeholder responses when features are disabled

### Schema Validation Requirements

- Message schema validates all required fields (role, content) and optional fields (id, timestamp, sources, metadata)
- ContentPart schema supports all content types with proper MIME type and format validation
- ToolDefinition schema validates tool names, descriptions, and nested Zod schemas for inputs/outputs
- Comprehensive error messages for validation failures include field paths and expected formats

### API Interface Requirements

- createClient accepts BridgeConfig and returns typed BridgeClient instance
- BridgeClient.chat() accepts messages array and options, returns Promise\<Message\>
- BridgeClient.stream() accepts same parameters, returns AsyncIterable\<StreamDelta\>
- Both methods throw appropriate errors when called with feature flags disabled

### Type System Requirements

- Full TypeScript compilation without errors
- Exported types available for consumption by external applications
- Generic types properly constrained and documented
- Consistent naming conventions following project standards

## Implementation Guidance

### Technical Approach

- **Zod-First Design**: Start with Zod schemas, then derive TypeScript types using `z.infer<>`
- **Modular Structure**: Keep each schema in its own file with dedicated test coverage
- **Runtime Validation**: All public API boundaries must use Zod validation
- **Progressive Enhancement**: Design for easy extension in future phases

### Code Organization

- Place Zod schemas alongside existing TypeScript interfaces in respective modules
- Create `src/client/` directory for BridgeClient implementation
- Add registry interfaces to `src/core/providers/` and `src/core/models/`
- Maintain existing module structure and naming conventions

### Error Handling Strategy

- Use consistent error types from existing error taxonomy
- Provide clear validation error messages with field-level details
- Implement proper error boundaries for async operations
- Ensure errors include context for debugging

## Dependencies

**Prerequisites**: Phase 0 completion (repository setup and base interfaces) - Trellis Issue: `F-phase-0-repository-setup-and` (Status: Done)
**Blocks**: Phase 2 (Transport and Streaming Foundations) - requires this API skeleton

## Testing Requirements

### Unit Test Coverage

- **Schema Tests**: Comprehensive validation tests for all Zod schemas with positive and negative test cases
- **API Tests**: Unit tests for createClient and BridgeClient method signatures
- **Type Tests**: TypeScript compilation tests ensuring proper type inference
- **Registry Tests**: Interface contract tests for provider and model registries

### Test Structure

- Each schema has dedicated test file with validation scenarios
- BridgeClient tests verify method signatures and feature flag behavior
- Integration tests for createClient with various configuration options
- Error handling tests for invalid inputs and edge cases

### Performance Considerations

- Schema validation performance with large message arrays
- Memory usage with complex nested tool definitions
- Type compilation time with extensive generic constraints

## Security Considerations

### Input Validation

- Strict validation of all user inputs through Zod schemas
- Sanitization of content parts to prevent injection attacks
- Validation of metadata fields to prevent prototype pollution
- Rate limiting considerations for schema validation performance

### Configuration Security

- Safe handling of API keys and sensitive configuration
- Validation of provider configurations without exposing secrets
- Secure defaults for all optional configuration parameters

## Implementation Tasks Breakdown

This feature should decompose into approximately 12-15 tasks of 1-2 hours each:

1. **Schema Implementation** (4-5 tasks)
   - Define Message Zod schema with validation rules
   - Define ContentPart union schema for all content types
   - Define ToolDefinition schema with nested validation
   - Add schema export and type inference setup
   - Create comprehensive schema validation tests

2. **Client API Implementation** (4-5 tasks)
   - Create BridgeClient class with method signatures
   - Implement createClient factory function
   - Add feature flag system for method implementations
   - Create client API unit tests
   - Add TypeScript compilation and type tests

3. **Registry Interfaces** (3-4 tasks)
   - Define ProviderRegistry interface and basic implementation
   - Define ModelRegistry interface and basic implementation
   - Add registry unit tests and contract validation
   - Integration with BridgeClient configuration

4. **Integration and Documentation** (1-2 tasks)
   - Update public API exports in src/index.ts
   - Add comprehensive JSDoc documentation
   - Create API usage examples

Each task should be independently testable and follow the project's coding standards including ≤400 LOC per file and strong typing requirements.
