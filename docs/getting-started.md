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
