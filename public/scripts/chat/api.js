(function initChatApiUtils(global) {
  const DEFAULT_API = Object.freeze({
    MODELS: "/api/models",
    SESSIONS: "/api/sessions",
    CHAT_STATUS: "/api/chat/status",
    CHAT_STREAM: "/api/chat/stream",
    UPLOADS: "/api/uploads",
    I18N_MAP: "/api/i18n-map",
    SESSION_MESSAGES: (sessionId) => `/api/sessions/${sessionId}/messages`,
    SESSION_STATS: (sessionId) => `/api/sessions/${sessionId}/stats`,
    SESSION_CHAT: (sessionId) => `/api/sessions/${sessionId}/chat`,
    NEW_SESSION_CHAT: "/api/sessions/new/chat",
  });

  const HTTP_METHOD_POST = "POST";
  const HEADER_CONTENT_TYPE = "Content-Type";
  const CONTENT_TYPE_JSON = "application/json";

  function safeApi(api) {
    if (!api || typeof api !== "object") return DEFAULT_API;
    return api;
  }

  function pickEndpoint(value, fallback) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function errorMessage(data, fallback) {
    if (!data || typeof data !== "object") return fallback;
    const text = String(data.error || "").trim();
    return text || fallback;
  }

  async function requestJson(url, options, fallbackError) {
    const response = await fetch(url, options);
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(errorMessage(data, fallbackError));
    }
    return data;
  }

  async function fetchModels(api) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.MODELS, DEFAULT_API.MODELS);
    return requestJson(endpoint, undefined, "Failed to load model list");
  }

  async function fetchI18nMap(api) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.I18N_MAP, DEFAULT_API.I18N_MAP);
    return requestJson(endpoint, undefined, "Failed to load i18n map");
  }

  async function uploadImage(api, formData) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.UPLOADS, DEFAULT_API.UPLOADS);
    return requestJson(
      endpoint,
      { method: HTTP_METHOD_POST, body: formData },
      "Upload failed"
    );
  }

  async function fetchSessions(api) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.SESSIONS, DEFAULT_API.SESSIONS);
    return requestJson(endpoint, undefined, "Failed to load sessions");
  }

  async function fetchSessionMessages(api, sessionId) {
    const resolved = safeApi(api);
    const endpointFactory =
      typeof resolved.SESSION_MESSAGES === "function"
        ? resolved.SESSION_MESSAGES
        : DEFAULT_API.SESSION_MESSAGES;
    return requestJson(endpointFactory(sessionId), undefined, "Failed to load messages");
  }

  async function fetchSessionStats(api, sessionId) {
    const resolved = safeApi(api);
    const endpointFactory =
      typeof resolved.SESSION_STATS === "function"
        ? resolved.SESSION_STATS
        : DEFAULT_API.SESSION_STATS;
    return requestJson(endpointFactory(sessionId), undefined, "Failed to load stats");
  }

  async function fetchChatStatus(api) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.CHAT_STATUS, DEFAULT_API.CHAT_STATUS);
    return requestJson(endpoint, undefined, "Failed to load chat status");
  }

  async function sendChatNonStream(api, payload) {
    const resolved = safeApi(api);
    const endpoint =
      payload && payload.sessionId
        ? (typeof resolved.SESSION_CHAT === "function"
            ? resolved.SESSION_CHAT
            : DEFAULT_API.SESSION_CHAT)(payload.sessionId)
        : pickEndpoint(resolved.NEW_SESSION_CHAT, DEFAULT_API.NEW_SESSION_CHAT);
    return requestJson(
      endpoint,
      {
        method: HTTP_METHOD_POST,
        headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
        body: JSON.stringify({
          prompt: payload?.prompt || "",
          model: payload?.model || null,
        }),
      },
      "Send failed"
    );
  }

  async function openChatStream(api, payload, signal) {
    const resolved = safeApi(api);
    const endpoint = pickEndpoint(resolved.CHAT_STREAM, DEFAULT_API.CHAT_STREAM);
    const response = await fetch(endpoint, {
      method: HTTP_METHOD_POST,
      headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
      body: JSON.stringify({
        sessionId: payload?.sessionId || "",
        prompt: payload?.prompt || "",
        model: payload?.model || null,
        images: Array.isArray(payload?.images) ? payload.images : [],
      }),
      signal,
    });
    if (!response.ok) {
      throw new Error("Stream failed");
    }
    return response;
  }

  global.ChatApiUtils = Object.freeze({
    fetchModels,
    fetchI18nMap,
    uploadImage,
    fetchSessions,
    fetchSessionMessages,
    fetchSessionStats,
    fetchChatStatus,
    sendChatNonStream,
    openChatStream,
  });
})(window);
