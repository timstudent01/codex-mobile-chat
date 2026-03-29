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

      const params = new URLSearchParams(window.location.search);
      let selectedSessionId = params.get("sessionId");
      let isSending = false;
      let serverLocked = false;
      let streamingAssistantBubble = null;
      let currentLang = localStorage.getItem("chat_lang") || "zh";
      const MODEL_PATTERN = /^[a-zA-Z0-9._:-]{1,80}$/;
      let currentModel = normalizeModelValue(localStorage.getItem("chat_model"));
      let availableModels = [];
      let lastStats = null;
      let cachedSessions = [];
      const activityEvents = [];
      let uploadedImages = [];
      let activityBubbleTimer = null;

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
          const res = await fetch("/api/models");
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
        },
      };
      const t = (key) => I18N[currentLang][key];

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

      function renderMessageHtml(text) {
        const raw = String(text || "");
        const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
        let output = "";
        let lastIndex = 0;
        let matched = false;

        for (const match of raw.matchAll(imagePattern)) {
          const index = match.index ?? 0;
          const alt = match[1] || "image";
          const url = match[2] || "";
          output += escapeHtml(raw.slice(lastIndex, index));
          if (isRenderableImageUrl(url)) {
            output += `<div class="inline-image-wrap"><img class="inline-image" src="${escapeHtml(
              url
            )}" alt="${escapeHtml(alt)}" loading="lazy" /></div>`;
            matched = true;
          } else {
            output += escapeHtml(match[0]);
          }
          lastIndex = index + match[0].length;
        }

        output += escapeHtml(raw.slice(lastIndex));
        if (!matched) return escapeHtml(raw);
        return output;
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
                <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.fileName)}" />
                <button type="button" class="attachment-remove" data-remove-index="${i}" aria-label="Remove image">
                  &times;
                </button>
              </div>
            `
          )
          .join("");
      }

      function buildPromptWithImages(prompt, images) {
        if (!images.length) return prompt;
        const lines = images
          .map((img, i) => `![uploaded-image-${i + 1}](${img.url})`)
          .join("\n");
        return `${prompt}\n${lines}`;
      }

      async function uploadSelectedImages(files) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");

          uploadedImages.push({
            fileName: data.fileName || file.name,
            url: data.url,
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

      function openImageViewer(src, alt = "preview") {
        imageViewerImg.src = src;
        imageViewerImg.alt = alt;
        imageViewer.classList.add("open");
        imageViewer.setAttribute("aria-hidden", "false");
      }

      function closeImageViewer() {
        imageViewer.classList.remove("open");
        imageViewer.setAttribute("aria-hidden", "true");
        imageViewerImg.removeAttribute("src");
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

      function appendMessage(role, text, metaText = "") {
        if (chat.querySelector(".empty")) chat.innerHTML = "";
        const row = document.createElement("div");
        row.className = `row ${role}`;
        row.innerHTML = `
          <div class="bubble">
            ${renderMessageHtml(text)}
            <div class="meta">${escapeHtml(metaText)}</div>
          </div>
        `;
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
        updateScrollToBottomButton();
        return row.querySelector(".bubble");
      }

      function renderMessages(messages) {
        streamingAssistantBubble = null;
        if (!messages.length) {
          setEmpty(t("emptyNoMessages"));
          return;
        }
        chat.innerHTML = messages
          .map((m) => {
            const roleClass = m.role === "user" ? "user" : "assistant";
            const roleLabel = m.role === "user" ? t("roleUser") : t("roleAssistant");
            const localizedPhase = localizePhase(m.phase);
            const phase = localizedPhase ? ` · ${localizedPhase}` : "";
            return `
              <div class="row ${roleClass}">
                <div class="bubble">
                  ${renderMessageHtml(m.text)}
                  <div class="meta">${roleLabel}${phase}${m.timestamp ? ` · ${formatTs(m.timestamp)}` : ""}</div>
                </div>
              </div>
            `;
          })
          .join("");
        chat.scrollTop = chat.scrollHeight;
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
          final_answer: "最終回覆",
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
          const res = await fetch(`/api/sessions/${sessionId}/stats`);
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
        const res = await fetch("/api/sessions");
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
        const res = await fetch(`/api/sessions/${sessionId}/messages`);
        const data = await res.json();
        if (!res.ok) {
          setEmpty(data.error || "Failed to load messages");
          addActivity(currentLang === "en" ? "Load messages failed" : "載入訊息失敗");
          return;
        }
        renderMessages(data.messages || []);
        await loadStats(sessionId);
        addActivity(
          currentLang === "en"
            ? `Messages synced (${(data.messages || []).length})`
            : `訊息同步完成（${(data.messages || []).length} 則）`
        );
      }

      async function syncMessagesNoFlicker(sessionId) {
        if (!sessionId) return;
        const res = await fetch(`/api/sessions/${sessionId}/messages`);
        const data = await res.json();
        if (!res.ok) return;
        renderMessages(data.messages || []);
      }

      async function refreshServerLock() {
        try {
          const res = await fetch("/api/chat/status");
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
          ? `/api/sessions/${selectedSessionId}/chat`
          : "/api/sessions/new/chat";
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

      async function sendMessage(prompt, imagesToSend = []) {
        setSendingState(true);
        setStatus(t("statusSending"));
        addActivity(currentLang === "en" ? "Sending prompt to Codex..." : "正在送出訊息到 Codex...");
        let syncTimer = null;
        let gotStreamEvent = false;
        const promptWithImages = buildPromptWithImages(prompt, imagesToSend);
        const imagePreviewMarkdown = imagesToSend.length
          ? `\n\n${imagesToSend
              .map((img, i) => `![${img.fileName || `image-${i + 1}`}](${img.url})`)
              .join("\n")}`
          : "";

        appendMessage("user", `${prompt}${imagePreviewMarkdown}`, t("userNow"));
        streamingAssistantBubble = appendMessage(
          "assistant",
          t("thinkingWord"),
          t("assistantStreaming")
        );

        try {
          const res = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: selectedSessionId,
              prompt: promptWithImages,
              model: currentModel || null,
            }),
          });
          if (!res.ok) throw new Error("Stream failed");

          if (!res.body || typeof res.body.getReader !== "function") {
            addActivity(
              currentLang === "en"
                ? "Stream unsupported on this browser. Falling back..."
                : "此瀏覽器不支援串流，改用一般傳送..."
            );
            await sendWithoutStream(promptWithImages);
            setStatus(t("statusDone"));
            return;
          }
          addActivity(currentLang === "en" ? "Stream connected" : "串流已連線");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          syncTimer = setInterval(async () => {
            if (!gotStreamEvent && selectedSessionId) {
              await syncMessagesNoFlicker(selectedSessionId);
            }
          }, 1200);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
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

              if (event.type === "status") {
                gotStreamEvent = true;
                const text = String(event.text || "thinking");
                const statusText = localizeStatusWord(text);
                setStatus(
                  text === "thinking"
                    ? t("statusThinking")
                    : `${t("statusSending")} (${statusText || text})`
                );
                addActivity(
                  currentLang === "en"
                    ? `Status: ${statusText || text}`
                    : `狀態：${statusText || text}`
                );
                showActivityBubble(
                  currentLang === "en"
                    ? `Status: ${statusText || text}`
                    : `狀態：${statusText || text}`,
                  true
                );
                continue;
              }
              if (event.type === "activity") {
                gotStreamEvent = true;
                const text = formatActivityEvent(event);
                if (text) addActivity(text);
                continue;
              }
              if (event.type === "session" && event.sessionId) {
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
              if (event.type === "assistant") {
                gotStreamEvent = true;
                if (streamingAssistantBubble) {
                  const textNode = streamingAssistantBubble.childNodes[0];
                  const current = textNode?.textContent || "";
                  textNode.textContent = `${current}${current ? "\n" : ""}${event.text || ""}`;
                }
                chat.scrollTop = chat.scrollHeight;
                updateScrollToBottomButton();
                continue;
              }
              if (event.type === "error") throw new Error(String(event.message || "Unknown stream error"));
              if (event.type === "done") {
                setStatus(t("statusDone"));
                addActivity(currentLang === "en" ? "Stream done" : "串流完成");
                hideActivityBubble(700);
              }
            }
          }

          if (selectedSessionId) {
            await loadSessions();
            picker.value = selectedSessionId;
            await loadMessages(selectedSessionId, { showLoading: false });
            setTimeout(() => {
              loadSessions().catch(() => {});
            }, 1500);
          }
          setStatus(t("statusReady"));
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Unknown error");
          addActivity(
            currentLang === "en"
              ? `Error: ${error instanceof Error ? error.message : "Unknown error"}`
              : `錯誤：${error instanceof Error ? error.message : "未知錯誤"}`
          );
          hideActivityBubble(1200);
        } finally {
          if (syncTimer) clearInterval(syncTimer);
          if (selectedSessionId) await loadMessages(selectedSessionId, { showLoading: false });
          setSendingState(false);
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
        const img = e.target.closest(".inline-image");
        if (!(img instanceof HTMLImageElement)) return;
        openImageViewer(img.src, img.alt || "preview");
      });
      chat.addEventListener("scroll", updateScrollToBottomButton);
      scrollToBottomBtn?.addEventListener("click", () => {
        chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
        updateScrollToBottomButton();
      });

      imageViewerClose.addEventListener("click", closeImageViewer);
      imageViewer.addEventListener("click", (e) => {
        if (e.target === imageViewer) closeImageViewer();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && imageViewer.classList.contains("open")) {
          closeImageViewer();
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
          setLoading();
          await loadModelOptions();
          await loadSessions();
          await loadMessages(selectedSessionId);
          await refreshServerLock();
          applyLanguage();
          autoResizePrompt();
          updateScrollToBottomButton();
          promptInput.focus();
          setInterval(refreshServerLock, 2000);
        } catch (error) {
          setEmpty(error instanceof Error ? error.message : "Unknown error");
          setStatus("Error");
        }
      })();
    
