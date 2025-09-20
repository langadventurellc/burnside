## LLM Bridge Library — Phased Implementation Plan

This plan turns the architecture in `docs/library-architecture.md` into an incremental, testable roadmap using vertical slices. Each phase delivers a working end‑to‑end path (chat → transport → provider → streaming → tests) before broadening capabilities. Defaults favor a stateless core with optional, opt‑in features.

### Guiding Principles

- Vertical slices first: ship a thin, working E2E path per provider/capability.
- Strong typing and validation: Zod at boundaries, no `any`.
- Stateless by default: persistence managed by consuming apps; optional in‑memory caches/rate limiting.
- HTTP/REST only: no provider SDKs.
- Tests and quality gates on every phase: `npm run quality`, `npm test`.

### Phase 0 — Repo Setup and Scaffolding

- Initialize base structure under `src/` as outlined in the architecture.
- Add shared types: error taxonomy, minimal message/content/tool type placeholders.
- Add `runtime` adapter interfaces (HTTP, timers) and a Node default adapter.
- Set up `transport` interface with fetch injection; no retries/caching yet.
- Wire CI hooks (lint, format, type‑check, tests).

Acceptance

- `npm run quality` passes; tests run with a trivial placeholder.

### Phase 1 — Core Domain and Public API Skeleton

- Define unified Zod schemas for `Message`, `ContentPart`, and `ToolDefinition` (no handler routing yet).
- Implement `createClient`, `BridgeClient.chat`, `BridgeClient.stream` signatures (no-op implementations behind feature flags).
- Add `ProviderRegistry` and `ModelRegistry` interfaces; no plugins yet.

Acceptance

- Type checks for the public API surface; unit tests for schema validation.

### Phase 2 — Transport and Streaming Foundations

- Implement `Transport.fetch` and streaming using injected `fetch` and SSE/chunk parsing helpers.
- Normalize errors to typed `TransportError`, `TimeoutError`, `RateLimitError`.
- Add request/response redaction hooks.

Acceptance

- Unit tests for SSE parsing and error mapping; simulated chunking tests.

### Phase 3 — Provider Plugin Framework

- Define `ProviderPlugin` interface (request translate/response parse/termination detection).
- Implement `ProviderRegistry` (register/resolve by `{id, version}`) with Zod‑validated provider configs.
- Implement centralized `ModelRegistry` with `providerPlugin` field for dynamic provider routing.
- Enhanced schema validation to include `providerPlugin` and capability fields.
- Dynamic provider resolution in `BridgeClient` based on model configuration.

Acceptance

- Contract tests for registry behavior and config validation.
- Model-to-provider routing via `providerPlugin` field implemented.
- Centralized model configuration eliminates hardcoded provider models.

### Phase 4 — Vertical Slice A: OpenAI v1 (Responses API), Chat + Streaming

- Implement `providers/openai-v1`:
  - Request translation for non‑tool chat and stream.
  - Streaming response parser to unified deltas.
  - Error normalization and termination detection.
- Wire into `BridgeClient.chat`/`stream` end‑to‑end.

Acceptance

- Contract tests with recorded fixtures for OpenAI chat and streaming.
- Example test proves E2E streaming deltas accumulate to final text.

### Phase 5 — Tool System Core + OpenAI Tool Calls

- Implement `ToolRouter` and `ToolHandler` contracts; add one built‑in test tool (e.g., echo) with Zod schemas.
- Map unified tool definitions to OpenAI function/tool format in translator.
- Add agent loop skeleton that executes a single tool call turn and resumes once.

Acceptance

- E2E test exercising: user → tool call → tool result → assistant response.

### Phase 6 — Vertical Slice B: Anthropic Messages API + Tools

- Implement `providers/anthropic-<apiDate>` plugin:
  - Support provider‑native tools, stop reasons, and streaming.
  - Surface capability `promptCaching: true` where applicable.
- Update agent loop to handle provider differences (termination signals).

Acceptance

- Contract tests for Anthropic streaming and tool calls; tool definition translation verified.

### Phase 7 — Vertical Slice C: Google (Gemini 2.x) + Citations

