(function initChatRetryUtils(global) {
  function delayMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getRetryBackoffMs(attemptIndex, options) {
    const baseDelayMs = Number(options?.baseDelayMs || 600);
    const maxDelayMs = Number(options?.maxDelayMs || 1800);
    const jitterMs = Number(options?.jitterMs || 280);
    const exp = baseDelayMs * Math.pow(2, Math.max(0, Number(attemptIndex || 1) - 1));
    const jitter = Math.floor(Math.random() * jitterMs);
    return Math.min(maxDelayMs, exp + jitter);
  }

  function normalizeErrorText(error) {
    if (typeof error === "string") return error.toLowerCase();
    if (error instanceof Error) return String(error.message || "").toLowerCase();
    return String(error || "").toLowerCase();
  }

  function isRetryableStreamError(error, options) {
    const abortName = String(options?.abortName || "AbortError");
    const tokens = Array.isArray(options?.tokens) ? options.tokens : [];
    const isAbortError =
      (error instanceof DOMException && error.name === abortName) ||
      (error instanceof Error && error.name === abortName);
    if (isAbortError) return true;

    const text = normalizeErrorText(error);
    if (!text) return false;
    return tokens.some((token) => text.includes(String(token || "").toLowerCase()));
  }

  global.ChatRetryUtils = Object.freeze({
    delayMs,
    getRetryBackoffMs,
    normalizeErrorText,
    isRetryableStreamError,
  });
})(window);
