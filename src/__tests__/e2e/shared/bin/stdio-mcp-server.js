#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global require, console, process */
/**
 * STDIO Mock MCP Server for E2E Testing
 *
 * Standalone Node.js executable that implements JSON-RPC 2.0 MCP server
 * communicating via stdin/stdout. Provides identical tool behavior to the
 * HTTP MockMcpServer but adapted for subprocess-based testing with
 * cross-platform file-based telemetry tracking.
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const process = require("process");

// Project-relative temp directory
const currentDir = path.dirname(process.argv[1]);
const projectRoot = path.resolve(currentDir, "../../../../..");
const tempDir = path.join(projectRoot, "temp");

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Cross-platform telemetry file path in project temp directory
const telemetryFile = path.join(
  tempDir,
  `stdio-mcp-telemetry-${process.pid}.json`,
);

// Telemetry data structure
const telemetryData = {
  toolCalls: {},
};

// Tool definitions matching MockMcpServer
const tools = [
  {
    name: "echo_tool",
    description:
      "Echo tool for MCP E2E testing - returns input data with test metadata",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Message to echo back",
        },
      },
      required: ["message"],
    },
  },
];

/**
 * Write telemetry data to file atomically using temp file + rename pattern
 */
function writeTelemetry() {
  try {
    const tempFile = `${telemetryFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(telemetryData, null, 2), "utf8");
    fs.renameSync(tempFile, telemetryFile);
  } catch (error) {
    // Log to stderr, never stdout to avoid protocol contamination
    console.error("Failed to write telemetry:", error.message);
  }
}

/**
 * Record a tool call in telemetry data
 */
function recordToolCall(toolName, args) {
  if (!telemetryData.toolCalls[toolName]) {
    telemetryData.toolCalls[toolName] = [];
  }

  telemetryData.toolCalls[toolName].push({
    arguments: args,
    timestamp: new Date().toISOString(),
  });

  writeTelemetry();
}

/**
 * Send JSON-RPC 2.0 response to stdout
 */
function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

/**
 * Send JSON-RPC 2.0 error response
 */
function sendError(id, code, message, data) {
  sendResponse({
    jsonrpc: "2.0",
    error: { code, message, data },
    id: id ?? null,
  });
}

/**
 * Handle MCP initialize method
 */
function handleInitialize(id, params) {
  // Basic validation - MCP initialize should have capabilities
  if (!params || typeof params !== "object") {
    return sendError(id, -32602, "Invalid params", {
      details: "initialize requires capabilities parameter",
    });
  }

  const response = {
    protocolVersion: "2025-06-18",
    capabilities: {
      tools: { supported: true },
    },
    serverInfo: {
      name: "StdioMockMcpServer",
      version: "1.0.0",
    },
  };

  sendResponse({
    jsonrpc: "2.0",
    result: response,
    id,
  });
}

/**
 * Handle MCP tools/list method
 */
function handleToolsList(id) {
  sendResponse({
    jsonrpc: "2.0",
    result: { tools },
    id,
  });
}

/**
 * Handle MCP tools/call method
 */
function handleToolsCall(id, params) {
  if (!params || typeof params !== "object") {
    return sendError(id, -32602, "Invalid params", {
      details: "tools/call requires name and arguments",
    });
  }

  const { name, arguments: args } = params;

  if (!name || typeof name !== "string") {
    return sendError(id, -32602, "Invalid params", {
      details: "name parameter is required and must be a string",
    });
  }

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return sendError(id, -32601, "Method not found", {
      details: `Tool '${name}' not found`,
    });
  }

  // Record the tool call
  recordToolCall(tool.name, args);

  // Execute the tool - echo_tool implementation matching MockMcpServer
  let result;
  if (tool.name === "echo_tool") {
    const message = (args && args.message) || "default message";
    result = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            echoed: message,
            timestamp: new Date().toISOString(),
            testSuccess: true,
          }),
        },
      ],
    };
  } else {
    // Generic tool execution response
    result = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tool: tool.name,
            result: "Mock tool execution successful",
            arguments: args,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  sendResponse({
    jsonrpc: "2.0",
    result,
    id,
  });
}

/**
 * Process a JSON-RPC 2.0 request
 */
function processRequest(request) {
  const { jsonrpc, method, params, id } = request;

  // Validate JSON-RPC 2.0 format
  if (jsonrpc !== "2.0") {
    return sendError(id ?? null, -32600, "Invalid Request", {
      details: "jsonrpc must be '2.0'",
    });
  }

  if (typeof method !== "string") {
    return sendError(id ?? null, -32600, "Invalid Request", {
      details: "method must be a string",
    });
  }

  // Handle JSON-RPC notification (no id field)
  if (id === undefined) {
    // Notifications don't get responses
    return;
  }

  // Process the request
  try {
    switch (method) {
      case "initialize":
        return handleInitialize(id, params);

      case "tools/list":
        return handleToolsList(id);

      case "tools/call":
        return handleToolsCall(id, params);

      default:
        return sendError(id, -32601, "Method not found", { method });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return sendError(id, -32603, "Internal error", { details: message });
  }
}

/**
 * Cleanup function for graceful shutdown
 */
function cleanup() {
  try {
    if (fs.existsSync(telemetryFile)) {
      fs.unlinkSync(telemetryFile);
    }
  } catch (error) {
    console.error("Failed to cleanup telemetry file:", error.message);
  }
}

/**
 * Signal handlers for graceful shutdown
 */
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

// Setup readline interface for stdin processing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Handle each line of input as a separate JSON-RPC request
rl.on("line", (line) => {
  if (!line.trim()) return; // Skip empty lines

  try {
    const request = JSON.parse(line);
    processRequest(request);
  } catch (error) {
    // Send JSON-RPC parse error for malformed JSON
    sendError(null, -32700, "Parse error", {
      details: "Invalid JSON",
    });
  }
});

// Handle readline errors
rl.on("error", (error) => {
  console.error("Readline error:", error.message);
  cleanup();
  process.exit(1);
});

// Handle unexpected errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  cleanup();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  cleanup();
  process.exit(1);
});

// Initialize telemetry file
writeTelemetry();
