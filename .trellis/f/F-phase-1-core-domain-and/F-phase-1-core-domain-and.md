---
id: F-phase-1-core-domain-and
title: "Phase 1: Core Domain and Public API Skeleton"
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  package.json: Added Zod v3.22.0 as production dependency
  src/core/validation/validationResult.ts: Created ValidationResult type for standardized validation responses
  src/core/validation/schemaInput.ts: Created SchemaInput utility type for extracting Zod input types
  src/core/validation/schemaOutput.ts: Created SchemaOutput utility type for extracting Zod output types
  src/core/validation/typeGuard.ts: Created TypeGuard type signature for runtime type checking
  src/core/validation/schemaValidator.ts: Created SchemaValidator interface for consistent validation patterns
  src/core/validation/validationOptions.ts: Created ValidationOptions interface for customizable validation behavior
  src/core/validation/schemaCompositionOptions.ts: Created SchemaCompositionOptions interface for schema merging configuration
  src/core/validation/commonSchemas.ts:
    Implemented common validation schemas for
    email, URL, and timestamps; Enhanced with base64, image MIME type, document
    MIME type, filename, and language identifier validation schemas; Added
    toolName and toolDescription validation schemas following existing patterns
    with regex validation and length constraints
  src/core/validation/formatValidationError.ts: Created error message formatter with context and field information
  src/core/validation/safeValidate.ts: Implemented safe validation wrapper
    returning ValidationResult instead of throwing
  src/core/validation/validateOrThrow.ts: Created validation wrapper that throws ValidationError on failure
  src/core/validation/createTypeGuard.ts: Implemented type guard creator utility for runtime type checking
  src/core/validation/schemaComposition.ts: Created schema composition utilities for merging and transforming schemas
  src/core/validation/index.ts: Created barrel export module aggregating all validation functionality
  src/core/index.ts: Updated core module to export validation infrastructure
  src/core/validation/__tests__/validationResult.test.ts: Comprehensive tests for ValidationResult type and type discrimination
  src/core/validation/__tests__/commonSchemas.test.ts: Complete test suite for
    email, URL, and timestamp validation schemas; Added comprehensive tests for
    new validation schemas including base64, MIME types, filenames, and language
    identifiers
  src/core/validation/__tests__/safeValidate.test.ts: Thorough tests for safe validation utility with various scenarios
  src/core/validation/__tests__/validateOrThrow.test.ts: Comprehensive tests for throwing validation utility and error handling
  src/core/validation/__tests__/createTypeGuard.test.ts: Complete tests for type guard creation and runtime type checking
  src/core/validation/__tests__/index.test.ts: Integration tests for module exports and API surface validation
  src/core/messages/contentPartSchema.ts: Created main Zod discriminated union
    schema for ContentPart validation with strict validation rules
  src/core/messages/contentPartTypes.ts: Created TypeScript types derived from Zod schema for ContentPart union
  src/core/messages/contentPartValidation.ts:
    Created validation utility functions
    for ContentPart validation and type checking
  src/core/messages/__tests__/contentPartSchema.test.ts:
    Implemented comprehensive
    test suite covering all content types, validation scenarios, and edge cases
  src/core/messages/contentPart.ts: Updated to export Zod-derived types while maintaining backward compatibility
  src/core/messages/index.ts: Updated to export new schema and validation
    utilities alongside existing types; Updated module exports to include
    MessageSchema, validateMessage function, and ValidatedMessage type
  src/core/messages/messageSchema.ts:
    Created comprehensive Zod schema for Message
    interface with UUID, role enum, content array, timestamp, sources, and
    metadata validation
  src/core/messages/messageValidation.ts: Created validateMessage function using
    validateOrThrow utility for runtime Message validation
  src/core/messages/messageTypes.ts: Created ValidatedMessage type inferred from
    Zod schema for type-safe validated messages
  src/core/messages/__tests__/messageSchema.test.ts: Implemented comprehensive
    test suite with 36 tests covering all validation rules, error cases, and
    edge conditions
  src/client/chatRequest.ts: Created ChatRequest interface for chat completion
    requests with messages array, model selection, and optional parameters
  src/client/streamRequest.ts: Created StreamRequest interface extending
    ChatRequest with streaming-specific options like stream flag and
    streamOptions
  src/client/streamDelta.ts: Created StreamDelta interface for incremental
    streaming response chunks with partial message content and metadata
  src/client/bridgeClientConfig.ts: Created BridgeClientConfig interface for
    internal validated configuration with Map-based provider storage
  src/client/featureFlagsInterface.ts: Created FeatureFlags interface defining
    CHAT_ENABLED, STREAMING_ENABLED, and TOOLS_ENABLED boolean flags
  src/client/featureFlagOverrides.ts: Created FeatureFlagOverrides interface for
    optional flag overrides during development and testing
  src/client/initializeFeatureFlags.ts: Implemented initializeFeatureFlags
    function with all flags defaulting to false for Phase 1 with optional
    overrides
  src/client/isFeatureEnabled.ts: Created isFeatureEnabled utility function for type-safe feature flag checking
  src/client/bridgeClient.ts: Implemented main BridgeClient class with
    constructor, chat(), stream(), and getConfig() methods; comprehensive
    configuration validation; feature flag integration; proper error handling
    with BridgeError instances
  src/client/index.ts: Created barrel export module aggregating all client
    functionality including BridgeClient class and related types
  src/client/__tests__/chatRequest.test.ts: Comprehensive test suite for
    ChatRequest interface covering structure validation, TypeScript compilation,
    and type inference
  src/client/__tests__/streamRequest.test.ts: Complete test suite for
    StreamRequest interface including inheritance from ChatRequest and
    streaming-specific options
  src/client/__tests__/streamDelta.test.ts: Thorough test suite for StreamDelta
    interface covering partial message content, usage information, and metadata
    handling
  src/client/__tests__/bridgeClientConfig.test.ts: Extensive test suite for
    BridgeClientConfig interface including Map provider storage and complex
    configuration scenarios
  src/client/__tests__/featureFlags.test.ts:
    Complete test suite for feature flag
    system covering all interfaces, initialization, checking utilities, and
    integration scenarios
  src/client/__tests__/bridgeClient.test.ts: Comprehensive test suite for
    BridgeClient class covering constructor validation, method signatures,
    feature flag behavior, configuration transformation, and error handling
  src/index.ts: Updated main public API exports to include BridgeClient,
    request/response types, configuration interfaces, core message types, error
    classes, and feature flag system
  src/core/tools/toolDefinitionSchema.ts: Created comprehensive Zod schema for
    ToolDefinition with discriminated union support for both Zod schemas and
    JSON Schema objects, strict validation rules, and security considerations
  src/core/tools/toolDefinition.ts: Updated to use Zod-derived types while
    maintaining backward compatibility, enhanced JSDoc with examples for both
    Zod and JSON Schema usage patterns
  src/core/tools/index.ts: Added export for ToolDefinitionSchema to make schema
    validation available to external consumers
  src/core/tools/__tests__/toolDefinitionSchema.test.ts:
    Implemented comprehensive
    test suite with 37 tests covering all validation rules, error cases, edge
    conditions, and type inference verification
log: []
schema: v1.0
childrenIds:
  - T-define-modelregistry
  - T-define-providerregistry
  - T-define-tooldefinition-schema
  - T-implement-createclient
  - T-integrate-registries-with
  - T-update-public-api-exports-and
  - T-add-zod-dependency-and
  - T-create-bridgeclient-class
  - T-define-contentpart-union
  - T-define-message-zod-schema
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
