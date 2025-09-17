/**
 * Test fixtures for xAI error responses
 *
 * Contains sample error response objects for testing error handling
 * in the response parser with various error scenarios.
 */

export const emptyResponse = "";

export const invalidJsonResponse = "{ invalid json";

export const nonObjectResponse = '"this is a string not an object"';

export const emptyOutputArrayResponse = {
  id: "resp_empty_output",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [],
  text: {},
  tool_choice: "auto",
  tools: [],
};

export const noMessageTypeResponse = {
  id: "resp_no_message",
  object: "completion",
  status: "completed",
  model: "grok-3",
  output: [
    {
      id: "reasoning_only",
      type: "reasoning",
      summary: ["Only reasoning output"],
    },
  ],
  text: {},
  tool_choice: "auto",
  tools: [],
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
        {
          type: "output_text",
          text: "Response with malformed tool calls.",
        },
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
  text: {},
  tool_choice: "auto",
  tools: [],
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
        {
          type: "output_text",
          text: "Response with invalid tool call structure.",
        },
      ],
      tool_calls: [
        {
          // Missing required fields
          type: "function",
        },
      ],
    },
  ],
  text: {},
  tool_choice: "auto",
  tools: [],
};

export const missingRequiredFieldsResponse = {
  object: "completion",
  status: "completed",
  // Missing id and model fields
  output: [
    {
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: "Missing required fields.",
        },
      ],
    },
  ],
  text: {},
  tool_choice: "auto",
  tools: [],
};
