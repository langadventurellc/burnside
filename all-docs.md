# All Documentation

This file contains all documentation from the docs/ folder, concatenated automatically.

---

# File: docs/api-reference.md

# API Reference

Complete API reference for the Burnside LLM Bridge Library.

## Table of Contents

- [Primary API](#primary-api)
- [Client Methods](#client-methods)
- [Types and Interfaces](#types-and-interfaces)
- [Configuration](#configuration)
- [Registries](#registries)
- [Error Types](#error-types)

## Primary API

### createClient(config)

The primary entry point for creating a configured BridgeClient instance.

```typescript
function createClient(config: BridgeConfig): BridgeClient;
```

**Parameters:**

- `config` - Configuration object for the bridge client

**Returns:** Configured BridgeClient instance

**Throws:**

- `ValidationError` - When configuration is invalid
- `BridgeError` - When client initialization fails

**Example:**

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
  },
  modelSeed: "builtin",
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### BridgeClient

Main client class for chat and streaming operations.

```typescript
class BridgeClient {
  constructor(config: BridgeClientConfig);
}
```

## Client Methods

### chat(request)

Execute a single-turn or multi-turn chat completion.

```typescript
async chat(request: ChatRequest): Promise<Message>
```

**Parameters:**

- `request.messages` - Array of conversation messages
- `request.model` - Model to use (format: `provider:model-id`)
- `request.providerConfig` - **Required:** Provider configuration name to use
- `request.tools?` - Whether to enable tool execution
- `request.multiTurn?` - Multi-turn conversation configuration
- `request.temperature?` - Sampling temperature (if supported by model)
- `request.maxTokens?` - Maximum tokens to generate
- `request.stream?` - Whether to stream the response (use `stream()` instead)

**Returns:** Promise resolving to the assistant's response message

**Example:**

```typescript
const response = await client.chat({
  messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
  model: "openai:gpt-4o-2024-08-06",
  providerConfig: "default",
});
```

#### Response Shape

Burnside normalizes provider results to the shared `Message` interface. A typical
assistant response looks like:

```json
{
  "id": "resp_02HFG1A3CEXAMPLE",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "timestamp": "2025-02-20T18:19:00.123Z",
  "metadata": {
    "provider": "openai",
    "id": "resp_02HFG1A3CEXAMPLE",
    "created_at": "2025-02-20T18:18:59.997Z",
    "status": "completed",
    "finishReason": null
  }
}
```

Key details:

- `content` accumulates multimodal parts (`text`, `image`, `document`, `code`).
- `metadata.provider` reflects the originating provider (`openai`, `anthropic`, `google`, `xai`).
- Providers add additional keys such as `stopReason` (Anthropic), `modelVersion`/`safetyRatings` (Google Gemini), or raw request identifiers.
- When a provider returns native tool calls, the message includes `toolCalls` or `metadata.tool_calls`; use `extractToolCallsFromMessage` to work with them safely.
- Multi-turn executions still resolve to a final assistant `Message` using the same structure.

### stream(request)

Execute a streaming chat completion.

```typescript
async stream(request: StreamRequest): Promise<AsyncIterable<StreamDelta>>
```

**Parameters:**

- `request.messages` - Array of conversation messages
- `request.model` - Model to use (format: `provider:model-id`)
- `request.providerConfig` - **Required:** Provider configuration name to use
- `request.tools?` - Whether to enable tool execution
- `request.multiTurn?` - Multi-turn conversation configuration
- `request.temperature?` - Sampling temperature (if supported by model)
- `request.maxTokens?` - Maximum tokens to generate

**Returns:** Promise resolving to an async iterable of stream deltas

**Example:**

```typescript
for await (const delta of await client.stream({
  messages: [
    { role: "user", content: [{ type: "text", text: "Tell me a story" }] },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  providerConfig: "default",
})) {
  process.stdout.write(delta.delta.content?.[0]?.text || "");
}
```

#### Stream Output

Streaming responses yield incremental `StreamDelta` objects. The first deltas
carry partial content:

```json
{
  "id": "resp_stream_02HFG1A3C",
  "delta": {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Hello"
      }
    ]
  },
  "finished": false,
  "metadata": {
    "eventType": "response.output_text.delta"
  }
}
```

The terminal chunk is flagged with `finished: true` and includes usage when the
provider shares it:

```json
{
  "id": "resp_stream_02HFG1A3C",
  "delta": {},
  "finished": true,
  "usage": {
    "promptTokens": 812,
    "completionTokens": 146,
    "totalTokens": 958
  }
}
```

Tool-aware streams may surface tool call plans in `metadata.tool_calls`; the
wrapper will pause the stream, execute registered tools, and resume with the
same `StreamDelta` shape.

### registerTool(definition, handler)

Register a custom tool for use in conversations.

```typescript
registerTool(
  definition: ToolDefinition,
  handler: ToolHandler
): void
```

**Parameters:**

- `definition` - Tool definition with schema
- `handler` - Function to execute when tool is called

**Example:**
Tools must be enabled via `tools.enabled = true` in the client configuration before registering custom tools.

```typescript
client.registerTool(
  {
    name: "calculator",
    description: "Perform basic arithmetic",
    parameters: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["add", "subtract"] },
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["operation", "a", "b"],
    },
  },
  async (params) => {
    const { operation, a, b } = params;
    switch (operation) {
      case "add":
        return { result: a + b };
      case "subtract":
        return { result: a - b };
      default:
        throw new Error("Unknown operation");
    }
  },
);
```

### getModelRegistry()

Get the model registry for querying available models.

```typescript
getModelRegistry(): ModelRegistry
```

**Returns:** Model registry instance

**Example:**

```typescript
const registry = client.getModelRegistry();
const model = registry.get("openai:gpt-4o-2024-08-06");
console.log(model?.capabilities);
```

### getProviderRegistry()

Get the provider registry for managing providers.

```typescript
getProviderRegistry(): ProviderRegistry
```

**Returns:** Provider registry instance

### getToolRouter()

Get the tool router for accessing registered tools.

```typescript
getToolRouter(): ToolRouter | undefined
```

**Returns:** Tool router instance or undefined if not initialized

### dispose()

Clean up resources and disconnect from MCP servers.

```typescript
async dispose(): Promise<void>
```

## Types and Interfaces

### Message

```typescript
interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: ContentPart[];
  sources?: SourceRef[];
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

Messages produced by providers may add a transient `toolCalls` array or raw
`metadata.tool_calls` payloads. Use the helper `extractToolCallsFromMessage` to
obtain normalized `ToolCall` entries when working with tool execution.

### ContentPart

```typescript
type ContentPart =
  | TextContentPart
  | ImageContentPart
  | DocumentContentPart
  | CodeContentPart;

interface TextContentPart {
  type: "text";
  text: string;
}

interface ImageContentPart {
  type: "image";
  data: string; // Base64 data
  mimeType: string;
  alt?: string;
}

interface DocumentContentPart {
  type: "document";
  data: string; // Base64 data
  mimeType: string;
  name?: string;
}

interface CodeContentPart {
  type: "code";
  text: string;
  language?: string;
  filename?: string;
}
```

### SourceRef

```typescript
interface SourceRef {
  id: string;
  url?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}
```

### ChatRequest

```typescript
interface ChatRequest {
  messages: Message[];
  model: string; // Format: "provider:model-id"
  providerConfig: string; // Required: provider configuration name
  tools?: ToolDefinition[]; // Array of tool definitions, not boolean
  multiTurn?: Partial<AgentExecutionOptions>;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, unknown>;
  signal?: AbortSignal;
}
```

### StreamRequest

```typescript
interface StreamRequest {
  messages: Message[];
  model: string; // Format: "provider:model-id"
  providerConfig: string; // Required: provider configuration name
  tools?: ToolDefinition[]; // Array of tool definitions, not boolean
  multiTurn?: Partial<AgentExecutionOptions>;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, unknown>;
  signal?: AbortSignal;
}
```

### StreamDelta

```typescript
interface StreamDelta {
  id: string; // Unique identifier for this chunk
  delta: Partial<Message>; // Partial message content for this chunk
  finished: boolean; // Whether this is the final chunk
  usage?: {
    // Token usage information when available
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>; // Additional metadata for this chunk
}
```

### AgentExecutionOptions (Multi-Turn Configuration)

```typescript
interface AgentExecutionOptions {
  // Core execution options
  maxToolCalls?: number; // Default: 1
  timeoutMs?: number; // Default: 30000 (30 seconds)
  toolTimeoutMs?: number; // Default: 5000 (5 seconds)
  continueOnToolError?: boolean; // Default: true

  // Multi-turn options
  maxIterations?: number; // Default: 10
  iterationTimeoutMs?: number; // Default: undefined
  enableStreaming?: boolean; // Default: true
  toolExecutionStrategy?: "sequential" | "parallel"; // Default: "sequential"
  maxConcurrentTools?: number; // Default: 3

  // Cancellation options
  signal?: AbortSignal;
  cancellationCheckIntervalMs?: number; // Default: 100
  gracefulCancellationTimeoutMs?: number; // Default: 5000
  cleanupOnCancel?: boolean; // Default: true
}
```

### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema; // JSON Schema for parameters
  metadata?: Record<string, unknown>;
}
```

### ToolCall

```typescript
interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  metadata?: {
    providerId?: string;
    timestamp?: string;
    contextId?: string;
  };
}
```

### ToolHandler

```typescript
type ToolHandler = (
  params: Record<string, unknown>,
  context?: ToolExecutionContext,
) => Promise<unknown>;
```

## Configuration

### BridgeConfig

```typescript
interface BridgeConfig {
  providers?: Record<string, Record<string, ProviderConfig>>; // Nested: provider -> config name -> config
  defaultModel?: string;
  timeout?: number;
  options?: Record<string, unknown>;
  registryOptions?: {
    providers?: ProviderRegistryOptions;
    models?: ModelRegistryOptions;
  };
  modelSeed?: "builtin" | "none" | { data?: unknown } | { path: string };
  tools?: ToolsConfig;
  rateLimitPolicy?: {
    enabled?: boolean;
    maxRps?: number;
    burst?: number;
    scope?: "global" | "provider" | "provider:model" | "provider:model:key";
  };
  retryPolicy?: {
    attempts?: number;
    backoff?: "exponential" | "linear";
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    retryableStatusCodes?: number[];
  };
}
```

### ProviderConfig

```typescript
interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  options?: Record<string, unknown>;
}
```

### ToolsConfig

```typescript
interface ToolsConfig {
  enabled: boolean;
  builtinTools: string[];
  executionTimeoutMs?: number;
  maxConcurrentTools?: number;
  mcpServers?: McpServerConfig[];
  mcpToolFailureStrategy?: "immediate_unregister" | "mark_unavailable";
}
```

### McpServerConfig

```typescript
interface McpServerConfig {
  name: string;
  command?: string; // STDIO servers
  args?: string[]; // STDIO servers
  url?: string; // HTTP servers
}
```

## Registries

### ModelRegistry

```typescript
interface ModelRegistry {
  register(id: ModelId, info: ModelInfo): void;
  get(id: ModelId): ModelInfo | undefined;
  list(): ModelInfo[];
  query(query: ModelQuery): ModelInfo[];
  has(id: ModelId): boolean;
  unregister(id: ModelId): boolean;
}
```

### ProviderRegistry

```typescript
interface ProviderRegistry {
  register(key: ProviderKey, plugin: ProviderPlugin): void;
  get(key: ProviderKey): ProviderPlugin | undefined;
  list(): ProviderInfo[];
  has(key: ProviderKey): boolean;
  unregister(key: ProviderKey): boolean;
}
```

### ModelCapabilities

```typescript
interface ModelCapabilities {
  streaming: boolean;
  toolCalls: boolean;
  images: boolean;
  documents: boolean;
  temperature?: boolean;
  thinking?: boolean;
  promptCaching?: boolean;
  maxTokens?: number; // Use maxTokens, not contextLength
  supportedContentTypes: string[];
  metadata?: Record<string, unknown>;
}
```

## Error Types

### BridgeError

Base error class for all library errors.

```typescript
class BridgeError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>);

  toJSON(): Record<string, unknown>;
}
```

### ValidationError

Thrown when input validation fails.

```typescript
class ValidationError extends BridgeError {
  validationErrors: ValidationIssue[];
}
```

### ProviderError

Thrown when provider-specific errors occur.

```typescript
class ProviderError extends BridgeError {
  provider: string;
  httpStatus?: number;
}
```

### ToolError

Thrown when tool execution fails.

```typescript
class ToolError extends BridgeError {
  toolName: string;
  phase: "validation" | "execution" | "result_processing";
}
```

### McpError

Thrown when MCP operations fail.

```typescript
class McpError extends BridgeError {
  serverName: string;
  mcpErrorCode?: number;
}
```

## Validation Schemas

All types include Zod validation schemas for runtime type checking:

```typescript
import {
  MessageSchema,
  ContentPartSchema,
  BridgeConfigSchema,
  ToolDefinitionSchema,
} from "@langadventurellc/burnside";

// Validate a message
const result = MessageSchema.safeParse(message);
if (result.success) {
  console.log("Valid message:", result.data);
} else {
  console.error("Validation errors:", result.error.issues);
}
```

## Helper Functions

### createModelId(provider, modelId)

Create a properly formatted model ID.

```typescript
function createModelId(provider: string, modelId: string): ModelId;
```

### parseModelId(modelId)

Parse a model ID into provider and model components.

```typescript
function parseModelId(modelId: ModelId): { provider: string; model: string };
```

### validateMessage(message)

Validate a message object.

```typescript
function validateMessage(message: unknown): Message;
```

### validateContentPart(contentPart)

Validate a content part object.

```typescript
function validateContentPart(contentPart: unknown): ContentPart;
```

---

# File: docs/error-handling.md

# Error Handling and Troubleshooting

Comprehensive guide to error handling, troubleshooting, and debugging with the Burnside LLM Bridge Library.

## Table of Contents

- [Error Types](#error-types)
- [Common Errors](#common-errors)
- [Error Handling Patterns](#error-handling-patterns)
- [Debugging Techniques](#debugging-techniques)
- [Provider-Specific Issues](#provider-specific-issues)
- [MCP Troubleshooting](#mcp-troubleshooting)
- [Performance Issues](#performance-issues)
- [Production Considerations](#production-considerations)

## Error Types

### BridgeError (Base Class)

All library errors extend from `BridgeError`, providing consistent error handling:

```typescript
import { BridgeError } from "@langadventurellc/burnside";

class BridgeError extends Error {
  code: string; // Error code for programmatic handling
  context?: Record<string, unknown>; // Additional error context
  originalError?: Error; // Original error if wrapped
}
```

### ValidationError

Thrown when input validation fails:

```typescript
try {
  const response = await client.chat({
    messages: [], // Invalid: empty messages array
    model: "openai:gpt-4o-2024-08-06",
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.message);
    console.error("Issues:", error.validationErrors);
  }
}
```

### ProviderError

Thrown when provider-specific errors occur:

```typescript
try {
  const response = await client.chat({
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
    model: "openai:gpt-4o-2024-08-06",
  });
} catch (error) {
  if (error instanceof ProviderError) {
    console.error(`Provider ${error.provider} error:`, error.message);
    console.error("HTTP Status:", error.httpStatus);
  }
}
```

### ToolError

Thrown when tool execution fails:

```typescript
try {
  const response = await client.chat({
    messages: [
      { role: "user", content: [{ type: "text", text: "Calculate 5/0" }] },
    ],
    model: "openai:gpt-4o-2024-08-06",
    tools: true,
  });
} catch (error) {
  if (error instanceof ToolError) {
    console.error(`Tool ${error.toolName} failed:`, error.message);
    console.error("Phase:", error.phase); // "validation" | "execution" | "result_processing"
  }
}
```

### McpError

Thrown when MCP operations fail:

```typescript
try {
  // MCP server connection or operation
} catch (error) {
  if (error instanceof McpError) {
    console.error(`MCP server ${error.serverName} error:`, error.message);
    console.error("MCP Error Code:", error.mcpErrorCode);
  }
}
```

### TimeoutError

Thrown when operations exceed configured timeouts:

```typescript
try {
  const response = await client.chat({
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
    model: "openai:gpt-4o-2024-08-06",
  });
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error("Operation timed out:", error.message);
    console.error("Timeout duration:", error.timeoutMs);
  }
}
```

### RateLimitError

Thrown when rate limits are exceeded:

```typescript
try {
  const response = await client.chat({
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
    model: "openai:gpt-4o-2024-08-06",
  });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded:", error.message);
    console.error("Retry after:", error.retryAfterMs);
  }
}
```

## Common Errors

### Authentication Errors

**Invalid API Key**

```
Error: Authentication failed for provider 'openai'
Code: AUTH_FAILED
```

**Solution:**

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Check API key format and validity
const client = createClient({
  providers: {
    openai: {
      apiKey: "${OPENAI_API_KEY}", // Ensure env var is set
    },
  },
  modelSeed: "builtin",
});

client.registerProvider(new OpenAIResponsesV1Provider());

// Verify environment variable
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable not set");
}
```

### Model Errors

**Model Not Found**

```
Error: Model 'openai:invalid-model' not found
Code: MODEL_NOT_FOUND
```

**Solution:**

```typescript
// Check available models
const modelRegistry = client.getModelRegistry();
const availableModels = modelRegistry.list();
console.log("Available models:", availableModels.map(m => m.id));

// Use correct model format: provider:model-id
const response = await client.chat({
  messages: [...],
  model: "openai:gpt-4o-2024-08-06" // Correct format
});
```

**Model Doesn't Support Feature**

```
Error: Model 'openai:o1-2024-12-17' does not support tool calls
Code: FEATURE_NOT_SUPPORTED
```

**Solution:**

```typescript
// Check model capabilities before use
const modelRegistry = client.getModelRegistry();
const model = modelRegistry.get("openai:o1-2024-12-17");

if (!model?.capabilities?.toolCalls) {
  console.log("Model doesn't support tools, using different model");
  // Use a different model or disable tools
}
```

### Rate Limiting Errors

**Rate Limit Exceeded**

```
Error: Rate limit exceeded for provider 'openai'
Code: RATE_LIMIT_EXCEEDED
HTTP Status: 429
```

**Solution:**

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Configure rate limiting
const client = createClient({
  providers: {
    openai: {
      apiKey: "${OPENAI_API_KEY}",
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 60,
    burst: 120,
  },
  retryPolicy: {
    attempts: 3,
    backoff: "exponential",
    baseDelayMs: 500,
    maxDelayMs: 8000,
    jitter: true,
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());

// Implement retry with exponential backoff
async function chatWithRetry(request, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat(request);
    } catch (error) {
      if (error instanceof RateLimitError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 60000);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Network Errors

**Connection Timeout**

```
Error: Request timeout after 30000ms
Code: TIMEOUT
```

**Solution:**

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Increase timeout for slow connections
const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  timeout: 60000, // 60 seconds
  retryPolicy: {
    attempts: 3,
    backoff: "linear",
    baseDelayMs: 2000,
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Validation Errors

**Invalid Message Format**

```
Error: Invalid message format
Code: VALIDATION_FAILED
```

**Solution:**

```typescript
// Ensure correct message structure
const validMessage = {
  role: "user" as const, // Must be exact string literal
  content: [
    // Must be array
    { type: "text", text: "Hello" },
  ],
};

// Validate before sending
import { MessageSchema } from "@langadventurellc/burnside";
const result = MessageSchema.safeParse(validMessage);
if (!result.success) {
  console.error("Validation errors:", result.error.issues);
}
```

## Error Handling Patterns

### Basic Error Handling

```typescript
import {
  BridgeError,
  ValidationError,
  ProviderError,
  ToolError,
  TimeoutError,
  RateLimitError,
} from "@langadventurellc/burnside";

async function handleChat(request) {
  try {
    const response = await client.chat(request);
    return response;
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      console.error("Input validation failed:", error.message);
      // Fix input and retry
    } else if (error instanceof RateLimitError) {
      console.error("Rate limited, implementing backoff");
      // Implement exponential backoff
    } else if (error instanceof TimeoutError) {
      console.error("Request timed out, retrying with longer timeout");
      // Retry with increased timeout
    } else if (error instanceof ProviderError) {
      if (error.httpStatus === 401) {
        console.error("Authentication failed - check API key");
      } else if (error.httpStatus === 404) {
        console.error("Model not found - check model ID");
      } else {
        console.error(`Provider error (${error.httpStatus}):`, error.message);
      }
    } else if (error instanceof ToolError) {
      console.error(
        `Tool execution failed: ${error.toolName} in ${error.phase}`,
      );
      // Handle tool-specific errors
    } else if (error instanceof BridgeError) {
      console.error("Bridge error:", error.message, error.code);
    } else {
      console.error("Unknown error:", error);
    }

    throw error; // Re-throw if can't handle
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
async function chatWithRetry(request, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat(request);
    } catch (error) {
      lastError = error;

      // Don't retry certain error types
      if (error instanceof ValidationError) {
        throw error; // No point retrying validation errors
      }

      if (attempt === maxRetries) {
        break; // Last attempt failed
      }

      // Calculate delay with jitter
      const baseDelay = 1000 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay + jitter, 30000);

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state = "closed"; // closed | open | half-open

  constructor(
    private maxFailures = 5,
    private timeoutMs = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = "open";
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker();

async function robustChat(request) {
  return circuitBreaker.execute(() => client.chat(request));
}
```

## Debugging Techniques

### Enable Debug Logging

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  logging: {
    level: "debug",
    destination: "console",
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Custom Error Context

```typescript
// Add custom context to errors
try {
  const response = await client.chat({
    messages: [...],
    model: "openai:gpt-4o-2024-08-06",
    metadata: {
      requestId: "req_123",
      userId: "user_456"
    }
  });
} catch (error) {
  if (error instanceof BridgeError) {
    console.error("Error context:", error.context);
    console.error("Request metadata:", error.context?.metadata);
  }
}
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  async monitorChat(request) {
    const startTime = Date.now();
    const operation = `chat:${request.model}`;

    try {
      const response = await client.chat(request);
      this.recordSuccess(operation, Date.now() - startTime);
      return response;
    } catch (error) {
      this.recordFailure(operation, Date.now() - startTime, error);
      throw error;
    }
  }

  private recordSuccess(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    console.log(`✅ ${operation}: ${duration}ms`);
  }

  private recordFailure(operation: string, duration: number, error: Error) {
    console.error(`❌ ${operation}: ${duration}ms - ${error.message}`);
  }

  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;

    const sorted = durations.slice().sort((a, b) => a - b);
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
}

// Usage
const monitor = new PerformanceMonitor();
const response = await monitor.monitorChat(request);
```

## Provider-Specific Issues

### OpenAI Issues

**Model Access Denied**

```
Error: You don't have access to this model
HTTP Status: 403
```

- Check your API plan and model access
- Some models require special access (GPT-4, o1 series)

**Context Length Exceeded**

```
Error: This model's maximum context length is 128000 tokens
HTTP Status: 400
```

- Reduce message length or use a model with larger context
- Implement message truncation

### Anthropic Issues

**Prompt Caching Errors**

```
Error: Prompt caching not available for this model
```

- Only newer Claude models support prompt caching
- Check model capabilities before enabling caching

### Google Issues

**Video Processing Errors**

```
Error: Video format not supported
```

- Ensure video is in supported format (MP4, WebM)
- Check file size limits
- Use Google Cloud Storage URLs for large files

### xAI Issues

**API Endpoint Changes**

```
Error: Endpoint not found
HTTP Status: 404
```

- xAI API is newer, endpoints may change
- Check base URL configuration

## MCP Troubleshooting

### Server Connection Issues

**STDIO Server Won't Start**

```
Error: Failed to spawn MCP server process
```

**Troubleshooting Steps:**

1. Check executable path and permissions
2. Verify command arguments
3. Test manually in terminal

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Debug MCP server startup
const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
    mcpServers: [
      {
        name: "test-server",
        command: "/usr/local/bin/mcp-server",
        args: ["--debug", "--verbose"],
        environment: {
          DEBUG: "1",
          LOG_LEVEL: "debug",
        },
      },
    ],
  },
  logging: {
    level: "debug",
    destination: "console",
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

**HTTP Server Connection Errors**

```
Error: Failed to connect to MCP server at http://localhost:3001
```

**Troubleshooting Steps:**

1. Verify server is running
2. Check network connectivity
3. Verify URL and port

### Tool Registration Issues

**No Tools Registered**

```
Warning: MCP server connected but no tools available
```

**Possible Causes:**

- Server doesn't advertise tools capability
- Server has no tools to offer
- Capability negotiation failed

**Solution:**

```typescript
// Check MCP server capabilities
const toolRouter = client.getToolRouter();
if (toolRouter) {
  const tools = toolRouter.getRegisteredTools();
  const mcpTools = tools.filter((t) => t.name.startsWith("mcp_"));

  if (mcpTools.length === 0) {
    console.log("No MCP tools registered - check server capabilities");
  }
}
```

## Performance Issues

### Slow Response Times

**High Latency**

- Check network connection
- Use closer provider regions
- Implement request caching

```typescript
// Simple response caching
const responseCache = new Map<string, any>();

async function cachedChat(request) {
  const cacheKey = JSON.stringify(request);

  if (responseCache.has(cacheKey)) {
    console.log("Cache hit");
    return responseCache.get(cacheKey);
  }

  const response = await client.chat(request);
  responseCache.set(cacheKey, response);
  return response;
}
```

### Memory Issues

**High Memory Usage**

- Monitor conversation history length
- Implement message truncation
- Clear old conversations

```typescript
// Conversation management
class ConversationManager {
  private conversations = new Map<string, Message[]>();
  private maxMessages = 50;

  addMessage(conversationId: string, message: Message) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }

    const messages = this.conversations.get(conversationId)!;
    messages.push(message);

    // Truncate old messages
    if (messages.length > this.maxMessages) {
      messages.splice(0, messages.length - this.maxMessages);
    }
  }

  getMessages(conversationId: string): Message[] {
    return this.conversations.get(conversationId) || [];
  }

  clearConversation(conversationId: string) {
    this.conversations.delete(conversationId);
  }
}
```

## Production Considerations

### Health Checks

```typescript
async function healthCheck() {
  try {
    // Simple health check
    const response = await client.chat({
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Health check" }],
        },
      ],
      model: "openai:gpt-4o-2024-08-06",
    });

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: Date.now(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Graceful Shutdown

```typescript
class GracefulShutdown {
  private isShuttingDown = false;

  constructor(private client: BridgeClient) {
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log("Graceful shutdown initiated...");

    try {
      // Stop accepting new requests
      // Wait for ongoing requests to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Dispose of client resources
      await this.client.dispose();

      console.log("Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

// Usage
new GracefulShutdown(client);
```

### Error Reporting

```typescript
// Error reporting service
class ErrorReporter {
  async reportError(error: Error, context: Record<string, unknown>) {
    const report = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      environment: process.env.NODE_ENV,
    };

    // Send to logging service
    console.error("Error Report:", JSON.stringify(report, null, 2));

    // Could also send to external services like Sentry, DataDog, etc.
  }
}

const errorReporter = new ErrorReporter();

// Usage in error handlers
try {
  await client.chat(request);
} catch (error) {
  await errorReporter.reportError(error, {
    operation: "chat",
    model: request.model,
    userId: request.metadata?.userId,
  });
  throw error;
}
```

This comprehensive error handling guide should help you build robust applications with the Burnside LLM Bridge Library. Remember to implement appropriate error handling for your specific use case and always test error scenarios in development.

---

# File: docs/examples.md

# Examples

Comprehensive examples demonstrating common use cases and advanced patterns with the Burnside LLM Bridge Library.

All examples assume the model registry has been seeded (for example by passing `modelSeed: "builtin"`) and the relevant provider plugins have been registered with the client before making requests.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Streaming Examples](#streaming-examples)
- [Multimodal Examples](#multimodal-examples)
- [Tool Integration Examples](#tool-integration-examples)
- [Multi-Turn Conversations](#multi-turn-conversations)
- [MCP Integration Examples](#mcp-integration-examples)
- [Error Handling Examples](#error-handling-examples)
- [Production Examples](#production-examples)

## Basic Examples

### Simple Chat Completion

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
});

client.registerProvider(new OpenAIResponsesV1Provider());

async function basicChat() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Explain quantum computing in simple terms" },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
  });

  console.log(response.content[0].text);
}

basicChat().catch(console.error);
```

#### Sample Output

Running the example and logging the entire response (`console.log(JSON.stringify(response, null, 2))`) produces a normalized `Message`:

```json
{
  "id": "resp_02HFG1A3CEXAMPLE",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Quantum computing uses qubits to perform operations that would take classical computers much longer."
    }
  ],
  "timestamp": "2025-02-20T18:19:00.123Z",
  "metadata": {
    "provider": "openai",
    "id": "resp_02HFG1A3CEXAMPLE",
    "created_at": "2025-02-20T18:18:59.997Z",
    "status": "completed",
    "finishReason": null
  }
}
```

Provider-specific keys (for example Anthropic's `stopReason` or Gemini's `modelVersion` and `safetyRatings`) appear in `metadata` when available, while the overall shape stays constant.

### Multi-Provider Setup

```typescript
import { createClient } from "@langadventurellc/burnside";
import {
  OpenAIResponsesV1Provider,
  AnthropicMessagesV1Provider,
  GoogleGeminiV1Provider,
  XaiV1Provider,
} from "@langadventurellc/burnside/providers";

const multiProviderClient = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
    anthropic: { apiKey: "${ANTHROPIC_API_KEY}" },
    google: { apiKey: "${GOOGLE_AI_API_KEY}" },
    xai: { apiKey: "${XAI_API_KEY}" },
  },
  defaultProvider: "anthropic",
  modelSeed: "builtin",
});

multiProviderClient.registerProvider(new OpenAIResponsesV1Provider());
multiProviderClient.registerProvider(new AnthropicMessagesV1Provider());
multiProviderClient.registerProvider(new GoogleGeminiV1Provider());
multiProviderClient.registerProvider(new XaiV1Provider());

async function compareProviders() {
  const question = "What are the advantages of renewable energy?";
  const message = {
    role: "user" as const,
    content: [{ type: "text", text: question }],
  };

  // Get responses from different providers
  const [openaiResponse, anthropicResponse, googleResponse, xaiResponse] =
    await Promise.all([
      multiProviderClient.chat({
        messages: [message],
        model: "openai:gpt-4o-2024-08-06",
      }),
      multiProviderClient.chat({
        messages: [message],
        model: "anthropic:claude-3-5-haiku-latest",
      }),
      multiProviderClient.chat({
        messages: [message],
        model: "google:gemini-2.0-flash",
      }),
      multiProviderClient.chat({ messages: [message], model: "xai:grok-3" }),
    ]);

  console.log("OpenAI:", openaiResponse.content[0].text);
  console.log("Anthropic:", anthropicResponse.content[0].text);
  console.log("Google:", googleResponse.content[0].text);
  console.log("xAI:", xaiResponse.content[0].text);
}

compareProviders().catch(console.error);
```

## Streaming Examples

### Basic Streaming

```typescript
async function streamingChat() {
  const stream = await client.stream({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Tell me a story about a robot learning to paint",
          },
        ],
      },
    ],
    model: "anthropic:claude-3-5-haiku-latest",
  });

  let fullResponse = "";
  for await (const delta of stream) {
    if (delta.delta.content?.[0]?.text) {
      const chunk = delta.delta.content[0].text;
      process.stdout.write(chunk);
      fullResponse += chunk;
    }
  }

  console.log("\\n\\nComplete response:", fullResponse);
}

streamingChat().catch(console.error);
```

#### Stream Delta Snapshot

Inspecting the yielded deltas highlights the incremental structure:

```json
{
  "id": "resp_stream_02HFG1A3C",
  "delta": {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Once upon a time a curious robot"
      }
    ]
  },
  "finished": false,
  "metadata": {
    "eventType": "response.output_text.delta"
  }
}
```

When the provider signals completion, Burnside emits a final chunk:

```json
{
  "id": "resp_stream_02HFG1A3C",
  "delta": {},
  "finished": true,
  "usage": {
    "promptTokens": 645,
    "completionTokens": 128,
    "totalTokens": 773
  }
}
```

Any tool calls detected during streaming are surfaced via `metadata.tool_calls` and handled automatically when the tool system is enabled.

### Streaming with Progress Tracking

```typescript
async function streamingWithProgress() {
  const stream = await client.stream({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Write a detailed analysis of climate change impacts",
          },
        ],
      },
    ],
    model: "google:gemini-2.5-pro",
  });

  let tokenCount = 0;
  let chunkCount = 0;
  const startTime = Date.now();

  for await (const delta of stream) {
    chunkCount++;

    if (delta.delta.content?.[0]?.text) {
      const chunk = delta.delta.content[0].text;
      tokenCount += chunk.split(/\\s+/).length; // Rough token estimate
      process.stdout.write(chunk);
    }

    // Show progress every 50 chunks
    if (chunkCount % 50 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(
        `\\n[Progress: ${chunkCount} chunks, ~${tokenCount} tokens, ${elapsed.toFixed(1)}s]\\n`,
      );
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(
    `\\n\\nStreaming complete: ${chunkCount} chunks, ~${tokenCount} tokens in ${totalTime.toFixed(1)}s`,
  );
}

streamingWithProgress().catch(console.error);
```

### Streaming with Interruption

```typescript
import { StreamingInterruptionWrapper } from "@langadventurellc/burnside";

async function interruptibleStreaming() {
  const wrapper = new StreamingInterruptionWrapper();

  // Start streaming
  const streamPromise = wrapper.wrapStream(
    client.stream({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write a very long essay about artificial intelligence",
            },
          ],
        },
      ],
      model: "openai:gpt-4o-2024-08-06",
    }),
  );

  // Set up interrupt after 10 seconds
  setTimeout(() => {
    console.log("\\nInterrupting stream...");
    wrapper.interrupt();
  }, 10000);

  try {
    for await (const delta of await streamPromise) {
      if (delta.delta.content?.[0]?.text) {
        process.stdout.write(delta.delta.content[0].text);
      }
    }
  } catch (error) {
    if (error.message.includes("interrupted")) {
      console.log("\\nStream was interrupted by user");
    } else {
      throw error;
    }
  }
}

