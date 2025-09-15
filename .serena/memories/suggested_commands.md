# Essential Commands for LLM Bridge Library Development

## Quality Assurance (Run after every change)

```bash
npm run quality        # Run all quality checks (lint, format, type-check)
npm test              # Run unit tests with Jest
```

## Individual Quality Commands

```bash
npm run lint          # Run ESLint and fix issues automatically
npm run format        # Format TypeScript, JavaScript, and Markdown files
npm run type-check    # Run TypeScript type checks without emitting files
```

## Development Setup

```bash
npm install           # Install all dependencies
npm run prepare       # Set up husky git hooks
```

## Git and File Operations (Darwin/macOS)

```bash
git status            # Check repository status
git add .             # Stage all changes
git commit -m "msg"   # Commit changes
ls -la                # List files with details
find . -name "*.ts"   # Find TypeScript files
grep -r "pattern" src # Search for patterns in source
```

## Project Structure Commands

```bash
ls -la src/           # List source directory contents
find src/ -type f     # Find all files in src
tree src/             # Show directory tree (if tree is installed)
```

## Build and Distribution

- No build commands configured yet (library in initial setup phase)
- TypeScript compilation will output to `dist/` directory
- Declaration files and source maps will be generated
