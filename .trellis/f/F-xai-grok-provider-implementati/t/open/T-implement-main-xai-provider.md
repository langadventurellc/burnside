---
id: T-implement-main-xai-provider
title: Implement main xAI provider class with ProviderPlugin interface
status: open
priority: high
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-create-xai-configuration
  - T-build-xai-request-translator
  - T-create-xai-response-parser
  - T-implement-xai-streaming
  - T-create-xai-error-normalizer
  - T-build-xai-tool-translator-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-17T20:00:33.627Z
updated: 2025-09-17T20:00:33.627Z
---

# Implement Main xAI Provider Class with ProviderPlugin Interface

## Context

This task implements the main xAI provider class that orchestrates all the component pieces (configuration, translation, parsing, error handling) into a complete ProviderPlugin implementation. This is the central integration point that brings together all xAI-specific functionality. Since we're using xAI's Responses API, which is pretty much in line with the OpenAI Responses API, we should heavily reference our existing OpenAI provider code as a reference pattern for this.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` (primary template)
- `src/providers/google-gemini-v1/googleGeminiV1Provider.ts` (alternative patterns)
- `src/core/providers/providerPlugin.ts` (interface requirements)

## Implementation Requirements

Create `src/providers/xai-v1/xaiV1Provider.ts` with the following components:

### Main Provider Class

```typescript
export class XAIV1Provider implements ProviderPlugin {
  /** Unique identifier for the provider plugin */
  readonly id = "xai";

  /** Human-readable name of the provider */
  readonly name = "xAI Grok Provider";

  /** Version of the provider plugin */
  readonly version = "v1";