interruptibleStreaming().catch(console.error);
```

## Multimodal Examples

### Image Analysis

```typescript
import { readFileSync } from "fs";
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
});

client.registerProvider(new OpenAIResponsesV1Provider());

async function analyzeImage() {
  // Read image file and convert to base64
  const imageBuffer = readFileSync("./example-image.jpg");
  const base64Image = imageBuffer.toString("base64");

  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What's in this image? Describe it in detail.",
          },
          {
            type: "image",
            source: `data:image/jpeg;base64,${base64Image}`,
            mimeType: "image/jpeg",
          },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
  });

  console.log("Image analysis:", response.content[0].text);
}

analyzeImage().catch(console.error);
```

### Document Processing

```typescript
async function processDocument() {
  const pdfBuffer = readFileSync("./research-paper.pdf");
  const base64Pdf = pdfBuffer.toString("base64");

  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Summarize this research paper and extract the key findings.",
          },
          {
            type: "document",
            source: `data:application/pdf;base64,${base64Pdf}`,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    model: "anthropic:claude-opus-4-20250514",
  });

  console.log("Document summary:", response.content[0].text);
}

processDocument().catch(console.error);
```

### Video Analysis (Google Gemini)

```typescript
async function analyzeVideo() {
  // For Google Gemini, you can use Cloud Storage URLs
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe what happens in this video clip." },
          {
            type: "video",
            source: "gs://my-bucket/sample-video.mp4",
            mimeType: "video/mp4",
          },
        ],
      },
    ],
    model: "google:gemini-2.0-flash",
  });

  console.log("Video analysis:", response.content[0].text);
}

