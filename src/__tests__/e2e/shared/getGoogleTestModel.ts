export function getGoogleTestModel(): string {
  return process.env.E2E_GOOGLE_MODEL || "google:gemini-2.0-flash-lite";
}
