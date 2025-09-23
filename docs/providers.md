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
      apiKey: "${OPENAI_API_KEY}",
      baseUrl: "https://api.openai.com/v1", // Optional
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
      apiKey: "${ANTHROPIC_API_KEY}",
      baseUrl: "https://api.anthropic.com", // Optional
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
      apiKey: "${GOOGLE_AI_API_KEY}",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta", // Optional
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
      apiKey: "${XAI_API_KEY}",
      baseUrl: "https://api.x.ai/v1", // Optional
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

### Rate Limiting

Configure rate limits based on your API plan:

```typescript
const client = createClient({
  providers: {
    openai: {
      apiKey: "${OPENAI_API_KEY}",
    },
    anthropic: {
      apiKey: "${ANTHROPIC_API_KEY}",
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
      apiKey: "${OPENAI_API_KEY}",
      baseUrl: "https://your-enterprise-proxy.com/openai/v1",
    },
    anthropic: {
      apiKey: "${ANTHROPIC_API_KEY}",
      baseUrl: "https://your-enterprise-proxy.com/anthropic",
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
      apiKey: "${OPENAI_API_KEY}",
      timeout: 30000, // Provider-specific timeout override
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
