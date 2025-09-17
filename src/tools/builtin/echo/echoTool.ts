/**
 * Echo Tool Implementation
 *
 * Built-in Echo tool that accepts any JSON-serializable input parameters
 * and returns them in a structured format with execution metadata.
 * Serves as both a test tool and reference implementation for the tool system.
 */

import type { ToolDefinition } from "../../../core/tools/toolDefinition";
import type { ToolHandler } from "../../../core/tools/toolHandler";
import type { ToolExecutionContext } from "../../../core/tools/toolExecutionContext";
import { EchoInputSchema } from "./echoInputSchema";
import { EchoOutputSchema } from "./echoOutputSchema";
import type { EchoInput } from "./echoInputType";
import type { EchoOutput } from "./echoOutputType";

/**
 * Echo tool definition for registration with the tool system.
 * Includes provider-specific hints for OpenAI function calling integration.
 */
export const echoToolDefinition: ToolDefinition = {
  name: "echo",
  description: "Echo back the input parameters for testing and validation",
  inputSchema: EchoInputSchema,
  outputSchema: EchoOutputSchema,
  hints: {
    openai: {
      function: {
        name: "echo",
        description: "Echo back input for testing",
      },
    },
  },
};

/**
 * Echo tool handler implementation.
 * Validates input parameters and returns them with execution metadata.
 */
export const echoToolHandler: ToolHandler = (
  parameters: Record<string, unknown>,
  context: unknown,
): Promise<EchoOutput> => {
  try {
    // Validate input parameters against schema
    const validatedInput: EchoInput = EchoInputSchema.parse(parameters);

    // Extract execution context with safe defaults
    const execContext = context as ToolExecutionContext;
    const contextId =
      execContext?.sessionId || execContext?.userId || "unknown";

    // Return echoed input with metadata
    return Promise.resolve({
      echoed: validatedInput,
      metadata: {
        timestamp: new Date().toISOString(),
        contextId,
      },
    });
  } catch (error) {
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
