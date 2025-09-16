---
id: T-implement-tool-definition
title: Implement tool definition translation for Anthropic format
status: open
priority: medium
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-api-request
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:29:26.051Z
updated: 2025-09-16T13:29:26.051Z
---

# Implement Tool Definition Translation for Anthropic Format

Implement the tool translator that converts unified Bridge `ToolDefinition` objects to Anthropic's tool format, handling Zod schema to JSON Schema conversion and tool execution flow.

## Context

This task implements the tool system integration for Anthropic's Messages API. The translator converts Bridge's unified tool definitions to Anthropic's native tool format, handles schema conversion from Zod to JSON Schema, and manages tool call processing.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/toolTranslator.ts` and OpenAI tool handling

**API Documentation**: Anthropic Messages API v2025-05-14 tools format

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2025-05-14/toolTranslator.ts`

### Core Translation Functions

1. **Main Tool Translation**:

   ```typescript
   export function translateToolDefinitions(
     tools: ToolDefinition[],
   ): AnthropicTool[] {
     // Convert Bridge tools to Anthropic format
   }
   ```

2. **Schema Conversion**:

   ```typescript
   function zodToJsonSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
     // Convert Zod schema to JSON Schema for Anthropic
   }
   ```

3. **Tool Call Processing**:

   ```typescript
   export function parseAnthropicToolCalls(
     contentBlocks: AnthropicContentBlock[],
   ): ToolCall[] {
     // Extract tool calls from Anthropic response blocks
   }
   ```

4. **Tool Result Formatting**:
   ```typescript
   export function formatToolResultMessage(
     toolCall: ToolCall,
     result: unknown,
   ): AnthropicMessage {
     // Format tool results back to Anthropic message format
   }
   ```

### Translation Logic

1. **Tool Definition Mapping**:

   ```typescript
   // Bridge format
   {
     name: "get_weather",
     description: "Get current weather",
     inputSchema: z.object({
       location: z.string(),
       units: z.enum(["celsius", "fahrenheit"])
     })
   }

   // Anthropic format
   {
     name: "get_weather",
     description: "Get current weather",
     input_schema: {
       type: "object",
       properties: {
         location: { type: "string" },
         units: { type: "string", enum: ["celsius", "fahrenheit"] }
       },
       required: ["location", "units"]
     }
   }
   ```

2. **Zod to JSON Schema Conversion with Correct Optional Detection**:
   - Handle basic types: string, number, boolean
   - Handle objects with properties and required fields
   - **Use `schema instanceof z.ZodOptional` for optional detection**
   - **Access array elements via `schema.element` (public API)**
   - Handle enums and literals with `z.ZodLiteral` support
   - Handle nested objects and complex schemas
   - **Unwrap ZodOptional/ZodNullable properly for required field detection**

3. **Tool Call Extraction**:
   - Parse `tool_use` content blocks from responses
   - Extract tool ID, name, and input arguments
   - Handle partial tool calls in streaming
   - Validate tool call format

4. **Tool Result Processing**:
   - Format tool execution results for Anthropic
   - Create appropriate message structure with `role: "user"`, `type: "tool_result"`
   - Handle tool errors and exceptions
   - Support streaming tool results

### Technical Approach

```typescript
import type { ToolDefinition } from "../../core/tools/toolDefinition.js";
import type { ToolCall } from "../../core/tools/toolCall.js";
import { ValidationError } from "../../core/errors/validationError.js";
import { z } from "zod";

