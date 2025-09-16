---
id: T-create-anthropic-provider-1
title: Create Anthropic provider plugin class structure
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-provider
  - T-create-anthropic-api-request
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:25:24.605Z
updated: 2025-09-16T13:25:24.605Z
---

# Create Anthropic Provider Plugin Class Structure

Implement the main `AnthropicMessagesV1Provider` class that implements the `ProviderPlugin` interface, providing the foundation for the Anthropic Messages API integration.

## Context

This task creates the core provider plugin class that implements the `ProviderPlugin` interface, serving as the main entry point for the Anthropic Messages API provider. The class coordinates request translation, response parsing, error handling, and streaming.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`

**Interface Reference**: `src/core/providers/providerPlugin.ts`

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Location

Create `src/providers/anthropic-2023-06-01/anthropicMessagesV1Provider.ts`

### Class Structure

```typescript
export class AnthropicMessagesV1Provider implements ProviderPlugin {
  readonly id = "anthropic";
  readonly name = "Anthropic Messages Provider";
  readonly version = "2023-06-01";

  private config?: AnthropicMessagesConfig;

  // Implement all ProviderPlugin interface methods with EXACT signatures
  initialize(config: unknown): Promise<void>;
  supportsModel(modelId: string): boolean;
  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest;
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
    | AsyncIterable<StreamDelta>;
  isTerminal(deltaOrResponse: StreamDelta | Message): boolean;
  normalizeError(error: unknown): BridgeError; // NOTE: No context parameter in interface
}
```

### Core Responsibilities

1. **Configuration Management**:
   - Initialize with validated configuration
   - Store configuration securely without logging sensitive data
   - Validate configuration using schema from previous task

2. **Model Support**:
   - Accept any model ID routed to this provider (model-agnostic)
   - Return true for `supportsModel()` to follow architecture pattern

3. **Request Translation** (placeholder implementation):
   - **Accept `ChatRequest & { stream?: boolean }` to match interface**
   - Accept optional `modelCapabilities` parameter
   - Return properly structured `ProviderHttpRequest`
   - Include proper headers (`x-api-key`, `anthropic-version`, `anthropic-beta`)

4. **Response Processing** (placeholder implementation):
   - Handle both streaming and non-streaming responses
   - **Return structured object `{ message, usage, model, metadata }` for non-streaming**
   - Return `AsyncIterable<StreamDelta>` for streaming
   - Proper error handling for malformed responses

5. **Termination Detection**:
   - Implement `isTerminal()` for streaming responses
   - Handle Anthropic's stop reasons and completion signals

6. **Error Normalization** (placeholder implementation):
   - **Accept only `error: unknown` parameter (no context in interface)**
   - Map Anthropic errors to unified error taxonomy
   - Add provider context internally

### Technical Approach

```typescript
import type { ProviderPlugin } from "../../core/providers/providerPlugin.js";
import type { ChatRequest } from "../../client/chatRequest.js";
import type { Message } from "../../core/messages/message.js";
import type { StreamDelta } from "../../client/streamDelta.js";
import type { ProviderHttpRequest } from "../../core/transport/providerHttpRequest.js";
import type { ProviderHttpResponse } from "../../core/transport/providerHttpResponse.js";
import { BridgeError } from "../../core/errors/bridgeError.js";
import { ValidationError } from "../../core/errors/validationError.js";
import {
  AnthropicMessagesConfigSchema,
  type AnthropicMessagesConfig,
} from "./configSchema.js";

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
    // Model-agnostic: accept any model ID routed to this provider
    return true;
  }

  translateRequest(
    request: ChatRequest & { stream?: boolean },
    modelCapabilities?: { temperature?: boolean },
  ): ProviderHttpRequest {
    // Placeholder - will be implemented in separate translation task
    throw new Error("translateRequest not yet implemented");
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
    // Placeholder - will be implemented in separate parsing tasks
    throw new Error("parseResponse not yet implemented");
  }

  isTerminal(deltaOrResponse: StreamDelta | Message): boolean {
    // Placeholder - will be implemented with streaming parser
    return false;
  }

  normalizeError(error: unknown): BridgeError {
    // Placeholder - will be implemented in separate error handling task
    // Add provider context internally since interface doesn't accept context parameter
    throw new Error("normalizeError not yet implemented");
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
}
```

## Acceptance Criteria

1. **Interface Implementation**:
   - ✅ Implements all required `ProviderPlugin` interface methods
   - ✅ **Uses EXACT method signatures from ProviderPlugin interface**
   - ✅ Proper provider identification (id: "anthropic", version: "2023-06-01")
   - ✅ Type-safe implementation with no `any` types

2. **Configuration Management**:
   - ✅ Initializes with validated configuration schema
   - ✅ Throws `ValidationError` for invalid configuration
   - ✅ Stores configuration securely without logging sensitive data

3. **Model Support**:
   - ✅ `supportsModel()` returns true for any model (model-agnostic)
   - ✅ Architecture pattern followed for dynamic model routing

4. **Method Placeholders**:
   - ✅ All interface methods present with **exact ProviderPlugin signatures**
   - ✅ **translateRequest accepts `ChatRequest & { stream?: boolean }` and optional modelCapabilities**
   - ✅ **parseResponse returns structured object for non-streaming or AsyncIterable for streaming**
   - ✅ **normalizeError accepts only error parameter (no context in interface)**
   - ✅ Placeholder implementations throw descriptive errors

5. **Error Handling**:
   - ✅ Configuration validation with appropriate error context
   - ✅ Provider state validation (initialized check)
   - ✅ Proper error types used (ValidationError, BridgeError)

6. **Unit Tests** (included in this task):
   - ✅ Test successful initialization with valid config
   - ✅ Test initialization failure with invalid config
   - ✅ Test provider identification properties
   - ✅ Test model support behavior
   - ✅ Test uninitialized state handling
   - ✅ Test placeholder method behaviors
   - ✅ **Test method signatures match ProviderPlugin interface**
   - ✅ Achieve >90% code coverage

## Dependencies

- ProviderPlugin interface from core providers
- Configuration schema from T-create-anthropic-provider
- API schemas from T-create-anthropic-api-request
- Core error classes (ValidationError, BridgeError)
- Core message and request types

## Out of Scope

- Actual request translation logic (separate task)
- Response parsing implementation (separate tasks)
- Error normalization implementation (separate task)
- Streaming termination detection (handled with streaming parser)

## Testing Requirements

Create `src/providers/anthropic-2023-06-01/__tests__/anthropicMessagesV1Provider.test.ts` with:

- Configuration initialization tests
- **Interface compliance verification with exact signatures**
- Error handling scenarios
- Provider identification validation
- State management testing