  /** Provider configuration */
  private config?: XAIV1Config;

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: Record<string, unknown>): Promise<void> {
    try {
      this.config = XAIV1ConfigSchema.parse(config);
    } catch (error) {
      throw new BridgeError("Invalid xAI configuration", "INVALID_CONFIG", {
        originalError: error,
        provider: "xai",
      });
    }
  }

  /**
   * Check if the provider supports a specific model
   */
  supportsModel(modelId: string): boolean {
    // Model support is determined by the centralized model registry
    // Provider accepts all models routed to it
    return true;
  }

  /**
   * Convert unified request format to provider-specific HTTP request
   */
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest {
    if (!this.config) {
      throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
        method: "translateRequest",
        provider: "xai",
      });
    }

    try {
      return translateChatRequest(request, this.config, modelCapabilities);
    } catch (error) {
      throw normalizeXaiError(error);
    }
  }

  /**
   * Parse provider HTTP response back to unified format
   */
  parseResponse(
    response: ProviderHttpResponse,
    isStreaming: boolean,
  ):
    | Promise<{
        message: Message;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens?: number;
        };
        model: string;
        metadata?: Record<string, unknown>;
      }>
    | AsyncIterable<StreamDelta> {
    try {
      if (isStreaming) {
        return parseXaiResponseStream(response, {} as ChatRequest);
      } else {
        return parseXaiResponse(response, {} as ChatRequest);
      }
    } catch (error) {
      throw normalizeXaiError(error);
    }
  }

  /**
   * Detect if streaming response has reached termination
   */
  isTerminal(
    deltaOrResponse:
      | StreamDelta
      | {
          message: Message;
          usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens?: number;
          };
          model: string;
          metadata?: Record<string, unknown>;
        },
  ): boolean {
    // For non-streaming responses, always terminal
    if (!("delta" in deltaOrResponse)) {
      return true;
    }

    // For streaming responses, check termination conditions
    return isStreamTerminated(deltaOrResponse);
  }

  /**
   * Normalize provider-specific errors to unified error types
   */
  normalizeError(error: unknown): BridgeError {
    return normalizeXaiError(error);
  }

  /**
   * Provider capability descriptors
   */
  capabilities = {
    streaming: true,
    toolCalls: true,
    images: true,
    documents: true,
    maxTokens: 8192,
    supportedContentTypes: ["text", "image", "document"] as const,
    temperature: true,
    topP: true,
    promptCaching: false,
  };
}
```

### Provider Metadata

```typescript
export const XAI_PROVIDER_INFO = {
  id: "xai",
  version: "v1",
  name: "xAI Grok Provider",
  description:
    "Provider for xAI's Grok models with streaming and tool calling support",
  supportedModels: [
    "grok-3-mini",
    "grok-3",
    "grok-4-0709",
    "grok-2",
    "grok-2-mini",
    "grok-2-vision-1212",
  ],
  capabilities: {
    streaming: true,
    toolCalls: true,
    images: true,
    documents: true,
    maxTokens: 8192,
    supportedContentTypes: ["text", "image", "document"],
    temperature: true,
    topP: true,
    promptCaching: false,
  },
} as const;
```

### Error Handling Integration

```typescript
private handleProviderError(error: unknown, context: string): never {
  const normalizedError = normalizeXaiError(error);

  // Add context information
  normalizedError.metadata = {
    ...normalizedError.metadata,
    provider: "xai",
    context,
    timestamp: new Date().toISOString()
  };

  throw normalizedError;
}
```

### Configuration Validation

```typescript
private validateConfiguration(): void {
  if (!this.config) {
    throw new BridgeError("Provider not initialized", "NOT_INITIALIZED", {
      provider: "xai"
    });
  }

  // Additional runtime validations
  if (!this.config.apiKey.startsWith("xai-")) {
    throw new BridgeError("Invalid API key format", "INVALID_CONFIG", {
      provider: "xai",
      field: "apiKey"
    });
  }

  if (!this.config.baseUrl.startsWith("https://")) {
    throw new BridgeError("Base URL must use HTTPS", "INVALID_CONFIG", {
      provider: "xai",
      field: "baseUrl"
    });
  }
}
```

### Request Context Handling

```typescript
private enrichRequestContext(
  request: ChatRequest & { stream?: boolean }
): ChatRequest & { stream?: boolean } & { requestId: string } {
  return {
    ...request,
    requestId: `xai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}
```

## Acceptance Criteria

### Functional Requirements

✅ **ProviderPlugin Interface**: Complete implementation of all required methods
✅ **Configuration Management**: Proper initialization and validation
✅ **Request Translation**: Delegation to translator with error handling
✅ **Response Parsing**: Both streaming and non-streaming response handling
✅ **Error Normalization**: All errors converted to BridgeError types
✅ **Stream Termination**: Proper detection of streaming completion
✅ **Model Support**: Accepts all models routed by model registry

### Integration Requirements

✅ **Component Orchestration**: All component pieces work together seamlessly
✅ **Error Propagation**: Errors from components properly handled and normalized
✅ **Configuration Flow**: Configuration passed correctly to all components
✅ **Context Preservation**: Request context maintained through processing pipeline
✅ **Resource Management**: Proper cleanup and resource handling

### Interface Compliance Requirements

✅ **Method Signatures**: All ProviderPlugin methods implemented correctly
✅ **Return Types**: Correct return types for all methods
✅ **Error Handling**: Proper BridgeError instances for all error cases
✅ **Async Handling**: Proper Promise and AsyncIterable handling
✅ **Type Safety**: Complete TypeScript type coverage

## Testing Requirements

Include comprehensive unit tests covering:

### Provider Initialization Tests

- Valid configuration initialization
- Invalid configuration rejection
- Configuration validation edge cases
- Reinitialization handling

### Request Translation Tests

- Translation delegation to translator component
- Error handling from translator
- Model capability passing
- Request context enrichment

### Response Parsing Tests

- Non-streaming response parsing delegation
- Streaming response parsing delegation
- Error handling from parsers
- Response type detection

### Stream Termination Tests

- Non-streaming response termination (always true)
- Streaming delta termination detection
- Edge cases and malformed responses

### Error Handling Tests

- Error normalization delegation
- Context preservation in errors
- Error metadata enrichment
- Component error propagation

### Interface Compliance Tests

- All ProviderPlugin methods implemented
- Correct return types for all methods
- Proper async/await handling
- Type safety verification

## Implementation Steps

1. **Create Provider Class File**: Set up main class structure
2. **Implement Interface Methods**: Complete all ProviderPlugin methods
3. **Configuration Management**: Initialize and validate configuration
4. **Component Integration**: Wire together all component pieces
5. **Error Handling**: Integrate error normalization throughout
6. **Context Management**: Add request/response context handling
7. **Provider Metadata**: Define provider capabilities and information
8. **Write Unit Tests**: Comprehensive test coverage for all functionality
9. **Integration Testing**: Verify end-to-end provider functionality

## Dependencies

- **Prerequisites**: All component tasks (configuration, translator, parsers, error normalizer, tool translator)
- **Blocks**: Provider registration and module exports

## Out of Scope

- Provider registration (handled in separate registration task)
- Module exports (handled in index.ts task)
- E2E testing (handled separately)
- Performance optimization (initial implementation focus)

## Technical Notes

- Follow the exact ProviderPlugin interface requirements
- Ensure proper error handling and normalization throughout
- Delegate specific functionality to appropriate component modules
- Maintain request context and metadata throughout processing pipeline
- Implement proper resource cleanup for streaming responses
