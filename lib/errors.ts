/** Message from an unknown thrown value (catch clauses are `unknown`). */
export function errorMessage(error: unknown, fallback = ""): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error || fallback;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}
