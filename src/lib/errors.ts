export function publicErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    const message = error.message;
    const blocked = /service.role|jwt|token|password|api key|secret/i.test(message);
    if (blocked) return fallback;
    if (message.length > 180) return fallback;
    return message;
  }
  return fallback;
}
