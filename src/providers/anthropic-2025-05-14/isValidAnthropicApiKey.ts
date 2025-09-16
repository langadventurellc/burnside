/**
 * Type guard to validate if a string is a valid Anthropic API key
 *
 * @param apiKey - The API key string to validate
 * @returns True if the API key has valid Anthropic format
 */
export function isValidAnthropicApiKey(apiKey: string): boolean {
  return (
    typeof apiKey === "string" &&
    apiKey.length > 0 &&
    apiKey.startsWith("sk-ant-")
  );
}
