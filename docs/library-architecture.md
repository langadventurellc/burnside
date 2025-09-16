# LLM Bridge Library — High‑Level Architecture

This document proposes a high‑level architecture for a TypeScript library that provides a unified bridge to multiple LLM provider HTTP APIs across Desktop (Electron), Mobile (React Native), and Web (Node.js) environments. It aligns with the requirements in `docs/API Bridge Library.md` and the project’s coding standards.

## Initial Model Support

See `docs/defaultLlmModels.json`.

## Goals and Principles

- Unified, provider‑agnostic API for chat, tools, and streaming.
- Extensible via plugins for provider versions and tools (no SDKs; HTTP only).
- Strong typing and schema validation (TypeScript + Zod) with no `any`.
- Platform‑agnostic core with thin runtime adapters for Node/Electron/RN.
- Configuration‑driven providers, models, and capabilities (no hard‑coding).
- Deterministic agent loop with safety limits and observable behavior.
- Backward compatibility across multiple provider API versions concurrently.

## System Overview

- Core domain defines shared types, configuration, orchestration, transport, streaming, and error taxonomy.
- Provider plugins implement versioned translators between the unified model and provider‑specific HTTP payloads and responses.
- Tool system supports built‑in tools, provider‑native tools, and MCP tools with translation and fallback.
- Runtime adapters abstract platform differences for HTTP, storage, and file access.
- Cross‑cutting concerns (validation, caching, rate limiting, retries, logging/metrics) are centralized and configurable.

```
App (Electron / RN / Node)
  │
  ▼
LLM Bridge (public API)
  ├── Core Domain (messages, tools, agent, streaming, config)
  ├── Provider Registry + Plugins (openai-responses-v1, anthropic-2023-06-01, ...)
  ├── Tool Router (native ↔ built‑in ↔ MCP)
  ├── Transport (HTTP, streaming) + Policies (retry, rate, cache)
  └── Runtime Adapters (platform I/O, storage, timers)
```

## Proposed Module Layout

```
src/
  index.ts                     # Public API surface
  core/
    config/                    # Zod schemas, config loader/merger
    messages/                  # Unified message & content model + translation primitives
    tools/                     # Tool model, router, execution contracts
    agent/                     # Agent loop orchestrator + policies (limits, budgets)
    streaming/                 # Universal streaming interface + parsers/buffers
    transport/                 # HTTP client, interceptors, retry, rate limiting
    providers/                 # Provider base types, registry, capability model
    performance/               # Cache interfaces, token optimization utilities
    errors/                    # Error taxonomy + normalization
    observability/             # Logging, metrics, tracing hooks
    runtime/                   # Platform adapters (Node/Electron/RN)
  providers/
    openai-responses-v1/
      schema.ts                # Zod config for this provider version
      translator.ts            # Messages/tools → OpenAI payloads; responses → unified
      http.ts                  # Endpoints, headers, SSE parsing specifics
    anthropic-2023-06-01/
      ...
    google-gemini-v1/
      ...
    xai-grok-v1/
      ...
    ollama-v*/                 # (Out of scope for V1)
      ...
  tools/
    builtin/
      webSearch/
      fileOps/
    provider-native/
      openai/
      anthropic/
      google/
    mcp/
      client.ts                # MCP connection lifecycle + discovery
      adapters/                # Map MCP tool schemas ↔ unified tool schema
```

Constrain each module to a single domain concept and keep files ≤ 400 logical LOC.

## Key Domain Models (sketch)

