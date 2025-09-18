# Instructions for working in the LLM Bridge Library

A TypeScript library that acts as a unified bridge to multiple LLM provider APIs for use across Desktop (Electron), Mobile (React Native), and Web (Node.js) platforms. The library provides an extensible architecture for integrating various LLM providers and tools while maintaining a consistent interface across all platforms.

## Repository Structure

**Applications:**

- `src` - main library code
- `src/data/defaultLlmModels.ts` - configured LLM providers, models and model capabilities. **ALL** provider and model information should come from this file and **NEVER EVER** hardcoded.

## Development

### Quality checks

**IMPORTANT** Run the following commands to ensure code quality after every change. Fix all issues as soon as possible.

- `npm run quality` - Run linting, formatting, and type checks
- `npm test` - Run unit tests to ensure functionality

### Commands

#### Testing & Quality

| Command              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `npm test`           | Run unit tests with Jest                              |
| `npm run test:e2e`   | Run E2E tests with Jest                               |
| `npm run lint`       | Run ESLint and fix issues automatically               |
| `npm run format`     | Format all TypeScript, JavaScript, and Markdown files |
| `npm run type-check` | Run TypeScript type checks without emitting files     |
| `npm run quality`    | Run all quality checks (lint, format, type-check)     |

## Architecture

### Technology Stack

- **Language**: TypeScript (5.8+)
- **Unit Testing**: Jest (30.0+)
- **Validation**: Zod (4.0+)

---

# Coding Standards

## 1  Architecture

### Files / Packages

- ≤ 400 logical LOC
- No “util” dumping grounds
- Naming:
  - `ComponentName.tsx` (PascalCase)
  - `moduleName.ts` / `moduleName.css` (camelCase)

### Modules & Dependencies

1. Each module owns **one** domain concept.
2. Export only what callers need (`index.ts`).

## 2  Forbidden

- `any` types
- Dead code kept around
- Shared “kitchen‑sink” modules
- Hard‑coded secrets or env values
- Never create integration or performance tests

---

## 🤔 When You're Unsure

1. **Stop** and ask a clear, single question.
2. Offer options (A / B / C) if helpful.
3. Wait for user guidance before proceeding.

## Troubleshooting

If you encounter issues:

- Use the context7 MCP tool for up-to-date library documentation
- Use web for research (the current year is 2025)
- If you need clarification, ask specific questions with options