export function translateToolDefinitions(
  tools: ToolDefinition[],
): AnthropicTool[] {
  return tools.map((tool) => {
    try {
      const jsonSchema = zodToJsonSchema(tool.inputSchema);

      return {
        name: tool.name,
        description: tool.description || `Execute ${tool.name}`,
        input_schema: jsonSchema,
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to translate tool definition: ${tool.name}`,
        { cause: error, context: { toolName: tool.name } },
      );
    }
  });
}

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Handle ZodOptional wrapper - correct detection
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap());
  }

  // Handle ZodNullable wrapper
  if (schema instanceof z.ZodNullable) {
    return zodToJsonSchema(schema.unwrap());
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const fieldSchemaTyped = fieldSchema as z.ZodTypeAny;

      // Check if field is optional - correct detection
      const isOptional = fieldSchemaTyped instanceof z.ZodOptional;

      properties[key] = zodToJsonSchema(fieldSchemaTyped);

      if (!isOptional) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }

  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: schema.options,
    };
  }

  // Handle ZodLiteral - new support
  if (schema instanceof z.ZodLiteral) {
    return {
      type: typeof schema.value,
      enum: [schema.value],
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element), // Use public .element property
    };
  }

  // Fallback for unsupported schema types
  return { type: "object" };
}

export function parseAnthropicToolCalls(
  contentBlocks: AnthropicContentBlock[],
): ToolCall[] {
  return contentBlocks
    .filter((block) => block.type === "tool_use")
    .map((block) => ({
      id: block.id || `tool_${Date.now()}`,
      name: block.name,
      arguments: JSON.stringify(block.input),
      type: "function" as const,
    }));
}

export function formatToolResultMessage(
  toolCall: ToolCall,
  result: unknown,
): AnthropicMessage {
  return {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      },
    ],
  };
}
```

## Acceptance Criteria

1. **Tool Definition Translation**:
   - ✅ Converts Bridge ToolDefinition to Anthropic tool format
   - ✅ Preserves tool name and description
   - ✅ Converts Zod input schema to JSON Schema format
   - ✅ Handles nested objects and complex schemas

2. **Schema Conversion with Correct Zod Handling**:
   - ✅ Basic types (string, number, boolean) converted correctly
   - ✅ Object schemas with properties and required fields
   - ✅ Array schemas with item types using `schema.element`
   - ✅ **Optional field detection using `schema instanceof z.ZodOptional`**
   - ✅ **ZodLiteral type support for literal values**
   - ✅ **Proper unwrapping of ZodOptional/ZodNullable for required field computation**
   - ✅ Enum and literal types handled

3. **Tool Call Processing**:
   - ✅ Extracts tool calls from Anthropic response blocks
   - ✅ Handles multiple tool calls in single response
   - ✅ Generates appropriate tool call IDs
   - ✅ Properly formats tool arguments

4. **Tool Result Formatting**:
   - ✅ Formats tool execution results for Anthropic API
   - ✅ **Uses correct message structure: `role: "user"`, `type: "tool_result"`**
   - ✅ Handles string and JSON result formatting
   - ✅ Creates proper message structure for conversation flow
   - ✅ Handles tool errors appropriately

5. **Error Handling**:
   - ✅ Schema conversion errors handled gracefully
   - ✅ Invalid tool definitions rejected with clear messages
   - ✅ Malformed tool calls handled appropriately
   - ✅ Proper error context and debugging information

6. **Unit Tests** (included in this task):
   - ✅ Test basic tool definition translation
   - ✅ **Test complex schema conversion with optional detection**
   - ✅ **Test ZodLiteral and ZodArray.element handling**
   - ✅ Test tool call extraction from responses
   - ✅ Test tool result formatting
   - ✅ Test error scenarios and edge cases
   - ✅ Test schema validation and type safety
   - ✅ Achieve >90% code coverage

## Dependencies

- ToolDefinition and ToolCall types from core tools
- Anthropic API schemas from T-create-anthropic-api-request
- Zod library for schema operations
- Core error classes

## Out of Scope

- Tool execution logic (handled by core tool system)
- Advanced schema conversion beyond basic types
- Tool call streaming optimization (handled by streaming parser)
- Tool validation beyond basic schema checks

## Testing Requirements

Create `src/providers/anthropic-2025-05-14/__tests__/toolTranslator.test.ts` with:

- Basic tool translation tests
- **Complex schema conversion tests with proper optional field detection**
- **Tests for ZodOptional, ZodLiteral, and ZodArray.element handling**
- Tool call extraction tests
- Tool result formatting tests
- Error handling scenarios
- Edge cases for unsupported schema types
