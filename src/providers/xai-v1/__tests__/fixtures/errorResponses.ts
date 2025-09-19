/**
 * Test fixtures for xAI error responses
 *
 * Contains sample error response objects for testing error handling
 * in the response parser with various error scenarios.
 */

// Helper function to create properly structured content parts
function createErrorFixtureContentPart(
  text: string,
  annotations?: unknown[],
  logprobs?: unknown[],
) {
  return {
    type: "output_text" as const,
    text,
    annotations: annotations || null,
    logprobs: logprobs || null,
  };
}

// Helper function to create base response fields that are now required/nullable
function createErrorBaseFixtureFields(overrides: any = {}) {
  return {
    max_output_tokens: null,
    metadata: null,
    previous_response_id: null,
    temperature: null,
    top_p: null,
    user: null,
    incomplete_details: null,
    debug_output: {
      attempts: 1,
      cache_read_count: 0,
      cache_read_input_bytes: 0,
      cache_write_count: 0,
      cache_write_input_bytes: 0,
      engine_request: "req_123",
      lb_address: "10.0.0.1",
      prompt: "Hello",
      request: "original_request",
      responses: [],
      sampler_tag: "default",
    },
    reasoning: {
      effort: null,
      generate_summary: false,
      summary: null,
    },
    store: false,
    parallel_tool_calls: false,
    text: {
      format: {
        type: "text",
      },
    },
    ...overrides,
  };
}

export const emptyResponse = "";

export const invalidJsonResponse = "{ invalid json";

export const nonObjectResponse = '"this is a string not an object"';

export const emptyOutputArrayResponse = {
  id: "resp_empty_output",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [],
  tool_choice: "auto",
  tools: [],
  ...createErrorBaseFixtureFields(),
};

export const noMessageTypeResponse = {
  id: "resp_no_supported_output",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "unsupported_only",
      type: "unsupported_type",
      data: "Unknown output type",
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createErrorBaseFixtureFields(),
};

export const malformedToolCallsResponse = {
  id: "resp_bad_tools",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [
        createErrorFixtureContentPart("Response with malformed tool calls."),
      ],
      tool_calls: [
        {
          id: "call_malformed",
          type: "function",
          function: {
            name: "test_function",
            arguments: "{ invalid json arguments",
          },
        },
      ],
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createErrorBaseFixtureFields(),
};

export const invalidToolCallStructureResponse = {
  id: "resp_invalid_tool_structure",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [
        createErrorFixtureContentPart(
          "Response with invalid tool call structure.",
        ),
      ],
      tool_calls: [
        {
          // Missing required fields
          type: "function",
        },
      ],
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createErrorBaseFixtureFields(),
};

export const missingRequiredFieldsResponse = {
  object: "completion",
  status: "completed",
  // Missing id and model fields
  output: [
    {
      type: "message",
      role: "assistant",
      content: [createErrorFixtureContentPart("Missing required fields.")],
    },
  ],
  tool_choice: "auto",
  tools: [],
  ...createErrorBaseFixtureFields(),
};