```ts
// Message and content model
export type Role = "system" | "user" | "assistant" | "tool";

export interface SourceRef {
  uri: string;
  title?: string;
  snippet?: string;
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string; alt?: string }
  | { type: "document"; data: string; mimeType: string; name?: string }
  | { type: "code"; text: string; language?: string; filename?: string };

export interface Message {
  id?: string;
  role: Role;
  content: ContentPart[];
  sources?: SourceRef[]; // preserve citations and attributions
  toolCallId?: string; // associates tool messages
}

// Tool model (unified)
export interface ToolDefinition {
  name: string;
  description?: string;
  // JSON schema via Zod for inputs/outputs
  inputSchema: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
  // Hints for provider-native mapping (function name, parameters)
  hints?: Record<string, unknown>;
}

export interface ToolExecutionContext {
  // opaque context for execution (e.g., file access, network policies)
}

export type ToolHandler = (
  args: unknown,
  ctx: ToolExecutionContext,
) => Promise<unknown>;

// Provider capability + model info
export interface ModelCapabilities {
  toolCalls: boolean;
  streaming: boolean;
  images: boolean;
  documents: boolean;
  promptCaching?: boolean; // e.g., Anthropic cache points
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelInfo {
  id: string; // e.g., 'gpt-4o-mini'
  family?: string; // e.g., 'gpt-4o'
  capabilities: ModelCapabilities;
}

// Provider plugin contract (versioned)
export interface ProviderPlugin<PCfg extends z.ZodTypeAny> {
  id: string; // e.g., 'openai'
  version: string; // e.g., 'v1'
  configSchema: PCfg; // provider-specific config (baseUrl, apiKey, region, ...)
  supportsModel(modelId: string): boolean; // model-agnostic: typically returns true
  translateRequest(input: {
    messages: Message[];
    tools?: ToolDefinition[];
    model: string;
    stream: boolean;
    options?: Record<string, unknown>;
  }): ProviderHttpRequest;
  parseResponse(
    stream: boolean,
    res: ProviderHttpResponse,
  ): UnifiedResponse | AsyncIterable<UnifiedDelta>;
  isTerminal(deltaOrFinal: UnifiedDelta | UnifiedResponse): boolean; // termination detection
}

// Transport + streaming
export interface Transport {
  fetch(
    req: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<ProviderHttpResponse>;
  stream(
    req: ProviderHttpRequest,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<Uint8Array>>;
}

export interface Stream<T> {
  on(
    event: "delta" | "tool" | "error" | "done",
    handler: (v?: T) => void,
  ): void;
  cancel(): void;
}

// Agent loop
export interface AgentLimits {
  maxIterations: number;
  maxMillis?: number;
  tokenBudget?: number;
}
```

Note: Types above illustrate shape; production types will be complete and strictly typed with Zod validators at module boundaries.

## Public API Surface

- `createClient(config: BridgeConfig): BridgeClient`
  - Returns a configured `BridgeClient` bound to a provider version and model registry.
- `BridgeClient.chat({...})`
  - Send a single request, get a unified response.
- `BridgeClient.stream({...})`
  - Stream deltas and tool calls via a universal streaming interface.
- `BridgeClient.runAgent({...})`
  - Run the unified agent loop with safety limits and tool execution.
- `registerProvider(plugin: ProviderPlugin)` and `registerTool(tool: ToolDefinition, handler: ToolHandler)`
  - Dynamically extend at runtime when needed.

## Configuration and Registry

- `BridgeConfig` (Zod)
  - `providers`: array of provider entries `{ id, version, config }`. Multiple entries for the same provider with different versions are valid concurrently.
  - `models`: centralized model definitions with `providerPlugin` field specifying which provider implementation to use (e.g., "openai-responses-v1").
  - `tools`: built‑in, provider‑native enablement, and MCP endpoints.
  - `policies`: retry, timeout, rate limit, caching strategy, and token budgets.
- Provider Registry resolves `(providerId, version)` to a concrete plugin.
- Model Registry stores centralized model definitions and routes requests to appropriate provider plugins via `providerPlugin` field.
- Dynamic Provider Resolution: BridgeClient automatically selects the correct provider plugin based on the model's `providerPlugin` configuration.

Example (shape):

```ts
const BridgeConfig = z.object({
  providers: z.array(
    z.object({
      id: z.string(),
      version: z.string(),
      config: z.record(z.unknown()), // validated by provider.configSchema at runtime
    }),
  ),
  models: z.record(
    z.string(),
    z.object({
      providerPlugin: z.string().optional(), // e.g., "openai-responses-v1"
      capabilities: z.object({
        toolCalls: z.boolean(),
        streaming: z.boolean(),
        images: z.boolean(),
        documents: z.boolean(),
        promptCaching: z.boolean().optional(),
        maxInputTokens: z.number().optional(),
        maxOutputTokens: z.number().optional(),
      }),
    }),
  ),
  tools: z
    .object({
      builtin: z.array(z.string()).optional(),
      mcp: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
    })
    .optional(),
  policies: z
    .object({
      retry: z.object({ attempts: z.number(), backoff: z.string() }).optional(),
      timeoutMs: z.number().optional(),
      rateLimit: z
        .object({ maxRps: z.number(), burst: z.number().optional() })
        .optional(),
      caching: z
        .object({ enabled: z.boolean(), ttlSec: z.number().optional() })
        .optional(),
    })
    .optional(),
});
```

