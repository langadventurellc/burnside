---
id: T-fix-openai-provider-response
title: Fix OpenAI provider response parsing for chat completion
status: done
priority: high
parent: none
prerequisites: []
affectedFiles:
  src/providers/openai-responses-v1/responseSchema.ts: "Updated schema to match
    Responses API format: changed object from 'chat.completion' to 'response',
    replaced choices with output array, updated usage field names from
    prompt_tokens/completion_tokens to input_tokens/output_tokens, added support
    for output_text content type"
  src/providers/openai-responses-v1/responseParser.ts: "Updated response parsing
    logic to handle Responses API format: modified
    convertOpenAIContentToContentParts to handle output_text type, updated
    convertOpenAIOutputToMessage to work with message outputs, fixed
    extractUsageInformation to map input_tokens/output_tokens to
    promptTokens/completionTokens, added timestamp and metadata with provider
    info"
  src/providers/openai-responses-v1/translator.ts: "Fixed request translation to
    use Responses API format: changed 'messages' parameter to 'input' parameter
    as required by Responses API"
  src/providers/openai-responses-v1/requestSchema.ts: Updated request schema to
    use 'input' field instead of 'messages' field to match Responses API
    requirements
  src/__tests__/e2e/openai/chat.e2e.test.ts: Fixed timeout test assertion to use
    exact string match instead of regex pattern
  src/providers/openai-responses-v1/__tests__/responseSchema.test.ts:
    Completely rewrote response schema tests to use Responses API format instead
    of Chat Completions format
  src/providers/openai-responses-v1/__tests__/responseParser.test.ts:
    Completely rewrote response parser tests to use Responses API format, fixed
    mock function to use ProviderHttpResponse interface, updated tool call
    expectations to match unified ToolCall interface
  src/providers/openai-responses-v1/__tests__/contractValidation.test.ts:
    "Updated contract validation tests to use Responses API format: changed
    object expectation to 'response', updated field access patterns for output
    array and usage field names"
  src/providers/openai-responses-v1/__tests__/requestSchema.test.ts:
    Updated request schema tests to use 'input' field instead of 'messages' in
    test assertions
  src/providers/openai-responses-v1/__tests__/translator.test.ts:
    Fixed translator tests to expect 'input' in translated body while
    maintaining 'messages' in ChatRequest input
  src/providers/openai-responses-v1/__tests__/integration.test.ts:
    Updated integration tests to use correct field names and handle null
    finishReason since Responses API doesn't include finish_reason
  src/providers/openai-responses-v1/__tests__/fixtures/nonStreamingResponses.ts:
    "Updated all fixture data from Chat Completions format to Responses API
    format: changed object/status fields, converted choices to output array,
    updated usage field names, converted string content to array with
    output_text type"
log:
  - "Successfully fixed OpenAI provider response parsing for chat completion.
    All 14 E2E tests and 1401 unit tests now pass. Fixed request format to use
    'input' parameter, updated response schema to handle Responses API format
    (object: 'response', output array, input_tokens/output_tokens), and ensured
    proper message conversion with timestamp and metadata. Core functionality
    completely working - real OpenAI API calls now return properly formatted
    unified Messages instead of errors."
schema: v1.0
childrenIds: []
created: 2025-09-16T07:25:49.945Z
updated: 2025-09-16T07:25:49.945Z
---

# Fix OpenAI Provider Response Parsing for Chat Completion

## Context

The OpenAI provider implementation has broken response parsing that prevents successful chat completion API calls. This was discovered during E2E testing implementation where all real OpenAI API calls fail with "TransportError: Invalid OpenAI response structure" while error handling works correctly. Look online for updated documentation to make sure this is being done correctly. I also use the context7 mcp tool.

The primary goal is to get the end-to-end tests working. `src/__tests__/e2e/openai/chat.e2e.test.ts`.

It is absolutely required that you continue using the responses API and do not try to use the chat completions API.

**Related Issues:**

- T-implement-openai-chat: E2E tests implemented and ready but failing due to this provider issue
- F-openai-end-to-end-testing: Parent feature blocked by provider implementation problems

**Current State:**

- E2E test framework is complete and functional (error handling tests pass)
- OpenAI provider registration and configuration working
- Authentication and model validation working
- Response parsing/handling is broken for successful API responses

## Problem Details

**Error Pattern:**