analyzeVideo().catch(console.error);
```

## Tool Integration Examples

### Calculator Tool

```typescript
// Register calculator tool
client.registerTool(
  {
    name: "calculator",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "Mathematical expression to evaluate (e.g., '2 + 3 * 4')",
        },
      },
      required: ["expression"],
    },
  },
  async (params) => {
    try {
      // Simple expression evaluator (use a proper library in production)
      const result = Function(`"use strict"; return (${params.expression})`)();
      return { result, expression: params.expression };
    } catch (error) {
      throw new Error(`Invalid expression: ${error.message}`);
    }
  },
);

async function mathChat() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What's the result of (15 + 27) * 3 - 10?" },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
    tools: true,
  });

  console.log(response.content[0].text);
}

mathChat().catch(console.error);
```

#### Tool Call Payload

When a provider decides to execute a tool, the first assistant response is a tool-call message:

```json
{
  "id": "resp_tool_02HFG1A3C",
  "role": "assistant",
  "content": [],
  "toolCalls": [
    {
      "id": "call_calculator_01",
      "name": "calculator",
      "parameters": {
        "expression": "(15 + 27) * 3 - 10"
      }
    }
  ],
  "metadata": {
    "provider": "openai",
    "tool_calls": [
      {
        "id": "call_calculator_01",
        "type": "function",
        "function": {
          "name": "calculator",
          "arguments": "{\"expression\":\"(15 + 27) * 3 - 10\"}"
        }
      }
    ]
  }
}
```

Use `extractToolCallsFromMessage(response)` to work with the normalized `toolCalls` array regardless of which provider produced the message.

### Web API Tool

```typescript
// Register weather tool
client.registerTool(
  {
    name: "get_weather",
    description: "Get current weather information for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name, state/country (e.g., 'New York, NY')",
        },
        units: {
          type: "string",
          enum: ["metric", "imperial"],
          default: "metric",
          description: "Temperature units",
        },
      },
      required: ["location"],
    },
  },
  async (params) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const { location, units = "metric" } = params;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      units,
    };
  },
);

