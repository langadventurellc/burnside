# LLM Bridge Library - Project Overview

## Purpose

A TypeScript library that acts as a unified bridge to multiple LLM provider APIs for use across Desktop (Electron), Mobile (React Native), and Web (Node.js) platforms. The library provides an extensible architecture for integrating various LLM providers and tools while maintaining a consistent interface across all platforms.

## Tech Stack

- **Language**: TypeScript 5.8+
- **Testing**: Jest 30.0+ with ts-jest
- **Validation**: Zod 4.0+
- **Target**: ES2022, CommonJS modules
- **Node Version**: >=18.0.0
- **License**: GPL-3.0-only

## Key Features

- Unified, provider-agnostic API for chat, tools, and streaming
- Extensible via plugins for provider versions and tools (HTTP only, no SDKs)
- Strong typing and schema validation with Zod (no `any` types)
- Platform-agnostic core with thin runtime adapters
- Configuration-driven providers, models, and capabilities
- Deterministic agent loop with safety limits
- Backward compatibility across multiple provider API versions

## Current State

- Empty `src/` directory - foundational structure needs to be created
- Package.json and build configuration already set up
- Architecture documented in docs/library-architecture.md
- Ready for Phase 0: Repository Setup and Scaffolding
