export async function getEdgeFunctionErrorMessage(
  error: unknown,
  data: unknown,
  fallback: string,
): Promise<string> {
  if (data && typeof data === "object" && "error" in data && data.error) {
    return String(data.error);
  }

  if (error && typeof error === "object" && "context" in error) {
    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const body = await response.json();
        if (body?.error) {
          return String(body.error);
        }
        if (body?.message) {
          return String(body.message);
        }
      }
    } catch {
      // Ignore JSON parse errors and fall through.
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
