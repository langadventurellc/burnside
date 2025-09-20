---
id: T-add-package-dependencies-for
title: Add package dependencies for React Native support
status: done
priority: low
parent: F-cross-platform-runtime
prerequisites: []
affectedFiles:
  README.md:
    Added comprehensive React Native installation documentation including
    peer dependency requirements, why react-native-sse is needed for streaming
    functionality, step-by-step installation instructions, version compatibility
    matrix, platform support table, and troubleshooting section for common React
    Native issues
log:
  - Added comprehensive React Native peer dependency documentation to README.md.
    The react-native-sse peer dependency was already correctly configured in
    package.json. Documentation explains why react-native-sse is required for
    Server-Sent Events streaming, provides clear installation instructions for
    React Native users, includes version compatibility information, and offers
    troubleshooting guidance. All quality checks pass.
schema: v1.0
childrenIds: []
created: 2025-09-20T04:33:32.311Z
updated: 2025-09-20T04:33:32.311Z
---

# Add Package Dependencies for React Native Support

## Context

Add the necessary package dependencies to support React Native streaming functionality. The React Native adapter requires `react-native-sse` for Server-Sent Events support, which should be added as a peer dependency.

## Implementation Requirements

### Package.json Updates

- Add `react-native-sse` as a peer dependency (not a direct dependency)
- Add appropriate version constraints based on React Native compatibility
- Update any relevant development dependencies for testing React Native code

### Documentation Updates

- Document the peer dependency requirement in README or installation docs
- Explain why react-native-sse is needed for streaming functionality
- Provide installation instructions for React Native users

### Technical Approach

```json
{
  "peerDependencies": {
    "react-native-sse": "^1.2.1"
  }
}
```

### Files to Modify

- `package.json` - Add peer dependency
- Documentation files as needed for installation instructions

## Acceptance Criteria

- **Peer Dependency**: react-native-sse added as peer dependency with appropriate version
- **Version Compatibility**: Version constraint compatible with common React Native versions
- **No Breaking Changes**: Existing installations continue to work
- **Documentation**: Clear instructions for React Native users about installing dependencies

## Testing Requirements

- **Package Installation**: Verify package.json changes don't break npm/yarn install
- **Dependency Resolution**: Test that peer dependency warnings are appropriate
- **CI/CD**: Ensure CI builds still work with new peer dependencies

## Out of Scope

- Implementation of the React Native adapter itself (covered by separate task)
- Complex dependency management or bundling optimizations
