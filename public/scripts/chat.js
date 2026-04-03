      const picker = document.getElementById("sessionPicker");
      const chat = document.getElementById("chat");
      const form = document.getElementById("composerForm");
      const promptInput = document.getElementById("promptInput");
      const imageInput = document.getElementById("imageInput");
      const attachBtn = document.getElementById("attachBtn");
      const attachmentList = document.getElementById("attachmentList");
      const sendBtn = document.getElementById("sendBtn");
      const menuBtn = document.getElementById("menuBtn");
      const newSessionBtn = document.getElementById("newSessionBtn");
      const drawerBackdrop = document.getElementById("drawerBackdrop");
      const drawerTitle = document.getElementById("drawerTitle");
      const drawerCloseBtn = document.getElementById("drawerCloseBtn");
      const sessionList = document.getElementById("sessionList");
      const imageViewer = document.getElementById("imageViewer");
      const imageViewerImg = document.getElementById("imageViewerImg");
      const imageViewerClose = document.getElementById("imageViewerClose");
      const imageViewerPrev = document.getElementById("imageViewerPrev");
      const imageViewerNext = document.getElementById("imageViewerNext");
      const imageViewerCounter = document.getElementById("imageViewerCounter");
      const activityBubble = document.getElementById("activityBubble");
      const statusText = document.getElementById("statusText");
      const appTitle = document.getElementById("appTitle");
      const langBtn = document.getElementById("langBtn");
      const modelPicker = document.getElementById("modelPicker");
      const streamBadge = document.getElementById("streamBadge");
      const usageContext = document.getElementById("usageContext");
      const usage5h = document.getElementById("usage5h");
      const usageWeek = document.getElementById("usageWeek");
      const helpWrap = document.getElementById("helpWrap");
      const helpBtn = document.getElementById("helpBtn");
      const glossaryPanel = document.getElementById("glossaryPanel");
      const activityWrap = document.getElementById("activityWrap");
      const activityBtn = document.getElementById("activityBtn");
      const activityPanel = document.getElementById("activityPanel");
      const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
      const bottomComposer = document.querySelector(".bottom");
      const modelLoadingMask = document.getElementById("modelLoadingMask");
      const modelLoadingTitle = document.getElementById("modelLoadingTitle");
      const modelLoadingSub = document.getElementById("modelLoadingSub");

      const params = new URLSearchParams(window.location.search);
      let selectedSessionId = params.get("sessionId");
      let isSending = false;
      let serverLocked = false;
      let streamingAssistantBubble = null;
      let currentLang = localStorage.getItem("chat_lang") || "zh";
      const MODEL_PATTERN = /^[a-zA-Z0-9._:-]{1,80}$/;
      const DEFAULT_FALLBACK_MODEL = "gpt-5.3-codex";
      const CHAT_CONSTANTS = window.ChatConstants || {};
      const CHAT_API = CHAT_CONSTANTS.API || {};
      const CHAT_STREAM_EVENT = CHAT_CONSTANTS.STREAM_EVENT || {};
      const CHAT_STREAM_STATUS = CHAT_CONSTANTS.STREAM_STATUS || {};
      const CHAT_ASSISTANT_PHASE = CHAT_CONSTANTS.ASSISTANT_PHASE || {};
      const CHAT_ERROR_NAME = CHAT_CONSTANTS.ERROR_NAME || {};
      const CHAT_ERROR_TOKEN = CHAT_CONSTANTS.ERROR_TOKEN || {};
      const CHAT_RETRY = CHAT_CONSTANTS.RETRY || {};
      const CHAT_POLL = CHAT_CONSTANTS.POLL || {};
      const CHAT_SELECTOR = CHAT_CONSTANTS.CSS_SELECTOR || {};
      const CHAT_IMAGE_PLACEHOLDER = CHAT_CONSTANTS.IMAGE_PLACEHOLDER || {};
      const CHAT_I18N_RUNTIME = window.ChatI18nRuntime || {};
      const CHAT_STREAM_DISPATCHER = window.ChatStreamDispatcher || {};
      const CHAT_STREAM_STATE_UTILS = window.ChatStreamStateUtils || {};
      const CHAT_MESSAGE_RENDERER_UTILS = window.ChatMessageRendererUtils || {};
      const CHAT_BOOTSTRAP_EVENTS_UTILS = window.ChatBootstrapEventsUtils || {};
      const CHAT_BOOTSTRAP_INIT_UTILS = window.ChatBootstrapInitUtils || {};
      const CHAT_STREAM_ORCHESTRATOR_UTILS = window.ChatStreamOrchestratorUtils || {};
      const CHAT_UI_UTILS = window.ChatUiUtils || {};
      const CHAT_SESSION_UI_UTILS = window.ChatSessionUiUtils || {};
      const CHAT_IMAGE_VIEWER_UTILS = window.ChatImageViewerUtils || {};
      const CHAT_FORMAT_UTILS = window.ChatFormatUtils || {};
      const CHAT_RETRY_UTILS = window.ChatRetryUtils || {};
      const CHAT_API_UTILS = window.ChatApiUtils || {};
      const normalizeI18nMapPayloadApi =
        typeof CHAT_I18N_RUNTIME.normalizeI18nMapPayload === "function"
          ? CHAT_I18N_RUNTIME.normalizeI18nMapPayload
          : null;
      const localizePhaseApi =
        typeof CHAT_I18N_RUNTIME.localizePhase === "function" ? CHAT_I18N_RUNTIME.localizePhase : null;
      const localizeStatusApi =
        typeof CHAT_I18N_RUNTIME.localizeStatus === "function" ? CHAT_I18N_RUNTIME.localizeStatus : null;
      const formatActivityEventApi =
        typeof CHAT_I18N_RUNTIME.formatActivityEvent === "function"
          ? CHAT_I18N_RUNTIME.formatActivityEvent
          : null;
      const createStreamDispatcherApi =
        typeof CHAT_STREAM_DISPATCHER.createStreamDispatcher === "function"
          ? CHAT_STREAM_DISPATCHER.createStreamDispatcher
          : null;
      const resetLiveStreamApi =
        typeof CHAT_STREAM_STATE_UTILS.resetLiveStream === "function"
          ? CHAT_STREAM_STATE_UTILS.resetLiveStream
          : null;
      const initLiveStreamApi =
        typeof CHAT_STREAM_STATE_UTILS.initLiveStream === "function"
          ? CHAT_STREAM_STATE_UTILS.initLiveStream
          : null;
      const appendStreamNoteApi =
        typeof CHAT_STREAM_STATE_UTILS.appendStreamNote === "function"
          ? CHAT_STREAM_STATE_UTILS.appendStreamNote
          : null;
      const updateLiveAssistantPhaseApi =
        typeof CHAT_STREAM_STATE_UTILS.updateLiveAssistantPhase === "function"
          ? CHAT_STREAM_STATE_UTILS.updateLiveAssistantPhase
          : null;
      const splitLiveAssistantBubbleApi =
        typeof CHAT_STREAM_STATE_UTILS.splitLiveAssistantBubble === "function"
          ? CHAT_STREAM_STATE_UTILS.splitLiveAssistantBubble
          : null;
      const createProcessBlockApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.createProcessBlock === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.createProcessBlock
          : null;
      const createAssistantPlainBlockApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.createAssistantPlainBlock === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.createAssistantPlainBlock
          : null;
      const groupMessagesForRenderApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.groupMessagesForRender === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.groupMessagesForRender
          : null;
      const ensureProcessFinalDividerApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.ensureProcessFinalDivider === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.ensureProcessFinalDivider
          : null;
      const refreshFinalDividersApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.refreshFinalDividers === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.refreshFinalDividers
          : null;
      const setBubbleTextApi =
        typeof CHAT_MESSAGE_RENDERER_UTILS.setBubbleText === "function"
          ? CHAT_MESSAGE_RENDERER_UTILS.setBubbleText
          : null;
      const bindBootstrapEventsApi =
        typeof CHAT_BOOTSTRAP_EVENTS_UTILS.bindBootstrapEvents === "function"
          ? CHAT_BOOTSTRAP_EVENTS_UTILS.bindBootstrapEvents
          : null;
      const runBootstrapApi =
        typeof CHAT_BOOTSTRAP_INIT_UTILS.runBootstrap === "function"
          ? CHAT_BOOTSTRAP_INIT_UTILS.runBootstrap
          : null;
      const sendWithoutStreamApi =
        typeof CHAT_STREAM_ORCHESTRATOR_UTILS.sendWithoutStream === "function"
          ? CHAT_STREAM_ORCHESTRATOR_UTILS.sendWithoutStream
          : null;
      const recoverAfterStreamInterruptionApi =
        typeof CHAT_STREAM_ORCHESTRATOR_UTILS.recoverAfterStreamInterruption === "function"
          ? CHAT_STREAM_ORCHESTRATOR_UTILS.recoverAfterStreamInterruption
          : null;
      const reconcileAssistantSplitFromSessionApi =
        typeof CHAT_STREAM_ORCHESTRATOR_UTILS.reconcileAssistantSplitFromSession === "function"
          ? CHAT_STREAM_ORCHESTRATOR_UTILS.reconcileAssistantSplitFromSession
          : null;
      const escapeHtmlApi =
        typeof CHAT_UI_UTILS.escapeHtml === "function" ? CHAT_UI_UTILS.escapeHtml : null;
      const renderMessageHtmlApi =
        typeof CHAT_UI_UTILS.renderMessageHtml === "function" ? CHAT_UI_UTILS.renderMessageHtml : null;
      const extractMarkdownImagesApi =
        typeof CHAT_UI_UTILS.extractMarkdownImages === "function"
          ? CHAT_UI_UTILS.extractMarkdownImages
          : null;
      const setSummaryButtonTextApi =
        typeof CHAT_UI_UTILS.setSummaryButtonText === "function"
          ? CHAT_UI_UTILS.setSummaryButtonText
          : null;
      const renderSessionListApi =
        typeof CHAT_SESSION_UI_UTILS.renderSessionList === "function"
          ? CHAT_SESSION_UI_UTILS.renderSessionList
          : null;
      const renderAttachmentsApi =
        typeof CHAT_SESSION_UI_UTILS.renderAttachments === "function"
          ? CHAT_SESSION_UI_UTILS.renderAttachments
          : null;
      const createImageViewerControllerApi =
        typeof CHAT_IMAGE_VIEWER_UTILS.createImageViewerController === "function"
          ? CHAT_IMAGE_VIEWER_UTILS.createImageViewerController
          : null;
      const formatClockApi =
        typeof CHAT_FORMAT_UTILS.formatClock === "function" ? CHAT_FORMAT_UTILS.formatClock : null;
      const formatTsApi =
        typeof CHAT_FORMAT_UTILS.formatTs === "function" ? CHAT_FORMAT_UTILS.formatTs : null;
      const formatNumberApi =
        typeof CHAT_FORMAT_UTILS.formatNumber === "function" ? CHAT_FORMAT_UTILS.formatNumber : null;
      const formatRunLineApi =
        typeof CHAT_FORMAT_UTILS.formatRunLine === "function" ? CHAT_FORMAT_UTILS.formatRunLine : null;
      const delayMsApi =
        typeof CHAT_RETRY_UTILS.delayMs === "function" ? CHAT_RETRY_UTILS.delayMs : null;
      const getRetryBackoffMsApi =
        typeof CHAT_RETRY_UTILS.getRetryBackoffMs === "function"
          ? CHAT_RETRY_UTILS.getRetryBackoffMs
          : null;
      const isRetryableStreamErrorApi =
        typeof CHAT_RETRY_UTILS.isRetryableStreamError === "function"
          ? CHAT_RETRY_UTILS.isRetryableStreamError
          : null;
      const fetchModelsApi =
        typeof CHAT_API_UTILS.fetchModels === "function" ? CHAT_API_UTILS.fetchModels : null;
      const fetchI18nMapApi =
        typeof CHAT_API_UTILS.fetchI18nMap === "function" ? CHAT_API_UTILS.fetchI18nMap : null;
      const uploadImageApi =
        typeof CHAT_API_UTILS.uploadImage === "function" ? CHAT_API_UTILS.uploadImage : null;
      const fetchSessionsApi =
        typeof CHAT_API_UTILS.fetchSessions === "function" ? CHAT_API_UTILS.fetchSessions : null;
      const fetchSessionMessagesApi =
        typeof CHAT_API_UTILS.fetchSessionMessages === "function"
          ? CHAT_API_UTILS.fetchSessionMessages
          : null;
      const fetchSessionStatsApi =
        typeof CHAT_API_UTILS.fetchSessionStats === "function"
          ? CHAT_API_UTILS.fetchSessionStats
          : null;
      const fetchChatStatusApi =
        typeof CHAT_API_UTILS.fetchChatStatus === "function" ? CHAT_API_UTILS.fetchChatStatus : null;
      const sendChatNonStreamApi =
        typeof CHAT_API_UTILS.sendChatNonStream === "function"
          ? CHAT_API_UTILS.sendChatNonStream
          : null;
      const openChatStreamApi =
        typeof CHAT_API_UTILS.openChatStream === "function" ? CHAT_API_UTILS.openChatStream : null;
      const STREAM_EVENT_STATUS = CHAT_STREAM_EVENT.STATUS || "status";
      const STREAM_EVENT_HEARTBEAT = CHAT_STREAM_EVENT.HEARTBEAT || "heartbeat";
      const STREAM_EVENT_ACTIVITY = CHAT_STREAM_EVENT.ACTIVITY || "activity";
      const STREAM_EVENT_SESSION = CHAT_STREAM_EVENT.SESSION || "session";
      const STREAM_EVENT_ASSISTANT = CHAT_STREAM_EVENT.ASSISTANT || "assistant";
      const STREAM_EVENT_ASSISTANT_BOUNDARY =
        CHAT_STREAM_EVENT.ASSISTANT_BOUNDARY || "assistant_boundary";
      const STREAM_EVENT_ASSISTANT_PHASE =
        CHAT_STREAM_EVENT.ASSISTANT_PHASE || "assistant_phase";
      const STREAM_EVENT_ERROR = CHAT_STREAM_EVENT.ERROR || "error";
      const STREAM_EVENT_DONE = CHAT_STREAM_EVENT.DONE || "done";
      const STREAM_STATUS_THINKING = CHAT_STREAM_STATUS.THINKING || "thinking";
      const PHASE_FINAL_ANSWER = CHAT_ASSISTANT_PHASE.FINAL_ANSWER || "final_answer";
      const PHASE_COMMENTARY = CHAT_ASSISTANT_PHASE.COMMENTARY || "commentary";
      const ERROR_NAME_ABORT = CHAT_ERROR_NAME.ABORT || "AbortError";
      const ERROR_TOKEN_STREAM_STALLED = CHAT_ERROR_TOKEN.STREAM_STALLED || "stream_stalled";
      const ERROR_TOKEN_STREAM_INCOMPLETE =
        CHAT_ERROR_TOKEN.STREAM_INCOMPLETE || "stream_incomplete";
      const ERROR_TOKEN_STREAM_FAILED = CHAT_ERROR_TOKEN.STREAM_FAILED || "stream failed";
      const ERROR_TOKEN_MODEL_ACCESS_DENIED =
        CHAT_ERROR_TOKEN.MODEL_ACCESS_DENIED || "does not have access to model";
      const ERROR_TOKEN_NETWORK_ERROR = CHAT_ERROR_TOKEN.NETWORK_ERROR || "networkerror";
      const ERROR_TOKEN_FAILED_TO_FETCH = CHAT_ERROR_TOKEN.FAILED_TO_FETCH || "failed to fetch";
      const ERROR_TOKEN_TIMEOUT = CHAT_ERROR_TOKEN.TIMEOUT || "timeout";
      const ERROR_TOKEN_ABORTED = CHAT_ERROR_TOKEN.ABORTED || "aborted";
      const STREAM_RETRY_ERROR_TOKENS = [
        ERROR_TOKEN_STREAM_STALLED,
        ERROR_TOKEN_STREAM_INCOMPLETE,
        ERROR_TOKEN_STREAM_FAILED,
        ERROR_TOKEN_NETWORK_ERROR,
        ERROR_TOKEN_FAILED_TO_FETCH,
        ERROR_TOKEN_TIMEOUT,
        ERROR_TOKEN_ABORTED,
      ];
      const STREAM_RETRY_MAX_ATTEMPTS = Number(CHAT_RETRY.STREAM_MAX_ATTEMPTS || 2);
      const STREAM_RETRY_BASE_DELAY_MS = Number(CHAT_RETRY.STREAM_BASE_DELAY_MS || 600);
      const STREAM_RETRY_MAX_DELAY_MS = Number(CHAT_RETRY.STREAM_MAX_DELAY_MS || 1800);
      const STREAM_RETRY_JITTER_MS = Number(CHAT_RETRY.STREAM_JITTER_MS || 280);
      const STREAM_STALL_CHECK_INTERVAL_MS = Number(
        CHAT_RETRY.STREAM_STALL_CHECK_INTERVAL_MS || 2000
      );
      const STREAM_STALL_TIMEOUT_MS = Number(CHAT_RETRY.STREAM_STALL_TIMEOUT_MS || 150000);
      const SYNC_RETRIES = Number(CHAT_RETRY.SYNC_RETRIES || 3);
      const SYNC_DELAY_MS = Number(CHAT_RETRY.SYNC_DELAY_MS || 300);
      const SYNC_POST_STREAM_RETRIES = Number(CHAT_RETRY.SYNC_POST_STREAM_RETRIES || 5);
      const SYNC_POST_STREAM_DELAY_MS = Number(CHAT_RETRY.SYNC_POST_STREAM_DELAY_MS || 400);
      const SYNC_BACKGROUND_RETRIES = Number(CHAT_RETRY.SYNC_BACKGROUND_RETRIES || 3);
      const SYNC_BACKGROUND_DELAY_MS = Number(CHAT_RETRY.SYNC_BACKGROUND_DELAY_MS || 500);
      const SERVER_LOCK_INTERVAL_MS = Number(CHAT_POLL.SERVER_LOCK_INTERVAL_MS || 2000);
      const FINAL_ASSISTANT_ROWS_SELECTOR =
        CHAT_SELECTOR.FINAL_ASSISTANT_ROWS ||
        '.row.assistant[data-phase="final_answer"], .row.assistant.assistant-plain[data-phase="final_answer"]';
      let currentModel = normalizeModelValue(localStorage.getItem("chat_model"));
      let availableModels = [];
      let lastStats = null;
      let cachedSessions = [];
      const activityEvents = [];
      let uploadedImages = [];
      let activityBubbleTimer = null;
      let commandCollapseTimer = null;
      let liveStreamState = null;
      let modelLoadingFailed = false;
      let imageViewerController = null;
      let runtimeI18nMap = {
        phase: {},
        status: {},
        activityCode: {},
      };

      function normalizeModelValue(value) {
        if (typeof value !== "string") return "";
        const normalized = value.trim();
        if (!normalized) return "";
        return MODEL_PATTERN.test(normalized) ? normalized : "";
      }

      function renderModelPicker() {
        const optionsHtml = availableModels
          .map((item) => {
            const selected = item.value === currentModel ? " selected" : "";
            return `<option value="${escapeHtml(item.value)}"${selected}>${escapeHtml(item.label)}</option>`;
          })
          .join("");
        modelPicker.innerHTML = optionsHtml;
      }

      function parseModelOptionsPayload(data) {
        const rawModels = Array.isArray(data?.models) ? data.models : [];
        return rawModels
          .map((item) => {
            const value = normalizeModelValue(item?.value);
            if (!value) return null;
            return { value, label: String(item?.label || value) };
          })
          .filter(Boolean);
      }

      async function loadModelOptions() {
        let loadedFromApi = true;
        try {
          if (!fetchModelsApi) throw new Error("ChatApiUtils.fetchModels unavailable");
          const data = await fetchModelsApi(CHAT_API);
          const parsed = parseModelOptionsPayload(data);
          availableModels = parsed;

          const defaultModel = normalizeModelValue(data.defaultModel);
          if (!currentModel) {
            currentModel = defaultModel || availableModels[0]?.value || "";
            if (currentModel) localStorage.setItem("chat_model", currentModel);
          }

          if (
            currentModel &&
            !availableModels.some((item) => item.value === currentModel)
          ) {
            availableModels = [
              { value: currentModel, label: `${currentModel} (custom)` },
              ...availableModels,
            ];
          }
        } catch {
          loadedFromApi = false;
          availableModels = currentModel
            ? [{ value: currentModel, label: `${currentModel} (custom)` }]
            : [{ value: DEFAULT_FALLBACK_MODEL, label: DEFAULT_FALLBACK_MODEL }];
          if (!currentModel) {
            currentModel = availableModels[0]?.value || "";
            if (currentModel) localStorage.setItem("chat_model", currentModel);
          }
        } finally {
          renderModelPicker();
        }
        return loadedFromApi;
      }

      async function loadI18nMap() {
        try {
          if (!fetchI18nMapApi) return;
          const data = await fetchI18nMapApi(CHAT_API);
          const incoming = data?.map;
          runtimeI18nMap = normalizeI18nMapPayloadApi
            ? normalizeI18nMapPayloadApi(incoming)
            : {
                phase: incoming?.phase && typeof incoming.phase === "object" ? incoming.phase : {},
                status: incoming?.status && typeof incoming.status === "object" ? incoming.status : {},
                activityCode:
                  incoming?.activityCode && typeof incoming.activityCode === "object"
                    ? incoming.activityCode
                    : {},
              };
        } catch {
          // Keep fallback behavior when map endpoint is unavailable.
        }
      }

            const I18N = {
        en: {
          title: "Codex Session Chat",
          langBtn: "中文",
          menuBtn: "☰",
          drawerTitle: "Sessions",
          newSession: "New Session",
          placeholder: "Message this session...",
          attachBtn: "Image",
          sendBtn: "Send",
          streamBadge: "Realtime: Stream + Sync backup",
          statusReady: "Ready",
          statusSending: "Streaming...",
          statusThinking: "Streaming (thinking...)",
          statusDone: "Done",
          statusThinkingLock: "Assistant is thinking...",
          statusLoadingSession: "Loading session...",
          statusNewSession: "New session mode",
          emptyLoading: "Loading...",
          emptyNoMessages: "No chat messages for this session yet.",
          emptyNoSessions: "No sessions found.",
          newSessionHint: "New session mode. Send your first message.",
          userNow: "user · now",
          assistantStreaming: "assistant · streaming",
          roleUser: "user",
          roleAssistant: "assistant",
          thinkingWord: "Thinking...",
          usageContextEmpty: "Context -",
          usage5hEmpty: "5h -",
          usageWeekEmpty: "Week -",
          usageContext: (r, t) => `Ctx ${r} / ${t}`,
          usageContextWithPercent: (r, t, p) => `Ctx ${r} / ${t} (${p} left)`,
          usage5h: (v) => `5h left ${v}`,
          usageWeek: (v) => `Week left ${v}`,
          loadingModelsTitle: "Loading model list...",
          loadingModelsSub: "Fetching available models from Codex",
          loadingModelsFail: "Failed to load models. Please refresh.",
        },
        zh: {
          title: "Codex 對話",
          langBtn: "EN",
          menuBtn: "☰",
          drawerTitle: "對話列表",
          newSession: "新對話",
          placeholder: "輸入訊息...",
          attachBtn: "圖片",
          sendBtn: "送出",
          streamBadge: "即時：串流 + 同步備援",
          statusReady: "就緒",
          statusSending: "串流中...",
          statusThinking: "串流中（思考中...）",
          statusDone: "完成",
          statusThinkingLock: "助手正在思考中...",
          statusLoadingSession: "正在載入對話...",
          statusNewSession: "新對話模式",
          emptyLoading: "載入中...",
          emptyNoMessages: "此對話尚無訊息。",
          emptyNoSessions: "找不到任何對話。",
          newSessionHint: "目前是新對話模式，送出第一則訊息即可建立。",
          userNow: "你 · 現在",
          assistantStreaming: "助手 · 串流中",
          roleUser: "你",
          roleAssistant: "助手",
          thinkingWord: "思考中...",
          usageContextEmpty: "上下文 -",
          usage5hEmpty: "5小時 -",
          usageWeekEmpty: "一週 -",
          usageContext: (r, t) => `上下文 ${r} / ${t}`,
          usageContextWithPercent: (r, t, p) => `上下文 ${r} / ${t}（剩餘 ${p}）`,
          usage5h: (v) => `5小時剩餘 ${v}`,
          usageWeek: (v) => `一週剩餘 ${v}`,
          loadingModelsTitle: "讀取模型列表中...",
          loadingModelsSub: "正在透過 Codex 取得可用模型",
          loadingModelsFail: "模型列表讀取失敗，請重新整理頁面",
        },
      };
      const t = (key) => I18N[currentLang][key];

      function setModelLoadingMask(open, failed = false) {
        if (!modelLoadingMask) return;
        modelLoadingFailed = failed;
        if (modelLoadingTitle) {
          modelLoadingTitle.textContent = modelLoadingFailed ? t("loadingModelsFail") : t("loadingModelsTitle");
        }
        if (modelLoadingSub) {
          modelLoadingSub.textContent = t("loadingModelsSub");
        }
        modelLoadingMask.classList.toggle("open", Boolean(open));
      }

      function formatClockValue(dateValue) {
        if (formatClockApi) {
          return formatClockApi(dateValue || new Date(), { locale: "zh-TW" });
        }
        return new Date(dateValue || Date.now()).toLocaleTimeString("zh-TW", { hour12: false });
      }

      function formatTimestampValue(ts) {
        if (formatTsApi) return formatTsApi(ts, { locale: "zh-TW" });
        if (!ts) return "";
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("zh-TW", { hour12: false });
      }

      function formatUsageNumber(num) {
        if (formatNumberApi) return formatNumberApi(num, { locale: "en-US" });
        if (num === null || num === undefined || Number.isNaN(num)) return "-";
        return Number(num).toLocaleString("en-US");
      }

            function getGlossaryHtml() {
        if (currentLang === "en") {
          return `
            <div class="glossary-title">Terms</div>
            <div class="glossary-line"><b>Context</b>: Remaining tokens / model context window in this session's latest turn.</div>
            <div class="glossary-line"><b>5h left</b>: Remaining quota in your rolling 5-hour limit.</div>
            <div class="glossary-line"><b>Week left</b>: Remaining quota in your weekly limit.</div>
            <div class="glossary-line"><b>Realtime</b>: Stream output now; final messages sync after completion.</div>
          `;
        }
        return `
          <div class="glossary-title">名詞解釋</div>
          <div class="glossary-line"><b>上下文</b>：此對話最新一輪的「剩餘 token / 總 context window」。</div>
          <div class="glossary-line"><b>5小時剩餘</b>：滾動 5 小時配額的剩餘比例。</div>
          <div class="glossary-line"><b>一週剩餘</b>：每週配額的剩餘比例。</div>
          <div class="glossary-line"><b>即時串流</b>：先即時顯示回覆，完成後再做最終同步。</div>
        `;
      }
            function renderActivityPanel() {
        const title = currentLang === "en" ? "Live Activity" : "即時動態";
        if (!activityEvents.length) {
          const empty = currentLang === "en" ? "No activity yet." : "目前沒有動態。";
          activityPanel.innerHTML = `<div class="activity-title">${escapeHtml(title)}</div><div class="activity-line">${escapeHtml(empty)}</div>`;
          return;
        }

        const lines = activityEvents
          .map((entry) => `<div class="activity-line">[${escapeHtml(entry.time)}] ${escapeHtml(entry.text)}</div>`)
          .join("");
        activityPanel.innerHTML = `<div class="activity-title">${escapeHtml(title)}</div>${lines}`;
      }
      function addActivity(text) {
        const normalized = String(text || "").trim();
        if (!normalized) return;
        activityEvents.unshift({ time: formatClockValue(new Date()), text: normalized });
        if (activityEvents.length > 40) activityEvents.length = 40;
        renderActivityPanel();
        showActivityBubble(normalized, isSending || serverLocked);
      }

      function showActivityBubble(text, keepOpen = false) {
        if (!activityBubble) return;
        const normalized = String(text || "").trim();
        if (!normalized) return;
        activityBubble.textContent = normalized;
        activityBubble.classList.add("open");

        if (activityBubbleTimer) {
          clearTimeout(activityBubbleTimer);
          activityBubbleTimer = null;
        }

        if (!keepOpen) {
          activityBubbleTimer = setTimeout(() => {
            activityBubble.classList.remove("open");
            activityBubbleTimer = null;
          }, 1800);
        }
      }

      function hideActivityBubble(delayMs = 0) {
        if (!activityBubble) return;
        if (activityBubbleTimer) {
          clearTimeout(activityBubbleTimer);
          activityBubbleTimer = null;
        }
        if (delayMs > 0) {
          activityBubbleTimer = setTimeout(() => {
            activityBubble.classList.remove("open");
            activityBubbleTimer = null;
          }, delayMs);
          return;
        }
        activityBubble.classList.remove("open");
      }

      function resetLiveStream() {
        if (resetLiveStreamApi) {
          liveStreamState = resetLiveStreamApi({
            clearScheduledCollapse: () => {
              if (!commandCollapseTimer) return;
              clearTimeout(commandCollapseTimer);
              commandCollapseTimer = null;
            },
          });
          return;
        }
        if (commandCollapseTimer) {
          clearTimeout(commandCollapseTimer);
          commandCollapseTimer = null;
        }
        liveStreamState = null;
      }

      function initLiveStream() {
        if (initLiveStreamApi) {
          liveStreamState = initLiveStreamApi({
            currentState: liveStreamState,
            streamingAssistantBubble,
            thinkingWord: t("thinkingWord"),
            clearScheduledCollapse: () => {
              if (!commandCollapseTimer) return;
              clearTimeout(commandCollapseTimer);
              commandCollapseTimer = null;
            },
          });
          return;
        }
        const contentEl = streamingAssistantBubble?.querySelector(".message-content");
        if (!(contentEl instanceof HTMLElement)) return;
        if (commandCollapseTimer) {
          clearTimeout(commandCollapseTimer);
          commandCollapseTimer = null;
        }

        liveStreamState = {
          assistantContentEl: contentEl,
          commandStarts: new Map(),
          streamStartedAt: Date.now(),
          commandLogs: [],
          commandSeq: 0,
          seenDoneKeys: new Set(),
          textBuffer: "",
          hasRealAssistantText: false,
          currentAssistantBubble: streamingAssistantBubble,
          currentAssistantPhase: "",
          splitReconciled: false,
          bubbleCommandState: new WeakMap(),
        };

        contentEl.textContent = t("thinkingWord");
      }

      function appendStreamNote(chunkText) {
        if (appendStreamNoteApi) {
          liveStreamState = appendStreamNoteApi({
            currentState: liveStreamState,
            thinkingWord: t("thinkingWord"),
          }, chunkText);
          return;
        }
        const normalized = String(chunkText || "");
        if (!normalized || !liveStreamState) return;

        if (!(liveStreamState.assistantContentEl instanceof HTMLElement)) return;
        liveStreamState.textBuffer = `${liveStreamState.textBuffer || ""}${normalized}`;
        const compact = liveStreamState.textBuffer.trim();
        if (compact) {
          liveStreamState.hasRealAssistantText = true;
          liveStreamState.assistantContentEl.textContent = compact;
        } else if (!liveStreamState.hasRealAssistantText) {
          liveStreamState.assistantContentEl.textContent = t("thinkingWord");
        }
      }

      function setBubbleMetaText(bubbleEl, text) {
        if (!(bubbleEl instanceof HTMLElement)) return;
        const metaEl = bubbleEl.querySelector(".meta");
        if (!(metaEl instanceof HTMLElement)) return;
        metaEl.textContent = text;
      }

      function updateLiveAssistantPhase(phase) {
        if (updateLiveAssistantPhaseApi) {
          liveStreamState = updateLiveAssistantPhaseApi(
            {
              currentState: liveStreamState,
              roleAssistant: t("roleAssistant"),
              thinkingWord: t("thinkingWord"),
              localizePhase,
              appendMessage,
            },
            phase
          );
          return;
        }
        const normalized = String(phase || "").trim();
        if (!normalized || !liveStreamState) return;
        if (normalized === liveStreamState.currentAssistantPhase) return;

        const phaseLabel = localizePhase(normalized) || normalized;
        const nextMeta = `${t("roleAssistant")} · ${phaseLabel}`;
        const activeBubble = liveStreamState.currentAssistantBubble;

        if (
          activeBubble instanceof HTMLElement &&
          !liveStreamState.hasRealAssistantText &&
          !String(liveStreamState.textBuffer || "").trim()
        ) {
          setBubbleMetaText(activeBubble, nextMeta);
          liveStreamState.currentAssistantPhase = normalized;
          return;
        }

        const bubble = appendMessage("assistant", t("thinkingWord"), nextMeta);
        const nextContentEl = bubble?.querySelector(".message-content");
        if (!(nextContentEl instanceof HTMLElement)) return;

        liveStreamState.currentAssistantBubble = bubble;
        liveStreamState.assistantContentEl = nextContentEl;
        liveStreamState.textBuffer = "";
        liveStreamState.hasRealAssistantText = false;
        liveStreamState.currentAssistantPhase = normalized;
      }

      function splitLiveAssistantBubble(forcePhase = "") {
        if (splitLiveAssistantBubbleApi) {
          liveStreamState = splitLiveAssistantBubbleApi(
            {
              currentState: liveStreamState,
              roleAssistant: t("roleAssistant"),
              thinkingWord: t("thinkingWord"),
              localizePhase,
              appendMessage,
            },
            forcePhase
          );
          return;
        }
        if (!liveStreamState) return;
        const currentBubble = liveStreamState.currentAssistantBubble;
        if (!(currentBubble instanceof HTMLElement)) return;
        const hasText =
          liveStreamState.hasRealAssistantText || Boolean(String(liveStreamState.textBuffer || "").trim());
        if (!hasText) return;

        const normalized = String(forcePhase || liveStreamState.currentAssistantPhase || "").trim();
        const phaseLabel = normalized ? localizePhase(normalized) || normalized : "";
        const metaText = `${t("roleAssistant")}${phaseLabel ? ` · ${phaseLabel}` : ""}`;
        const bubble = appendMessage("assistant", t("thinkingWord"), metaText);
        const nextContentEl = bubble?.querySelector(".message-content");
        if (!(nextContentEl instanceof HTMLElement)) return;

        liveStreamState.currentAssistantBubble = bubble;
        liveStreamState.assistantContentEl = nextContentEl;
        liveStreamState.textBuffer = "";
        liveStreamState.hasRealAssistantText = false;
      }

      function setSummaryButtonText(summaryBtn, text) {
        if (setSummaryButtonTextApi) {
          setSummaryButtonTextApi(summaryBtn, text);
          return;
        }
        if (!(summaryBtn instanceof HTMLElement)) return;
        summaryBtn.textContent = String(text || "");
      }

      function appendStreamActivity(text) {
        const normalized = String(text || "").trim();
        if (!normalized || !liveStreamState) return;

        const isRun = /^Run:/i.test(normalized);
        const isDone = /^Done:/i.test(normalized);
        const isShellTool = /^Tool call:\s*shell_command/i.test(normalized);
        if (!isRun && !isDone && !isShellTool) return;

        const rendered = formatRunLineApi
          ? formatRunLineApi(normalized, {
              lang: currentLang,
              commandStarts: liveStreamState.commandStarts,
              nowMs: Date.now(),
            })
          : normalized;
        if (!rendered) return;

        const targetBubble = liveStreamState.currentAssistantBubble;
        if (!(targetBubble instanceof HTMLElement)) return;

        const rowEl = targetBubble.closest(".row.assistant");
        if (!(rowEl instanceof HTMLElement)) return;

        let commandState = liveStreamState.bubbleCommandState.get(targetBubble);
        if (!commandState) {
          const summaryBtn = document.createElement("button");
          summaryBtn.type = "button";
          summaryBtn.className = "stream-bubble-summary";
          summaryBtn.style.display = "none";

          const listEl = document.createElement("div");
          listEl.className = "stream-bubble-command-list";

          rowEl.insertBefore(summaryBtn, targetBubble);
          rowEl.appendChild(listEl);

          commandState = {
            summaryBtn,
            listEl,
            logs: [],
            startedAt: Date.now(),
            endedAt: null,
            expanded: true,
          };

          summaryBtn.addEventListener("click", () => {
            commandState.expanded = !commandState.expanded;
            listEl.classList.toggle("open", commandState.expanded);
            if (rowEl.classList.contains("assistant-process")) {
              rowEl.classList.toggle("open", commandState.expanded);
            }
            const elapsed = commandState.endedAt
              ? Math.max(1, Math.round((commandState.endedAt - commandState.startedAt) / 1000))
              : Math.max(1, Math.round((Date.now() - commandState.startedAt) / 1000));
            const arrow = commandState.expanded ? "v" : ">";
            setSummaryButtonText(
              summaryBtn,
              currentLang === "en" ? `Applied in ${elapsed}s ${arrow}` : `適用於 ${elapsed}s ${arrow}`
            );
          });

          liveStreamState.bubbleCommandState.set(targetBubble, commandState);
          if (rowEl.classList.contains("assistant-process")) {
            rowEl.classList.add("has-stream-summary");
          }
        }

        if (isDone) {
          const key = normalized.toLowerCase();
          if (liveStreamState.seenDoneKeys.has(key)) return;
          liveStreamState.seenDoneKeys.add(key);
        }

        liveStreamState.commandSeq += 1;
        liveStreamState.commandLogs.push({
          seq: liveStreamState.commandSeq,
          raw: normalized,
          rendered,
        });

        const line = document.createElement("div");
        line.className = "stream-bubble-command-line";
        line.textContent = rendered;
        commandState.logs.push(rendered);
        commandState.listEl.appendChild(line);
        commandState.listEl.classList.add("open");

        chat.scrollTop = chat.scrollHeight;
        updateScrollToBottomButton();
      }

      function collapseCommandLogs() {
        if (!liveStreamState?.bubbleCommandState) return;
        const checked = new Set();
        const collect = chat.querySelectorAll(".row.assistant .bubble");
        for (const bubble of collect) {
          const bubbleEl = bubble;
          if (!(bubbleEl instanceof HTMLElement) || checked.has(bubbleEl)) continue;
          checked.add(bubbleEl);
          const state = liveStreamState.bubbleCommandState.get(bubbleEl);
          if (!state || !state.logs.length) continue;
          const hasCommandLines =
            state.listEl instanceof HTMLElement &&
            state.listEl.querySelector(".stream-bubble-command-line");
          if (!hasCommandLines) {
            state.summaryBtn.style.display = "none";
            state.listEl.classList.remove("open");
            const rowElNoCmd = state.summaryBtn.closest(".row.assistant");
            if (rowElNoCmd instanceof HTMLElement) {
              rowElNoCmd.classList.remove("has-stream-summary");
            }
            continue;
          }

          state.endedAt = Date.now();
          const elapsedSec = Math.max(1, Math.round((state.endedAt - state.startedAt) / 1000));
          state.expanded = false;
          state.summaryBtn.style.display = "block";
          const rowEl = state.summaryBtn.closest(".row.assistant");
          if (rowEl instanceof HTMLElement && rowEl.classList.contains("assistant-process")) {
            rowEl.classList.remove("open");
          }
          setSummaryButtonText(
            state.summaryBtn,
            currentLang === "en" ? `Applied in ${elapsedSec}s >` : `適用於 ${elapsedSec}s >`
          );
          state.listEl.classList.remove("open");
        }
      }

      function scheduleCollapseCommandLogs(delayMs = 3500) {
        if (commandCollapseTimer) {
          clearTimeout(commandCollapseTimer);
        }
        commandCollapseTimer = setTimeout(() => {
          collapseCommandLogs();
          commandCollapseTimer = null;
        }, delayMs);
      }
      function placeGlossaryPanel() {
        if (!glossaryPanel.classList.contains("open")) return;

        glossaryPanel.style.left = "0px";
        glossaryPanel.style.right = "auto";

        const viewportWidth = window.innerWidth;
        const wrapRect = helpWrap.getBoundingClientRect();
        const panelWidth = glossaryPanel.getBoundingClientRect().width;
        const minGap = 8;

        const canOpenRight = wrapRect.left + panelWidth + minGap <= viewportWidth;
        const canOpenLeft = wrapRect.right - panelWidth - minGap >= 0;

        if (canOpenRight) {
          glossaryPanel.style.left = "0px";
          glossaryPanel.style.right = "auto";
          return;
        }

        if (canOpenLeft) {
          glossaryPanel.style.left = "auto";
          glossaryPanel.style.right = "0px";
          return;
        }

        const viewportLeft = Math.max(minGap, Math.min(wrapRect.left, viewportWidth - panelWidth - minGap));
        const relativeLeft = viewportLeft - wrapRect.left;
        glossaryPanel.style.left = `${relativeLeft}px`;
        glossaryPanel.style.right = "auto";
      }

      function placeActivityPanel() {
        if (!activityPanel.classList.contains("open")) return;

        activityPanel.style.left = "0px";
        activityPanel.style.right = "auto";

        const viewportWidth = window.innerWidth;
        const wrapRect = activityWrap.getBoundingClientRect();
        const panelWidth = activityPanel.getBoundingClientRect().width;
        const minGap = 8;

        const canOpenRight = wrapRect.left + panelWidth + minGap <= viewportWidth;
        const canOpenLeft = wrapRect.right - panelWidth - minGap >= 0;

        if (canOpenRight) {
          activityPanel.style.left = "0px";
          activityPanel.style.right = "auto";
          return;
        }
        if (canOpenLeft) {
          activityPanel.style.left = "auto";
          activityPanel.style.right = "0px";
          return;
        }

        const viewportLeft = Math.max(minGap, Math.min(wrapRect.left, viewportWidth - panelWidth - minGap));
        const relativeLeft = viewportLeft - wrapRect.left;
        activityPanel.style.left = `${relativeLeft}px`;
        activityPanel.style.right = "auto";
      }

      function applyLanguage() {
        appTitle.textContent = t("title");
        langBtn.textContent = t("langBtn");
        menuBtn.textContent = t("menuBtn");
        drawerTitle.textContent = t("drawerTitle");
        newSessionBtn.textContent = t("newSession");
        promptInput.placeholder = t("placeholder");
        attachBtn.textContent = t("attachBtn");
        sendBtn.textContent = t("sendBtn");
        streamBadge.textContent = t("streamBadge");
        renderModelPicker();
        glossaryPanel.innerHTML = getGlossaryHtml();
        renderActivityPanel();
        renderUsage(lastStats);
        placeGlossaryPanel();
        placeActivityPanel();
        setModelLoadingMask(modelLoadingMask?.classList.contains("open"), modelLoadingFailed);
      }

      function escapeHtml(input) {
        if (escapeHtmlApi) return escapeHtmlApi(input);
        return String(input);
      }

      function renderMarkdownToHtml(raw) {
        return escapeHtml(raw || "");
      }

      function renderMessageHtml(text) {
        if (renderMessageHtmlApi) return renderMessageHtmlApi(text);
        return escapeHtml(text || "");
      }

      function extractMarkdownImages(text) {
        if (extractMarkdownImagesApi) return extractMarkdownImagesApi(text);
        return { text: String(text || ""), images: [] };
      }

      function renderAttachments() {
        if (!renderAttachmentsApi) {
          attachmentList.innerHTML = "";
          return;
        }
        renderAttachmentsApi({
          attachmentListEl: attachmentList,
          uploadedImages,
          escapeHtml,
        });
      }

      async function uploadSelectedImages(files) {
        const fileToDataUrl = (file) =>
          new Promise((resolve) => {
            try {
              const reader = new FileReader();
              reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
              reader.onerror = () => resolve("");
              reader.readAsDataURL(file);
            } catch {
              resolve("");
            }
          });

        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          if (!uploadImageApi) throw new Error("ChatApiUtils.uploadImage unavailable");
          const data = await uploadImageApi(CHAT_API, formData);
          const previewUrl = await fileToDataUrl(file);

          uploadedImages.push({
            fileName: data.fileName || file.name,
            url: data.url,
            previewUrl: previewUrl || data.url,
            absolutePath: data.absolutePath,
            relativePath: data.relativePath,
          });
        }
        renderAttachments();
      }

      function setStatus(text) {
        statusText.textContent = text;
      }

      function setEmpty(message) {
        chat.innerHTML = `<div class="empty">${message}</div>`;
      }

      function setLoading() {
        setEmpty(t("emptyLoading"));
      }

      function updateUrl(sessionId) {
        const url = new URL(window.location.href);
        if (sessionId) url.searchParams.set("sessionId", sessionId);
        else url.searchParams.delete("sessionId");
        history.replaceState({}, "", url);
      }

      function openDrawer() {
        drawerBackdrop.classList.add("open");
      }

      function closeDrawer() {
        drawerBackdrop.classList.remove("open");
      }

      function ensureImageViewerController() {
        if (imageViewerController) return imageViewerController;
        if (!createImageViewerControllerApi) return null;
        imageViewerController = createImageViewerControllerApi({
          viewer: imageViewer,
          imageEl: imageViewerImg,
          prevBtn: imageViewerPrev,
          nextBtn: imageViewerNext,
          counterEl: imageViewerCounter,
        });
        return imageViewerController;
      }

      function renderImageViewerState() {
        const controller = ensureImageViewerController();
        if (!controller) return;
        controller.renderState();
      }

      function openImageViewer(src, alt = "preview", gallery = null, index = 0) {
        const controller = ensureImageViewerController();
        if (!controller) return;
        controller.open(src, alt, gallery, index);
      }

      function closeImageViewer() {
        const controller = ensureImageViewerController();
        if (!controller) return;
        controller.close();
      }

      function navigateImageViewer(step) {
        const controller = ensureImageViewerController();
        if (!controller) return;
        controller.navigate(step);
      }

      function renderSessionList(sessions) {
        cachedSessions = sessions;
        if (!renderSessionListApi) {
          sessionList.innerHTML = `<div class="empty">${escapeHtml(t("emptyNoSessions"))}</div>`;
          return;
        }
        renderSessionListApi({
          sessionListEl: sessionList,
          sessions,
          selectedSessionId,
          emptyText: t("emptyNoSessions"),
          formatTs: formatTimestampValue,
          escapeHtml,
        });
      }

      function updateInputLock() {
        const locked = isSending || serverLocked;
        sendBtn.disabled = locked;
        attachBtn.disabled = locked;
        imageInput.disabled = locked;
        modelPicker.disabled = locked;
        picker.disabled = locked;
        menuBtn.disabled = locked;
        newSessionBtn.disabled = locked;
        drawerCloseBtn.disabled = locked;
        promptInput.disabled = locked;
        attachmentList.style.display = locked ? "none" : "flex";
        if (!locked) renderAttachments();
        if (locked) closeDrawer();
      }

      function setSendingState(sending) {
        isSending = sending;
        updateInputLock();
        if (sending) {
          showActivityBubble(
            currentLang === "en" ? "Thinking..." : "思考中...",
            true
          );
        } else {
          hideActivityBubble(900);
        }
      }

      function autoResizePrompt() {
        const maxHeight = 180;
        promptInput.style.height = "auto";
        const nextHeight = Math.min(promptInput.scrollHeight, maxHeight);
        promptInput.style.height = `${nextHeight}px`;
        promptInput.style.overflowY = promptInput.scrollHeight > maxHeight ? "auto" : "hidden";
      }

      function appendMessage(role, text, metaText = "", phase = "") {
        if (chat.querySelector(".empty")) chat.innerHTML = "";
        const row = document.createElement("div");
        row.className = `row ${role}`;
        if (role === "assistant" && phase) {
          row.dataset.phase = String(phase);
        }
        row.innerHTML = `
          <div class="bubble">
            <div class="message-content">${renderMessageHtml(text)}</div>
            <div class="meta">${escapeHtml(metaText)}</div>
          </div>
        `;
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
        updateScrollToBottomButton();
        return row.querySelector(".bubble");
      }

      function createProcessBlock(text, metaText = "", open = false, phase = "") {
        if (createProcessBlockApi) {
          const row = createProcessBlockApi({
            text,
            metaText,
            open,
            phase,
            renderMessageHtml,
            escapeHtml,
          });
          chat.appendChild(row);
          chat.scrollTop = chat.scrollHeight;
          updateScrollToBottomButton();
          return row;
        }
        const row = document.createElement("div");
        row.className = "row assistant assistant-process";
        if (phase) row.dataset.phase = String(phase);
        if (open) row.classList.add("open");
        row.innerHTML = `
          <button type="button" class="assistant-process-toggle">
            <span class="assistant-process-meta">${escapeHtml(metaText)}</span>
            <span class="assistant-process-arrow">${open ? "v" : ">"}</span>
          </button>
          <div class="assistant-process-body">${renderMessageHtml(text)}</div>
        `;
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
        updateScrollToBottomButton();
        return row;
      }

      function createAssistantPlainBlock(text, metaText = "", phase = "") {
        if (createAssistantPlainBlockApi) {
          const row = createAssistantPlainBlockApi({
            text,
            metaText,
            phase,
            renderMessageHtml,
            escapeHtml,
          });
          chat.appendChild(row);
          chat.scrollTop = chat.scrollHeight;
          updateScrollToBottomButton();
          return row;
        }
        const row = document.createElement("div");
        row.className = "row assistant assistant-plain";
        if (phase) row.dataset.phase = String(phase);
        row.innerHTML = `
          <div class="assistant-plain-content">${renderMessageHtml(text)}</div>
          <div class="meta">${escapeHtml(metaText)}</div>
        `;
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
        updateScrollToBottomButton();
        return row;
      }

      function replaceBubbleWithProcessBlock(bubbleEl, text, metaText = "", open = false, phase = "") {
        if (!(bubbleEl instanceof HTMLElement)) return null;
        const row = bubbleEl.closest(".row.assistant");
        if (!(row instanceof HTMLElement)) return null;
        if (phase) row.dataset.phase = String(phase);
        row.classList.add("assistant-process");
        if (open) row.classList.add("open");
        bubbleEl.remove();

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "assistant-process-toggle";
        toggle.innerHTML = `
          <span class="assistant-process-meta">${escapeHtml(metaText)}</span>
          <span class="assistant-process-arrow">${open ? "v" : ">"}</span>
        `;

        const body = document.createElement("div");
        body.className = "assistant-process-body";
        body.innerHTML = renderMessageHtml(text);

        const summaryBtn = row.querySelector(".stream-bubble-summary");
        const commandList = row.querySelector(".stream-bubble-command-list");
        const hasCommandRecords =
          commandList instanceof HTMLElement &&
          commandList.querySelector(".stream-bubble-command-line");
        if (summaryBtn instanceof HTMLElement && hasCommandRecords) {
          row.classList.add("has-stream-summary");
          if (commandList instanceof HTMLElement) {
            row.insertBefore(body, commandList);
          } else {
            summaryBtn.insertAdjacentElement("afterend", body);
          }
        } else {
          if (summaryBtn instanceof HTMLElement) {
            summaryBtn.remove();
          }
          if (commandList instanceof HTMLElement) {
            commandList.remove();
          }
          row.classList.remove("has-stream-summary");
          row.appendChild(toggle);
          row.appendChild(body);
        }
        return row;
      }

      function appendAssistantByPhase(text, phase = "", timestamp = "") {
        const parsed = extractMarkdownImages(text);
        const renderText = parsed.text;
        const normalizedPhase = String(phase || "").trim();
        const phaseLabel = localizePhase(normalizedPhase);
        const metaText = `${t("roleAssistant")}${phaseLabel ? ` · ${phaseLabel}` : ""}${
          timestamp ? ` · ${formatTimestampValue(timestamp)}` : ""
        }`;

        if (normalizedPhase && normalizedPhase !== PHASE_FINAL_ANSWER) {
          const row = createProcessBlock(renderText, metaText, false, normalizedPhase);
          appendMessageImageAttachments(row, parsed.images);
          return row;
        }
        const row = createAssistantPlainBlock(
          renderText,
          metaText,
          normalizedPhase || PHASE_FINAL_ANSWER
        );
        appendMessageImageAttachments(row, parsed.images);
        return row;
      }

      function groupMessagesForRender(messages) {
        if (groupMessagesForRenderApi) {
          return groupMessagesForRenderApi(messages, {
            phaseFinalAnswer: PHASE_FINAL_ANSWER,
            phaseCommentary: PHASE_COMMENTARY,
          });
        }
        const grouped = [];
        let pendingAssistantGroup = null;

        const flushPending = () => {
          if (!pendingAssistantGroup) return;
          grouped.push({
            role: "assistant",
            phase: pendingAssistantGroup.phase,
            timestamp: pendingAssistantGroup.timestamp,
            text: pendingAssistantGroup.texts.filter(Boolean).join("\n\n"),
          });
          pendingAssistantGroup = null;
        };

        for (const m of messages) {
          if (m?.role !== "assistant" || m?.type === "image") {
            flushPending();
            grouped.push(m);
            continue;
          }

          const phase = String(m?.phase || "").trim();
          const isProcess = phase !== PHASE_FINAL_ANSWER;
          if (!isProcess) {
            flushPending();
            grouped.push(m);
            continue;
          }

          if (!pendingAssistantGroup) {
            pendingAssistantGroup = {
              phase: phase || PHASE_COMMENTARY,
              timestamp: m.timestamp || "",
              texts: [m.text || ""],
            };
            continue;
          }

          pendingAssistantGroup.texts.push(m.text || "");
        }

        flushPending();
        return grouped;
      }

      function ensureProcessFinalDivider(processRow, show) {
        if (ensureProcessFinalDividerApi) {
          ensureProcessFinalDividerApi(processRow, show, {
            label: currentLang === "en" ? "Final message" : "最終訊息",
          });
          return;
        }
        if (!(processRow instanceof HTMLElement)) return;
        const existing = processRow.nextElementSibling;
        const isExistingDivider =
          existing instanceof HTMLElement && existing.classList.contains("assistant-final-divider-row");
        if (!show) {
          if (isExistingDivider) existing.remove();
          return;
        }

        if (isExistingDivider) return;

        const row = document.createElement("div");
        row.className = "row assistant-final-divider-row";
        const divider = document.createElement("div");
        divider.className = "assistant-final-divider";
        divider.innerHTML = `<span class="assistant-final-divider-label">${
          currentLang === "en" ? "Final message" : "最終訊息"
        }</span>`;
        row.appendChild(divider);
        processRow.insertAdjacentElement("afterend", row);
      }

      function refreshFinalDividers() {
        if (refreshFinalDividersApi) {
          refreshFinalDividersApi({
            chatEl: chat,
            phaseFinalAnswer: PHASE_FINAL_ANSWER,
            label: currentLang === "en" ? "Final message" : "最終訊息",
            ensureProcessFinalDivider,
          });
          return;
        }
        const rows = Array.from(chat.querySelectorAll(".row.assistant"));
        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          if (!(row instanceof HTMLElement)) continue;
          if (!row.classList.contains("assistant-process")) continue;

          const phase = String(row.dataset.phase || "").trim();
          const next = rows[i + 1];
          const nextPhase = next instanceof HTMLElement ? String(next.dataset.phase || "").trim() : "";
          const shouldShow = phase !== PHASE_FINAL_ANSWER && nextPhase === PHASE_FINAL_ANSWER;
          ensureProcessFinalDivider(row, shouldShow);
        }
      }

      function setBubbleText(bubbleEl, text) {
        if (setBubbleTextApi) {
          setBubbleTextApi(bubbleEl, text, { renderMessageHtml });
          return;
        }
        if (!(bubbleEl instanceof HTMLElement)) return;
        const contentEl = bubbleEl.querySelector(".message-content");
        if (!(contentEl instanceof HTMLElement)) return;
        contentEl.innerHTML = renderMessageHtml(text);
      }

      function renderMessages(messages, options = {}) {
        streamingAssistantBubble = null;
        const forceBottom = Boolean(options.forceBottom);
        const preserveScroll = options.preserveScroll !== false;
        const prevBottomGap = preserveScroll
          ? Math.max(0, chat.scrollHeight - chat.scrollTop - chat.clientHeight)
          : 0;
        if (!messages.length) {
          setEmpty(t("emptyNoMessages"));
          return;
        }
        const groupedMessages = groupMessagesForRender(messages);
        chat.innerHTML = "";
        let lastBubbleContext = null;
        for (const m of groupedMessages) {
          if (m?.type === "image") {
            const canAttachToPrevious =
              lastBubbleContext &&
              lastBubbleContext.row instanceof HTMLElement &&
              lastBubbleContext.role === m.role &&
              String(lastBubbleContext.timestamp || "") === String(m.timestamp || "") &&
              String(lastBubbleContext.phase || "") === String(m.phase || "");
            if (canAttachToPrevious) {
              appendMessageImageAttachments(lastBubbleContext.row, [
                {
                  url: String(m.imageUrl || ""),
                  fileName: String(m.fileName || "attachment"),
                },
              ]);
              continue;
            }
            const isAssistant = m.role === "assistant";
            const phase = isAssistant ? String(m.phase || "").trim() : "";
            const phaseLabel = isAssistant && phase ? localizePhase(phase) : "";
            const metaText = isAssistant
              ? `${t("roleAssistant")}${phaseLabel ? ` · ${phaseLabel}` : ""}${m.timestamp ? ` · ${formatTimestampValue(m.timestamp)}` : ""}`
              : `${t("roleUser")}${m.timestamp ? ` · ${formatTimestampValue(m.timestamp)}` : ""}`;
            const row = appendMessage(m.role, "", metaText, phase || "");
            appendMessageImageAttachments(row, [
              {
                url: String(m.imageUrl || ""),
                fileName: String(m.fileName || "attachment"),
              },
            ]);
            lastBubbleContext = {
              row,
              role: m.role,
              timestamp: m.timestamp || "",
              phase: phase || "",
            };
            continue;
          }
          if (m.role === "user") {
            const userText =
              m.text && String(m.text).trim()
                ? m.text
                : "";
            const userRow = appendMessage(
              "user",
              userText,
              `${t("roleUser")}${m.timestamp ? ` · ${formatTimestampValue(m.timestamp)}` : ""}`
            );
            lastBubbleContext = {
              row: userRow,
              role: "user",
              timestamp: m.timestamp || "",
              phase: "",
            };
            continue;
          }
          const assistantRow = appendAssistantByPhase(m.text, m.phase, m.timestamp);
          lastBubbleContext = {
            row: assistantRow,
            role: "assistant",
            timestamp: m.timestamp || "",
            phase: String(m.phase || "").trim(),
          };
        }
        refreshFinalDividers();
        if (forceBottom || !preserveScroll) {
          chat.scrollTop = chat.scrollHeight;
        } else {
          const maxTop = Math.max(0, chat.scrollHeight - chat.clientHeight);
          const nextTop = Math.max(0, Math.min(maxTop, maxTop - prevBottomGap));
          chat.scrollTop = nextTop;
        }
        updateScrollToBottomButton();
      }

      function updateScrollToBottomButton() {
        if (!scrollToBottomBtn) return;
        if (bottomComposer) {
          const gap = 8;
          const buttonHeight = 36;
          const rect = bottomComposer.getBoundingClientRect();
          const top = Math.max(8, rect.top - buttonHeight - gap);
          scrollToBottomBtn.style.top = `${Math.round(top)}px`;
          scrollToBottomBtn.style.bottom = "auto";
        }
        const distanceFromBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
        if (distanceFromBottom > 140) {
          scrollToBottomBtn.classList.add("open");
        } else {
          scrollToBottomBtn.classList.remove("open");
        }
      }

      function resolveMapLabel(sectionName, key, fallback) {
        const section = runtimeI18nMap?.[sectionName];
        if (!section || typeof section !== "object") return fallback;
        const entry = section[key];
        if (!entry || typeof entry !== "object") return fallback;
        const localized = entry[currentLang];
        if (typeof localized !== "string") return fallback;
        const trimmed = localized.trim();
        return trimmed || fallback;
      }

      function localizePhase(phase) {
        if (localizePhaseApi) {
          return localizePhaseApi(runtimeI18nMap, phase, currentLang);
        }
        const raw = String(phase || "").trim();
        if (!raw || currentLang === "en") return raw;
        return resolveMapLabel("phase", raw, raw);
      }

      function localizeStatusWord(statusWord) {
        if (localizeStatusApi) {
          return localizeStatusApi(runtimeI18nMap, statusWord, currentLang);
        }
        const raw = String(statusWord || "").trim();
        if (!raw || currentLang === "en") return raw;
        return resolveMapLabel("status", raw, raw);
      }

      function autoSwitchModelOnAccessError(messageText) {
        const text = String(messageText || "").toLowerCase();
        if (!text.includes(ERROR_TOKEN_MODEL_ACCESS_DENIED)) return false;

        const preferred = availableModels.find((item) => item.value === "gpt-5.2")?.value;
        const fallback =
          preferred ||
          availableModels.find((item) => item.value && item.value !== currentModel)?.value;
        if (!fallback || fallback === currentModel) return false;

        currentModel = fallback;
        localStorage.setItem("chat_model", currentModel);
        renderModelPicker();
        addActivity(
          currentLang === "en"
            ? `Auto-switched model to ${currentModel} (access fallback)`
            : `偵測到模型權限問題，已自動切換到 ${currentModel}`
        );
        return true;
      }

      function formatActivityEvent(event) {
        if (formatActivityEventApi) {
          return formatActivityEventApi(runtimeI18nMap, event, currentLang);
        }
        const rawText = String(event?.text || "").trim();
        const code = String(event?.code || "").trim();
        if (!rawText) return "";
        if (currentLang === "en" || !code) return rawText;
        const label = resolveMapLabel("activityCode", code, rawText);
        const colonIndex = rawText.indexOf(":");
        if (colonIndex > -1) {
          const detail = rawText.slice(colonIndex + 1).trim();
          if (detail) return `${label}：${detail}`;
        }
        return label;
      }

      function renderUsage(stats) {
        if (!stats) {
          usageContext.textContent = t("usageContextEmpty");
          usage5h.textContent = t("usage5hEmpty");
          usageWeek.textContent = t("usageWeekEmpty");
          return;
        }
        const contextRemainPercent =
          stats.contextWindow && stats.contextWindow > 0 && stats.contextRemaining !== null
            ? `${Math.max(0, Math.round((Number(stats.contextRemaining) / Number(stats.contextWindow)) * 100))}%`
            : null;
        const fiveHourRemain =
          stats.fiveHourUsedPercent === null || stats.fiveHourUsedPercent === undefined
            ? "-"
            : `${Math.max(0, 100 - Number(stats.fiveHourUsedPercent))}%`;
        const weekRemain =
          stats.weekUsedPercent === null || stats.weekUsedPercent === undefined
            ? "-"
            : `${Math.max(0, 100 - Number(stats.weekUsedPercent))}%`;
        const contextRemain = formatUsageNumber(stats.contextRemaining);
        const contextWindow = formatUsageNumber(stats.contextWindow);
        usageContext.textContent = contextRemainPercent
          ? t("usageContextWithPercent")(contextRemain, contextWindow, contextRemainPercent)
          : t("usageContext")(contextRemain, contextWindow);
        usage5h.textContent = t("usage5h")(fiveHourRemain);
        usageWeek.textContent = t("usageWeek")(weekRemain);
      }

      async function loadStats(sessionId) {
        if (!sessionId) {
          lastStats = null;
          renderUsage(null);
          return;
        }
        try {
          if (!fetchSessionStatsApi) throw new Error("ChatApiUtils.fetchSessionStats unavailable");
          const data = await fetchSessionStatsApi(CHAT_API, sessionId);
          lastStats = data.stats || null;
          renderUsage(lastStats);
        } catch {
          lastStats = null;
          renderUsage(null);
        }
      }

      async function loadSessions() {
        addActivity(currentLang === "en" ? "Loading sessions list..." : "正在載入 session 清單...");
        if (!fetchSessionsApi) throw new Error("ChatApiUtils.fetchSessions unavailable");
        const data = await fetchSessionsApi(CHAT_API);
        const sessions = (data.sessions || []).slice().sort((a, b) => {
          const ta = Date.parse(a?.updatedAt || "") || 0;
          const tb = Date.parse(b?.updatedAt || "") || 0;
          return tb - ta;
        });
        cachedSessions = sessions;
        if (!sessions.length) {
          picker.innerHTML = "";
          renderSessionList([]);
          setEmpty(t("emptyNoSessions"));
          return;
        }
        const hasSelected = selectedSessionId
          ? sessions.some((s) => s.id === selectedSessionId)
          : false;
        let optionsHtml = sessions
          .map((s) => {
            const when = formatTimestampValue(s.updatedAt);
            const title = `${s.title || s.id}${when ? ` (${when})` : ""}`;
            return `<option value="${s.id}">${escapeHtml(title)}</option>`;
          })
          .join("");

        // New session id can appear before session_index is fully updated.
        // Keep it selected instead of jumping back to another session.
        let drawerSessions = sessions;
        if (selectedSessionId && !hasSelected) {
          const pendingTitle = `${selectedSessionId.slice(0, 8)}... (syncing)`;
          optionsHtml = `<option value="${selectedSessionId}">${escapeHtml(pendingTitle)}</option>${optionsHtml}`;
          drawerSessions = [{ id: selectedSessionId, title: pendingTitle, updatedAt: "" }, ...sessions];
        }

        picker.innerHTML = optionsHtml;
        renderSessionList(drawerSessions);

        if (!selectedSessionId) {
          selectedSessionId = sessions[0].id;
        }
        picker.value = selectedSessionId;
        addActivity(
          currentLang === "en"
            ? `Sessions ready (${sessions.length})`
            : `Session 清單已更新（${sessions.length} 筆）`
        );
      }

      async function loadMessages(sessionId, options = {}) {
        const { showLoading = true } = options;
        if (!sessionId) return;
        addActivity(
          currentLang === "en"
            ? `Loading messages for ${sessionId.slice(0, 8)}...`
            : `正在載入 ${sessionId.slice(0, 8)} 的訊息...`
        );
        if (showLoading) setLoading();
        updateUrl(sessionId);
        let data;
        try {
          if (!fetchSessionMessagesApi) {
            throw new Error("ChatApiUtils.fetchSessionMessages unavailable");
          }
          data = await fetchSessionMessagesApi(CHAT_API, sessionId);
        } catch (error) {
          setEmpty(error instanceof Error ? error.message : "Failed to load messages");
          addActivity(currentLang === "en" ? "Load messages failed" : "載入訊息失敗");
          return;
        }
        renderMessages(data.messages || [], { forceBottom: true, preserveScroll: false });
        await loadStats(sessionId);
        addActivity(
          currentLang === "en"
            ? `Messages synced (${(data.messages || []).length})`
            : `訊息同步完成（${(data.messages || []).length} 則）`
        );
      }

      async function syncMessagesNoFlicker(sessionId) {
        if (!sessionId) return;
        if (isSending || streamingAssistantBubble) return;
        let data;
        try {
          if (!fetchSessionMessagesApi) return;
          data = await fetchSessionMessagesApi(CHAT_API, sessionId);
          if (!data) return;
        } catch {
          return;
        }
        renderMessages(data.messages || [], { preserveScroll: true });
      }

      async function syncMessagesForce(sessionId) {
        if (!sessionId) return;
        let data;
        try {
          if (!fetchSessionMessagesApi) return;
          data = await fetchSessionMessagesApi(CHAT_API, sessionId);
          if (!data) return;
        } catch {
          return;
        }
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        const domHasFinalAssistant = Boolean(chat.querySelector(FINAL_ASSISTANT_ROWS_SELECTOR));
        const serverHasFinalAssistant = incoming.some(
          (m) =>
            m?.role === "assistant" &&
            m?.type !== "image" &&
            String(m?.phase || "").trim() === PHASE_FINAL_ANSWER
        );
        // Protect against race: if UI already has a streamed final answer but
        // server persistence lags behind, don't overwrite with older state.
        if (domHasFinalAssistant && !serverHasFinalAssistant) return;
        renderMessages(incoming, { preserveScroll: true });
      }

      async function syncMessagesWithRetry(
        sessionId,
        retries = SYNC_RETRIES,
        delayMs = SYNC_DELAY_MS
      ) {
        if (!sessionId) return;
        for (let i = 0; i < retries; i += 1) {
          await syncMessagesForce(sessionId);
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      function appendMessageImageAttachments(rowEl, images) {
        if (!(rowEl instanceof HTMLElement) || !Array.isArray(images) || images.length === 0) return;
        const bubble = rowEl.classList.contains("bubble") ? rowEl : rowEl.querySelector(".bubble");
        const plainRow =
          bubble ? null : rowEl.classList.contains("assistant-plain")
            ? rowEl
            : rowEl.querySelector(".row.assistant.assistant-plain");
        const processBody =
          bubble || plainRow
            ? null
            : rowEl.classList.contains("assistant-process-body")
              ? rowEl
              : rowEl.querySelector(".assistant-process-body");
        if (!(bubble instanceof HTMLElement) && !(plainRow instanceof HTMLElement) && !(processBody instanceof HTMLElement)) {
          return;
        }

        const host =
          bubble instanceof HTMLElement
            ? bubble
            : plainRow instanceof HTMLElement
              ? plainRow
              : processBody instanceof HTMLElement
                ? processBody
                : null;
        if (!(host instanceof HTMLElement)) return;
        let wrap = host.querySelector(":scope > .message-image-attachments");
        if (!(wrap instanceof HTMLElement)) {
          wrap = document.createElement("div");
          wrap.className = "message-image-attachments";
          wrap.style.display = "flex";
          wrap.style.flexWrap = "wrap";
          wrap.style.gap = "8px";
          wrap.style.marginTop = "8px";
        }

        for (const img of images) {
          const src = String(img?.url || img?.previewUrl || "").trim();
          if (!src) continue;
          const thumb = document.createElement("img");
          thumb.src = src;
          thumb.alt = String(img?.fileName || "attachment");
          thumb.className = "inline-image";
          thumb.loading = "lazy";
          thumb.style.width = "96px";
          thumb.style.height = "96px";
          thumb.style.objectFit = "cover";
          thumb.style.borderRadius = "8px";
          thumb.style.cursor = "zoom-in";
          wrap.appendChild(thumb);
        }

        if (wrap.childElementCount > 0) {
          if (bubble instanceof HTMLElement) {
            const metaEl = bubble.querySelector(".meta");
            if (metaEl instanceof HTMLElement && wrap.parentElement !== bubble) {
              bubble.insertBefore(wrap, metaEl);
            } else if (wrap.parentElement !== bubble) {
              bubble.appendChild(wrap);
            }
            return;
          }
          if (plainRow instanceof HTMLElement) {
            const metaEl = plainRow.querySelector(".meta");
            if (metaEl instanceof HTMLElement && wrap.parentElement !== plainRow) {
              plainRow.insertBefore(wrap, metaEl);
            } else if (wrap.parentElement !== plainRow) {
              plainRow.appendChild(wrap);
            }
            return;
          }
          if (processBody instanceof HTMLElement && wrap.parentElement !== processBody) {
            processBody.appendChild(wrap);
          }
        }
      }


      async function recoverAfterStreamInterruption(sessionId) {
        if (recoverAfterStreamInterruptionApi) {
          return recoverAfterStreamInterruptionApi(
            {
              loadSessions,
              setPickerValue: (id) => {
                picker.value = id;
              },
              syncMessagesWithRetry,
              syncRetries: SYNC_RETRIES,
              syncDelayMs: SYNC_DELAY_MS,
              loadStats,
              reconcileAssistantSplitFromSession,
            },
            sessionId
          );
        }
        if (!sessionId) return false;
        try {
          await loadSessions();
          picker.value = sessionId;
          await syncMessagesWithRetry(sessionId, SYNC_RETRIES, SYNC_DELAY_MS);
          await loadStats(sessionId);
          await reconcileAssistantSplitFromSession(sessionId);
          return true;
        } catch {
          return false;
        }
      }

      async function reconcileAssistantSplitFromSession(sessionId) {
        if (reconcileAssistantSplitFromSessionApi) {
          return reconcileAssistantSplitFromSessionApi(
            {
              liveStreamState,
              fetchSessionMessages: async (id) => {
                if (!fetchSessionMessagesApi) return null;
                return fetchSessionMessagesApi(CHAT_API, id);
              },
              phaseFinalAnswer: PHASE_FINAL_ANSWER,
              localizePhase,
              roleAssistant: t("roleAssistant"),
              formatTimestamp: formatTimestampValue,
              replaceBubbleWithProcessBlock,
              appendAssistantByPhase,
              refreshFinalDividers,
            },
            sessionId
          );
        }
        if (!sessionId || !liveStreamState) return;
        if (liveStreamState.splitReconciled) return;
        const firstBubble = liveStreamState.currentAssistantBubble;
        if (!(firstBubble instanceof HTMLElement)) return;

        let data;
        try {
          if (!fetchSessionMessagesApi) return;
          data = await fetchSessionMessagesApi(CHAT_API, sessionId);
          if (!data) return;
        } catch {
          return;
        }

        const messages = Array.isArray(data.messages) ? data.messages : [];
        if (!messages.length) return;
        const tail = [];
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          const msg = messages[i];
          if (msg?.role !== "assistant") break;
          tail.unshift(msg);
        }
        if (!tail.length) return;
        const textTail = tail.filter((m) => m?.type !== "image");
        if (!textTail.length) return;

        const processItems = textTail.filter(
          (m) => String(m?.phase || "").trim() !== PHASE_FINAL_ANSWER
        );
        const finalItems = textTail.filter(
          (m) => String(m?.phase || "").trim() === PHASE_FINAL_ANSWER
        );
        if (!processItems.length || !finalItems.length) return;

        const firstProcess = processItems[0];
        const processPhase = String(firstProcess?.phase || "").trim();
        const processText = processItems.map((m) => String(m?.text || "")).filter(Boolean).join("\n\n");
        const processPhaseLabel = localizePhase(processPhase);
        const processMeta = `${t("roleAssistant")}${processPhaseLabel ? ` · ${processPhaseLabel}` : ""}${
          firstProcess?.timestamp ? ` · ${formatTimestampValue(firstProcess.timestamp)}` : ""
        }`;

        replaceBubbleWithProcessBlock(firstBubble, processText, processMeta, false, processPhase);

        for (const msg of finalItems) {
          appendAssistantByPhase(msg.text || "", msg.phase || "", msg.timestamp || "");
        }
        refreshFinalDividers();
        liveStreamState.splitReconciled = true;
      }

      async function refreshServerLock() {
        try {
          if (!fetchChatStatusApi) return;
          const data = await fetchChatStatusApi(CHAT_API);
          const ids = Array.isArray(data.activeSessionIds) ? data.activeSessionIds : [];
          const hasGlobal = Number(data.activeRunCount || 0) > 0;
          serverLocked = selectedSessionId ? ids.includes(selectedSessionId) : hasGlobal;
          updateInputLock();
          if (serverLocked && !isSending) setStatus(t("statusThinkingLock"));
          else if (!isSending) setStatus(t("statusReady"));
        } catch {
          // ignore
        }
      }

      async function sendWithoutStream(promptWithImages) {
        if (sendWithoutStreamApi) {
          return sendWithoutStreamApi(
            {
              sessionId: selectedSessionId,
              currentModel,
              sendChatNonStream: async (payload) => {
                if (!sendChatNonStreamApi) {
                  throw new Error("ChatApiUtils.sendChatNonStream unavailable");
                }
                return sendChatNonStreamApi(CHAT_API, payload);
              },
              setSessionId: (id) => {
                selectedSessionId = id;
              },
              updateUrl,
              loadSessions,
              setPickerValue: (id) => {
                picker.value = id;
              },
              loadMessages,
            },
            promptWithImages
          );
        }
        if (!sendChatNonStreamApi) {
          throw new Error("ChatApiUtils.sendChatNonStream unavailable");
        }
        const data = await sendChatNonStreamApi(CHAT_API, {
          sessionId: selectedSessionId,
          prompt: promptWithImages,
          model: currentModel || null,
        });

        if (data.sessionId) {
          selectedSessionId = data.sessionId;
          updateUrl(selectedSessionId);
        }
        await loadSessions();
        if (selectedSessionId) {
          picker.value = selectedSessionId;
          await loadMessages(selectedSessionId, { showLoading: false });
        }
      }

      async function sendMessage(prompt, imagesToSend = []) {
        setSendingState(true);
        setStatus(t("statusSending"));
        addActivity(currentLang === "en" ? "Sending prompt to Codex..." : "正在送出訊息到 Codex...");
        let gotStreamEvent = false;
        let streamDone = false;
        let stallTimer = null;
        const promptForModel = String(prompt || "");
        const imageAbsolutePaths = imagesToSend
          .map((img) => String(img?.absolutePath || "").trim())
          .filter(Boolean);
        const userText =
          prompt && prompt.trim()
            ? prompt
            : imagesToSend.length > 0
              ? currentLang === "en"
                ? CHAT_IMAGE_PLACEHOLDER.EN || "[Image attachment]"
                : CHAT_IMAGE_PLACEHOLDER.ZH || "[圖片附件]"
              : "";
        const userRow = appendMessage("user", userText, t("userNow"));
        appendMessageImageAttachments(userRow, imagesToSend);
        streamingAssistantBubble = appendMessage(
          "assistant",
          t("thinkingWord"),
          t("assistantStreaming")
        );
        initLiveStream();

        try {
          const abortController = new AbortController();
          let lastChunkAt = Date.now();
          const touchStream = () => {
            lastChunkAt = Date.now();
          };
          const stopWatchdog = () => {
            if (stallTimer) {
              clearInterval(stallTimer);
              stallTimer = null;
            }
          };
          stallTimer = setInterval(() => {
            // Network can silently stall while the UI remains in "thinking...".
            // Abort and force a sync fallback so the final answer can still appear.
            if (Date.now() - lastChunkAt > STREAM_STALL_TIMEOUT_MS) {
              abortController.abort(ERROR_TOKEN_STREAM_STALLED);
            }
          }, STREAM_STALL_CHECK_INTERVAL_MS);

          if (!openChatStreamApi) throw new Error("ChatApiUtils.openChatStream unavailable");
          const res = await openChatStreamApi(
            CHAT_API,
            {
              sessionId: selectedSessionId,
              prompt: promptForModel,
              model: currentModel || null,
              images: imageAbsolutePaths,
            },
            abortController.signal
          );

          if (!res.body || typeof res.body.getReader !== "function") {
            addActivity(
              currentLang === "en"
                ? "Stream unsupported on this browser. Falling back..."
                : "此瀏覽器不支援串流，改用一般傳送..."
            );
            await sendWithoutStream(promptForModel);
            setStatus(t("statusDone"));
            return;
          }
          addActivity(currentLang === "en" ? "Stream connected" : "串流已連線");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          const streamDispatcher = createStreamDispatcherApi
            ? createStreamDispatcherApi({
                streamEvents: {
                  STATUS: STREAM_EVENT_STATUS,
                  HEARTBEAT: STREAM_EVENT_HEARTBEAT,
                  ACTIVITY: STREAM_EVENT_ACTIVITY,
                  SESSION: STREAM_EVENT_SESSION,
                  ASSISTANT: STREAM_EVENT_ASSISTANT,
                  ASSISTANT_BOUNDARY: STREAM_EVENT_ASSISTANT_BOUNDARY,
                  ASSISTANT_PHASE: STREAM_EVENT_ASSISTANT_PHASE,
                  ERROR: STREAM_EVENT_ERROR,
                  DONE: STREAM_EVENT_DONE,
                },
                markGotEvent: () => {
                  gotStreamEvent = true;
                },
                onStatus: async (event) => {
                  const text = String(event.text || STREAM_STATUS_THINKING);
                  const statusText = localizeStatusWord(text);
                  const statusLine =
                    currentLang === "en"
                      ? `Status: ${statusText || text}`
                      : `狀態：${statusText || text}`;
                  setStatus(
                    text === STREAM_STATUS_THINKING
                      ? t("statusThinking")
                      : `${t("statusSending")} (${statusText || text})`
                  );
                  addActivity(statusLine);
                  showActivityBubble(statusLine, true);
                },
                onHeartbeat: async () => {},
                onActivity: async (event) => {
                  const rawText = String(event.text || "").trim();
                  const text = formatActivityEvent(event);
                  if (text) addActivity(text);
                  if (rawText) appendStreamActivity(rawText);
                },
                onSession: async (event) => {
                  if (!event.sessionId) return;
                  selectedSessionId = event.sessionId;
                  updateUrl(selectedSessionId);
                  addActivity(
                    currentLang === "en"
                      ? `Session assigned: ${event.sessionId.slice(0, 8)}...`
                      : `已分配 Session：${event.sessionId.slice(0, 8)}...`
                  );
                },
                onAssistant: async (event) => {
                  if (streamingAssistantBubble) {
                    appendStreamNote(event.text || "");
                  }
                  chat.scrollTop = chat.scrollHeight;
                  updateScrollToBottomButton();
                },
                onAssistantBoundary: async () => {
                  splitLiveAssistantBubble();
                },
                onAssistantPhase: async (event) => {
                  updateLiveAssistantPhase(event.phase || "");
                },
                onError: async (event) => {
                  const errMsg = String(event.message || "Unknown stream error");
                  autoSwitchModelOnAccessError(errMsg);
                  throw new Error(errMsg);
                },
                onDone: async () => {
                  streamDone = true;
                  setStatus(t("statusDone"));
                  scheduleCollapseCommandLogs(3500);
                  if (selectedSessionId) {
                    await reconcileAssistantSplitFromSession(selectedSessionId);
                  }
                  addActivity(currentLang === "en" ? "Stream done" : "串流完成");
                  hideActivityBubble(700);
                },
              })
            : null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            touchStream();
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (streamDispatcher) {
                await streamDispatcher.dispatchLine(line);
                continue;
              }
              if (!line.trim()) continue;
            }
          }

          if (streamDispatcher) {
            await streamDispatcher.dispatchLine(buffer);
          }
          if (!streamDone) {
            throw new Error(ERROR_TOKEN_STREAM_INCOMPLETE);
          }

          if (selectedSessionId) {
            const bgSessionId = selectedSessionId;
            // Do post-stream sync in background so UI exits "thinking" immediately.
            void (async () => {
              await new Promise((resolve) => setTimeout(resolve, 900));
              await loadSessions();
              picker.value = bgSessionId;
              await syncMessagesWithRetry(
                bgSessionId,
                SYNC_POST_STREAM_RETRIES,
                SYNC_POST_STREAM_DELAY_MS
              );
              await loadStats(bgSessionId);
              setTimeout(() => {
                loadSessions().catch(() => {});
                syncMessagesWithRetry(
                  bgSessionId,
                  SYNC_BACKGROUND_RETRIES,
                  SYNC_BACKGROUND_DELAY_MS
                ).catch(() => {});
              }, 1500);
            })();
          }
          stopWatchdog();
          setStatus(t("statusReady"));
        } catch (error) {
          if (stallTimer) {
            clearInterval(stallTimer);
            stallTimer = null;
          }

          const retryableError = isRetryableStreamErrorApi
            ? isRetryableStreamErrorApi(error, {
                abortName: ERROR_NAME_ABORT,
                tokens: STREAM_RETRY_ERROR_TOKENS,
              })
            : false;

          let recovered = false;
          if (selectedSessionId && (retryableError || gotStreamEvent || !streamDone)) {
            recovered = await recoverAfterStreamInterruption(selectedSessionId);
          }

          if (!recovered && retryableError && !gotStreamEvent) {
            for (let attempt = 1; attempt <= STREAM_RETRY_MAX_ATTEMPTS; attempt += 1) {
              const retryDelay = getRetryBackoffMsApi
                ? getRetryBackoffMsApi(attempt, {
                    baseDelayMs: STREAM_RETRY_BASE_DELAY_MS,
                    maxDelayMs: STREAM_RETRY_MAX_DELAY_MS,
                    jitterMs: STREAM_RETRY_JITTER_MS,
                  })
                : STREAM_RETRY_BASE_DELAY_MS;
              addActivity(
                currentLang === "en"
                  ? `Stream failed early, retrying via sync mode (${attempt}/${STREAM_RETRY_MAX_ATTEMPTS})...`
                  : `串流初期失敗，改用同步模式重試（${attempt}/${STREAM_RETRY_MAX_ATTEMPTS}）...`
              );
              if (!delayMsApi) {
                throw new Error("ChatRetryUtils.delayMs unavailable");
              }
              await delayMsApi(retryDelay);
              try {
                await sendWithoutStream(promptForModel);
                recovered = true;
                break;
              } catch (retryError) {
                if (attempt >= STREAM_RETRY_MAX_ATTEMPTS) {
                  throw retryError;
                }
              }
            }
          }

          if (recovered) {
            setStatus(t("statusReady"));
            addActivity(
              currentLang === "en"
                ? "Stream interrupted; recovered via sync fallback."
                : "串流中斷，已透過同步備援恢復。"
            );
            hideActivityBubble(900);
          } else {
            setStatus(error instanceof Error ? error.message : "Unknown error");
            addActivity(
              currentLang === "en"
                ? `Error: ${error instanceof Error ? error.message : "Unknown error"}`
                : `錯誤：${error instanceof Error ? error.message : "未知錯誤"}`
            );
            hideActivityBubble(1200);
          }
        } finally {
          if (stallTimer) clearInterval(stallTimer);
          setSendingState(false);
          resetLiveStream();
          streamingAssistantBubble = null;
          uploadedImages = [];
          renderAttachments();
          imageInput.value = "";
          promptInput.focus();
          addActivity(currentLang === "en" ? "Ready for next input" : "已就緒，可輸入下一則");
        }
      }

      async function selectSession(sessionId) {
        selectedSessionId = sessionId;
        picker.value = sessionId;
        addActivity(
          currentLang === "en"
            ? `Switch session: ${sessionId.slice(0, 8)}...`
            : `正在載入 ${sessionId.slice(0, 8)} 的訊息...`
        );
        setStatus(t("statusLoadingSession"));
        await loadMessages(selectedSessionId);
        await refreshServerLock();
      }

      if (!bindBootstrapEventsApi) {
        throw new Error("ChatBootstrapEventsUtils.bindBootstrapEvents unavailable");
      }
      bindBootstrapEventsApi({
        elements: {
          picker,
          menuBtn,
          drawerCloseBtn,
          drawerBackdrop,
          sessionList,
          chat,
          scrollToBottomBtn,
          imageViewer,
          imageViewerClose,
          imageViewerPrev,
          imageViewerNext,
          newSessionBtn,
          form,
          attachBtn,
          imageInput,
          attachmentList,
          promptInput,
          langBtn,
          modelPicker,
          helpBtn,
          activityBtn,
        },
        handlers: {
          onPickerChange: async (value) => {
            await selectSession(value);
          },
          onMenuClick: () => {
            if (isSending || serverLocked) return;
            openDrawer();
          },
          onDrawerClose: closeDrawer,
          onDrawerBackdropClick: (e) => {
            if (e.target === drawerBackdrop) closeDrawer();
          },
          onSessionListClick: async (e) => {
            if (!(e.target instanceof Element)) return;
            const btn = e.target.closest("[data-session-id]");
            if (!btn) return;
            const sessionId = btn.getAttribute("data-session-id");
            if (!sessionId || sessionId === selectedSessionId) {
              closeDrawer();
              return;
            }
            closeDrawer();
            await selectSession(sessionId);
          },
          onChatClick: (e) => {
            if (!(e.target instanceof Element)) return;
            const processBtn = e.target.closest(".assistant-process-toggle");
            if (processBtn instanceof HTMLButtonElement) {
              const row = processBtn.closest(".row.assistant.assistant-process");
              if (!(row instanceof HTMLElement)) return;
              row.classList.toggle("open");
              const arrow = processBtn.querySelector(".assistant-process-arrow");
              if (arrow instanceof HTMLElement) {
                arrow.textContent = row.classList.contains("open") ? "v" : ">";
              }
              updateScrollToBottomButton();
              return;
            }
            const img = e.target.closest(".inline-image");
            if (!(img instanceof HTMLImageElement)) return;
            const wrap = img.closest(".message-image-attachments");
            const siblings = wrap ? Array.from(wrap.querySelectorAll(".inline-image")) : [img];
            const gallery = siblings
              .filter((item) => item instanceof HTMLImageElement)
              .map((item) => ({ src: item.src, alt: item.alt || "preview" }));
            const currentIndex = Math.max(0, siblings.indexOf(img));
            openImageViewer(img.src, img.alt || "preview", gallery, currentIndex);
          },
          onChatScroll: updateScrollToBottomButton,
          onScrollToBottomClick: () => {
            chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
            updateScrollToBottomButton();
          },
          onImageViewerClose: closeImageViewer,
          onImageViewerPrev: () => navigateImageViewer(-1),
          onImageViewerNext: () => navigateImageViewer(1),
          onImageViewerClick: (e) => {
            if (e.target === imageViewer) closeImageViewer();
          },
          onDocumentKeydown: (e) => {
            if (e.key === "Escape" && imageViewer.classList.contains("open")) {
              closeImageViewer();
              return;
            }
            if (!imageViewer.classList.contains("open")) return;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              navigateImageViewer(-1);
              return;
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              navigateImageViewer(1);
            }
          },
          onNewSessionClick: () => {
            closeDrawer();
            selectedSessionId = null;
            updateUrl(null);
            setEmpty(t("newSessionHint"));
            setStatus(t("statusNewSession"));
            addActivity(currentLang === "en" ? "Entered new session mode" : "已進入新對話模式");
            lastStats = null;
            renderUsage(null);
            refreshServerLock();
            promptInput.focus();
          },
          onSubmit: async () => {
            if (isSending || serverLocked) return;
            const prompt = promptInput.value.trim();
            if (!prompt && uploadedImages.length === 0) return;
            const imagesToSend = uploadedImages.slice();
            promptInput.value = "";
            uploadedImages = [];
            renderAttachments();
            imageInput.value = "";
            autoResizePrompt();
            await sendMessage(prompt, imagesToSend);
          },
          onAttachClick: () => {
            if (isSending || serverLocked) return;
            imageInput.click();
          },
          onImageInputChange: async (files) => {
            if (isSending || serverLocked) return;
            if (!files.length) return;
            try {
              addActivity(
                currentLang === "en"
                  ? `Uploading ${files.length} image${files.length > 1 ? "s" : ""}...`
                  : `正在上傳 ${files.length} 張圖片...`
              );
              await uploadSelectedImages(files);
              addActivity(
                currentLang === "en"
                  ? `Upload done (${files.length})`
                  : `圖片上傳完成（${files.length}）`
              );
            } catch (error) {
              addActivity(
                currentLang === "en"
                  ? `Upload error: ${error instanceof Error ? error.message : "Unknown error"}`
                  : `上傳錯誤：${error instanceof Error ? error.message : "未知錯誤"}`
              );
              setStatus(error instanceof Error ? error.message : "Upload failed");
            } finally {
              imageInput.value = "";
            }
          },
          onAttachmentListClick: (e) => {
            if (!(e.target instanceof Element)) return;
            const btn = e.target.closest("[data-remove-index]");
            if (!btn) return;
            const index = Number(btn.getAttribute("data-remove-index"));
            if (Number.isNaN(index) || index < 0 || index >= uploadedImages.length) return;
            uploadedImages.splice(index, 1);
            renderAttachments();
          },
          onPromptInput: autoResizePrompt,
          onPromptKeydown: (e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              form.requestSubmit();
            }
          },
          onLanguageToggle: () => {
            currentLang = currentLang === "en" ? "zh" : "en";
            localStorage.setItem("chat_lang", currentLang);
            applyLanguage();
            if (!isSending && !serverLocked) {
              setStatus(selectedSessionId ? t("statusReady") : t("statusNewSession"));
            }
            if (selectedSessionId) {
              void loadMessages(selectedSessionId, { showLoading: false }).catch(() => {});
            } else {
              setEmpty(t("newSessionHint"));
            }
          },
          onModelChange: (value) => {
            currentModel = normalizeModelValue(value);
            localStorage.setItem("chat_model", currentModel);
            renderModelPicker();
            addActivity(
              currentLang === "en"
                ? `Model switched: ${currentModel || "none"}`
                : `模型已切換：${currentModel || "未設定"}`
            );
          },
          onHelpClick: (e) => {
            e.stopPropagation();
            glossaryPanel.classList.toggle("open");
            activityPanel.classList.remove("open");
            placeGlossaryPanel();
          },
          onActivityClick: (e) => {
            e.stopPropagation();
            activityPanel.classList.toggle("open");
            glossaryPanel.classList.remove("open");
            placeActivityPanel();
          },
          onDocumentClick: (e) => {
            if (!helpWrap.contains(e.target)) {
              glossaryPanel.classList.remove("open");
            }
            if (!activityWrap.contains(e.target)) {
              activityPanel.classList.remove("open");
            }
          },
          onWindowResize: () => {
            placeGlossaryPanel();
            placeActivityPanel();
            updateScrollToBottomButton();
          },
        },
      });

      if (!runBootstrapApi) {
        throw new Error("ChatBootstrapInitUtils.runBootstrap unavailable");
      }
      void runBootstrapApi({
        addActivity,
        appStartedText: currentLang === "en" ? "App started" : "應用已啟動",
        setModelLoadingMask,
        setLoading,
        loadI18nMap,
        loadModelOptions,
        loadSessions,
        loadMessages,
        getSelectedSessionId: () => selectedSessionId,
        refreshServerLock,
        applyLanguage,
        autoResizePrompt,
        updateScrollToBottomButton,
        focusPromptInput: () => {
          promptInput.focus();
        },
        startServerLockPolling: () => {
          setInterval(refreshServerLock, SERVER_LOCK_INTERVAL_MS);
        },
        setEmpty,
        setStatus,
        buildInitErrorText: (message) =>
          currentLang === "en" ? `Init error: ${message}` : `初始化錯誤：${message}`,
      });
    


