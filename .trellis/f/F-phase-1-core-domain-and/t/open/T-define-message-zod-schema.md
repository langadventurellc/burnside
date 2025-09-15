---
id: T-define-message-zod-schema
title: Define Message Zod schema with comprehensive validation
status: open
priority: high
parent: F-phase-1-core-domain-and
prerequisites:
  - T-add-zod-dependency-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T05:34:57.016Z
updated: 2025-09-15T05:34:57.016Z
---

## Context

This task implements comprehensive Zod validation for the Message interface, building upon the existing TypeScript interface in `src/core/messages/message.ts`. The schema will provide runtime validation and type inference for the core message structure used throughout the LLM Bridge Library.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Existing Interface: `src/core/messages/message.ts` - Message interface definition
- Architecture: `/docs/library-architecture.md` - Message model specifications

## Specific Implementation Requirements

### 1. Create Message Zod Schema

- Create `src/core/messages/messageSchema.ts`
- Define comprehensive Zod schema that validates all Message interface fields:
  - `id`: Optional string with UUID format validation
  - `role`: Required enum matching Role type ("system" | "user" | "assistant" | "tool")
  - `content`: Required array of ContentPart objects (will reference ContentPart schema)
  - `timestamp`: Optional ISO date string validation
  - `sources`: Optional array of SourceRef objects
  - `metadata`: Optional record with unknown values

### 2. Schema Validation Rules

- **ID Validation**: Optional UUID v4 format or custom ID pattern
- **Role Validation**: Strict enum validation with clear error messages
- **Content Validation**: Non-empty array requirement with proper ContentPart validation
- **Timestamp Validation**: ISO 8601 date string format
- **Sources Validation**: Array of valid SourceRef objects
- **Metadata Validation**: Object with string keys and unknown values

### 3. Type Inference and Exports

- Export validated Message type using `z.infer<typeof MessageSchema>`
- Create validation function `validateMessage(input: unknown): Message`
- Export schema for use in other modules
- Ensure type compatibility with existing Message interface

## Technical Approach

### File Structure

```
src/core/messages/
├── message.ts           # Existing TypeScript interface
├── messageSchema.ts     # New Zod schema (this task)
├── role.ts              # Existing Role enum
├── contentPart.ts       # Existing ContentPart interface
├── sourceRef.ts         # Existing SourceRef interface
└── index.ts             # Updated exports
```

### Implementation Steps

1. Import required dependencies (Zod, validation helpers, existing types)
2. Define MessageSchema with comprehensive validation rules
3. Create validation helper functions
4. Add type inference and exports
5. Update message module index.ts with new exports
6. Implement comprehensive unit tests
7. Add JSDoc documentation

### Error Handling

- Provide clear field-level error messages
- Include field paths in validation errors
- Use consistent error message formatting from validation infrastructure

## Detailed Acceptance Criteria

### Schema Validation Requirements

- ✅ Valid messages pass validation with correct typing
- ✅ Invalid role values rejected with clear error messages
- ✅ Empty content arrays rejected with validation error
- ✅ Invalid timestamp formats rejected (non-ISO 8601)
- ✅ Invalid UUID formats rejected for id field
- ✅ Nested validation works for sources and metadata fields

### Type System Requirements

- ✅ Inferred Message type matches existing Message interface
- ✅ TypeScript compilation without errors or warnings
- ✅ Proper type narrowing after validation
- ✅ Generic constraints work correctly

### API Requirements

- ✅ `validateMessage()` function accepts unknown input and returns typed Message
- ✅ `MessageSchema` export available for composition in other schemas
- ✅ All exports available through messages module index

## Dependencies

**Prerequisites:**

- `T-add-zod-dependency-and` - Zod infrastructure must be available
- Existing Role, ContentPart, and SourceRef interfaces

**Blocks:** BridgeClient implementation, ContentPart schema creation

## Security Considerations

### Input Validation

- Strict validation of all message fields to prevent injection attacks
- Sanitization of metadata fields to prevent prototype pollution
- Size limits on content arrays to prevent DoS attacks
- Validation of timestamp formats to prevent parsing exploits

### Error Handling

- Error messages don't expose sensitive system information
- Validation failures logged appropriately without leaking data

## Testing Requirements

### Unit Tests (Include in this task)

- **Valid Message Tests**: Various valid message configurations
- **Invalid Role Tests**: Test each invalid role value
- **Content Validation Tests**: Empty arrays, invalid content types
- **Timestamp Tests**: Various date formats, invalid dates
- **ID Tests**: Valid/invalid UUID formats
- **Sources Tests**: Valid/invalid SourceRef arrays
- **Metadata Tests**: Various object structures, edge cases
- **Error Message Tests**: Verify clear, helpful error messages

### Test File: `src/core/messages/__tests__/messageSchema.test.ts`

### Example Test Cases

```typescript
describe("MessageSchema", () => {
  it("validates valid user message", () => {
    const validMessage = {
      role: "user",
      content: [{ type: "text", text: "Hello" }],
    };
    expect(() => MessageSchema.parse(validMessage)).not.toThrow();
  });

  it("rejects invalid role", () => {
    const invalidMessage = {
      role: "invalid-role",
      content: [{ type: "text", text: "Hello" }],
    };
    expect(() => MessageSchema.parse(invalidMessage)).toThrow();
  });
});
```

## Out of Scope

- ContentPart schema implementation (separate task)
- SourceRef schema implementation (separate task)
- Provider-specific message format translation (future phases)
- Message persistence or serialization (future phases)