## Providers

- Each provider version lives in its own package folder under `src/providers/<provider>-<version>` and implements `ProviderPlugin`.
- Responsibilities:
  - Zod‑validated configuration and defaults (base URL, headers, auth strategy).
  - Request translation from unified messages/tools to provider payloads.
  - Streaming parse/normalize to unified deltas (text, tool calls, citations).
  - Termination detection per provider conventions.
  - Error normalization (HTTP status ↔ provider codes ↔ unified errors).
  - Model-agnostic operation: providers accept any model ID routed to them by the model registry.
- Model Selection: The `BridgeClient` uses the centralized model registry to route requests to appropriate provider plugins based on each model's `providerPlugin` field.
- Examples:
  - `openai-responses-v1`: function/tool calls, chunks via SSE or chunked transfer.
  - `anthropic-2023-06-01`: tools array, stop reasons, cache points.
  - `google-gemini-v1`: function declarations, grounding/citations mapping.
  - `ollama-v*`: local models, non‑SSE streaming, image embeddings. (out of scope for V1)

## Tool System and Routing

- Unified `ToolDefinition` backed by Zod schemas for inputs/outputs.
- Tool Router decides at runtime:
  1. Use provider‑native tool call if supported and enabled.
  2. Else, fall back to built‑in implementation (webSearch, fileOps) if allowed.
  3. Else, route to MCP tool if configured and reachable.
- Tool Response Normalization always returns a unified `ToolResult` structure regardless of execution path.
- Tool Definition Translation layer maps unified definitions to provider formats (OpenAI functions, Anthropic tools, Google function declarations) and back.

## Agent Loop Orchestrator

- Deterministic loop handling mixed content and tools across providers.
- Safety controls: `maxIterations`, timeouts, and token budgets enforced.
- Streaming interruption handling: when a tool call is emitted mid‑stream, pause stream, execute tool, append tool result message, then resume the next turn.
- Pluggable strategies for context length: trimming, summarization/compaction, and content chunking.
- State model stores conversation history, tool executions, and budget counters; pluggable persistence via `ConversationStore` interface.

## Streaming Abstraction

- `Stream<T>` interface provides consistent events: `delta`, `tool`, `error`, `done`.
- Buffer manager for partial JSON/chunks and robust recovery on malformed segments.
- Provider‑specific SSE/chunk parsing lives in each plugin; the core only handles framing and backpressure.
- Platform considerations: RN/Electron/Node differences are hidden by `Transport` and `RuntimeAdapter`.

## Transport, Policies, and Performance

- `Transport` wraps `fetch`/HTTP and exposes `fetch` + `stream`. It supports:
  - Interceptors (pre/post) for headers, auth, and logging.
  - Retries with backoff and circuit breakers.
  - Rate limiting and concurrency control.
  - Request/response redaction rules to avoid leaking secrets.
- Caching layers:
  - Response cache (hash of normalized request) when allowed by policy.
  - Prompt caching surfaces provider‑specific features (e.g., Anthropic cache points) via capability flags.
- Token optimization utilities for compacting messages and content formatting hints.

### Rate Limiting

- Default: off. When enabled without a store, enforce best‑effort in‑memory token buckets per client.
- Scope keys by `provider:version:model:keyHash[:endpoint]` so limits apply per credential and API surface.
- Respect provider 429s/`Retry‑After`; pacer backs off with jitter even if local counters lag.
- Config shape (illustrative): `{ enabled: true, rps: 2, burst: 4, scope: 'provider:version:model:keyHash', store: 'memory'}`.

### Caching

- Response caching (bridge‑managed):
  - Cache only final, idempotent responses. Streaming deltas are not cached.
  - Key by a normalized request hash (provider, version, model, messages, tool defs, params), excluding non‑deterministic inputs.
  - Defaults: disabled; if enabled, use TTL + LRU caps to bound memory.
  - Do not cache non‑deterministic requests (e.g., high temperature or tool‑calling turns) unless explicitly allowed by policy.
- Provider‑native prompt caching:
  - If a provider exposes prompt caching (e.g., Anthropic cache points), the plugin maps unified inputs to provider cache declarations and reuses provider‑issued cache IDs.
  - Reuse works within the current process/session.
  - Policy controls which segments are eligible and their lifetimes; capabilities flag (`promptCaching`) indicates support.

