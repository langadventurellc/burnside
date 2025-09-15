# Coding Standards for LLM Bridge Library

## Architecture Rules

- **Files**: ≤ 400 logical LOC per file
- **No "util" dumping grounds** - each module owns one domain concept
- **Module exports**: Export only what callers need via index.ts files
- **Dependencies**: Each module owns one domain concept

## File Naming Conventions

- **TypeScript files**: `moduleName.ts` (camelCase)
- **Test files**: `moduleName.test.ts` in `__tests__` directories
- **Index files**: `index.ts` for module exports

## Forbidden Practices

- `any` types (strict TypeScript enforcement)
- Dead code kept around
- Shared "kitchen-sink" modules
- Hard-coded secrets or environment values
- Integration or performance tests (unit tests only)

## TypeScript Configuration

- Target: ES2022
- Module: CommonJS
- Strict mode enabled
- Declaration files generated
- Source maps enabled
- Root directory: `src/`
- Output directory: `dist/`

## Testing

- Jest with ts-jest preset
- Test files in `src/**/__tests__/**/*.test.ts`
- ESM support enabled
- No e2e tests (excluded: `*.e2e.test.ts`)
- Coverage collection from all `src/**/*.ts` files