async function weatherChat() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What's the weather like in Tokyo and Paris right now?",
          },
        ],
      },
    ],
    model: "anthropic:claude-3-5-haiku-latest",
    tools: true,
    multiTurn: {
      toolExecutionStrategy: "parallel", // Get both weather reports simultaneously
    },
  });

  console.log(response.content[0].text);
}

weatherChat().catch(console.error);
```

### File System Tool

```typescript
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Register file operations tool
client.registerTool(
  {
    name: "file_operations",
    description: "Read, write, and list files in a safe directory",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["read", "write", "list"],
          description: "File operation to perform",
        },
        path: {
          type: "string",
          description: "File or directory path (relative to safe directory)",
        },
        content: {
          type: "string",
          description: "Content to write (required for write operation)",
        },
      },
      required: ["operation", "path"],
    },
  },
  async (params) => {
    const safeDir = "./safe-directory"; // Restrict to safe directory
    const fullPath = join(safeDir, params.path);

    // Security check
    if (!fullPath.startsWith(safeDir)) {
      throw new Error("Access denied: path outside safe directory");
    }

    switch (params.operation) {
      case "read":
        try {
          const content = readFileSync(fullPath, "utf8");
          return { content, path: params.path };
        } catch (error) {
          throw new Error(`Failed to read file: ${error.message}`);
        }

      case "write":
        if (!params.content) {
          throw new Error("Content is required for write operation");
        }
        try {
          writeFileSync(fullPath, params.content, "utf8");
          return {
            success: true,
            path: params.path,
            size: params.content.length,
          };
        } catch (error) {
          throw new Error(`Failed to write file: ${error.message}`);
        }

      case "list":
        try {
          const entries = readdirSync(fullPath).map((name) => {
            const entryPath = join(fullPath, name);
            const stats = statSync(entryPath);
            return {
              name,
              type: stats.isDirectory() ? "directory" : "file",
              size: stats.size,
              modified: stats.mtime.toISOString(),
            };
          });
          return { entries, path: params.path };
        } catch (error) {
          throw new Error(`Failed to list directory: ${error.message}`);
        }

      default:
        throw new Error(`Unknown operation: ${params.operation}`);
    }
  },
);

async function fileManagementChat() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "List the files in the current directory, then read the README.md file if it exists",
          },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
    tools: true,
  });

  console.log(response.content[0].text);
}

fileManagementChat().catch(console.error);
```

## Multi-Turn Conversations

### Research Assistant

```typescript
async function researchAssistant() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Research the current state of quantum computing and create a summary report with the latest developments",
          },
        ],
      },
    ],
    model: "anthropic:claude-opus-4-20250514",
    tools: true,
    multiTurn: {
      maxIterations: 10,
      toolExecutionStrategy: "sequential",
      terminationStrategy: "smart",
    },
  });

  console.log("Research Report:");
  console.log(response.content[0].text);
}

