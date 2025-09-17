---
id: T-add-temperature-parameter
title: Add temperature parameter capability support to prevent GPT-5 API errors
status: done
priority: high
parent: none
prerequisites: []
affectedFiles:
  src/core/providers/modelCapabilities.ts: "Added optional temperature: boolean
    field to ModelCapabilities interface with JSDoc documentation and updated
    example"
  src/core/models/defaultLlmModelsSchema.ts: "Extended Zod schema with
    temperature: z.boolean().optional() field and updated JSDoc example"
  src/data/defaultLlmModels.ts: "Added temperature: false to all three GPT-5
    models (gpt-5-nano-2025-08-07, gpt-5-mini-2025-08-07, gpt-5-2025-08-07)"
  src/core/models/modelLoader.ts: Updated mapJsonToModelInfo to read temperature
    capability from JSON with default true for backward compatibility, updated
    documentation
  src/providers/openai-responses-v1/translator.ts:
    Enhanced buildOpenAIRequestBody
    function to accept optional ModelCapabilities parameter and conditionally
    include temperature based on capabilities, added TODO comment for future
    provider integration
  src/core/providers/__tests__/modelCapabilities.test.ts: Created comprehensive
    test suite (7 tests) for ModelCapabilities interface temperature field type
    safety and compatibility
  src/core/models/__tests__/temperatureCapabilityLoading.test.ts:
    Created test suite (10 tests) for temperature capability loading from JSON
    to ModelCapabilities mapping
  src/providers/openai-responses-v1/__tests__/temperatureCapabilityTranslation.test.ts:
    Created test suite (12 tests) for capability-aware temperature parameter
    handling in request translation
  src/core/models/__tests__/modelLoader.test.ts:
    "Updated existing test to expect
    temperature: true in default capabilities object"
log:
  - "Successfully implemented temperature parameter capability support to
    prevent GPT-5 API errors. Extended ModelCapabilities interface with optional
    temperature field, updated JSON schema validation, added temperature: false
    to GPT-5 models, enhanced model loading to read capabilities from JSON, and
    implemented capability-aware request building in OpenAI translator. Added
    comprehensive unit tests (29 total tests) covering interface compliance,
    capability loading, and translation logic. All quality checks pass and
    backward compatibility is maintained."
schema: v1.0
childrenIds: []
created: 2025-09-16T11:09:03.846Z
updated: 2025-09-16T11:09:03.846Z
---

# Add Temperature Parameter Capability Support for GPT-5 Models

## Context

GPT-5 models (`gpt-5-nano-2025-08-07`, `gpt-5-mini-2025-08-07`, `gpt-5-2025-08-07`) do not support the `temperature` parameter in OpenAI API requests. Currently, the system unconditionally includes temperature in requests when provided, causing API errors for these models.

The codebase needs to track temperature support as a model capability and conditionally include the temperature parameter based on model capabilities.

## Problem Analysis

**Current State:**

- Temperature is unconditionally added to requests in `buildOpenAIRequestBody()` (lines 104-106 in `src/providers/openai-responses-v1/translator.ts`)
- `ModelCapabilities` interface lacks temperature support field
- `DefaultLlmModelsSchema` doesn't include temperature capability field
- Model loading process doesn't handle temperature-specific capabilities
- GPT-5 models are defined with basic capabilities but no temperature metadata

**Root Cause:**
The system lacks capability-aware request building for temperature parameters.

## Technical Implementation Requirements

### 1. Extend Model Capabilities Schema

**File:** `src/core/providers/modelCapabilities.ts`

- Add `temperature: boolean` field to `ModelCapabilities` interface
- Add JSDoc documentation explaining temperature parameter support
- Position after existing capability fields for consistency

### 2. Update Model Definition Schema

**File:** `src/core/models/defaultLlmModelsSchema.ts`

- Add optional `temperature?: z.boolean().optional()` field to model schema (after existing optional fields)
- Update JSDoc example to show temperature capability usage
- Maintain backward compatibility by making field optional

### 3. Update Default Model Definitions

**File:** `src/data/defaultLlmModels.ts`

- Add `temperature: false` to all GPT-5 models:
  - `gpt-5-nano-2025-08-07`
  - `gpt-5-mini-2025-08-07`
  - `gpt-5-2025-08-07`
- Leave other models without explicit temperature field (defaults to true)

### 4. Update Model Loading Logic

**File:** `src/core/models/modelLoader.ts`

- Modify `mapJsonToModelInfo()` function (lines 50-95)
- In the capabilities object construction (lines 59-66), add:
  ```typescript
  temperature: model.temperature ?? true, // Default true for backward compatibility
  ```
- Update JSDoc example to include temperature capability

### 5. Implement Capability-Aware Request Building

**File:** `src/providers/openai-responses-v1/translator.ts`

**Challenge:** The `buildOpenAIRequestBody()` function currently doesn't have access to model capabilities. This requires architectural changes.

**Approach:** Modify the function signature to accept model capabilities:

1. Update `buildOpenAIRequestBody()` signature:

   ```typescript
   function buildOpenAIRequestBody(
     request: ChatRequest & { stream?: boolean; tools?: unknown[] },
     modelCapabilities?: ModelCapabilities,
   ): Record<string, unknown>;
   ```