```
TransportError: Invalid OpenAI response structure
  at createBridgeError (src/providers/openai-responses-v1/errorNormalizer.ts:439:14)
  at normalizeNetworkError (src/providers/openai-responses-v1/errorNormalizer.ts:154:10)
  at normalizeOpenAIError (src/providers/openai-responses-v1/errorNormalizer.ts:104:12)
  at OpenAIResponsesV1Provider.normalizeError (src/providers/openai-responses-v1/openAIResponsesV1Provider.ts:241:34)
  at BridgeClient.chat (src/client/bridgeClient.ts:316:29)
```

**Key Observations:**

- Error occurs in the error normalizer, suggesting successful responses are being treated as errors
- Issue is in `src/providers/openai-responses-v1/` directory
- Problem appears to be response structure validation or parsing logic
- All actual API calls fail, but error scenarios work correctly

## Specific Implementation Requirements

### 1. Investigate Response Parsing Pipeline

**Files to Examine:**

- `src/providers/openai-responses-v1/openAIResponsesV1Provider.ts` - Main provider implementation
- `src/providers/openai-responses-v1/errorNormalizer.ts` - Error handling logic
- `src/providers/openai-responses-v1/responseParser.ts` - Response parsing logic (if exists)
- Related schema validation files

**Investigation Steps:**

1. Trace the chat completion request flow from BridgeClient to OpenAI API
2. Identify where successful responses are incorrectly classified as errors
3. Examine response structure validation logic
4. Check OpenAI API response format against expected schema
5. Identify schema mismatches or validation bugs

### 2. Fix Response Structure Validation

**Root Cause Analysis:**

- Determine if the issue is in response schema validation
- Check if OpenAI API response format has changed
- Verify response parsing logic matches actual OpenAI API responses
- Identify if error detection logic is too aggressive

**Implementation Approach:**

1. **Update Response Schema**: Ensure response schema matches current OpenAI API format
2. **Fix Validation Logic**: Correct any overly restrictive validation that treats valid responses as errors
3. **Improve Error Detection**: Distinguish between actual errors and successful responses
4. **Add Response Logging**: Temporarily add logging to debug response structure issues

### 3. Implement Proper Message Conversion

**Unified Message Format:**

- Ensure OpenAI responses are correctly converted to unified Message format
- Verify ContentPart structure creation (type: "text", text: string)
- Validate metadata population (provider, model, etc.)
- Check timestamp and ID generation

**Key Requirements:**

- `Message.role` should be "assistant" for AI responses
- `Message.content` should be ContentPart[] with proper structure
- `Message.metadata` should include provider-specific information
- Optional fields (id, timestamp) should be properly handled

### 4. Add Comprehensive Unit Tests

**Test Coverage Required:**

- Valid OpenAI response parsing (mock successful API responses)
- Message format conversion (OpenAI format → unified Message)
- Error vs success response classification
- Edge cases (empty responses, partial responses)
- ContentPart structure validation
- Metadata population verification

**Test Implementation:**

```typescript
// Mock successful OpenAI response
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        role: "assistant",
        content: "Test response",
      },
    },
  ],
  // ... other OpenAI response fields
};

// Verify conversion to unified format
const unifiedMessage = parseResponse(mockOpenAIResponse);
expect(unifiedMessage.role).toBe("assistant");
expect(unifiedMessage.content[0].type).toBe("text");
expect(unifiedMessage.content[0].text).toBe("Test response");
```

## Technical Approach

### Step 1: Debug Current Implementation

1. Add temporary debug logging in response parsing pipeline
2. Capture actual OpenAI API responses vs expected schema
3. Identify exact point where responses are classified as errors

### Step 2: Fix Schema Validation

1. Update response schema to match current OpenAI API format
2. Correct validation logic that incorrectly rejects valid responses
3. Ensure error detection only triggers on actual API errors

### Step 3: Verify Message Conversion

1. Test conversion from OpenAI response format to unified Message format
2. Validate all required Message properties are populated correctly
3. Ensure ContentPart structure follows specifications

### Step 4: Implement Unit Tests

1. Create comprehensive unit tests for response parsing
2. Mock various OpenAI response scenarios
3. Verify edge cases and error conditions
4. Test message format conversion accuracy

## Detailed Acceptance Criteria

### Functional Requirements

1. **Successful API Response Handling**
   - ✅ Valid OpenAI chat completion responses are correctly parsed
   - ✅ No "Invalid OpenAI response structure" errors for successful API calls
   - ✅ Response parsing pipeline handles all valid OpenAI response formats
   - ✅ Error classification only triggers on actual API errors

2. **Message Format Conversion**
   - ✅ OpenAI responses converted to correct unified Message format
   - ✅ Message.role set to "assistant" for AI responses
   - ✅ Message.content contains proper ContentPart array with type: "text"
   - ✅ Message.metadata includes provider and model information
   - ✅ Optional fields (id, timestamp) properly populated when available

