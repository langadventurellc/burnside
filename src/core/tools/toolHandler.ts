/**
 * Tool Handler Interface
 *
 * Function signature interface for tool execution handlers.
 * Defines the contract for implementing tool functionality that can be
 * invoked by LLM providers through the bridge.
 *
 * @example
 * ```typescript
 * const weatherHandler: ToolHandler = async (params, context) => {
 *   const { location } = params;
 *   const weather = await fetchWeather(location);
 *   return { temperature: weather.temp, condition: weather.condition };
 * };
 * ```
 */
export interface ToolHandler {
  /**
   * Execute the tool with given parameters and context
   * @param parameters - Input parameters for the tool execution
   * @param context - Execution context providing environment information
   * @returns Promise resolving to the tool execution result
   */
  (parameters: Record<string, unknown>, context: unknown): Promise<unknown>;
}