researchAssistant().catch(console.error);
```

### Code Analysis and Improvement

```typescript
// Register code analysis tools
client.registerTool(
  {
    name: "analyze_code",
    description: "Analyze code for issues, patterns, and improvements",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code to analyze" },
        language: { type: "string", description: "Programming language" },
      },
      required: ["code", "language"],
    },
  },
  async (params) => {
    // Mock code analysis - replace with real analysis tools
    const issues = [];
    const suggestions = [];

    if (params.code.includes("var ")) {
      issues.push("Use 'const' or 'let' instead of 'var'");
    }
    if (params.code.includes("== ")) {
      issues.push("Use '===' for strict equality comparison");
    }
    if (!params.code.includes("try")) {
      suggestions.push("Consider adding error handling");
    }

    return {
      language: params.language,
      issues,
      suggestions,
      complexity: Math.floor(Math.random() * 10) + 1, // Mock complexity score
    };
  },
);

async function codeReview() {
  const codeToReview = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price == undefined) {
      continue;
    }
    total += items[i].price;
  }
  return total;
}
  `;

  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze this JavaScript code and suggest improvements:\\n\\n${codeToReview}`,
          },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
    tools: true,
    multiTurn: {
      maxIterations: 3,
      toolExecutionStrategy: "sequential",
    },
  });

  console.log("Code Review Results:");
  console.log(response.content[0].text);
}

codeReview().catch(console.error);
```

## MCP Integration Examples

### Filesystem MCP Server

```typescript
import { createClient } from "@langadventurellc/burnside";
import { AnthropicMessagesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    anthropic: { apiKey: "${ANTHROPIC_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
    mcpServers: [
      {
        name: "filesystem",
        command: "npx",
        args: [
          "@modelcontextprotocol/server-filesystem",
          "/home/user/documents",
        ],
        timeout: 30000,
      },
    ],
  },
});

client.registerProvider(new AnthropicMessagesV1Provider());

async function filesystemChat() {
  // Wait for MCP tools to be registered
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Find all Python files in my documents folder and show me their content",
          },
        ],
      },
    ],
    model: "anthropic:claude-3-5-haiku-latest",
    tools: true,
  });

  console.log(response.content[0].text);
}

filesystemChat().catch(console.error);
```

### Database MCP Server

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
    mcpServers: [
      {
        name: "database",
        command: "npx",
        args: ["@modelcontextprotocol/server-postgres"],
        environment: {
          POSTGRES_URL: "postgresql://user:password@localhost:5432/mydb",
        },
      },
    ],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());

async function databaseQuery() {
  const response = await client.chat({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Show me the top 10 customers by total order value from our database",
          },
        ],
      },
    ],
    model: "openai:gpt-4o-2024-08-06",
    tools: true,
  });

  console.log(response.content[0].text);
}

databaseQuery().catch(console.error);
```

## Error Handling Examples

### Comprehensive Error Handling

```typescript
import {
  BridgeError,
  ValidationError,
  ProviderError,
  ToolError,
} from "@langadventurellc/burnside";

async function robustChat() {
  try {
    const response = await client.chat({
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello, world!" }],
        },
      ],
      model: "openai:gpt-4o-2024-08-06",
    });

    console.log("Success:", response.content[0].text);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Validation Error:", error.message);
      console.error("Validation Issues:", error.validationErrors);
    } else if (error instanceof ProviderError) {
      console.error(`Provider Error (${error.provider}):`, error.message);
      if (error.httpStatus === 401) {
        console.error("Check your API key");
      } else if (error.httpStatus === 429) {
        console.error("Rate limit exceeded - implement backoff");
      }
    } else if (error instanceof ToolError) {
      console.error(`Tool Error (${error.toolName}):`, error.message);
      console.error("Execution phase:", error.phase);
    } else if (error instanceof BridgeError) {
      console.error("Bridge Error:", error.message);
      console.error("Error code:", error.code);
      console.error("Context:", error.context);
    } else {
      console.error("Unknown Error:", error);
    }
  }
}

robustChat().catch(console.error);
```

### Retry Logic

```typescript
async function chatWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat({
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Hello, world!" }],
          },
        ],
        model: "openai:gpt-4o-2024-08-06",
      });

      return response;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error; // Give up after max retries
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

chatWithRetry().catch(console.error);
```

## Production Examples

### Web Server Integration (Express.js)

```typescript
import express from "express";
import { createClient, BridgeError } from "@langadventurellc/burnside";

const app = express();
app.use(express.json());

const client = createClient({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  logging: {
    level: "info",
    destination: "file",
    filePath: "./logs/llm-bridge.log",
  },
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages,
      model = "openai:gpt-4o-2024-08-06",
      stream = false,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const streamResponse = await client.stream({ messages, model });

      for await (const delta of streamResponse) {
        res.write(`data: ${JSON.stringify(delta)}\\n\\n`);
      }

      res.write("data: [DONE]\\n\\n");
      res.end();
    } else {
      const response = await client.chat({ messages, model });
      res.json({ response });
    }
  } catch (error) {
    console.error("Chat error:", error);

    if (error instanceof BridgeError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        provider: error.context?.provider,
      });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Health check
app.get("/api/health", (req, res) => {
  const modelRegistry = client.getModelRegistry();
  const availableModels = modelRegistry.list().length;

  res.json({
    status: "healthy",
    models: availableModels,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await client.dispose();
  process.exit(0);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Chat Application (React)

```typescript
// hooks/useBurnsideChat.ts
import { useState, useCallback } from "react";
import {
  createClient,
  type Message,
  type StreamDelta,
} from "@langadventurellc/burnside";

const client = createClient({
  providers: {
    openai: { apiKey: process.env.REACT_APP_OPENAI_API_KEY },
  },
  runtime: "browser",
});

export function useBurnsideChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string, model = "openai:gpt-4o-2024-08-06") => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: [{ type: "text", text }],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.chat({
          messages: [...messages, userMessage],
          model,
        });

        setMessages((prev) => [...prev, response]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const streamMessage = useCallback(
    async (text: string, model = "openai:gpt-4o-2024-08-06") => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: [{ type: "text", text }],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: [{ type: "text", text: "" }],
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const stream = await client.stream({
          messages: [...messages, userMessage],
          model,
        });

        for await (const delta of stream) {
          if (delta.delta.content?.[0]?.text) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastMessage = updated[updated.length - 1];
              if (
                lastMessage.role === "assistant" &&
                lastMessage.content[0].type === "text"
              ) {
                lastMessage.content[0].text += delta.delta.content[0].text;
              }
              return updated;
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
  };
}
```

These examples demonstrate the versatility and power of the Burnside LLM Bridge Library across different use cases and platforms. Each example can be adapted and extended based on your specific requirements.

---

# File: docs/getting-started.md

# Getting Started with Burnside

This guide will walk you through setting up and using the Burnside LLM Bridge Library in your application.

## Installation

Install the library using npm:

```bash
npm install @langadventurellc/burnside
```

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **TypeScript**: Version 5.8+ (recommended)
- **API Keys**: At least one LLM provider API key

## Basic Setup

### 1. Environment Variables

Create a `.env` file in your project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_AI_API_KEY=...

# xAI
xAI_API_KEY=...
```

### 2. Create Your First Client

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" }, // Named configuration
    },
  },
  modelSeed: "builtin", // Required to populate model registry
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

// Register provider plugins
client.registerProvider(new OpenAIResponsesV1Provider());
```

### 3. Make Your First Request

```typescript
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Hello, world!" }],
    },
  ],
  model: "openai:gpt-4o-2024-08-06", // Use actual model from registry
  providerConfig: "default", // Required: specify which provider configuration to use
});

console.log(response.content[0].text);
```

## Configuration Options

### Provider Configurations

Each provider must have **named configurations**. You can have multiple configurations per provider (e.g., for different API keys, base URLs, or environments):

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
      backup: { apiKey: "${OPENAI_BACKUP_KEY}" },
    },
    anthropic: {
      production: { apiKey: "${ANTHROPIC_API_KEY}" },
      development: { apiKey: "${ANTHROPIC_DEV_KEY}" },
    },
  },
  modelSeed: "builtin",
  tools: { enabled: true },
});
```

**Important**: When making chat/stream requests, you must specify which configuration to use:

```typescript
// Use the "default" OpenAI configuration
const response1 = await client.chat({
  messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
  model: "openai:gpt-4o-2024-08-06",
  providerConfig: "default", // Required
});

// Use the "production" Anthropic configuration
const response2 = await client.chat({
  messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
  model: "anthropic:claude-3-5-haiku-latest",
  providerConfig: "production", // Required
});
```

### Multiple Providers

```typescript
import {
  OpenAIResponsesV1Provider,
  AnthropicMessagesV1Provider,
  GoogleGeminiV1Provider,
  XaiV1Provider,
} from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
    anthropic: {
      default: { apiKey: "${ANTHROPIC_API_KEY}" },
    },
    google: {
      default: { apiKey: "${GOOGLE_AI_API_KEY}" },
    },
    xai: {
      default: { apiKey: "${XAI_API_KEY}" },
    },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

// Register all provider plugins
client.registerProvider(new OpenAIResponsesV1Provider());
client.registerProvider(new AnthropicMessagesV1Provider());
client.registerProvider(new GoogleGeminiV1Provider());
client.registerProvider(new XaiV1Provider());
```

### Timeout Configuration

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
  },
  timeout: 30000, // 30 seconds
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});
```

### Rate Limiting (Global Policy)

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    maxRps: 10,
    burst: 20,
    scope: "provider",
  },
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});
```

## Platform-Specific Setup

### Node.js

Standard setup works out of the box:

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: { apiKey: process.env.OPENAI_API_KEY },
    },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Electron Main Process

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// In main process - same configuration as Node.js
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: process.env.OPENAI_API_KEY },
    },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Electron Renderer Process

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// In renderer process
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "..." }, // Pass from main process
    },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### React Native

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "..." },
    },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

**Note**: React Native requires the `react-native-sse` peer dependency for streaming:

```bash
npm install react-native-sse
```

## Message Format

Burnside uses a unified message format across all providers:

```typescript
interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: ContentPart[];
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// ContentPart supports: text, image, document, and code
type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string; alt?: string }
  | { type: "document"; data: string; mimeType: string; name?: string }
  | { type: "code"; text: string; language?: string; filename?: string };
```

### Text Messages

```typescript
const textMessage = {
  role: "user" as const,
  content: [{ type: "text", text: "Hello!" }],
};
```

### Multimodal Messages

```typescript
const multimodalMessage = {
  role: "user" as const,
  content: [
    { type: "text", text: "What's in this image?" },
    {
      type: "image",
      data: "/9j/4AAQSkZJRgAB...", // Base64 data
      mimeType: "image/jpeg",
      alt: "Description of image",
    },
  ],
};
```

## Model Selection

### Available Models