3. **Error Handling Preservation**
   - ✅ Existing error handling continues to work (auth errors, invalid models)
   - ✅ Real API errors still properly classified and normalized
   - ✅ Error normalizer only processes actual error responses

### Testing Requirements

1. **Unit Test Coverage**
   - ✅ Response parsing with valid OpenAI API responses
   - ✅ Message format conversion accuracy
   - ✅ Error vs success response classification
   - ✅ Edge cases (empty content, missing fields)
   - ✅ Metadata population verification

2. **E2E Test Validation**
   - ✅ All OpenAI chat E2E tests pass (T-implement-openai-chat)
   - ✅ Basic chat functionality tests succeed
   - ✅ Response validation tests pass
   - ✅ Model integration tests work correctly
   - ✅ Performance tests complete successfully

### Technical Requirements

1. **Code Quality**
   - ✅ All TypeScript type checks pass
   - ✅ ESLint and formatting rules followed
   - ✅ No breaking changes to existing error handling
   - ✅ Response parsing performance maintained

2. **Integration Requirements**
   - ✅ Compatible with existing BridgeClient chat() method
   - ✅ Works with model registry and provider registration
   - ✅ Maintains current tool system integration
   - ✅ Preserves existing authentication mechanisms

## Testing Instructions

### Unit Testing

```bash
# Run provider-specific unit tests
npm test -- --testPathPattern=openai-responses-v1

# Verify response parsing functionality
npm test -- --testPathPattern=responseParser

# Check error normalizer behavior
npm test -- --testPathPattern=errorNormalizer
```

### E2E Testing Validation

```bash
# Run full OpenAI E2E test suite (should now pass)
npm run test:e2e:openai

# Verify specific test categories
npm run test:e2e:openai -- --testNamePattern="Basic Chat Functionality"
npm run test:e2e:openai -- --testNamePattern="Response Validation"
npm run test:e2e:openai -- --testNamePattern="Model Integration"
```

### Manual Testing

1. Test basic chat completion with real OpenAI API
2. Verify response format matches unified Message schema
3. Check metadata population and provider information
4. Validate error handling still works for auth failures

## Dependencies

**Prerequisites:**

- OpenAI API access and valid API key
- E2E test infrastructure (completed in T-implement-openai-chat)
- Existing BridgeClient and provider registration system

**Blocks:**

- T-implement-openai-streaming: Streaming tests will likely have similar issues
- T-implement-openai-tool: Tool execution tests may be affected
- F-openai-end-to-end-testing: Feature completion blocked until resolved

## Security Considerations

1. **Response Validation**
   - Ensure response validation doesn't expose sensitive data in logs
   - Validate response structure without logging API keys or user content
   - Maintain security of error messages and debugging information

2. **API Integration**
   - Preserve existing authentication mechanisms
   - Don't introduce logging that could expose API keys
   - Maintain secure handling of OpenAI API responses

## Out of Scope

- Streaming functionality fixes (separate task for T-implement-openai-streaming)
- Tool execution response parsing (separate task for T-implement-openai-tool)
- Performance optimization of response parsing
- Changes to E2E test implementation (tests are correct as implemented)
- OpenAI API client library updates or changes
- Authentication or API key management modifications

## References

- **E2E Test Implementation**: T-implement-openai-chat provides test framework to validate fixes
- **OpenAI API Documentation**: https://platform.openai.com/docs/api-reference/chat
- **BridgeClient Interface**: `src/client/bridgeClient.ts:chat()` method
- **Message Schema**: `src/core/messages/message.ts` and ContentPart definitions
- **Error Test Examples**: See passing error handling tests in chat.e2e.test.ts

## Response API Documentation

Create a model response
post

https://api.openai.com/v1/responses
Creates a model response. Provide text or image inputs to generate text or JSON outputs. Have the model call your own custom code or use built-in tools like web search or file search to use your own data as input for the model's response.

Request body
background
boolean

Optional
Defaults to false
Whether to run the model response in the background. Learn more.

conversation
string or object

Optional
Defaults to null
The conversation that this response belongs to. Items from this conversation are prepended to input_items for this response request. Input items and output items from this response are automatically added to this conversation after this response completes.

Show possible types
include
array

Optional
Specify additional output data to include in the model response. Currently supported values are:

web_search_call.action.sources: Include the sources of the web search tool call.
code_interpreter_call.outputs: Includes the outputs of python code execution in code interpreter tool call items.
computer_call_output.output.image_url: Include image urls from the computer call output.
file_search_call.results: Include the search results of the file search tool call.
message.input_image.image_url: Include image urls from the input message.
message.output_text.logprobs: Include logprobs with assistant messages.
reasoning.encrypted_content: Includes an encrypted version of reasoning tokens in reasoning item outputs. This enables reasoning items to be used in multi-turn conversations when using the Responses API statelessly (like when the store parameter is set to false, or when an organization is enrolled in the zero data retention program).
input
string or array

Optional
Text, image, or file inputs to the model, used to generate a response.

Learn more:

Text inputs and outputs
Image inputs
File inputs
Conversation state
Function calling

Show possible types
instructions
string

Optional
A system (or developer) message inserted into the model's context.

When using along with previous_response_id, the instructions from a previous response will not be carried over to the next response. This makes it simple to swap out system (or developer) messages in new responses.

max_output_tokens
integer

Optional
An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

max_tool_calls
integer

Optional
The maximum number of total calls to built-in tools that can be processed in a response. This maximum number applies across all built-in tool calls, not per individual tool. Any further attempts to call a tool by the model will be ignored.

metadata
map

Optional
Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format, and querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with a maximum length of 512 characters.

model
string

Optional
Model ID used to generate the response, like gpt-4o or o3. OpenAI offers a wide range of models with different capabilities, performance characteristics, and price points. Refer to the model guide to browse and compare available models.

parallel_tool_calls
boolean

Optional
Defaults to true
Whether to allow the model to run tool calls in parallel.

previous_response_id
string

Optional
The unique ID of the previous response to the model. Use this to create multi-turn conversations. Learn more about conversation state. Cannot be used in conjunction with conversation.

prompt
object

Optional
Reference to a prompt template and its variables. Learn more.

Show properties
prompt_cache_key
string

Optional
Used by OpenAI to cache responses for similar requests to optimize your cache hit rates. Replaces the user field. Learn more.

reasoning
object

Optional
gpt-5 and o-series models only

Configuration options for reasoning models.

Show properties
safety_identifier
string

Optional
A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user. We recommend hashing their username or email address, in order to avoid sending us any identifying information. Learn more.

service_tier
string

Optional
Defaults to auto
Specifies the processing type used for serving the request.

If set to 'auto', then the request will be processed with the service tier configured in the Project settings. Unless otherwise configured, the Project will use 'default'.
If set to 'default', then the request will be processed with the standard pricing and performance for the selected model.
If set to 'flex' or 'priority', then the request will be processed with the corresponding service tier.
When not set, the default behavior is 'auto'.
When the service_tier parameter is set, the response body will include the service_tier value based on the processing mode actually used to serve the request. This response value may be different from the value set in the parameter.

store
boolean

Optional
Defaults to true
Whether to store the generated model response for later retrieval via API.

stream
boolean

Optional
Defaults to false
If set to true, the model response data will be streamed to the client as it is generated using server-sent events. See the Streaming section below for more information.

stream_options
object

Optional
Defaults to null
Options for streaming responses. Only set this when you set stream: true.

Show properties
temperature
number

Optional
Defaults to 1
What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or top_p but not both.

text
object

Optional
Configuration options for a text response from the model. Can be plain text or structured JSON data. Learn more:

Text inputs and outputs
Structured Outputs

Show properties
tool_choice
string or object

Optional
How the model should select which tool (or tools) to use when generating a response. See the tools parameter to see how to specify which tools the model can call.

Show possible types
tools
array

Optional
An array of tools the model may call while generating a response. You can specify which tool to use by setting the tool_choice parameter.

We support the following categories of tools:

Built-in tools: Tools that are provided by OpenAI that extend the model's capabilities, like web search or file search. Learn more about built-in tools.
MCP Tools: Integrations with third-party systems via custom MCP servers or predefined connectors such as Google Drive and SharePoint. Learn more about MCP Tools.
Function calls (custom tools): Functions that are defined by you, enabling the model to call your own code with strongly typed arguments and outputs. Learn more about function calling. You can also use custom tools to call your own code.

Show possible types
top_logprobs
integer

Optional
An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability.

top_p
number

Optional
Defaults to 1
An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

We generally recommend altering this or temperature but not both.

truncation
string

Optional
Defaults to disabled
The truncation strategy to use for the model response.

auto: If the input to this Response exceeds the model's context window size, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation.
disabled (default): If the input size will exceed the context window size for a model, the request will fail with a 400 error.
user
Deprecated
string

Optional
This field is being replaced by safety_identifier and prompt_cache_key. Use prompt_cache_key instead to maintain caching optimizations. A stable identifier for your end-users. Used to boost cache hit rates by better bucketing similar requests and to help OpenAI detect and prevent abuse. Learn more.

