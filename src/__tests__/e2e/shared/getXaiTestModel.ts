export function getXaiTestModel(): string {
  return process.env.E2E_XAI_MODEL || "xai:grok-3-mini";
}
