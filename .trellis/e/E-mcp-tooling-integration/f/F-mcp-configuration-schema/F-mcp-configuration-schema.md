---
id: F-mcp-configuration-schema
title: MCP Configuration Schema Extension
status: in-progress
priority: medium
parent: E-mcp-tooling-integration
prerequisites: []
affectedFiles:
  src/core/config/bridgeConfigSchema.ts: Extended tools object schema with
    optional mcpServers field including name/URL validation, HTTP/HTTPS protocol
    enforcement, and server name uniqueness constraints
  src/core/config/__tests__/bridgeConfigSchema.test.ts: Added comprehensive unit
    tests for MCP server validation covering valid/invalid configurations,
    protocol validation, duplicate name detection, and integration scenarios
log: []
schema: v1.0
childrenIds:
  - T-add-mcp-server-configuration
  - T-extend-bridgeconfigschema
  - T-update-toolsconfig-type-to
created: 2025-09-20T19:16:43.325Z
updated: 2025-09-20T19:16:43.325Z
---

# MCP Configuration Schema Extension

## Purpose and Functionality

Extend the existing configuration system to support MCP server definitions while maintaining architectural consistency and platform constraints. This feature adds MCP-specific configuration validation to `BridgeConfigSchema` and `ToolsConfig` with comprehensive test coverage.

## Key Components to Implement

### 1. Configuration Schema Updates

- Extend `src/core/config/bridgeConfigSchema.ts` with `mcpServers` field
- Update `src/core/config/toolsConfig.ts` to include MCP server configurations
- Add platform-specific validation rules (React Native remote-only constraint)
- Maintain backward compatibility with existing configurations

### 2. Validation Rules

- MCP server name uniqueness validation
- URL format validation for remote servers
- Platform constraint enforcement through Zod schemas
- Connection parameter validation (basic, no authentication)

### 3. Type Definitions

- Create TypeScript interfaces for MCP server configuration
- Export configuration types for use in other modules
- Ensure type safety across the configuration system

## Detailed Acceptance Criteria

### Schema Extensions

- [ ] `BridgeConfigSchema` extended with optional `mcpServers` field in `tools` section
- [ ] MCP server configuration supports `name` (string) and `url` (string) fields
- [ ] URL validation ensures proper HTTP/HTTPS format
- [ ] Server name validation ensures uniqueness within configuration
- [ ] Platform constraints enforced: React Native only allows remote servers

### Validation Implementation

- [ ] Zod validation schemas created for MCP server definitions
- [ ] Platform detection integrated into validation logic
- [ ] Invalid configurations produce clear, actionable error messages
- [ ] Validation performs efficiently with large server lists (up to 10 servers)

### Backward Compatibility

- [ ] Existing `BridgeConfig` schemas continue to validate successfully
- [ ] New `mcpServers` field is optional and defaults to empty array
- [ ] No breaking changes to existing configuration interfaces
- [ ] Migration path provided for future configuration updates

### Testing Coverage

- [ ] Unit tests cover all new Zod validation schemas (100% coverage)
- [ ] Test cases for valid and invalid MCP server configurations
- [ ] Platform constraint validation tests for all supported platforms
- [ ] Error message testing for clear user feedback
- [ ] Unit test assertions verify configuration validation completes within reasonable time

### Type Safety

- [ ] TypeScript interfaces exported for MCP server configuration
- [ ] Configuration types integrate with existing `BridgeConfig` interface
- [ ] No `any` types used in new configuration schemas
- [ ] Intellisense support for MCP configuration in IDEs

## Implementation Guidance

### Technical Approach

- Follow existing configuration patterns in `src/core/config/`
- Use Zod schemas consistently with current validation approach
- Leverage existing platform detection utilities
- Maintain configuration schema versioning approach

### Integration Points

- Extend `BridgeConfigSchema` object definition
- Update `ToolsConfig` interface to include MCP servers
- Integrate with existing validation pipeline
- Ensure configuration merging works with MCP fields

### Error Handling

- Provide specific error messages for invalid URLs
- Include server name in validation error context
- Guide users toward correct configuration format
- Handle edge cases gracefully (empty arrays, null values)

## Testing Requirements

### Unit Tests

- Schema validation with valid MCP server configurations
- Schema validation with invalid configurations (malformed URLs, duplicate names)
- Platform constraint validation (React Native remote-only)
- Error message accuracy and clarity
- Type inference correctness

### Edge Case Testing

- Empty `mcpServers` array handling
- Missing optional fields behavior
- Very long server names and URLs
- Special characters in server names
- Invalid URL formats and protocols

### Performance Expectations

- Configuration validation should complete within 100ms for typical configurations
- Support up to 10 MCP servers without performance degradation
- Validation errors should return immediately without blocking
- Memory usage should remain constant with configuration size

## Security Considerations

### Input Validation

- Validate URL schemes (only HTTP/HTTPS allowed)
- Prevent injection attacks through URL validation
- Sanitize server names to prevent code injection
- Validate URL length to prevent DoS attacks

### Platform Security

- Enforce React Native security constraints
- Prevent local server configurations on restricted platforms
- Validate remote server URLs meet security requirements

## Dependencies

- **Prerequisites**: None (first feature in epic)
- **Builds Upon**: Existing configuration system in `src/core/config/`
- **Required By**: All subsequent MCP features depend on this configuration foundation

## Definition of Done

- [ ] All acceptance criteria met with passing tests
- [ ] Code review completed with no major issues
- [ ] Documentation updated for new configuration options
- [ ] Performance expectations verified through unit test assertions
- [ ] Security review completed for input validation
- [ ] Backward compatibility verified with existing configurations