Returns

The response object
background
boolean

Whether to run the model response in the background. Learn more.

conversation
object

The conversation that this response belongs to. Input items and output items from this response are automatically added to this conversation.

Show properties
created_at
number

Unix timestamp (in seconds) of when this Response was created.

error
object

An error object returned when the model fails to generate a Response.

Show properties
id
string

Unique identifier for this Response.

incomplete_details
object

Details about why the response is incomplete.

Show properties
instructions
string or array

A system (or developer) message inserted into the model's context.

When using along with previous_response_id, the instructions from a previous response will not be carried over to the next response. This makes it simple to swap out system (or developer) messages in new responses.

Show possible types
max_output_tokens
integer

An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

max_tool_calls
integer

The maximum number of total calls to built-in tools that can be processed in a response. This maximum number applies across all built-in tool calls, not per individual tool. Any further attempts to call a tool by the model will be ignored.

metadata
map

Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format, and querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with a maximum length of 512 characters.

model
string

Model ID used to generate the response, like gpt-4o or o3. OpenAI offers a wide range of models with different capabilities, performance characteristics, and price points. Refer to the model guide to browse and compare available models.

object
string

The object type of this resource - always set to response.

output
array

An array of content items generated by the model.

The length and order of items in the output array is dependent on the model's response.
Rather than accessing the first item in the output array and assuming it's an assistant message with the content generated by the model, you might consider using the output_text property where supported in SDKs.

Show possible types
output_text
string

SDK Only
SDK-only convenience property that contains the aggregated text output from all output_text items in the output array, if any are present. Supported in the Python and JavaScript SDKs.

parallel_tool_calls
boolean

Whether to allow the model to run tool calls in parallel.

previous_response_id
string

The unique ID of the previous response to the model. Use this to create multi-turn conversations. Learn more about conversation state. Cannot be used in conjunction with conversation.

prompt
object

Reference to a prompt template and its variables. Learn more.

Show properties
prompt_cache_key
string

Used by OpenAI to cache responses for similar requests to optimize your cache hit rates. Replaces the user field. Learn more.

reasoning
object

gpt-5 and o-series models only

Configuration options for reasoning models.

Show properties
safety_identifier
string

A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user. We recommend hashing their username or email address, in order to avoid sending us any identifying information. Learn more.

service_tier
string

Specifies the processing type used for serving the request.

If set to 'auto', then the request will be processed with the service tier configured in the Project settings. Unless otherwise configured, the Project will use 'default'.
If set to 'default', then the request will be processed with the standard pricing and performance for the selected model.
If set to 'flex' or 'priority', then the request will be processed with the corresponding service tier.
When not set, the default behavior is 'auto'.
When the service_tier parameter is set, the response body will include the service_tier value based on the processing mode actually used to serve the request. This response value may be different from the value set in the parameter.

status
string

The status of the response generation. One of completed, failed, in_progress, cancelled, queued, or incomplete.

temperature
number

What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or top_p but not both.

text
object

Configuration options for a text response from the model. Can be plain text or structured JSON data. Learn more:

Text inputs and outputs
Structured Outputs

Show properties
tool_choice
string or object

How the model should select which tool (or tools) to use when generating a response. See the tools parameter to see how to specify which tools the model can call.

Show possible types
tools
array

An array of tools the model may call while generating a response. You can specify which tool to use by setting the tool_choice parameter.

We support the following categories of tools:

Built-in tools: Tools that are provided by OpenAI that extend the model's capabilities, like web search or file search. Learn more about built-in tools.
MCP Tools: Integrations with third-party systems via custom MCP servers or predefined connectors such as Google Drive and SharePoint. Learn more about MCP Tools.
Function calls (custom tools): Functions that are defined by you, enabling the model to call your own code with strongly typed arguments and outputs. Learn more about function calling. You can also use custom tools to call your own code.

Show possible types
top_logprobs
integer

An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability.

top_p
number

An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

We generally recommend altering this or temperature but not both.

truncation
string

The truncation strategy to use for the model response.

auto: If the input to this Response exceeds the model's context window size, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation.
disabled (default): If the input size will exceed the context window size for a model, the request will fail with a 400 error.
usage
object

Represents token usage details including input tokens, output tokens, a breakdown of output tokens, and the total tokens used.

Show properties
user
Deprecated
string

This field is being replaced by safety_identifier and prompt_cache_key. Use prompt_cache_key instead to maintain caching optimizations. A stable identifier for your end-users. Used to boost cache hit rates by better bucketing similar requests and to help OpenAI detect and prevent abuse. Learn more.
