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
    openai: { apiKey: "sk-..." },
    anthropic: { apiKey: "sk-ant-..." },
  },
  defaultProvider: "openai",
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
    openai: { apiKey: "${OPENAI_API_KEY}" },
    anthropic: { apiKey: "${ANTHROPIC_API_KEY}" },
  },
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
