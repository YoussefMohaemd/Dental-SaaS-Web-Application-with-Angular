export function getApiErrorMessage(error: unknown, fallback: string): string {
  const root = asRecord(error);
  const responseError = asRecord(root?.["error"]);
  const candidates = [
    responseError?.["message"],
    asRecord(responseError?.["error"])?.["message"],
    root?.["message"],
  ];

  const message = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0,
  );

  return message?.trim() ?? fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
