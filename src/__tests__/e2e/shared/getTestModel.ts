export function getTestModel(): string {
  return process.env.E2E_OPENAI_MODEL || "openai:gpt-4.1-nano-2025-04-14";
}
