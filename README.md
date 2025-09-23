# Burnside

A TypeScript LLM provider adapter that provides a unified interface to multiple LLM providers (OpenAI, Anthropic, Google, XAI) with Model Context Protocol (MCP) support. Designed for Desktop (Electron Main/Renderer), Mobile (React Native), and API (Node.js) platforms.

## Key Features

- **Unified LLM Interface**: Single API for multiple providers (OpenAI, Anthropic, Google, XAI)
- **MCP Integration**: Full Model Context Protocol support with both HTTP and STDIO transports
- **Cross-Platform**: Works across Node.js, Electron (Main/Renderer), and React Native
- **Streaming Support**: Real-time response streaming from all providers
- **TypeScript**: Fully typed with comprehensive type safety

## Installation

### Node.js / Electron Main

```bash
npm install @langadventurellc/burnside
```

### React Native

React Native requires an additional peer dependency for Server-Sent Events (SSE) streaming support:

```bash
npm install @langadventurellc/burnside react-native-sse
```

### Electron Renderer

For Electron renderer processes, no additional dependencies are required beyond the base installation:

```bash
npm install @langadventurellc/burnside
```

## Platform Support & MCP Capabilities

| Platform          | HTTP Requests | Streaming (SSE) | MCP HTTP | MCP STDIO |
| ----------------- | ------------- | --------------- | -------- | --------- |
| Node.js           | ✅            | ✅              | ✅       | ✅        |
| Electron Main     | ✅            | ✅              | ✅       | ✅        |
| Electron Renderer | ✅            | ✅              | ✅       | ❌        |
| React Native      | ✅            | ✅\*            | ✅       | ❌        |

\*Requires `react-native-sse` peer dependency

### MCP Transport Differences

**STDIO MCP Support**: Only available in Node.js and Electron Main processes due to the need for child process spawning and standard I/O access. This is the key differentiator between platforms.

**HTTP MCP Support**: Available across all platforms as it only requires standard HTTP capabilities.

## React Native Setup

#### Why react-native-sse is required

React Native doesn't have native support for Server-Sent Events (SSE), which are essential for streaming responses from LLM providers. The `react-native-sse` library provides this functionality, enabling real-time streaming of LLM responses in React Native applications.

#### Installation Steps for React Native

1. Install both packages:

   ```bash
   npm install @langadventurellc/burnside react-native-sse
   ```

2. For React Native 0.60 and above, no additional linking is required as react-native-sse is a JavaScript-only library.

3. Verify installation by importing the library:
   ```typescript
   import { Burnside } from "@langadventurellc/burnside";
   ```

#### Version Compatibility

- **react-native-sse**: ^1.2.1 (latest available version)
- **React Native**: 0.64+ (supported due to JavaScript-only implementation)
- **Node.js**: 18.0.0+ (for development and Electron main process)

## Troubleshooting

### React Native Issues

**Missing react-native-sse dependency:**

```
Error: Cannot resolve module 'react-native-sse'
```

**Solution:** Install the peer dependency: `npm install react-native-sse`

**Streaming not working:**
Ensure you have installed react-native-sse and that your React Native version is 0.64 or higher.

**Peer dependency warnings:**
These warnings are expected and do not affect functionality. The warnings remind you that react-native-sse is required for React Native streaming support.

### MCP Issues

**STDIO MCP not working in React Native/Electron Renderer:**
This is expected behavior. STDIO MCP requires Node.js child process capabilities that are only available in Node.js and Electron Main processes. Use HTTP MCP transport instead.
