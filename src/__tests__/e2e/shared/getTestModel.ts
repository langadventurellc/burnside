export function getTestModel(): string {
  return process.env.E2E_OPENAI_MODEL || "openai:gpt-4o-2024-08-06";
}
