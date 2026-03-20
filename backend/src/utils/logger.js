export function logInfo(message, meta) {
  // Keep it simple; swap for Winston/Pino later if needed.
  // eslint-disable-next-line no-console
  console.log(`[info] ${message}`, meta || "");
}

export function logWarn(message, meta) {
  // eslint-disable-next-line no-console
  console.warn(`[warn] ${message}`, meta || "");
}

export function logError(message, meta) {
  // eslint-disable-next-line no-console
  console.error(`[error] ${message}`, meta || "");
}
