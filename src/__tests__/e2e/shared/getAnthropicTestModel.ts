export function getAnthropicTestModel(): string {
  return process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-haiku-20240307";
}
