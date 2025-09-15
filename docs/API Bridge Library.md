## Overview

A TypeScript library that acts as a unified bridge to multiple LLM provider APIs for use across Desktop (Electron), Mobile (React Native), and Web (Node.js) platforms. The library provides an extensible architecture for integrating various LLM providers and tools while maintaining a consistent interface across all platforms.

## Core Requirements

### Provider Management

- **Extensible Provider System**: Support for multiple LLM providers (OpenAI, Anthropic, Google, xAI, Ollama, etc.)
- **API Version Specificity**: Providers must be versioned by API version, not just provider name (e.g., `openai-v1`, `openai-v2`) to handle API evolution
- **Configuration-Driven**: All provider and model definitions must be configuration-based with no hard-coded provider logic, including model capabilities
- **Dynamic Configuration Schema**: Each provider can define its own configuration requirements (API keys, base URLs, region settings, etc.) while conforming to common interfaces

### Tool System

- **Extensible Built-in Tools**: Core tools for web search and file operations that can be extended or replaced
- **Native Tool Integration**: Automatic use of provider-native tools when available (e.g., Claude's web_search, Gemini's grounding)
- **Tool Definition Translation**: Automatic conversion between different provider tool formats (OpenAI function format, Anthropic tool format, Google function declarations)
- **Tool Response Normalization**: Unified tool response format regardless of provider-specific implementations
- **Fallback Mechanism**: Automatic fallback to external tool implementations when native tools are unavailable

### Agent Loop Management

- **Unified Agent Orchestration**: Handle the iterative tool-calling loop across all providers
- **Provider-Specific Termination Detection**: Recognize different completion signals from each provider
- **State Management**: Maintain conversation and tool execution state throughout agent cycles
- **Safety Controls**: Configurable limits for maximum iterations, timeouts, and token budgets
- **Streaming Interruption Handling**: Manage tool calls that interrupt streaming responses

### MCP (Model Context Protocol) Support

- **Tool Discovery**: Integration of tools from connected MCP servers via configuration
- **Connection Lifecycle Management**: Handle connection, disconnection, and reconnection of MCP servers

### File and Content Handling

- **Multi-Modal Content Support**: Handle text, code, documents, images, and other media types
- **Provider-Specific Formatting**: Adapt content presentation based on provider preferences (markdown for code, base64 for images, XML tags for Claude, etc.)
- **File Type Routing**: Different handling strategies based on file type and provider capabilities
- **Content Chunking**: Split large content to fit within provider context limits
- **Metadata Preservation**: Maintain file names, paths, and language hints for code files

### Message Format Abstraction

- **Unified Message Format**: Common internal representation for all message types
- **Provider Translation Layer**: Automatic conversion to/from provider-specific message formats
- **Multi-Modal Message Support**: Handle messages containing mixed content types
- **Citation and Source Tracking**: Preserve source information from web searches and document references

### Streaming Support

- **Universal Streaming Interface**: Consistent streaming API across all providers that support it
- **Partial Response Handling**: Process incomplete responses and tool calls during streaming
- **Buffer Management**: Handle partial JSON and interrupted streams when tool calls occur
- **Platform-Specific Optimizations**: Adapt streaming behavior for desktop, mobile, and web environments

### Performance Optimization

- **Response Caching**: Cache responses where appropriate to reduce API calls
- **Prompt Caching**: Support provider-specific prompt caching mechanisms (e.g., Anthropic's cache points)
- **Rate Limiting**: Respect and manage provider-specific rate limits
- **Token Optimization**: Minimize token usage through intelligent content formatting and chunking

### Conversation Management

- **Context Window Management**: Automatic handling of conversation history within provider limits
- **Message History Tracking**: Maintain conversation state across multiple interactions
- **No Thread/Session Support**: No threading support
- **Context Length Strategies**: Configurable and extensible strategies for dealing with context length
  - Trimming
  - Compacting / summarizing

## Non-Functional Requirements

- **HTTP-Based Communication**: All provider interactions must use HTTP/REST APIs for maximum compatibility
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies on Provider SDKs**: Direct HTTP communication without requiring provider-specific SDKs
- **Platform Agnostic Core**: Shared logic that works across all platforms with platform-specific adapters
- **Backward Compatibility**: Support for multiple API versions of the same provider simultaneously
