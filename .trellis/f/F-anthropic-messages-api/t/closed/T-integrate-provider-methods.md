---
id: T-integrate-provider-methods
title: Integrate provider methods with translation and parsing
status: done
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-provider-1
  - T-implement-request-translation
  - T-implement-non-streaming
  - T-implement-streaming-response
  - T-implement-anthropic-error
affectedFiles:
  src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts:
    Replaced placeholder method implementations with actual integration of
    translation, parsing, streaming, and error handling modules. Added required
    imports and implemented all four ProviderPlugin interface methods with
    proper error handling and response body reading helper.
  src/providers/anthropic-2023-06-01/__tests__/anthropicMessagesV1Provider.test.ts:
    Updated test expectations to reflect actual working implementations instead
    of placeholder behavior. Fixed mock configurations for proper integration
    testing and corrected test patterns to use async rejection for missing
    response body validation.
log:
  - Successfully integrated all provider methods with translation and parsing
    modules. The AnthropicMessagesV1Provider now has fully functional
    implementations for translateRequest, parseResponse, isTerminal, and
    normalizeError methods, replacing all placeholder implementations. All
    translation, parsing, streaming, and error handling components are properly
    integrated and working correctly.
schema: v1.0
childrenIds: []
created: 2025-09-16T13:31:04.839Z
updated: 2025-09-16T13:31:04.839Z
---

# Integrate Provider Methods with Translation and Parsing

Complete the provider plugin implementation by integrating all translation, parsing, and error handling components into the main `AnthropicMessagesV1Provider` class methods.

## Context

This task completes the provider plugin by implementing the actual method bodies that were left as placeholders. It integrates request translation, response parsing, streaming, error normalization, and termination detection into a cohesive provider implementation with correct ProviderPlugin interface compliance.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File to Update

Update `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts`

### Method Implementations with Correct Interface Signatures

1. **translateRequest Method**:

   ```typescript
   translateRequest(
     request: ChatRequest & { stream?: boolean },
     modelCapabilities?: { temperature?: boolean }
   ): ProviderHttpRequest {
     this.assertInitialized();
     return translateChatRequest(request, this.config);
   }
   ```

2. **parseResponse Method**:

   ```typescript
   async parseResponse(
     response: ProviderHttpResponse,
     isStreaming: boolean
   ): Promise<{ message: Message; usage?: { promptTokens: number; completionTokens: number; totalTokens?: number }; model: string; metadata?: Record<string, unknown>; } | AsyncIterable<StreamDelta>> {
     this.assertInitialized();

     try {
       if (isStreaming) {
         return parseAnthropicResponseStream(response);
       } else {
         // Read response body first, then pass to parser
         const responseText = await response.body;
         return parseAnthropicResponse(response, responseText);
       }
     } catch (error) {
       throw this.normalizeError(error);
     }
   }
   ```

3. **isTerminal Method**:

   ```typescript
   isTerminal(deltaOrResponse: StreamDelta | Message): boolean {
     // Handle Message (non-streaming)
     if ('role' in deltaOrResponse) {
       return true; // Non-streaming responses are always terminal
     }

     // Handle StreamDelta (streaming)
     return isAnthropicStreamTerminal(deltaOrResponse);
   }
   ```

4. **normalizeError Method**:
   ```typescript
   normalizeError(error: unknown): BridgeError {
     // Interface doesn't accept context parameter - add context internally
     const enhancedContext = {
       provider: this.id,
       version: this.version,
       timestamp: new Date().toISOString(),
     };
     return normalizeAnthropicError(error, enhancedContext);
   }
   ```

### Import Integration

Add necessary imports to the provider class:

```typescript
import { translateChatRequest } from "./translator.js";
import { parseAnthropicResponse } from "./responseParser.js";
import {
  parseAnthropicResponseStream,
  isAnthropicStreamTerminal,
} from "./streamingParser.js";
import { normalizeAnthropicError } from "./errorNormalizer.js";
```

### Error Handling Integration

1. **Method-Level Error Handling**:
   - Wrap method execution in try-catch blocks where appropriate
   - Use `normalizeError()` method for consistent error handling
   - Ensure initialization state is validated
   - Preserve error chains and stack traces

2. **Provider State Validation**:
   - Ensure `assertInitialized()` is called in all methods requiring config
   - Validate configuration availability
   - Handle uninitialized state gracefully

3. **Response Body Handling**:
   - Read response body for non-streaming responses
   - Pass pre-read text to `parseAnthropicResponse(response, responseText)`
   - Handle streaming responses directly with `parseAnthropicResponseStream(response)`

### Technical Integration

