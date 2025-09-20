# LLM Bridge

A TypeScript library that acts as a unified bridge to multiple LLM provider APIs for use across Desktop (Electron Main/Renderer), Mobile (React Native), and API (Node.js) platforms. The library provides an extensible architecture for integrating various LLM providers and tools while maintaining a consistent interface across all platforms.

## Installation

### Node.js / Electron Main

```bash
npm install llm-bridge
```

### React Native

React Native requires an additional peer dependency for Server-Sent Events (SSE) streaming support:

```bash
npm install llm-bridge react-native-sse
```

#### Why react-native-sse is required

React Native doesn't have native support for Server-Sent Events (SSE), which are essential for streaming responses from LLM providers. The `react-native-sse` library provides this functionality, enabling real-time streaming of LLM responses in React Native applications.

**Key streaming features enabled by react-native-sse:**

- Real-time response streaming from LLM providers
- Proper handling of SSE connection management
- Compatible with common React Native versions (0.64+)
- JavaScript-only implementation (no native code required)

#### Installation Steps for React Native

1. Install both packages:

   ```bash
   npm install llm-bridge react-native-sse
   ```

2. For React Native 0.60 and above, no additional linking is required as react-native-sse is a JavaScript-only library.

3. Verify installation by importing the library:
   ```typescript
   import { LLMBridge } from "llm-bridge";
   ```

#### Version Compatibility

- **react-native-sse**: ^1.2.1 (latest available version)
- **React Native**: 0.64+ (supported due to JavaScript-only implementation)
- **Node.js**: 18.0.0+ (for development and Electron main process)

### Electron Renderer

For Electron renderer processes, no additional dependencies are required beyond the base installation:

```bash
npm install llm-bridge
```

## Platform Support

| Platform          | HTTP Requests | Streaming (SSE) | File Operations | Timer Operations |
| ----------------- | ------------- | --------------- | --------------- | ---------------- |
| Node.js           | ✅            | ✅              | ✅              | ✅               |
| Electron Main     | ✅            | ✅              | ✅              | ✅               |
| Electron Renderer | ✅            | ✅              | ❌              | ✅               |
| React Native      | ✅            | ✅\*            | ❌              | ✅               |

\*Requires `react-native-sse` peer dependency

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
