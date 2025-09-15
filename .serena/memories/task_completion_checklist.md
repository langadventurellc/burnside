# Task Completion Checklist

## After Every Code Change

### 1. Quality Checks (MANDATORY)

Run these commands and fix all issues:

```bash
npm run quality       # Runs lint + format + type-check
npm test             # Run unit tests
```

### 2. Code Standards Verification

- [ ] No `any` types used
- [ ] Files ≤ 400 logical LOC
- [ ] Each module owns one domain concept
- [ ] Proper camelCase naming for TypeScript files
- [ ] No dead code or unused imports
- [ ] No hard-coded secrets or environment values

### 3. TypeScript Requirements

- [ ] All code properly typed
- [ ] No TypeScript errors in `npm run type-check`
- [ ] Proper exports via index.ts files
- [ ] Import statements follow project conventions

### 4. Testing Requirements

- [ ] Unit tests pass (`npm test`)
- [ ] New functionality has corresponding tests
- [ ] Tests follow naming convention: `*.test.ts` in `__tests__` directories
- [ ] No integration or e2e tests (forbidden)

### 5. File Organization

- [ ] Files in correct directory structure according to architecture
- [ ] Index.ts files properly export module interfaces
- [ ] No "kitchen-sink" utility modules created

### 6. Git Practices

- [ ] Meaningful commit messages
- [ ] No secrets or sensitive data committed
- [ ] .gitignore rules respected

## When Task is Complete

- [ ] All quality checks pass
- [ ] Documentation updated if needed (only if explicitly requested)
- [ ] Architecture patterns followed consistently
