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
    openai: { apiKey: "${OPENAI_API_KEY}" },
  },
  defaultProvider: "openai",
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
});
```

### stream(request)

Execute a streaming chat completion.

```typescript
async stream(request: StreamRequest): Promise<AsyncIterable<StreamDelta>>
```

**Parameters:**

- `request.messages` - Array of conversation messages
- `request.model` - Model to use (format: `provider:model-id`)
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
})) {
  process.stdout.write(delta.delta.content?.[0]?.text || "");
}
```

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
  timestamp?: string;
  metadata?: Record<string, unknown>;
}
```

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

### ChatRequest

```typescript
interface ChatRequest {
  messages: Message[];
  model: string; // Format: "provider:model-id"
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
  providers?: Record<string, ProviderConfig>;
  defaultProvider?: string;
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
