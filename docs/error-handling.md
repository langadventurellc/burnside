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
