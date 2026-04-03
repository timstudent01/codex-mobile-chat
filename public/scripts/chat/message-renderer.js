(function initChatMessageRendererUtils(global) {
  function createProcessBlock(options) {
    const text = String(options?.text || "");
    const metaText = String(options?.metaText || "");
    const open = Boolean(options?.open);
    const phase = String(options?.phase || "");
    const renderMessageHtml =
      typeof options?.renderMessageHtml === "function" ? options.renderMessageHtml : null;
    const escapeHtml = typeof options?.escapeHtml === "function" ? options.escapeHtml : null;

    const row = document.createElement("div");
    row.className = "row assistant assistant-process";
    if (phase) row.dataset.phase = phase;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "assistant-process-toggle";
    toggle.innerHTML = `
      <span class="assistant-process-meta">${escapeHtml ? escapeHtml(metaText) : metaText}</span>
      <span class="assistant-process-arrow">${open ? "v" : ">"}</span>
    `;

    const body = document.createElement("div");
    body.className = "assistant-process-body";
    body.innerHTML = renderMessageHtml ? renderMessageHtml(text) : text;

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
      if (summaryBtn instanceof HTMLElement) summaryBtn.remove();
      if (commandList instanceof HTMLElement) commandList.remove();
      row.classList.remove("has-stream-summary");
      row.appendChild(toggle);
      row.appendChild(body);
    }
    return row;
  }

  function createAssistantPlainBlock(options) {
    const text = String(options?.text || "");
    const metaText = String(options?.metaText || "");
    const phase = String(options?.phase || "");
    const renderMessageHtml =
      typeof options?.renderMessageHtml === "function" ? options.renderMessageHtml : null;
    const escapeHtml = typeof options?.escapeHtml === "function" ? options.escapeHtml : null;

    const row = document.createElement("div");
    row.className = "row assistant assistant-plain";
    if (phase) row.dataset.phase = phase;
    row.innerHTML = `
      <div class="meta">${escapeHtml ? escapeHtml(metaText) : metaText}</div>
      <div class="bubble">
        <div class="message-content">${renderMessageHtml ? renderMessageHtml(text) : text}</div>
      </div>
    `;
    return row;
  }

  function groupMessagesForRender(messages, options) {
    const phaseFinalAnswer = String(options?.phaseFinalAnswer || "final_answer");
    const phaseCommentary = String(options?.phaseCommentary || "commentary");
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
      const isProcess = phase !== phaseFinalAnswer;
      if (!isProcess) {
        flushPending();
        grouped.push(m);
        continue;
      }

      if (!pendingAssistantGroup) {
        pendingAssistantGroup = {
          phase: phase || phaseCommentary,
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

  function ensureProcessFinalDivider(processRow, show, options) {
    if (!(processRow instanceof HTMLElement)) return;
    const label = String(options?.label || "Final message");
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
    divider.innerHTML = `<span class="assistant-final-divider-label">${label}</span>`;
    row.appendChild(divider);
    processRow.insertAdjacentElement("afterend", row);
  }

  function refreshFinalDividers(options) {
    const chatEl = options?.chatEl;
    if (!(chatEl instanceof HTMLElement)) return;
    const phaseFinalAnswer = String(options?.phaseFinalAnswer || "final_answer");
    const label = String(options?.label || "Final message");
    const ensureDividerFn =
      typeof options?.ensureProcessFinalDivider === "function"
        ? options.ensureProcessFinalDivider
        : null;
    if (!ensureDividerFn) return;

    const rows = Array.from(chatEl.querySelectorAll(".row.assistant"));
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!(row instanceof HTMLElement)) continue;
      if (!row.classList.contains("assistant-process")) continue;

      const phase = String(row.dataset.phase || "").trim();
      const next = rows[i + 1];
      const nextPhase = next instanceof HTMLElement ? String(next.dataset.phase || "").trim() : "";
      const shouldShow = phase !== phaseFinalAnswer && nextPhase === phaseFinalAnswer;
      ensureDividerFn(row, shouldShow, { label });
    }
  }

  function setBubbleText(bubbleEl, text, options) {
    if (!(bubbleEl instanceof HTMLElement)) return;
    const contentEl = bubbleEl.querySelector(".message-content");
    if (!(contentEl instanceof HTMLElement)) return;
    const renderMessageHtml =
      typeof options?.renderMessageHtml === "function" ? options.renderMessageHtml : null;
    contentEl.innerHTML = renderMessageHtml ? renderMessageHtml(text) : String(text || "");
  }

  global.ChatMessageRendererUtils = Object.freeze({
    createProcessBlock,
    createAssistantPlainBlock,
    groupMessagesForRender,
    ensureProcessFinalDivider,
    refreshFinalDividers,
    setBubbleText,
  });
})(window);