- Implement `providers/google-v1` plugin:
  - Function declarations mapping, grounding/citations preserved to `sources`.
  - Streaming semantics handled per Google response shape.

Acceptance

- Contract tests verifying function declarations and citation → `sources` mapping.

### Phase 8 — Vertical Slice D: xAI (Grok)

- Implement `providers/xai-v1` plugin with streaming and error normalization.

Acceptance

- Contract tests for Grok streaming and simple chat.

### Phase 9 — Agent Loop Robustness and Safety

- Complete agent loop: multi‑turn tool calls, max iterations/timeouts, cancellation.
- Context strategies: trimming and optional summarization/compaction.
- Token budget accounting surfaces via observability callbacks.

Acceptance

- Unit tests for loop termination, interruption on tool calls mid‑stream, and cancellation.

### Phase 10 — Rate Limiting, Retries, and Provider‑Native Prompt Caching

- Add in‑memory token‑bucket rate limiter; respect 429/Retry‑After with jitter backoff.
- Add error handling for non-success responses with automatic retries and exponential backoff.
- Provider‑native prompt caching hooks (e.g., Anthropic cache points) via plugin capability; reuse within session.

Acceptance

- Unit tests for rate limiter behavior, retry policies, and provider‑native prompt caching integration.

### Phase 11 — Runtime Adapters (Platform)

- Finalize Node adapter; add Electron and React Native adapters (HTTP shims, timers, file gates).
- Ensure adapters are injectable and selected explicitly by consuming apps.

Acceptance

- Adapter unit tests verifying fetch/stream availability and basic file gating.

### Phase 12 — MCP Tooling

- Implement MCP client connection lifecycle and tool discovery from config.
- Map MCP tool schemas ↔ unified tool schema; route calls via `ToolRouter`.

Acceptance

- Unit tests with a mock MCP server/client; discovery and execution round‑trip.

### Phase 13 — Observability and Redaction

- Add structured logging hooks and metric counters (requests, latency, tokens, cache hit, tool usage).
- Redact secrets in logs/metrics by default; optional trace spans interface.

Acceptance

- Tests for redaction rules and metric emission via mock sink.

### Phase 14 — Documentation, Examples, and Release

- Update architecture and add usage guides: chat, streaming, tools, agent loop, adapters.
- Add example scripts under `examples/` for each vertical slice.
- Prepare versioned release notes; ensure semantic versioning.

Acceptance

- Docs reviewed; example scripts run locally against mocked fixtures.

### Validation Gates (Recurring per Phase)

- Lint/format/types: `npm run quality` must pass.
- Unit/contract tests: `npm test` must pass; new capability requires tests.
- File size discipline: modules ≤ 400 logical LOC; single‑concept ownership.
- No SDKs, no `any`, no hard‑coded secrets; configuration driven.

### Risks and Mitigations

- Provider API drift: record and update fixtures regularly; add a lightweight “provider health” script to ping status endpoints in CI (without secrets).
- Streaming edge cases: invest early in parser fuzz tests and cancellation paths.
- Tool schema divergence: keep translation isolated per provider; Zod strongly validates both directions.
- Multi‑platform differences: hide behind adapters; keep the core platform‑agnostic.

### Dependency Map (Minimal)

- Phases 0–3 are prerequisites for all providers.
- Each vertical slice (4,6,7,8) is largely independent once the framework exists; they can be developed in parallel.
- Phases 9–13 enhance robustness; they can start after the first slice lands.

### Notes on Models and Capabilities

- `src/data/defaultLlmModels.ts` provides centralized model configuration with `providerPlugin` fields specifying which provider implementation to use.
- Capability flags (`toolCalls`, `streaming`, `images`, `documents`, `promptCaching`) are included in the centralized model definitions.
- Model-to-provider routing is handled dynamically by `BridgeClient` based on the model's `providerPlugin` field.
- Provider plugins operate model-agnostically and accept any model ID routed to them by the model registry.

---

Current Status: Phase 4 completed with unified model configuration architecture. Next suggested slice: Phase 5 (Tool System Core + OpenAI Tool Calls).
