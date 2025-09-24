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