Models are referenced using the format `provider:model-id`:

```typescript
// OpenAI models
"openai:gpt-4o-2024-08-06";
"openai:gpt-5-nano-2025-08-07";
"openai:o1-2024-12-17";

// Anthropic models
"anthropic:claude-3-5-haiku-latest";
"anthropic:claude-sonnet-4-20250514";

// Google models
"google:gemini-2.0-flash";
"google:gemini-2.5-pro";

// xAI models
"xai:grok-3";
"xai:grok-4-0709";
```

### Model Capabilities

Check model capabilities programmatically:

```typescript
const modelRegistry = client.getModelRegistry();
const model = modelRegistry.get("openai:gpt-4o-2024-08-06");

if (model?.capabilities?.toolCalls) {
  console.log("Model supports tool calling");
}

if (model?.capabilities?.streaming) {
  console.log("Model supports streaming");
}
```

## Error Handling

Burnside provides comprehensive error handling:

```typescript
import { BridgeError } from "@langadventurellc/burnside";

try {
  const response = await client.chat({
    messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
    model: "openai:gpt-4o-2024-08-06",
    providerConfig: "default",
  });
} catch (error) {
  if (error instanceof BridgeError) {
    console.error("Bridge Error:", error.message);
    console.error("Error Code:", error.code);
    console.error("Provider:", error.context?.provider);
  } else {
    console.error("Unknown Error:", error);
  }
}
```

## Logging

Configure logging for debugging:

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
  },
  logging: {
    level: "debug",
    destination: "console",
  },
});
```

## Next Steps

Now that you have basic setup working:

1. [Explore the API Reference](./api-reference.md) for detailed method documentation
2. [Learn about providers](./providers.md) and their specific capabilities
3. [Set up tool integration](./tools-and-mcp.md) for enhanced functionality
4. [Check out examples](./examples.md) for common use cases
5. [Review error handling](./error-handling.md) for production deployment

## Troubleshooting

### Common Issues

**Invalid API Key**

```
Error: Authentication failed for provider 'openai'
```

- Verify your API key is correct
- Check environment variable is properly loaded
- Ensure API key has sufficient permissions

**Model Not Found**

```
Error: Model 'openai:invalid-model' not found
```

- Check the model ID format: `provider:model-id`
- Verify the model exists and is available
- Check if your API key has access to the model

**Rate Limit Exceeded**

```
Error: Rate limit exceeded for provider 'openai'
```

- Implement rate limiting in your client configuration
- Add retry logic with exponential backoff
- Consider upgrading your API plan

For more detailed troubleshooting, see the [Error Handling Guide](./error-handling.md).

---

# File: docs/index.md

# Burnside LLM Bridge Library

A TypeScript LLM provider adapter that provides a unified interface to multiple LLM providers (OpenAI, Anthropic, Google, xAI) with comprehensive Model Context Protocol (MCP) support. Designed for Desktop (Electron Main/Renderer), Mobile (React Native), and API (Node.js) platforms.

## Features

- **Unified Interface**: Single API for all major LLM providers
- **Multi-Platform**: Supports Node.js, Electron, and React Native
- **MCP Integration**: Full Model Context Protocol support for external tools
- **Type Safety**: Comprehensive runtime validation with Zod schemas
- **Streaming**: Support for both streaming and non-streaming responses
- **Tool Calling**: Built-in tool execution with sequential/parallel strategies
- **Multi-Turn Conversations**: Agent-like multi-turn conversations with configurable termination
- **Error Handling**: Provider-agnostic error normalization and retry logic
- **Rate Limiting**: Built-in rate limiting and request throttling

## Quick Start

### Installation

```bash
npm install @langadventurellc/burnside
```

### Basic Usage

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Create client with proper model seeding and provider registration
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "sk-..." },
    },
    anthropic: {
      default: { apiKey: "sk-ant-..." },
    },
  },
  modelSeed: "builtin", // Required to populate model registry
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

// Register provider plugins
client.registerProvider(new OpenAIResponsesV1Provider());

// Simple chat completion
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Hello, world!" }],
    },
  ],
  model: "openai:gpt-4o-2024-08-06", // Use actual model from registry
  providerConfig: "default", // Required: specify which provider configuration to use
});

console.log(response.content[0].text);
```

### Streaming Example

```typescript
// Streaming responses
for await (const delta of await client.stream({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Tell me a story" }],
    },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  providerConfig: "default", // Required: specify which provider configuration to use
})) {
  process.stdout.write(delta.delta.content?.[0]?.text || "");
}
```

## Supported Providers

| Provider      | Models (see `src/data/defaultLlmModels.ts`)                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI**    | GPT-4o 2024-08-06, GPT-4.1 2025-04-14, GPT-5 2025-08-07, O1 2024-12-17, O3 2025-04-16, O4 Mini 2025-04-16                    |
| **Anthropic** | Claude 3 Haiku 20240307, Claude 3.5 Haiku Latest, Claude Sonnet 4 20250514, Claude Opus 4 20250514, Claude Opus 4.1 20250805 |
| **Google**    | Gemini 2.0 Flash, Gemini 2.0 Flash Lite, Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro                             |
| **xAI**       | Grok 3, Grok 3 Mini, Grok 4 0709                                                                                             |

## Documentation

- [Getting Started](./getting-started.md) - Detailed setup and configuration
- [API Reference](./api-reference.md) - Complete API documentation
- [Providers](./providers.md) - Provider-specific configurations and capabilities
- [Tools & MCP](./tools-and-mcp.md) - Tool integration and MCP server setup
- [Examples](./examples.md) - Comprehensive usage examples
- [Error Handling](./error-handling.md) - Troubleshooting and error recovery

## Environment Variables

The library supports environment variable substitution in configuration:

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
    anthropic: {
      default: { apiKey: "${ANTHROPIC_API_KEY}" },
    },
  },
  modelSeed: "builtin",
});
```

## TypeScript Support

Burnside is built with TypeScript-first design and includes comprehensive type definitions:

```typescript
import type {
  BridgeClient,
  ChatRequest,
  StreamDelta,
  Message,
} from "@langadventurellc/burnside";
```

## Platform Support

- **Node.js**: Full feature support including MCP STDIO servers
- **Electron**: Main and renderer process support
- **React Native**: Mobile-optimized with SSE streaming
- **Browser**: Limited support (no MCP STDIO)

## License

GPL-3.0-only

## Contributing

This project follows strict coding standards:

- ≤ 400 logical LOC per file
- No `any` types
- Comprehensive test coverage
- Breaking changes preferred over backwards compatibility

## Support

For issues and questions, please visit our [GitHub repository](https://github.com/langadventurellc/burnside).

---

# File: docs/providers.md

# Provider Guide

This guide covers provider-specific configurations, capabilities, and best practices for each supported LLM provider.

## Table of Contents

- [OpenAI](#openai)
- [Anthropic](#anthropic)
- [Google](#google)
- [xAI](#xai)
- [Provider Comparison](#provider-comparison)
- [Provider Configuration](#provider-configuration)
- [Model Selection](#model-selection)

## OpenAI

### Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: {
      default: {
        apiKey: "${OPENAI_API_KEY}",
        baseUrl: "https://api.openai.com/v1", // Optional
      },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 60,
    burst: 120,
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Available Models

| Model ID                  | Name         |
| ------------------------- | ------------ |
| `gpt-5-nano-2025-08-07`   | GPT-5 Nano   |
| `gpt-4o-2024-08-06`       | GPT-4o       |
| `gpt-4.1-nano-2025-04-14` | GPT-4.1 Nano |
| `gpt-5-mini-2025-08-07`   | GPT-5 Mini   |
| `gpt-4.1-mini-2025-04-14` | GPT-4.1 Mini |
| `o4-mini-2025-04-16`      | O4 Mini      |
| `gpt-5-2025-08-07`        | GPT-5        |
| `gpt-4.1-2025-04-14`      | GPT-4.1      |
| `o3-2025-04-16`           | o3           |
| `o1-2024-12-17`           | o1           |

### Features

**Multimodal Support:**

- Images (JPEG, PNG, WebP, GIF)
- Documents (PDF, text files)
- Audio (some models like GPT-4o)

**Example Usage:**

```typescript
// Image analysis
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image",
          source: "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
          mimeType: "image/jpeg",
        },
      ],
    },
  ],
  model: "openai:gpt-4o-2024-08-06",
});
```

### Best Practices

- Use `gpt-4.1-mini` for most tasks (good performance/cost ratio)
- Use `o3` or `o4-mini` for complex reasoning tasks
- Enable temperature only on models that support it
- Use streaming for better user experience when available

## Anthropic

### Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { AnthropicMessagesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    anthropic: {
      default: {
        apiKey: "${ANTHROPIC_API_KEY}",
        baseUrl: "https://api.anthropic.com", // Optional
      },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 40,
    burst: 80,
  },
});

client.registerProvider(new AnthropicMessagesV1Provider());
```

### Available Models

| Model ID                   | Name             |
| -------------------------- | ---------------- |
| `claude-3-haiku-20240307`  | Claude 3 Haiku   |
| `claude-3-5-haiku-latest`  | Claude 3.5 Haiku |
| `claude-sonnet-4-20250514` | Claude Sonnet 4  |
| `claude-opus-4-20250514`   | Claude Opus 4    |
| `claude-opus-4-1-20250805` | Claude Opus 4.1  |

### Features

**Prompt Caching:**
Anthropic models support prompt caching to reduce costs for repeated prompts:

```typescript
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this document...",
          metadata: { cache: true }, // Enable caching for this content
        },
      ],
    },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  providerConfig: "default",
});
```

**Multimodal Support:**

- Images (JPEG, PNG, WebP, GIF)
- Documents (PDF, text files)
- Full context understanding across modalities

**Example Usage:**

```typescript
// Document analysis with caching
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please analyze this long document and answer questions about it.",
          metadata: { cache: true },
        },
        {
          type: "document",
          source: "data:application/pdf;base64,JVBERi0xLjQ...",
          mimeType: "application/pdf",
        },
        { type: "text", text: "What are the main conclusions?" },
      ],
    },
  ],
  model: "anthropic:claude-opus-4-20250514",
  providerConfig: "default",
});
```

### Best Practices

- Use prompt caching for repeated long contexts
- Use Haiku for simple tasks, Sonnet for balanced needs, Opus for complex reasoning
- All models support the same feature set consistently
- Leverage strong instruction following capabilities

## Google

### Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { GoogleGeminiV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    google: {
      default: {
        apiKey: "${GOOGLE_AI_API_KEY}",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta", // Optional
      },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 80,
    burst: 160,
  },
});

client.registerProvider(new GoogleGeminiV1Provider());
```

### Available Models

| Model ID                | Name                  |
| ----------------------- | --------------------- |
| `gemini-2.0-flash-lite` | Gemini 2.0 Flash Lite |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite |
| `gemini-2.0-flash`      | Gemini 2.0 Flash      |
| `gemini-2.5-flash`      | Gemini 2.5 Flash      |
| `gemini-2.5-pro`        | Gemini 2.5 Pro        |

### Features

**Thinking Capability:**
Newer models (2.5 series) support "thinking" mode for complex reasoning:

```typescript
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Solve this complex math problem step by step...",
        },
      ],
    },
  ],
  model: "google:gemini-2.5-pro",
  providerConfig: "default",
  metadata: { thinking: true },
});
```

**Advanced Multimodal:**

- Images, documents, video, audio
- Large context window (1M tokens)
- Native video understanding

**Example Usage:**

```typescript
// Video analysis
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe what happens in this video" },
        {
          type: "video",
          source: "gs://my-bucket/video.mp4", // Google Cloud Storage URL
          mimeType: "video/mp4",
        },
      ],
    },
  ],
  model: "google:gemini-2.0-flash",
  providerConfig: "default",
});
```

### Best Practices

- Use Flash models for most tasks (good speed/performance)
- Use Pro for complex reasoning requiring thinking capability
- Leverage 1M context window for large document processing
- Video analysis is a unique strength

## xAI

### Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { XaiV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    xai: {
      default: {
        apiKey: "${XAI_API_KEY}",
        baseUrl: "https://api.x.ai/v1", // Optional
      },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 100,
    burst: 200,
  },
});

client.registerProvider(new XaiV1Provider());
```

### Available Models

| Model ID      | Name        |
| ------------- | ----------- |
| `grok-3-mini` | Grok 3 Mini |
| `grok-3`      | Grok 3      |
| `grok-4-0709` | Grok 4      |

### Features

**Consistent Feature Set:**
All xAI models support the same features:

- Streaming responses
- Tool calling
- Multimodal input (text, images, documents)

**Example Usage:**

```typescript
// Standard usage
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Explain quantum computing" }],
    },
  ],
  model: "xai:grok-4-0709",
  providerConfig: "default",
});
```

### Best Practices

- Use `grok-3-mini` for simple tasks
- Use `grok-4-0709` for complex reasoning
- All models have consistent behavior and capabilities

## Provider Comparison

| Feature          | OpenAI      | Anthropic   | Google     | xAI         |
| ---------------- | ----------- | ----------- | ---------- | ----------- |
| **Max Context**  | 1M tokens   | 200K tokens | 1M tokens  | 256K tokens |
| **Streaming**    | Most models | All models  | All models | All models  |
| **Tool Calling** | Most models | All models  | All models | All models  |
| **Images**       | ✅          | ✅          | ✅         | ✅          |
| **Documents**    | ✅          | ✅          | ✅         | ✅          |
| **Audio**        | Some models | ✅          | ✅         | ✅          |
| **Video**        | ❌          | ❌          | ✅         | ❌          |
| **Caching**      | ❌          | ✅          | ❌         | ❌          |
| **Thinking**     | ❌          | ❌          | 2.5 models | ❌          |
| **Temperature**  | Most models | ✅          | ✅         | ✅          |

## Provider Configuration

All providers use **named configurations** that allow multiple configurations per provider. This is **required** - you cannot configure providers with a single configuration object anymore.

### Basic Configuration Structure

```typescript
const client = createClient({
  providers: {
    [providerName]: {
      [configName]: {
        /* provider config */
      },
      [configName2]: {
        /* another config */
      },
    },
  },
  modelSeed: "builtin",
});
```

### Multiple Configurations Per Provider

You can define multiple configurations for each provider (useful for different environments, API keys, or settings):

```typescript
const client = createClient({
  providers: {
    openai: {
      production: { apiKey: "${OPENAI_PROD_KEY}" },
      development: { apiKey: "${OPENAI_DEV_KEY}" },
      backup: {
        apiKey: "${OPENAI_BACKUP_KEY}",
        baseUrl: "https://backup-api.example.com/v1",
      },
    },
    anthropic: {
      main: { apiKey: "${ANTHROPIC_KEY}" },
      testing: {
        apiKey: "${ANTHROPIC_TEST_KEY}",
        baseUrl: "https://testing.anthropic.com",
      },
    },
  },
  modelSeed: "builtin",
});

// When making requests, specify which configuration to use
const response = await client.chat({
  messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
  model: "openai:gpt-4o-2024-08-06",
  providerConfig: "production", // Uses the "production" OpenAI config
});

const response2 = await client.chat({
  messages: [
    { role: "user", content: [{ type: "text", text: "Test message" }] },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  providerConfig: "testing", // Uses the "testing" Anthropic config
});
```

**Important**: The `providerConfig` parameter is **required** for all chat() and stream() requests. There are no default configurations - you must explicitly specify which one to use.

### Rate Limiting

Configure rate limits based on your API plan:

```typescript
const client = createClient({
  providers: {
    openai: {
      default: { apiKey: "${OPENAI_API_KEY}" },
    },
    anthropic: {
      default: { apiKey: "${ANTHROPIC_API_KEY}" },
    },
  },
  modelSeed: "builtin",
  rateLimitPolicy: {
    enabled: true,
    scope: "provider:model",
    maxRps: 20,
    burst: 40,
  },
});
```

Each provider can have a different quota. Configure the shared policy using the most restrictive values for the providers registered on a client instance, or instantiate multiple clients when you need distinct throttling.

### Custom Base URLs

For enterprise or proxy setups:

```typescript
const client = createClient({
  providers: {
    openai: {
      default: {
        apiKey: "${OPENAI_API_KEY}",
        baseUrl: "https://your-enterprise-proxy.com/openai/v1",
      },
    },
    anthropic: {
      default: {
        apiKey: "${ANTHROPIC_API_KEY}",
        baseUrl: "https://your-enterprise-proxy.com/anthropic",
      },
    },
  },
  modelSeed: "builtin",
});
```

### Timeouts and Retries

```typescript
const client = createClient({
  providers: {
    openai: {
      default: {
        apiKey: "${OPENAI_API_KEY}",
        timeout: 30000, // Provider-specific timeout override
      },
    },
  },
  modelSeed: "builtin",
  timeout: 60000, // Global timeout fallback
  retryPolicy: {
    attempts: 3,
    backoff: "exponential",
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitter: true,
  },
});
```

## Model Selection

### By Use Case

**Quick Responses:**

- OpenAI: `gpt-4.1-mini-2025-04-14`
- Anthropic: `claude-3-5-haiku-latest`
- Google: `gemini-2.0-flash-lite`
- xAI: `grok-3-mini`

**Balanced Performance:**

- OpenAI: `gpt-4.1-2025-04-14`
- Anthropic: `claude-sonnet-4-20250514`
- Google: `gemini-2.5-flash`
- xAI: `grok-3`

**Maximum Capability:**

- OpenAI: `o3-2025-04-16`
- Anthropic: `claude-opus-4-1-20250805`
- Google: `gemini-2.5-pro`
- xAI: `grok-4-0709`

**Large Context:**

- OpenAI: `gpt-4.1-*` models (1M tokens)
- Google: All models (1M tokens)
- Anthropic: All models (200K tokens)
- xAI: All models (130K-256K tokens)

### Programmatic Selection

```typescript
// Query models by capability
const modelRegistry = client.getModelRegistry();
const streamingModels = modelRegistry.query({
  capabilities: { streaming: true },
});

const toolModels = modelRegistry.query({
  capabilities: { toolCalls: true, streaming: true },
});

// Select best model for task
function selectModel(task: "quick" | "balanced" | "complex"): string {
  switch (task) {
    case "quick":
      return "anthropic:claude-3-5-haiku-latest";
    case "balanced":
      return "openai:gpt-4.1-mini-2025-04-14";
    case "complex":
      return "google:gemini-2.5-pro";
    default:
      return "openai:gpt-4.1-mini-2025-04-14";
  }
}
```

---

# File: docs/tools-and-mcp.md

# Tools and MCP Integration

This guide covers tool integration, custom tool development, and Model Context Protocol (MCP) server setup for extending LLM capabilities.

## Table of Contents

- [Tool System Overview](#tool-system-overview)
- [Custom Tool Development](#custom-tool-development)
- [Tool Execution Strategies](#tool-execution-strategies)
- [MCP Integration](#mcp-integration)
- [MCP Server Configuration](#mcp-server-configuration)
- [Built-in Tools](#built-in-tools)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Tool System Overview

Burnside provides a unified tool system that allows LLMs to execute functions and interact with external services. Tools can be:

1. **Custom Tools**: Functions you define and register
2. **MCP Tools**: External tools provided by MCP servers
3. **Built-in Tools**: Utility tools included with the library

### Tool Architecture

```
LLM Request → Tool Router → Tool Registry → Tool Handler → Result
                    ↓
                MCP Client → MCP Server → Tool Execution
```

## Custom Tool Development

### Basic Tool Registration

```typescript
import { createClient } from "@langadventurellc/burnside";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
  },
});

// Register a calculator tool
client.registerTool(
  {
    name: "calculator",
    description: "Perform basic arithmetic operations",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "The arithmetic operation to perform",
        },
        a: {
          type: "number",
          description: "First number",
        },
        b: {
          type: "number",
          description: "Second number",
        },
      },
      required: ["operation", "a", "b"],
    },
  },
  async (params) => {
    const { operation, a, b } = params;

    switch (operation) {
      case "add":
        return { result: a + b };
      case "subtract":
        return { result: a - b };
      case "multiply":
        return { result: a * b };
      case "divide":
        if (b === 0) throw new Error("Division by zero");
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
);
```

### Advanced Tool with Context

```typescript
// Tool with execution context and metadata
client.registerTool(
  {
    name: "file_reader",
    description: "Read content from a file",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read",
        },
        encoding: {
          type: "string",
          enum: ["utf8", "base64"],
          default: "utf8",
          description: "File encoding",
        },
      },
      required: ["path"],
    },
    metadata: {
      category: "filesystem",
      permissions: ["read"],
    },
  },
  async (params, context) => {
    const { path, encoding = "utf8" } = params;

    // Access execution context
    console.log("Tool called by:", context?.messageId);
    console.log("Execution ID:", context?.executionId);

    try {
      const fs = await import("fs/promises");
      const content = await fs.readFile(path, encoding);

      return {
        content,
        size: content.length,
        path,
        encoding,
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  },
);
```

### Async Tool with External API

```typescript
// Tool that calls external APIs
client.registerTool(
  {
    name: "weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or coordinates",
        },
        units: {
          type: "string",
          enum: ["metric", "imperial"],
          default: "metric",
        },
      },
      required: ["location"],
    },
  },
  async (params) => {
    const { location, units = "metric" } = params;
    const apiKey = process.env.WEATHER_API_KEY;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      units,
    };
  },
);
```

### Using Tools in Conversations

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

// Create client with tools enabled
const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true, // Must be enabled for tool execution
    builtinTools: ["echo"],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());

// Register tools first, then use in chat
const calculatorTool = {
  name: "calculator",
  description: "Perform arithmetic",
  parameters: {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["add", "multiply"] },
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["operation", "a", "b"],
  },
};

client.registerTool(calculatorTool, async (params) => {
  const { operation, a, b } = params;
  switch (operation) {
    case "add":
      return { result: a + b };
    case "multiply":
      return { result: a * b };
    default:
      throw new Error("Unknown operation");
  }
});

// Chat with tools array (not boolean)
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's 15 + 27 and then multiply by 3?" },
      ],
    },
  ],
  model: "openai:gpt-4o-2024-08-06",
  tools: [calculatorTool], // Pass tool definitions
});

