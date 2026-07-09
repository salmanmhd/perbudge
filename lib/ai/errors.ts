/**
 * Turn a raw Gemini/SDK error into a short, honest, user-facing reason.
 * Keeps the "why" (denied key, quota, bad key) instead of a generic message,
 * so an operator can actually fix it.
 */
export function aiErrorMessage(error: any, fallback = "The AI service hit an error."): string {
  const status = error?.status ?? error?.code;
  const msg = String(error?.message || "");

  if (status === 403 || msg.includes("PERMISSION_DENIED")) {
    return "AI is unavailable: this Gemini API key/project is denied access. Add a valid GEMINI_API_KEY (Gemini API enabled, not blocked).";
  }
  if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
    return "AI is unavailable: Gemini quota/rate limit reached. Try again later or enable billing on the key.";
  }
  if ((status === 400 && /api key/i.test(msg)) || /API_KEY_INVALID/i.test(msg)) {
    return "AI is unavailable: the GEMINI_API_KEY is missing or invalid.";
  }
  return fallback;
}
