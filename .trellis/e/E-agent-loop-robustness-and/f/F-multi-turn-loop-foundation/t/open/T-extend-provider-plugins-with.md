---
id: T-extend-provider-plugins-with
title: Extend provider plugins with multi-turn awareness
status: open
priority: medium
parent: F-multi-turn-loop-foundation
prerequisites:
  - T-create-multiturnstate
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T02:58:39.998Z
updated: 2025-09-18T02:58:39.998Z
---

# Extend Provider Plugins with Multi-Turn Awareness

## Context

This task extends the existing `ProviderPlugin` interface and implementations to support multi-turn conversation state, enabling providers to make informed decisions about conversation continuation, token usage, and termination detection within multi-turn contexts.

## Related Files

- `src/core/providers/providerPlugin.ts` - Core ProviderPlugin interface
- Existing provider implementations (OpenAI, Anthropic, Google, xAI)
- `src/core/agent/multiTurnState.ts` - Multi-turn state interface

## Current Provider Interface Limitations

Current `ProviderPlugin` interface handles single requests/responses:

- `translateRequest()` - single request translation
- `parseResponse()` - single response parsing
- `isTerminal()` - basic termination detection
- No conversation context or multi-turn state awareness

## Implementation Requirements

Extend provider plugins with multi-turn context awareness:

1. **Add optional multi-turn context** to existing methods
2. **Enhance termination detection** with conversation state
3. **Support conversation-aware request translation**
4. **Provide token usage estimation** for multi-turn planning
5. **Maintain backward compatibility** with existing provider implementations

## Technical Approach

1. **Extend existing interface methods** with optional multi-turn context parameters
2. **Add new optional methods** for multi-turn specific capabilities
3. **Provide default implementations** for backward compatibility
4. **Update method signatures** to accept conversation context
5. **Enhance existing provider implementations** incrementally

## Detailed Acceptance Criteria

✅ **Interface Extension**

- `translateRequest()` accepts optional `ConversationContext` parameter
- `parseResponse()` receives optional `MultiTurnState` context
- `isTerminal()` enhanced with conversation history awareness
- New optional method `estimateTokenUsage()` for conversation planning
- New optional method `shouldContinueConversation()` for intelligent termination

✅ **Backward Compatibility**

- All existing provider plugin implementations continue to work unchanged
- Optional parameters default to undefined/null for existing implementations
- Existing method contracts preserved exactly
- No breaking changes to core provider plugin interface

✅ **Multi-Turn Context Integration**

- Providers can access conversation history for intelligent decision making
- Token usage estimation considers conversation length and complexity
- Termination detection factors in conversation patterns and length
- Request translation can optimize based on conversation context

✅ **Provider Implementation Updates**

- At least one existing provider (OpenAI) updated with multi-turn awareness
- Token usage estimation implemented for providers that support it
- Enhanced termination detection for providers with rich completion signals
- Documentation and examples for multi-turn provider development

✅ **Integration with Agent Loop**

- Multi-turn orchestration passes conversation context to providers
- Provider responses integrated with multi-turn state management
- Provider token estimates used for conversation planning
- Provider termination signals respected in multi-turn flow

## Testing Requirements

**Unit Tests** (include in this task):

- Extended interface compatibility with existing provider implementations
- Multi-turn context integration with provider methods
- Token usage estimation accuracy where implemented
- Enhanced termination detection behavior
- Backward compatibility validation with all existing providers

## Out of Scope

- Complete reimplementation of all provider plugins (incremental enhancement)
- Advanced provider-specific optimizations (future enhancement)
- Provider plugin registration changes (existing registry sufficient)
- Complex conversation analysis algorithms (basic context awareness sufficient)

## Dependencies

- T-create-multiturnstate (for MultiTurnState and ConversationContext types)

## Security Considerations

- Ensure conversation context doesn't leak sensitive information to providers
- Validate that multi-turn context doesn't expose authentication details
- Maintain existing provider security boundaries and constraints
- Prevent conversation injection through context parameters

## Performance Requirements

- Multi-turn context processing overhead < 10ms per provider call
- Token usage estimation completes in < 50ms for typical conversations
- Enhanced termination detection adds < 5ms overhead
- Memory usage for conversation context bounded and reasonable

## Implementation Notes

- Use optional parameters and interface extension to maintain compatibility
- Provide clear migration guidance for existing provider implementations
- Design for incremental adoption of multi-turn features
- Focus on high-value multi-turn capabilities that providers can reasonably implement
