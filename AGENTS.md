# Instructions for working in Burnside

A TypeScript LLM provider adapter that provides a unified interface to multiple LLM providers (OpenAI, Anthropic, Google, xAI) with Model Context Protocol (MCP) support. Designed for Desktop (Electron Main/Renderer), Mobile (React Native), and API (Node.js) platforms. The library provides an extensible architecture for integrating various LLM providers and tools while maintaining a consistent interface across all platforms.

## Repository Structure

**Applications:**

- `src/data/defaultLlmModels.ts` - configured LLM providers, models and model capabilities. **ALL** provider and model information should come from this file and **NEVER EVER** hardcoded.

## Commands

### Testing & Quality

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `npm test`         | Run unit tests with Jest                          |
| `npm run test:e2e` | Run E2E tests with Jest                           |
| `npm run quality`  | Run all quality checks (lint, format, type-check) |

## Technology Stack

- **Language**: TypeScript (5.8+)
- **Unit Testing**: Jest (30.0+)

## Coding Standards

### Files / Packages

- ≤ 400 logical LOC
- No “util” dumping grounds
- Naming:
  - `ComponentName.tsx` (PascalCase)
  - `moduleName.ts` / `moduleName.css` (camelCase)

### Forbidden

- `any` types
- Dead code kept around
- Shared “kitchen‑sink” modules
- Hard‑coded secrets or env values
- **NEVER** create integration or performance tests
- **NEVER** keep deprecated code for "backwards compatibility". Breaking old code is encouraged and preferred to keeping dead code for backwards compatibility. This is a greenfield project that's not being used anywhere, so there's no need for backwards compatibility.

## Troubleshooting

- Ask Perplexity
- If you need clarification, ask specific questions with options
  1. **Stop** and ask a clear, single question.
  2. Offer options (A / B / C) if helpful.
  3. Wait for user guidance before proceeding.
