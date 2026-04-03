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
      let imageViewerGallery = [];
      let imageViewerIndex = 0;

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

      async function loadModelOptions() {
        try {
          const res = await fetch(CHAT_API.MODELS || "/api/models");
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to load model list");
          const rawModels = Array.isArray(data.models) ? data.models : [];
          const parsed = rawModels
            .map((item) => {
              const value = normalizeModelValue(item?.value);
              if (!value) return null;
              return { value, label: String(item?.label || value) };
            })
            .filter(Boolean);
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
          availableModels = currentModel
            ? [{ value: currentModel, label: `${currentModel} (custom)` }]
            : [];
        } finally {
          renderModelPicker();
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
      function formatClock(d = new Date()) {
        return d.toLocaleTimeString("zh-TW", { hour12: false });
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
        activityEvents.unshift({ time: formatClock(), text: normalized });
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
        if (commandCollapseTimer) {
          clearTimeout(commandCollapseTimer);
          commandCollapseTimer = null;
        }
        liveStreamState = null;
      }

      function initLiveStream() {
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

      function formatRunLine(raw) {
        const text = String(raw || "").trim();
        if (!text) return "";

        if (/^Run:/i.test(text)) {
          const command = text.replace(/^Run:\s*/i, "").trim();
          if (!command) return "";
          liveStreamState?.commandStarts.set(command, Date.now());
          return currentLang === "en" ? `Executed ${command}` : `已執行 ${command}`;
        }

        if (/^Done:/i.test(text)) {
          const command = text.replace(/^Done:\s*/i, "").trim();
          const startedAt = liveStreamState?.commandStarts.get(command);
          if (startedAt) liveStreamState?.commandStarts.delete(command);
          const seconds = startedAt
            ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
            : null;
          if (currentLang === "en") {
            return seconds ? `Executed ${command} in ${seconds}s` : `Executed ${command}`;
          }
          return seconds ? `已執行 ${command}，適用於 ${seconds}s` : `已執行 ${command}`;
        }

        return text;
      }

      function setSummaryButtonText(summaryBtn, text) {
        if (!(summaryBtn instanceof HTMLElement)) return;
        summaryBtn.textContent = "";
        const label = document.createElement("span");
        label.className = "stream-bubble-summary-label";
        label.textContent = String(text || "");
        summaryBtn.appendChild(label);
      }

      function appendStreamActivity(text) {
        const normalized = String(text || "").trim();
        if (!normalized || !liveStreamState) return;

        const isRun = /^Run:/i.test(normalized);
        const isDone = /^Done:/i.test(normalized);
        const isShellTool = /^Tool call:\s*shell_command/i.test(normalized);
        if (!isRun && !isDone && !isShellTool) return;

        const rendered = formatRunLine(normalized);
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
        return String(input)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }

      function isRenderableImageUrl(url) {
        return /^https?:\/\//i.test(url) || /^\/public\//i.test(url);
      }

      function renderMarkdownToHtml(raw) {
        const source = String(raw || "");
        const markedApi = window.marked;
        if (!markedApi || typeof markedApi.parse !== "function") {
          return escapeHtml(source);
        }
        const parsed = markedApi.parse(source, {
          gfm: true,
          breaks: true,
          mangle: false,
          headerIds: false,
        });
        const purifier = window.DOMPurify;
        if (purifier && typeof purifier.sanitize === "function") {
          return purifier.sanitize(parsed);
        }
        return parsed;
      }

      function renderMessageHtml(text) {
        const html = renderMarkdownToHtml(text);
        const tpl = document.createElement("template");
        tpl.innerHTML = html;

        const images = tpl.content.querySelectorAll("img");
        for (const img of images) {
          const src = String(img.getAttribute("src") || "");
          if (!isRenderableImageUrl(src)) {
            const fallback = document.createTextNode(img.getAttribute("alt") || src);
            img.replaceWith(fallback);
            continue;
          }
          img.classList.add("inline-image");
          img.setAttribute("loading", "lazy");
          const wrap = document.createElement("div");
          wrap.className = "inline-image-wrap";
          img.replaceWith(wrap);
          wrap.appendChild(img);
        }

        const links = tpl.content.querySelectorAll("a[href]");
        for (const link of links) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }

        const hljsApi = window.hljs;
        if (hljsApi && typeof hljsApi.highlightElement === "function") {
          const codeBlocks = tpl.content.querySelectorAll("pre code");
          for (const block of codeBlocks) {
            try {
              hljsApi.highlightElement(block);
            } catch {
              // ignore highlight failures for unknown languages
            }
          }
        }

        return tpl.innerHTML;
      }

      function extractMarkdownImages(text) {
        const source = String(text || "");
        const images = [];
        const cleaned = source.replace(
          /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
          (_, altRaw, urlRaw) => {
            const src = String(urlRaw || "").trim().replace(/^<|>$/g, "");
            if (!src) return "";
            if (!/^(https?:\/\/|data:image\/|\/public\/uploads\/)/i.test(src)) {
              return "";
            }
            const fileName = String(altRaw || "").trim() || "assistant-image";
            images.push({ url: src, fileName });
            return "";
          }
        );
        return {
          text: cleaned.replace(/\n{3,}/g, "\n\n").trim(),
          images,
        };
      }

      function renderAttachments() {
        if (!uploadedImages.length) {
          attachmentList.innerHTML = "";
          return;
        }

        attachmentList.innerHTML = uploadedImages
          .map(
            (img, i) => `
              <div class="attachment-item">
                <img src="${escapeHtml(img.previewUrl || img.url)}" alt="${escapeHtml(img.fileName)}" />
                <button type="button" class="attachment-remove" data-remove-index="${i}" aria-label="Remove image">
                  &times;
                </button>
              </div>
            `
          )
          .join("");
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

          const res = await fetch(CHAT_API.UPLOADS || "/api/uploads", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
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

      function formatTs(ts) {
        if (!ts) return "";
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("zh-TW", { hour12: false });
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

      function renderImageViewerState() {
        if (!(imageViewerImg instanceof HTMLImageElement)) return;
        const item = imageViewerGallery[imageViewerIndex];
        if (!item) return;
        imageViewerImg.src = String(item.src || "");
        imageViewerImg.alt = String(item.alt || "preview");
        const hasMultiple = imageViewerGallery.length > 1;
        if (imageViewerPrev instanceof HTMLElement) {
          imageViewerPrev.classList.toggle("show", hasMultiple);
        }
        if (imageViewerNext instanceof HTMLElement) {
          imageViewerNext.classList.toggle("show", hasMultiple);
        }
        if (imageViewerCounter instanceof HTMLElement) {
          if (hasMultiple) {
            imageViewerCounter.textContent = `${imageViewerIndex + 1} / ${imageViewerGallery.length}`;
            imageViewerCounter.classList.add("show");
          } else {
            imageViewerCounter.textContent = "";
            imageViewerCounter.classList.remove("show");
          }
        }
      }

      function openImageViewer(src, alt = "preview", gallery = null, index = 0) {
        const fallback = [{ src, alt }];
        imageViewerGallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : fallback;
        imageViewerIndex = Math.max(0, Math.min(Number(index) || 0, imageViewerGallery.length - 1));
        renderImageViewerState();
        imageViewer.classList.add("open");
        imageViewer.setAttribute("aria-hidden", "false");
      }

      function closeImageViewer() {
        imageViewer.classList.remove("open");
        imageViewer.setAttribute("aria-hidden", "true");
        imageViewerImg.removeAttribute("src");
        imageViewerGallery = [];
        imageViewerIndex = 0;
        if (imageViewerCounter instanceof HTMLElement) {
          imageViewerCounter.textContent = "";
          imageViewerCounter.classList.remove("show");
        }
      }

      function navigateImageViewer(step) {
        if (!imageViewer.classList.contains("open")) return;
        if (!Array.isArray(imageViewerGallery) || imageViewerGallery.length <= 1) return;
        const total = imageViewerGallery.length;
        imageViewerIndex = (imageViewerIndex + step + total) % total;
        renderImageViewerState();
      }

      function renderSessionList(sessions) {
        cachedSessions = sessions;
        if (!sessions.length) {
          sessionList.innerHTML = `<div class="empty">${escapeHtml(t("emptyNoSessions"))}</div>`;
          return;
        }

        sessionList.innerHTML = sessions
          .map((s) => {
            const when = formatTs(s.updatedAt);
            const isActive = s.id === selectedSessionId;
            const title = s.title || s.id;
            return `
              <button type="button" class="session-item ${isActive ? "active" : ""}" data-session-id="${s.id}">
                <div class="session-item-title">${escapeHtml(title)}</div>
                <div class="session-item-time">${escapeHtml(when || s.id)}</div>
              </button>
            `;
          })
          .join("");
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
          timestamp ? ` · ${formatTs(timestamp)}` : ""
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
              ? `${t("roleAssistant")}${phaseLabel ? ` · ${phaseLabel}` : ""}${m.timestamp ? ` · ${formatTs(m.timestamp)}` : ""}`
              : `${t("roleUser")}${m.timestamp ? ` · ${formatTs(m.timestamp)}` : ""}`;
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
              `${t("roleUser")}${m.timestamp ? ` · ${formatTs(m.timestamp)}` : ""}`
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

      function formatNumber(num) {
        if (num === null || num === undefined || Number.isNaN(num)) return "-";
        return Number(num).toLocaleString("en-US");
      }

      function localizePhase(phase) {
        const raw = String(phase || "").trim();
        if (!raw || currentLang === "en") return raw;
        const PHASE_ZH = {
          [PHASE_FINAL_ANSWER]: "最終回覆",
          reasoning: "推理",
          analysis: "分析",
          commentary: "說明",
        };
        return PHASE_ZH[raw] || raw;
      }

      function localizeStatusWord(statusWord) {
        const raw = String(statusWord || "").trim();
        if (!raw || currentLang === "en") return raw;
        const STATUS_ZH = {
          started: "已開始",
          thinking: "思考中",
          done: "完成",
        };
        return STATUS_ZH[raw] || raw;
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
        const rawText = String(event?.text || "").trim();
        const code = String(event?.code || "").trim();
        if (!rawText) return "";
        if (currentLang === "en" || !code) return rawText;

        const CODE_ZH = {
          thread_started: "對話已建立",
          turn_started: "回合開始",
          turn_completed: "回合完成",
          item_started: "步驟開始",
          item_completed: "步驟完成",
          tool_call: "工具呼叫",
          tool_output: "工具回傳",
          reasoning_update: "推理更新",
          error_event: "錯誤事件",
        };
        const label = CODE_ZH[code] || rawText;
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
        const contextRemain = formatNumber(stats.contextRemaining);
        const contextWindow = formatNumber(stats.contextWindow);
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
          const statsEndpoint = CHAT_API.SESSION_STATS
            ? CHAT_API.SESSION_STATS(sessionId)
            : `/api/sessions/${sessionId}/stats`;
          const res = await fetch(statsEndpoint);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "stats error");
          lastStats = data.stats || null;
          renderUsage(lastStats);
        } catch {
          lastStats = null;
          renderUsage(null);
        }
      }

      async function loadSessions() {
        addActivity(currentLang === "en" ? "Loading sessions list..." : "正在載入 session 清單...");
        const res = await fetch(CHAT_API.SESSIONS || "/api/sessions");
        const data = await res.json();
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
            const when = formatTs(s.updatedAt);
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
        const messagesEndpoint = CHAT_API.SESSION_MESSAGES
          ? CHAT_API.SESSION_MESSAGES(sessionId)
          : `/api/sessions/${sessionId}/messages`;
        const res = await fetch(messagesEndpoint);
        const data = await res.json();
        if (!res.ok) {
          setEmpty(data.error || "Failed to load messages");
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
        const messagesEndpoint = CHAT_API.SESSION_MESSAGES
          ? CHAT_API.SESSION_MESSAGES(sessionId)
          : `/api/sessions/${sessionId}/messages`;
        const res = await fetch(messagesEndpoint);
        const data = await res.json();
        if (!res.ok) return;
        renderMessages(data.messages || [], { preserveScroll: true });
      }

      async function syncMessagesForce(sessionId) {
        if (!sessionId) return;
        const messagesEndpoint = CHAT_API.SESSION_MESSAGES
          ? CHAT_API.SESSION_MESSAGES(sessionId)
          : `/api/sessions/${sessionId}/messages`;
        const res = await fetch(messagesEndpoint);
        const data = await res.json();
        if (!res.ok) return;
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
        if (!sessionId || !liveStreamState) return;
        if (liveStreamState.splitReconciled) return;
        const firstBubble = liveStreamState.currentAssistantBubble;
        if (!(firstBubble instanceof HTMLElement)) return;

        let data;
        try {
          const messagesEndpoint = CHAT_API.SESSION_MESSAGES
            ? CHAT_API.SESSION_MESSAGES(sessionId)
            : `/api/sessions/${sessionId}/messages`;
          const res = await fetch(messagesEndpoint);
          data = await res.json();
          if (!res.ok) return;
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
          firstProcess?.timestamp ? ` · ${formatTs(firstProcess.timestamp)}` : ""
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
          const res = await fetch(CHAT_API.CHAT_STATUS || "/api/chat/status");
          const data = await res.json();
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
        const endpoint = selectedSessionId
          ? CHAT_API.SESSION_CHAT
            ? CHAT_API.SESSION_CHAT(selectedSessionId)
            : `/api/sessions/${selectedSessionId}/chat`
          : CHAT_API.NEW_SESSION_CHAT || "/api/sessions/new/chat";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptWithImages, model: currentModel || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Send failed");

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

      function delayMs(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      function getRetryBackoffMs(attemptIndex) {
        const exp = STREAM_RETRY_BASE_DELAY_MS * Math.pow(2, Math.max(0, attemptIndex - 1));
        const jitter = Math.floor(Math.random() * STREAM_RETRY_JITTER_MS);
        return Math.min(STREAM_RETRY_MAX_DELAY_MS, exp + jitter);
      }

      function normalizeErrorText(error) {
        if (typeof error === "string") return error.toLowerCase();
        if (error instanceof Error) return String(error.message || "").toLowerCase();
        return String(error || "").toLowerCase();
      }

      function isRetryableStreamError(error) {
        const isAbortError =
          (error instanceof DOMException && error.name === ERROR_NAME_ABORT) ||
          (error instanceof Error && error.name === ERROR_NAME_ABORT);
        if (isAbortError) return true;

        const text = normalizeErrorText(error);
        if (!text) return false;
        return (
          text.includes(ERROR_TOKEN_STREAM_STALLED) ||
          text.includes(ERROR_TOKEN_STREAM_INCOMPLETE) ||
          text.includes(ERROR_TOKEN_STREAM_FAILED) ||
          text.includes(ERROR_TOKEN_NETWORK_ERROR) ||
          text.includes(ERROR_TOKEN_FAILED_TO_FETCH) ||
          text.includes(ERROR_TOKEN_TIMEOUT) ||
          text.includes(ERROR_TOKEN_ABORTED)
        );
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

          const res = await fetch(CHAT_API.CHAT_STREAM || "/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: selectedSessionId,
              prompt: promptForModel,
              model: currentModel || null,
              images: imageAbsolutePaths,
            }),
            signal: abortController.signal,
          });
          if (!res.ok) throw new Error("Stream failed");

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

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            touchStream();
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              let event;
              try {
                event = JSON.parse(line);
              } catch {
                continue;
              }

              if (event.type === STREAM_EVENT_STATUS) {
                gotStreamEvent = true;
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
                continue;
              }
              if (event.type === STREAM_EVENT_HEARTBEAT) {
                gotStreamEvent = true;
                continue;
              }
              if (event.type === STREAM_EVENT_ACTIVITY) {
                gotStreamEvent = true;
                const rawText = String(event.text || "").trim();
                const text = formatActivityEvent(event);
                if (text) addActivity(text);
                if (rawText) appendStreamActivity(rawText);
                continue;
              }
              if (event.type === STREAM_EVENT_SESSION && event.sessionId) {
                gotStreamEvent = true;
                selectedSessionId = event.sessionId;
                updateUrl(selectedSessionId);
                addActivity(
                  currentLang === "en"
                    ? `Session assigned: ${event.sessionId.slice(0, 8)}...`
                    : `已分配 Session：${event.sessionId.slice(0, 8)}...`
                );
                continue;
              }
              if (event.type === STREAM_EVENT_ASSISTANT) {
                gotStreamEvent = true;
                if (streamingAssistantBubble) {
                  appendStreamNote(event.text || "");
                }
                chat.scrollTop = chat.scrollHeight;
                updateScrollToBottomButton();
                continue;
              }
              if (event.type === STREAM_EVENT_ASSISTANT_BOUNDARY) {
                gotStreamEvent = true;
                splitLiveAssistantBubble();
                continue;
              }
              if (event.type === STREAM_EVENT_ASSISTANT_PHASE) {
                gotStreamEvent = true;
                updateLiveAssistantPhase(event.phase || "");
                continue;
              }
              if (event.type === STREAM_EVENT_ERROR) {
                const errMsg = String(event.message || "Unknown stream error");
                autoSwitchModelOnAccessError(errMsg);
                throw new Error(errMsg);
              }
              if (event.type === STREAM_EVENT_DONE) {
                streamDone = true;
                setStatus(t("statusDone"));
                scheduleCollapseCommandLogs(3500);
                if (selectedSessionId) {
                  await reconcileAssistantSplitFromSession(selectedSessionId);
                }
                addActivity(currentLang === "en" ? "Stream done" : "串流完成");
                hideActivityBubble(700);
              }
            }
          }

          if (buffer.trim()) {
            try {
              const event = JSON.parse(buffer);
              if (event.type === STREAM_EVENT_ASSISTANT && streamingAssistantBubble) {
                appendStreamNote(event.text || "");
              } else if (event.type === STREAM_EVENT_ASSISTANT_BOUNDARY) {
                splitLiveAssistantBubble();
              } else if (event.type === STREAM_EVENT_ASSISTANT_PHASE) {
                updateLiveAssistantPhase(event.phase || "");
              } else if (event.type === STREAM_EVENT_ACTIVITY) {
                const rawText = String(event.text || "").trim();
                const text = formatActivityEvent(event);
                if (text) addActivity(text);
                if (rawText) appendStreamActivity(rawText);
              } else if (event.type === STREAM_EVENT_DONE) {
                streamDone = true;
                setStatus(t("statusDone"));
                scheduleCollapseCommandLogs(3500);
                if (selectedSessionId) {
                  await reconcileAssistantSplitFromSession(selectedSessionId);
                }
                addActivity(currentLang === "en" ? "Stream done" : "串流完成");
                hideActivityBubble(700);
              }
            } catch {
              // ignore trailing partial json line
            }
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

          const retryableError = isRetryableStreamError(error);

          let recovered = false;
          if (selectedSessionId && (retryableError || gotStreamEvent || !streamDone)) {
            recovered = await recoverAfterStreamInterruption(selectedSessionId);
          }

          if (!recovered && retryableError && !gotStreamEvent) {
            for (let attempt = 1; attempt <= STREAM_RETRY_MAX_ATTEMPTS; attempt += 1) {
              const retryDelay = getRetryBackoffMs(attempt);
              addActivity(
                currentLang === "en"
                  ? `Stream failed early, retrying via sync mode (${attempt}/${STREAM_RETRY_MAX_ATTEMPTS})...`
                  : `串流初期失敗，改用同步模式重試（${attempt}/${STREAM_RETRY_MAX_ATTEMPTS}）...`
              );
              await delayMs(retryDelay);
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

      picker.addEventListener("change", async (e) => {
        await selectSession(e.target.value);
      });

      menuBtn.addEventListener("click", () => {
        if (isSending || serverLocked) return;
        openDrawer();
      });

      drawerCloseBtn.addEventListener("click", closeDrawer);

      drawerBackdrop.addEventListener("click", (e) => {
        if (e.target === drawerBackdrop) closeDrawer();
      });

      sessionList.addEventListener("click", async (e) => {
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
      });

      chat.addEventListener("click", (e) => {
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
      });
      chat.addEventListener("scroll", updateScrollToBottomButton);
      scrollToBottomBtn?.addEventListener("click", () => {
        chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
        updateScrollToBottomButton();
      });

      imageViewerClose.addEventListener("click", closeImageViewer);
      imageViewerPrev?.addEventListener("click", () => navigateImageViewer(-1));
      imageViewerNext?.addEventListener("click", () => navigateImageViewer(1));
      imageViewer.addEventListener("click", (e) => {
        if (e.target === imageViewer) closeImageViewer();
      });
      document.addEventListener("keydown", (e) => {
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
      });

      newSessionBtn.addEventListener("click", () => {
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
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
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
      });

      attachBtn.addEventListener("click", () => {
        if (isSending || serverLocked) return;
        imageInput.click();
      });

      imageInput.addEventListener("change", async (e) => {
        if (isSending || serverLocked) return;
        const files = Array.from(e.target.files || []);
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
      });

      attachmentList.addEventListener("click", (e) => {
        if (!(e.target instanceof Element)) return;
        const btn = e.target.closest("[data-remove-index]");
        if (!btn) return;
        const index = Number(btn.getAttribute("data-remove-index"));
        if (Number.isNaN(index) || index < 0 || index >= uploadedImages.length) return;
        uploadedImages.splice(index, 1);
        renderAttachments();
      });

      promptInput.addEventListener("input", autoResizePrompt);
      promptInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          form.requestSubmit();
        }
      });

      langBtn.addEventListener("click", () => {
        currentLang = currentLang === "en" ? "zh" : "en";
        localStorage.setItem("chat_lang", currentLang);
        applyLanguage();
      });

      modelPicker.addEventListener("change", () => {
        currentModel = normalizeModelValue(modelPicker.value);
        localStorage.setItem("chat_model", currentModel);
        renderModelPicker();
        addActivity(
          currentLang === "en"
            ? `Model switched: ${currentModel || "none"}`
            : `模型已切換：${currentModel || "未設定"}`
        );
      });

      helpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        glossaryPanel.classList.toggle("open");
        activityPanel.classList.remove("open");
        placeGlossaryPanel();
      });

      activityBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        activityPanel.classList.toggle("open");
        glossaryPanel.classList.remove("open");
        placeActivityPanel();
      });

      document.addEventListener("click", (e) => {
        if (!helpWrap.contains(e.target)) {
          glossaryPanel.classList.remove("open");
        }
        if (!activityWrap.contains(e.target)) {
          activityPanel.classList.remove("open");
        }
      });

      window.addEventListener("resize", () => {
        placeGlossaryPanel();
        placeActivityPanel();
        updateScrollToBottomButton();
      });

      (async () => {
        try {
          addActivity(currentLang === "en" ? "App started" : "應用已啟動");
          setModelLoadingMask(true, false);
          setLoading();
          await loadModelOptions();
          setModelLoadingMask(false, false);
          await loadSessions();
          await loadMessages(selectedSessionId);
          await refreshServerLock();
          applyLanguage();
          autoResizePrompt();
          updateScrollToBottomButton();
          promptInput.focus();
          setInterval(refreshServerLock, SERVER_LOCK_INTERVAL_MS);
        } catch (error) {
          setEmpty(error instanceof Error ? error.message : "Unknown error");
          setStatus("Error");
          setModelLoadingMask(true, true);
        }
      })();
    