console.log(response.content[0].text);
```

## Tool Execution Strategies

### Sequential Execution

Tools are executed one after another (default):

```typescript
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Get weather for NYC and LA" }],
    },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  tools: true,
  multiTurn: {
    toolExecutionStrategy: "sequential", // Execute tools one by one
  },
});
```

### Parallel Execution

Independent tools are executed concurrently:

```typescript
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Get weather for NYC and LA" }],
    },
  ],
  model: "anthropic:claude-3-5-haiku-latest",
  tools: true,
  multiTurn: {
    toolExecutionStrategy: "parallel", // Execute independent tools concurrently
  },
});
```

## MCP Integration

Model Context Protocol (MCP) allows LLMs to connect to external servers that provide tools, resources, and prompts.

### MCP Server Types

**STDIO Servers**: Local processes communicating via stdin/stdout
**HTTP Servers**: Remote servers accessible via HTTP

### Basic MCP Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { OpenAIResponsesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
    mcpServers: [
      // MCP servers go under tools config
      {
        name: "web-search",
        url: "http://localhost:3001",
      },
    ],
  },
});

client.registerProvider(new OpenAIResponsesV1Provider());
```

### Advanced MCP Configuration

```typescript
import { createClient } from "@langadventurellc/burnside";
import { AnthropicMessagesV1Provider } from "@langadventurellc/burnside/providers";

const client = createClient({
  providers: {
    anthropic: { apiKey: "${ANTHROPIC_API_KEY}" },
  },
  modelSeed: "builtin",
  tools: {
    enabled: true,
    builtinTools: ["echo"],
    mcpServers: [
      {
        name: "database",
        url: "https://internal.company.com/mcp",
      },
      {
        name: "web-api",
        url: "https://api.example.com/mcp",
      },
    ],
  },
});

client.registerProvider(new AnthropicMessagesV1Provider());
```

## MCP Server Configuration

### STDIO Server Setup

For local MCP servers that communicate via stdin/stdout:

```typescript
{
  name: "local-tools",
  command: "/usr/local/bin/my-mcp-server",
  args: ["--config", "production.json", "--verbose"],
  environment: {
    LOG_LEVEL: "info",
    DATA_DIR: "/var/lib/mcp-data"
  },
  timeout: 30000,
  retries: 2
}
```

### HTTP Server Setup

For remote MCP servers accessible via HTTP:

```typescript
{
  name: "remote-api",
  url: "https://api.example.com/mcp",
  timeout: 15000,
  retries: 3
}
```

### Platform-Specific Considerations

**Node.js**: Full MCP support including STDIO servers

```typescript
// Works in Node.js
mcpServers: [
  {
    name: "filesystem",
    command: "mcp-server-filesystem",
    args: ["--root", process.cwd()],
  },
];
```

**Electron Main Process**: Full MCP support

```typescript
// Works in Electron main process
mcpServers: [
  {
    name: "system-tools",
    command: "/Applications/MCPTools.app/Contents/MacOS/server",
  },
];
```

**Electron Renderer Process**: HTTP servers only

```typescript
// Only HTTP servers work in renderer process
mcpServers: [
  {
    name: "web-api",
    url: "http://localhost:3001",
  },
];
```

**React Native**: HTTP servers only

```typescript
// Only HTTP servers work in React Native
mcpServers: [
  {
    name: "mobile-api",
    url: "https://api.example.com/mcp",
  },
];
```

### MCP Tool Usage

Once configured, MCP tools are automatically registered and available:

```typescript
// MCP tools are prefixed with "mcp_"
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "List files in the current directory" }],
    },
  ],
  model: "openai:gpt-4o-2024-08-06",
  tools: true,
});

// The LLM can now use tools like:
// - mcp_filesystem_list_directory
// - mcp_filesystem_read_file
// - mcp_web_search_query
```

### Monitoring MCP Connections

```typescript
// Check MCP server status
const toolRouter = client.getToolRouter();
if (toolRouter) {
  const tools = toolRouter.getRegisteredTools();
  const mcpTools = tools.filter((tool) => tool.name.startsWith("mcp_"));

  console.log(`${mcpTools.length} MCP tools available`);
  mcpTools.forEach((tool) => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
}
```

## Built-in Tools

### Echo Tool

A simple debugging tool for testing:

```typescript
// Echo tool is available by default
const response = await client.chat({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Echo back: Hello World" }],
    },
  ],
  model: "openai:gpt-4o-2024-08-06",
  tools: true,
});
```

### Tool Registry Inspection

```typescript
// List all available tools
const toolRouter = client.getToolRouter();
if (toolRouter) {
  const tools = toolRouter.getRegisteredTools();

  console.log("Available tools:");
  tools.forEach((tool) => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
}
```

## Best Practices

### Tool Design

1. **Clear Descriptions**: Provide detailed descriptions for tools and parameters
2. **Input Validation**: Validate all input parameters
3. **Error Handling**: Provide clear error messages
4. **Async Support**: Use async functions for I/O operations
5. **Metadata**: Include helpful metadata for categorization

```typescript
// Good tool design example
client.registerTool(
  {
    name: "send_email",
    description:
      "Send an email to one or more recipients with optional attachments",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "array",
          items: { type: "string", format: "email" },
          description: "Email addresses of recipients",
        },
        subject: {
          type: "string",
          maxLength: 200,
          description: "Email subject line",
        },
        body: {
          type: "string",
          description: "Email body content (supports HTML)",
        },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              content: { type: "string", format: "base64" },
            },
          },
          description: "Optional file attachments",
        },
      },
      required: ["to", "subject", "body"],
    },
    metadata: {
      category: "communication",
      permissions: ["email:send"],
      rateLimit: "10/minute",
    },
  },
  async (params, context) => {
    // Validate inputs
    if (!Array.isArray(params.to) || params.to.length === 0) {
      throw new Error("At least one recipient is required");
    }

    // Log for debugging
    console.log(`Sending email from tool execution ${context?.executionId}`);

    try {
      // Implementation...
      return { success: true, messageId: "msg_123" };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
);
```

### MCP Server Management

1. **Health Monitoring**: Monitor MCP server connections
2. **Error Recovery**: Handle disconnections gracefully
3. **Resource Cleanup**: Properly dispose of connections
4. **Security**: Validate MCP server configurations

```typescript
// Proper cleanup
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await client.dispose();
  process.exit(0);
});
```

### Security Considerations

1. **Input Sanitization**: Always validate and sanitize tool inputs
2. **Permission Checks**: Implement proper authorization
3. **Resource Limits**: Set timeouts and rate limits
4. **Audit Logging**: Log tool executions for security

```typescript
// Secure tool implementation
client.registerTool(
  {
    name: "execute_command",
    description: "Execute a system command (admin only)",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" },
        args: { type: "array", items: { type: "string" } },
      },
      required: ["command"],
    },
  },
  async (params, context) => {
    // Security checks
    if (!context?.permissions?.includes("admin")) {
      throw new Error("Insufficient permissions");
    }

    // Input validation
    const allowedCommands = ["ls", "cat", "grep", "find"];
    if (!allowedCommands.includes(params.command)) {
      throw new Error("Command not allowed");
    }

    // Audit logging
    console.log(
      `Admin command executed: ${params.command} by ${context?.userId}`,
    );

    // Implementation...
  },
);
```

## Troubleshooting

### MCP Connection Issues

**Server Not Starting**

```
Error: Failed to start MCP server 'filesystem'
```

- Check command path and arguments
- Verify executable permissions
- Check environment variables

**Server Disconnection**

```
Error: MCP server 'web-search' disconnected unexpectedly
```

- Check server logs
- Verify network connectivity (for HTTP servers)
- Review server configuration

**Tool Registration Failures**

```
Error: Failed to register tools from MCP server
```

- Check server capabilities negotiation
- Verify tools-only scope compliance
- Review server tool definitions

### Tool Execution Issues

**Tool Not Found**

```
Error: Tool 'calculator' not found
```

- Verify tool registration
- Check tool router initialization
- Confirm tool name spelling

**Parameter Validation Errors**

```
Error: Invalid parameters for tool 'weather'
```

- Review parameter schema
- Check required fields
- Validate parameter types

**Execution Timeouts**

```
Error: Tool execution timed out after 30000ms
```

- Increase timeout configuration
- Optimize tool implementation
- Check external service availability

### Debugging Tools

```typescript
// Enable debug logging
const client = createClient({
  providers: {
    /* ... */
  },
  logging: {
    level: "debug",
    destination: "console",
  },
});

// Inspect tool registry
const toolRouter = client.getToolRouter();
if (toolRouter) {
  console.log("Registered tools:", toolRouter.getRegisteredTools());
}

// Monitor tool executions
client.on("toolExecution", (event) => {
  console.log(`Tool ${event.toolName} executed in ${event.duration}ms`);
});
```

For more troubleshooting help, see the [Error Handling Guide](./error-handling.md).
