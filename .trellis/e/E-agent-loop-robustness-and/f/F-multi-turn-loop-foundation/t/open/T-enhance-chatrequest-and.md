---
id: T-enhance-chatrequest-and
title: Enhance ChatRequest and StreamRequest interfaces for multi-turn options
status: open
priority: medium
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-extend-agentexecutionoptions
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:59:03.420Z
updated: 2025-09-18T02:59:03.420Z
---

# Enhance ChatRequest and StreamRequest Interfaces for Multi-Turn Options

## Context

This task extends the existing `ChatRequest` and `StreamRequest` interfaces to support multi-turn execution options, enabling users to configure multi-turn behavior through the public BridgeClient API. This provides the interface layer for multi-turn configuration.

## Related Files

- `src/client/chatRequest.ts` - ChatRequest interface
- `src/client/streamRequest.ts` - StreamRequest interface
- `src/core/agent/agentExecutionOptions.ts` - Extended options interface (from previous task)

## Current Request Interface Limitations

Current request interfaces focus on single-turn execution:

- No multi-turn configuration options
- No iteration limits or timeout controls
- No tool execution strategy selection
- No streaming interruption preferences

## Implementation Requirements

Extend request interfaces with optional multi-turn configuration:

1. **Add optional multi-turn options** to ChatRequest interface
2. **Add optional multi-turn options** to StreamRequest interface
3. **Reference AgentExecutionOptions** for multi-turn configuration
4. **Provide sensible defaults** for multi-turn behavior
5. **Maintain backward compatibility** with existing request patterns

## Technical Approach

1. **Extend existing interfaces** with optional multi-turn properties
2. **Reuse AgentExecutionOptions** for consistent configuration patterns
3. **Add interface documentation** explaining multi-turn usage
4. **Provide usage examples** for common multi-turn scenarios
5. **Ensure type safety** across multi-turn configuration

## Detailed Acceptance Criteria

✅ **ChatRequest Interface Extension**

- Optional `multiTurn?: Partial<AgentExecutionOptions>` property added
- Backward compatibility maintained for all existing usage patterns
- Type safety preserved with proper TypeScript definitions
- Clear documentation of multi-turn configuration options

✅ **StreamRequest Interface Extension**

- Optional `multiTurn?: Partial<AgentExecutionOptions>` property added
- Streaming-specific multi-turn options documented and validated
- Integration with streaming interruption capabilities
- Consistent interface patterns with ChatRequest

✅ **Configuration Integration**

- Multi-turn options properly typed and validated
- Default values applied consistently across request types
- Configuration errors provide clear validation messages
- Integration with existing request validation patterns

✅ **Developer Experience**

- Clear TypeScript intellisense for multi-turn options
- Comprehensive JSDoc documentation with usage examples
- Type-safe configuration with helpful compiler messages
- Consistent naming patterns across all interfaces

✅ **Usage Examples**

- Basic multi-turn conversation configuration examples
- Tool execution strategy selection examples
- Timeout and iteration limit configuration examples
- Streaming interruption configuration examples

## Testing Requirements

**Unit Tests** (include in this task):

- Interface compilation and type checking validation
- Backward compatibility with existing request patterns
- Multi-turn configuration validation and default application
- Type safety verification for all configuration combinations
- Documentation examples compilation and accuracy

## Out of Scope

- Implementation of multi-turn execution logic (handled by other tasks)
- Advanced configuration validation (basic type checking sufficient)
- Complex configuration transformation (direct passthrough to AgentExecutionOptions)
- Provider-specific configuration options (handled by provider integration)

## Dependencies

- T-extend-agentexecutionoptions (for multi-turn configuration types)

## Security Considerations

- Validate multi-turn configuration parameters for reasonable limits
- Ensure timeout values cannot be set to dangerous extremes
- Prevent configuration injection through request parameters
- Maintain existing request validation security patterns

## Performance Requirements

- Configuration processing overhead negligible (< 1ms)
- Type checking and validation efficient for typical usage
- Memory usage for configuration options minimal
- No impact on single-turn request performance

## Implementation Notes

- Use optional properties to maintain strict backward compatibility
- Provide clear separation between single-turn and multi-turn configuration
- Design for extensibility as multi-turn features evolve
- Focus on developer ergonomics and ease of use
