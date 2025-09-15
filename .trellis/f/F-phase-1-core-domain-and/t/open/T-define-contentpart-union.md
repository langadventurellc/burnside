---
id: T-define-contentpart-union
title: Define ContentPart union schema for all content types
status: open
priority: high
parent: F-phase-1-core-domain-and
prerequisites:
  - T-add-zod-dependency-and
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T05:35:28.830Z
updated: 2025-09-15T05:35:28.830Z
---

## Context

This task implements comprehensive Zod validation for the ContentPart union type, replacing the generic interface in `src/core/messages/contentPart.ts` with a strongly-typed discriminated union schema that supports text, image, document, and code content types as specified in the library architecture.

**Related Specifications:**

- Feature: `F-phase-1-core-domain-and` - Phase 1: Core Domain and Public API Skeleton
- Architecture: `/docs/library-architecture.md` - ContentPart type definitions (lines 96-101)
- Existing Interface: `src/core/messages/contentPart.ts` - Generic ContentPart interface

## Specific Implementation Requirements

### 1. Define ContentPart Union Schema

- Create `src/core/messages/contentPartSchema.ts`
- Implement discriminated union schema with four content types:
  - **TextContent**: `{ type: "text"; text: string }`
  - **ImageContent**: `{ type: "image"; data: string; mimeType: string; alt?: string }`
  - **DocumentContent**: `{ type: "document"; data: string; mimeType: string; name?: string }`
  - **CodeContent**: `{ type: "code"; text: string; language?: string; filename?: string }`

### 2. Validation Rules by Content Type

- **Text Content**: Non-empty text string required
- **Image Content**: Base64 data validation, valid MIME type (image/\*), optional alt text
- **Document Content**: Base64 data validation, valid MIME type, optional filename
- **Code Content**: Non-empty code string, optional language identifier, optional filename

### 3. MIME Type Validation

- Image MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- Document MIME types: `application/pdf`, `text/plain`, `text/markdown`, `application/json`, etc.
- Comprehensive MIME type validation with clear error messages

## Technical Approach

### File Structure

```
src/core/messages/
├── contentPart.ts           # Update to use Zod types
├── contentPartSchema.ts     # New Zod schema (this task)
├── message.ts               # Existing Message interface
└── index.ts                 # Updated exports
```

### Implementation Steps

1. Create individual schemas for each content type
2. Combine into discriminated union with proper type discrimination
3. Add MIME type validation with comprehensive type lists
4. Create validation helper functions
5. Update existing contentPart.ts to export Zod-derived types
6. Implement comprehensive unit tests
7. Add JSDoc documentation with examples

### Schema Structure

```typescript
const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1, "Text content cannot be empty")
});

const ImageContentSchema = z.object({
  type: z.literal("image"),
  data: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, "Must be valid base64"),
  mimeType: z.enum(["image/jpeg", "image/png", ...]),
  alt: z.string().optional()
});

export const ContentPartSchema = z.discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  DocumentContentSchema,
  CodeContentSchema
]);
```

## Detailed Acceptance Criteria

### Content Type Validation

- ✅ Text content validates non-empty strings and rejects empty/whitespace-only text
- ✅ Image content validates base64 data format and supported MIME types
- ✅ Document content validates base64 data and document MIME types
- ✅ Code content validates non-empty code strings and optional language/filename

### MIME Type Validation

- ✅ Image MIME types restricted to supported formats (jpeg, png, gif, webp, svg)
- ✅ Document MIME types include common formats (pdf, plain text, markdown, json)
- ✅ Invalid MIME types rejected with clear error messages
- ✅ MIME type validation case-insensitive

### Type Discrimination

- ✅ Union discrimination works correctly based on `type` field
- ✅ TypeScript type narrowing functions properly after validation
- ✅ Invalid type values rejected with helpful error messages
- ✅ Each content type has proper TypeScript typing

### Data Format Validation

- ✅ Base64 data format validated for image and document content
- ✅ Empty or invalid base64 strings rejected
- ✅ Optional fields (alt, name, language, filename) properly validated

## Dependencies

**Prerequisites:**

- `T-add-zod-dependency-and` - Zod infrastructure must be available

**Blocks:**

- `T-define-message-zod-schema` - Message schema needs ContentPart schema
- BridgeClient API implementation

## Security Considerations

### Input Validation

- Strict base64 validation to prevent data injection
- MIME type validation to prevent file type confusion attacks
- Size limits on data fields to prevent DoS (reasonable string length limits)
- Sanitization of filename and alt text to prevent path traversal

### Data Handling

- No automatic decoding of base64 data in validation layer
- Safe handling of optional metadata fields
- Prevention of prototype pollution through metadata

## Testing Requirements

### Unit Tests (Include in this task)

- **Text Content Tests**: Valid text, empty strings, whitespace-only
- **Image Content Tests**: Valid/invalid base64, supported/unsupported MIME types
- **Document Content Tests**: Valid/invalid base64, document MIME types
- **Code Content Tests**: Valid code, empty strings, optional fields
- **Union Discrimination Tests**: Proper type narrowing and validation
- **Error Message Tests**: Clear, helpful validation error messages

### Test File: `src/core/messages/__tests__/contentPartSchema.test.ts`

### Example Test Cases

```typescript
describe("ContentPartSchema", () => {
  describe("TextContent", () => {
    it("validates non-empty text", () => {
      const textContent = { type: "text", text: "Hello world" };
      expect(() => ContentPartSchema.parse(textContent)).not.toThrow();
    });

    it("rejects empty text", () => {
      const emptyText = { type: "text", text: "" };
      expect(() => ContentPartSchema.parse(emptyText)).toThrow();
    });
  });

  describe("ImageContent", () => {
    it("validates valid image content", () => {
      const imageContent = {
        type: "image",
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      };
      expect(() => ContentPartSchema.parse(imageContent)).not.toThrow();
    });
  });
});
```

## Out of Scope

- Provider-specific content format translation (future phases)
- Content processing or rendering (application responsibility)
- File upload/download functionality (future phases)
- Content compression or optimization (future phases)
