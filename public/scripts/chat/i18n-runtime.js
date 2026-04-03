(function initChatI18nRuntime(global) {
  function isRecord(value) {
    return Boolean(value) && typeof value === "object";
  }

  function normalizeI18nMapPayload(payload) {
    if (!isRecord(payload)) {
      return { phase: {}, status: {}, activityCode: {} };
    }
    return {
      phase: isRecord(payload.phase) ? payload.phase : {},
      status: isRecord(payload.status) ? payload.status : {},
      activityCode: isRecord(payload.activityCode) ? payload.activityCode : {},
    };
  }

  function resolveMapLabel(map, sectionName, key, locale, fallback) {
    if (!isRecord(map)) return fallback;
    const section = map[sectionName];
    if (!isRecord(section)) return fallback;
    const entry = section[key];
    if (!isRecord(entry)) return fallback;
    const localized = entry[locale];
    if (typeof localized !== "string") return fallback;
    const trimmed = localized.trim();
    return trimmed || fallback;
  }

  function localizePhase(map, phase, locale) {
    const raw = String(phase || "").trim();
    if (!raw || locale === "en") return raw;
    return resolveMapLabel(map, "phase", raw, locale, raw);
  }

  function localizeStatus(map, statusWord, locale) {
    const raw = String(statusWord || "").trim();
    if (!raw || locale === "en") return raw;
    return resolveMapLabel(map, "status", raw, locale, raw);
  }

  function formatActivityEvent(map, event, locale) {
    const rawText = String(event?.text || "").trim();
    const code = String(event?.code || "").trim();
    if (!rawText) return "";
    if (locale === "en" || !code) return rawText;
    const label = resolveMapLabel(map, "activityCode", code, locale, rawText);
    const colonIndex = rawText.indexOf(":");
    if (colonIndex > -1) {
      const detail = rawText.slice(colonIndex + 1).trim();
      if (detail) return `${label}：${detail}`;
    }
    return label;
  }

  global.ChatI18nRuntime = Object.freeze({
    normalizeI18nMapPayload,
    localizePhase,
    localizeStatus,
    formatActivityEvent,
  });
})(window);
