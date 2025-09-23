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
