(function initChatFormatUtils(global) {
  const DEFAULT_LOCALE = "zh-TW";
  const FORMAT_US_LOCALE = "en-US";
  const RUN_PREFIX = /^Run:/i;
  const DONE_PREFIX = /^Done:/i;

  function formatClock(dateValue, options) {
    const locale = String(options?.locale || DEFAULT_LOCALE);
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
    return date.toLocaleTimeString(locale, { hour12: false });
  }

  function formatTs(ts, options) {
    if (!ts) return "";
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return "";
    const locale = String(options?.locale || DEFAULT_LOCALE);
    return date.toLocaleString(locale, { hour12: false });
  }

  function formatNumber(num, options) {
    if (num === null || num === undefined || Number.isNaN(num)) return "-";
    const locale = String(options?.locale || FORMAT_US_LOCALE);
    return Number(num).toLocaleString(locale);
  }

  function formatRunLine(raw, options) {
    const text = String(raw || "").trim();
    if (!text) return "";

    const lang = String(options?.lang || "zh");
    const commandStarts = options?.commandStarts instanceof Map ? options.commandStarts : null;
    const now = typeof options?.nowMs === "number" ? options.nowMs : Date.now();

    if (RUN_PREFIX.test(text)) {
      const command = text.replace(RUN_PREFIX, "").trim();
      if (!command) return "";
      if (commandStarts) commandStarts.set(command, now);
      return lang === "en" ? `Executed ${command}` : `已執行 ${command}`;
    }

    if (DONE_PREFIX.test(text)) {
      const command = text.replace(DONE_PREFIX, "").trim();
      if (!command) return "";
      const startedAt = commandStarts ? commandStarts.get(command) : null;
      if (commandStarts && startedAt) commandStarts.delete(command);
      const seconds = startedAt ? Math.max(1, Math.round((now - startedAt) / 1000)) : null;
      if (lang === "en") {
        return seconds ? `Executed ${command} in ${seconds}s` : `Executed ${command}`;
      }
      return seconds ? `已執行 ${command}，適用於 ${seconds}s` : `已執行 ${command}`;
    }

    return text;
  }

  global.ChatFormatUtils = Object.freeze({
    formatClock,
    formatTs,
    formatNumber,
    formatRunLine,
  });
})(window);
