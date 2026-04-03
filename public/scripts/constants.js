(function initChatConstants() {
  const ChatConstants = Object.freeze({
    API: Object.freeze({
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
    }),
    STREAM_EVENT: Object.freeze({
      STATUS: "status",
      HEARTBEAT: "heartbeat",
      ACTIVITY: "activity",
      SESSION: "session",
      ASSISTANT: "assistant",
      ASSISTANT_BOUNDARY: "assistant_boundary",
      ASSISTANT_PHASE: "assistant_phase",
      ERROR: "error",
      DONE: "done",
    }),
    STREAM_STATUS: Object.freeze({
      STARTED: "started",
      THINKING: "thinking",
      DONE: "done",
    }),
    ASSISTANT_PHASE: Object.freeze({
      FINAL_ANSWER: "final_answer",
      REASONING: "reasoning",
      ANALYSIS: "analysis",
      COMMENTARY: "commentary",
    }),
    ERROR_NAME: Object.freeze({
      ABORT: "AbortError",
    }),
    ERROR_TOKEN: Object.freeze({
      STREAM_STALLED: "stream_stalled",
      STREAM_INCOMPLETE: "stream_incomplete",
      STREAM_FAILED: "stream failed",
      MODEL_ACCESS_DENIED: "does not have access to model",
      NETWORK_ERROR: "networkerror",
      FAILED_TO_FETCH: "failed to fetch",
      TIMEOUT: "timeout",
      ABORTED: "aborted",
    }),
    RETRY: Object.freeze({
      STREAM_MAX_ATTEMPTS: 2,
      STREAM_BASE_DELAY_MS: 600,
      STREAM_MAX_DELAY_MS: 1800,
      STREAM_JITTER_MS: 280,
      STREAM_STALL_CHECK_INTERVAL_MS: 2000,
      STREAM_STALL_TIMEOUT_MS: 150000,
      SYNC_RETRIES: 3,
      SYNC_DELAY_MS: 300,
      SYNC_POST_STREAM_RETRIES: 5,
      SYNC_POST_STREAM_DELAY_MS: 400,
      SYNC_BACKGROUND_RETRIES: 3,
      SYNC_BACKGROUND_DELAY_MS: 500,
    }),
    POLL: Object.freeze({
      SERVER_LOCK_INTERVAL_MS: 2000,
    }),
    CSS_SELECTOR: Object.freeze({
      FINAL_ASSISTANT_ROWS:
        '.row.assistant[data-phase="final_answer"], .row.assistant.assistant-plain[data-phase="final_answer"]',
    }),
    IMAGE_PLACEHOLDER: Object.freeze({
      EN: "[Image attachment]",
      ZH: "[圖片附件]",
    }),
  });

  window.ChatConstants = ChatConstants;
})();
