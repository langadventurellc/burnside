export function getTestModel(): string {
  return process.env.E2E_OPENAI_MODEL || "openai:gpt-5-nano-2025-08-07";
}