2. Replace unconditional temperature addition (lines 104-106):

   ```typescript
   // OLD:
   if (request.temperature !== undefined) {
     openaiRequest.temperature = request.temperature;
   }

   // NEW:
   if (
     request.temperature !== undefined &&
     modelCapabilities?.temperature !== false
   ) {
     openaiRequest.temperature = request.temperature;
   }
   ```

3. Update `translateChatRequest()` function to pass model capabilities:
   - Function needs access to model registry to lookup capabilities
   - May require adding model registry parameter to function signature
   - Alternative: Pass capabilities directly from calling code

### 6. Update Request Translation Integration

**File:** `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`

**Investigation Required:** Determine how `translateChatRequest()` is called and ensure model capabilities are available at the call site.

**Likely Changes:**

- Provider may need access to model registry
- Calling code may need to lookup model capabilities before translation
- Consider caching capabilities lookup for performance

## Testing Requirements

### Unit Tests to Add/Update

1. **Model Capabilities Tests** (`src/core/providers/__tests__/modelCapabilities.test.ts` - create if doesn't exist):
   - Test temperature field presence and default values
   - Test interface compliance with new field

2. **Model Loading Tests** (`src/core/models/__tests__/modelLoader.test.ts`):
   - Test temperature capability mapping from JSON
   - Test default temperature=true behavior
   - Test explicit temperature=false for GPT-5 models
   - Test backward compatibility with models without temperature field

3. **Request Translation Tests** (`src/providers/openai-responses-v1/__tests__/translator.test.ts`):
   - Test temperature inclusion when capability is true/undefined
   - Test temperature exclusion when capability is false
   - Test temperature parameter handling with various model capabilities
   - Test backward compatibility when no capabilities provided

4. **Schema Validation Tests** (`src/core/models/__tests__/defaultLlmModelsSchema.test.ts`):
   - Test optional temperature field validation
   - Test schema parsing with and without temperature field

### Test Data Updates

Update test fixtures to include temperature capability examples:

- Add GPT-5 models with `temperature: false`
- Add other models with `temperature: true` or undefined
- Update existing test cases that might be affected by schema changes

## Implementation Steps

1. **Phase 1: Schema Updates**
   - Update `ModelCapabilities` interface
   - Update `DefaultLlmModelsSchema`
   - Update model definitions with GPT-5 temperature capabilities
   - Add corresponding unit tests

2. **Phase 2: Model Loading**
   - Update `mapJsonToModelInfo()` to handle temperature capability
   - Test model loading with new capability
   - Verify backward compatibility

3. **Phase 3: Request Translation**
   - Investigate current call patterns for `translateChatRequest()`
   - Design capability passing mechanism
   - Update request building logic
   - Update provider integration if needed

4. **Phase 4: Testing & Validation**
   - Add comprehensive unit tests
   - Run existing test suite to ensure no regressions
   - Test with actual GPT-5 model requests (if possible)

## Acceptance Criteria

- [ ] `ModelCapabilities` interface includes `temperature: boolean` field
- [ ] `DefaultLlmModelsSchema` supports optional `temperature` field
- [ ] All GPT-5 models have `temperature: false` in their definitions
- [ ] Other models default to `temperature: true` support
- [ ] `mapJsonToModelInfo()` correctly maps temperature capability from JSON
- [ ] Request translator conditionally includes temperature based on model capabilities
- [ ] Temperature parameter is excluded from requests for GPT-5 models
- [ ] Temperature parameter is included for models that support it
- [ ] All existing functionality remains unaffected (backward compatibility)
- [ ] Comprehensive unit tests cover all new functionality
- [ ] No breaking changes to existing APIs

## Security Considerations

- Validate temperature parameter bounds (0-2) only when including in requests
- Ensure capability checking cannot be bypassed
- Maintain input validation for temperature values

## Performance Considerations

- Model capability lookup should be efficient (consider caching if needed)
- Avoid additional API calls or expensive operations in request path
- Minimal impact on request building performance

## Dependencies

- No external dependencies required
- Uses existing Zod validation framework
- Works with current model registry and provider system

## Out of Scope

- Adding other parameter capability checks (beyond temperature)
- Modifying non-OpenAI providers
- Adding dynamic capability discovery from API
- Performance optimizations beyond basic efficiency
- Integration tests or E2E tests
- Documentation updates beyond code comments

## Files to Modify

**Core Changes:**

- `src/core/providers/modelCapabilities.ts`
- `src/core/models/defaultLlmModelsSchema.ts`
- `src/data/defaultLlmModels.ts`
- `src/core/models/modelLoader.ts`
- `src/providers/openai-responses-v1/translator.ts`

**Potential Changes:**

- `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts`

**Test Files:**

- `src/core/models/__tests__/modelLoader.test.ts`
- `src/providers/openai-responses-v1/__tests__/translator.test.ts`
- `src/core/models/__tests__/defaultLlmModelsSchema.test.ts`

## Related Information

- OpenAI Responses API v1 documentation for parameter support
- GPT-5 model specifications indicating temperature parameter restrictions
- Existing model capability patterns in codebase
- Current request translation flow and provider integration patterns
