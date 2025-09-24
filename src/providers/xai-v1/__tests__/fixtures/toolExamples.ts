/**
 * Test fixtures for xAI tool translation validation
 *
 * Provides comprehensive test cases covering various ToolDefinition formats
 * and their expected xAI tool format translations for contract validation.
 * xAI uses OpenAI-compatible tool format.
 */

import { z } from "zod";
import type { ToolDefinition } from "../../../../core/tools/toolDefinition";
import type { XAITool } from "../../xaiTool";

/**
 * Simple echo tool definition with basic string parameter
 */
export const simpleEchoToolDefinition: ToolDefinition = {
  name: "echo_tool",
  description: "Echo back the provided input data",
  inputSchema: z.object({
    data: z.string().min(1, "Data is required"),
  }),
  outputSchema: z.object({
    echoed: z.string(),
    timestamp: z.string(),
  }),
};

/**
 * Complex weather tool definition with object parameters, optional fields, and enums
 */
export const complexWeatherToolDefinition: ToolDefinition = {
  name: "get_weather_forecast",
  description: "Get detailed weather forecast for a specific location",
  inputSchema: z.object({
    location: z.string().min(1, "Location is required"),
    units: z.enum(["celsius", "fahrenheit"]).optional(),
    days: z.int().min(1).max(7).prefault(3),
    includeHourly: z.boolean().optional(),
    alerts: z
      .object({
        severe: z.boolean().prefault(true),
        precipitation: z.boolean().prefault(false),
      })
      .optional(),
  }),
  outputSchema: z.object({
    location: z.string(),
    forecast: z.array(
      z.object({
        date: z.string(),
        temperature: z.object({
          high: z.number(),
          low: z.number(),
        }),
        conditions: z.string(),
      }),
    ),
  }),
};

/**
 * Tool definition using xAI provider hints override
 */
export const toolWithHintsDefinition: ToolDefinition = {
  name: "custom_calculation",
  description: "Perform custom mathematical calculation",
  inputSchema: z.object({
    expression: z.string(),
  }),
  hints: {
    xai: {
      function: {
        name: "calculate_math_expression",
        description: "Execute a mathematical expression and return the result",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "Mathematical expression to evaluate",
            },
          },
          required: ["expression"],
          additionalProperties: false,
        },
      },
    },
  },
};

/**
 * Expected xAI format for simple echo tool
 */
export const expectedXAIEchoTool: XAITool = {
  type: "function",
  name: "echo_tool",
  description: "Echo back the provided input data",
  parameters: {
    type: "object",
    properties: {
      data: {
        type: "string",
        minLength: 1,
      },
    },
    required: ["data"],
    additionalProperties: false,
  },
};

/**
 * Expected xAI format for complex weather tool
 */
export const expectedXAIWeatherTool: XAITool = {
  type: "function",
  name: "get_weather_forecast",
  description: "Get detailed weather forecast for a specific location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        minLength: 1,
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
      },
      days: {
        type: "integer",
        minimum: 1,
        maximum: 7,
      },
      includeHourly: {
        type: "boolean",
      },
      alerts: {
        type: "object",
        properties: {
          severe: {
            type: "boolean",
          },
          precipitation: {
            type: "boolean",
          },
        },
        required: ["severe", "precipitation"],
        additionalProperties: false,
      },
    },
    required: ["location", "days"],
    additionalProperties: false,
  },
};

/**
 * Expected xAI format when using hints override
 */
export const expectedXAIHintsTool: XAITool = {
  type: "function",
  name: "calculate_math_expression",
  description: "Execute a mathematical expression and return the result",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Mathematical expression to evaluate",
      },
    },
    required: ["expression"],
    additionalProperties: false,
  },
};

/**
 * Tool definition examples for comprehensive testing
 */
export const toolDefinitionExamples = [
  simpleEchoToolDefinition,
  complexWeatherToolDefinition,
  toolWithHintsDefinition,
];