## Runtime Adapters (Platform)

- `RuntimeAdapter` abstracts platform concerns:
  - HTTP: use global `fetch` when available; allow injection for Node.
  - Storage: optional. Ephemeral in‑memory by default (everything else is out of scope). Conversation/message persistence is always application‑managed (the library stays stateless by default).
  - File access: gated; only enabled when the host app grants access.
  - Timers and AbortController consistency.
- Adapters for Node.js, Electron, and React Native ship as thin modules and are auto‑selected or injectable.

## Error Taxonomy and Observability

- Typed errors: `TransportError`, `AuthError`, `RateLimitError`, `TimeoutError`, `ValidationError`, `ProviderError`, `StreamingError`, `ToolError`.
- Error normalization maps provider codes/status to the unified taxonomy.
- Observability hooks:
  - Structured logs with redaction.
  - Metrics (request counts, latency, tokens, cache hit rate, tool usage).
  - Tracing (optional) via pluggable span interface.

## File and Content Handling

- Multi‑modal content via `ContentPart[]` with provider‑aware formatting hints.
- File type routing determines encoding and formatting (e.g., base64 images, code fences for code, XML tags when required by a provider).
- Metadata preservation for filenames, paths, and languages to improve model performance and references.
- Large content chunking aligned with model capabilities and context strategies.

## MCP Support

- Built-in tool discovery loads available tools into the Tool Router namespace.
- MCP Client manages connection lifecycle (connect/reconnect/disconnect) from config.
- MCP tools are configured via consuming application.
- Execution proxy maps calls/responses between MCP and unified tool model.

## Security and Secrets

- No hard‑coded secrets; all credentials flow through configuration.
- Redaction in logs/metrics by default.
- Optional encryption at rest for persisted conversation state or caches (host app responsibility; provide hooks).

## Testing Strategy

- Unit Tests (Jest): per module (translators, streaming parsers, agent loop state machine).
- Property Tests: Zod schemas and message/content round‑trip invariants.

## Extensibility Playbooks

- Add a provider version:
  1. Create `src/providers/<id>-<version>` with `schema.ts`, `translator.ts`, `models.ts`, `http.ts`.
  2. Implement `ProviderPlugin` and register with the Provider Registry.
  3. Add capability descriptors to the Model Registry (config‑driven).
- Add a tool:
  1. Define `ToolDefinition` with Zod schemas.
  2. Implement a handler; provide provider‑native mapping hints if applicable.
- Add a platform adapter:
  1. Implement `RuntimeAdapter` for HTTP, storage, and file gates.

## Public Usage (illustrative)

```ts
const client = createClient({
  providers: [
    {
      id: "openai",
      version: "v1",
      config: {
        apiKey: "env:OPENAI_API_KEY",
        baseUrl: "https://api.openai.com",
      },
    },
    {
      id: "anthropic",
      version: "2023-06-01",
      config: { apiKey: "env:ANTHROPIC_API_KEY" },
    },
  ],
  models: {
    "openai:gpt-4o-mini": {
      providerPlugin: "openai-responses-v1",
      capabilities: {
        toolCalls: true,
        streaming: true,
        images: true,
        documents: true,
      },
    },
    "anthropic:claude-3-5-sonnet": {
      providerPlugin: "anthropic-2023-06-01",
      capabilities: {
        toolCalls: true,
        streaming: true,
        images: true,
        documents: true,
        promptCaching: true,
      },
    },
  },
  policies: {
    retry: { attempts: 2, backoff: "exponential" },
    timeoutMs: 60000,
  },
});

const stream = client.stream({
  provider: { id: "anthropic", version: "2023-06-01" },
  model: "claude-3-5-sonnet",
  messages: [
    { role: "system", content: [{ type: "text", text: "Be concise." }] },
    {
      role: "user",
      content: [
        { type: "text", text: "Search latest TypeScript release notes." },
      ],
    },
  ],
  tools: [webSearchTool],
});

stream.on("delta", (d) => {
  /* render */
});
stream.on("tool", (t) => {
  /* execute tool or display */
});
stream.on("done", () => {
  /* finalize */
});
```

---

This architecture keeps provider specifics isolated, maximizes reuse in the core, and ensures a consistent, strongly‑typed developer experience across platforms while meeting the outlined functional and non‑functional requirements.
