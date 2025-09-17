export function getAnthropicTestModel(): string {
  return process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-5-haiku-latest";
}