```typescript
export class AnthropicMessagesV1Provider implements ProviderPlugin {
  readonly id = "anthropic";
  readonly name = "Anthropic Messages Provider";
  readonly version = "2023-06-01";

  private config?: AnthropicMessagesConfig;

  async initialize(config: unknown): Promise<void> {
    try {
      this.config = AnthropicMessagesConfigSchema.parse(config);
    } catch (error) {
      throw new ValidationError("Invalid Anthropic provider configuration", {
        cause: error,
        context: { provider: this.id, version: this.version },
      });
    }
  }

  supportsModel(modelId: string): boolean {
    return true; // Model-agnostic
  }

  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest {
    this.assertInitialized();

    try {
      return translateChatRequest(request, this.config);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
  ): Promise<
    | {
        message: Message;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens?: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      }
    | AsyncIterable<StreamDelta>
  > {
    this.assertInitialized();

    try {
      if (isStreaming) {
        return parseAnthropicResponseStream(response);
      } else {
        // Read response body first for non-streaming parser
        const responseText =
          typeof response.body === "string"
            ? response.body
            : await this.readResponseBody(response.body);
        return parseAnthropicResponse(response, responseText);
      }
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  isTerminal(deltaOrResponse: StreamDelta | Message): boolean {
    // Non-streaming responses (Message) are always terminal
    if ("role" in deltaOrResponse) {
      return true;
    }

    // Streaming responses use provider-specific terminal detection
    return isAnthropicStreamTerminal(deltaOrResponse);
  }

  normalizeError(error: unknown): BridgeError {
    // Interface doesn't accept context parameter, add internally
    const enhancedContext = {
      provider: this.id,
      version: this.version,
      timestamp: new Date().toISOString(),
    };

    return normalizeAnthropicError(error, enhancedContext);
  }

  private assertInitialized(): asserts this is {
    config: AnthropicMessagesConfig;
  } {
    if (!this.config) {
      throw new ValidationError("Provider not initialized", {
        context: { provider: this.id, version: this.version },
      });
    }
  }

  private async readResponseBody(body: unknown): Promise<string> {
    // Helper to read response body for non-streaming responses
    if (typeof body === "string") {
      return body;
    }

    if (
      body &&
      typeof body === "object" &&
      "text" in body &&
      typeof body.text === "function"
    ) {
      return await body.text();
    }

    throw new ValidationError("Unable to read response body");
  }
}
```

## Acceptance Criteria

1. **Interface Compliance**:
   - ✅ **All ProviderPlugin interface methods use exact signatures**
   - ✅ **translateRequest accepts `ChatRequest & { stream?: boolean }` and optional modelCapabilities**
   - ✅ **parseResponse returns structured object for non-streaming or AsyncIterable for streaming**
   - ✅ **normalizeError accepts only error parameter (no context in interface)**
   - ✅ No more placeholder implementations or "not implemented" errors

2. **Request Translation Integration**:
   - ✅ `translateRequest` calls translation module correctly
   - ✅ Configuration passed to translation function
   - ✅ Translation errors properly normalized and propagated
   - ✅ Method context handled appropriately

3. **Response Parsing Integration**:
   - ✅ `parseResponse` handles both streaming and non-streaming
   - ✅ **Non-streaming responses read body first, then pass to parser**
   - ✅ **Streaming responses passed directly to streaming parser**
   - ✅ Proper async handling for streaming responses
   - ✅ Parsing errors normalized appropriately

4. **Termination Detection**:
   - ✅ `isTerminal` correctly identifies Message vs StreamDelta
   - ✅ Non-streaming responses always marked terminal
   - ✅ Streaming deltas use provider-specific detection
   - ✅ Edge cases handled appropriately

5. **Error Handling Integration**:
   - ✅ All methods wrap operations in appropriate error handling
   - ✅ **Provider context added internally in normalizeError method**
   - ✅ Error chains maintained through integration
   - ✅ Consistent error handling patterns

6. **Provider State Management**:
   - ✅ Initialization state validated in all methods requiring config
   - ✅ Configuration availability checked
   - ✅ Clear error messages for uninitialized state
   - ✅ Thread-safe access to provider configuration

7. **Unit Tests** (included in this task):
   - ✅ Test successful request translation integration
   - ✅ Test streaming and non-streaming response parsing
   - ✅ Test termination detection for both response types
   - ✅ Test error handling and normalization integration
   - ✅ Test provider state validation
   - ✅ **Test interface signature compliance**
   - ✅ Test end-to-end method execution
   - ✅ Achieve >90% code coverage

## Dependencies

- Provider class from T-create-anthropic-provider-1
- Translation module from T-implement-request-translation
- Response parsers from T-implement-non-streaming and T-implement-streaming-response
- Error normalizer from T-implement-anthropic-error

## Out of Scope

- Tool translation integration (handled by separate task)
- Advanced configuration validation beyond initialization
- Provider registration with Bridge client (handled by client code)
- Performance optimizations beyond basic error handling

## Testing Requirements

Update `src/providers/anthropic-2023-06-01/__tests__/anthropicMessagesV1Provider.test.ts` with:

- Integration tests for all implemented methods
- **Interface compliance verification with exact signatures**
- Error handling scenarios across methods
- State management validation
- End-to-end provider functionality tests
- Mock integration with translation/parsing modules
