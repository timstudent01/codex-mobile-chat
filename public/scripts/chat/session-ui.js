(function initChatSessionUiUtils(global) {
  function renderSessionList(params) {
    const {
      sessionListEl,
      sessions,
      selectedSessionId,
      emptyText,
      formatTs,
      escapeHtml,
    } = params || {};
    if (!(sessionListEl instanceof HTMLElement)) return;
    if (!Array.isArray(sessions) || sessions.length === 0) {
      sessionListEl.innerHTML = `<div class="empty">${escapeHtml(emptyText || "")}</div>`;
      return;
    }

    sessionListEl.innerHTML = sessions
      .map((session) => {
        const when = formatTs(session?.updatedAt);
        const isActive = session?.id === selectedSessionId;
        const title = session?.title || session?.id || "";
        return `
          <button type="button" class="session-item ${isActive ? "active" : ""}" data-session-id="${session?.id || ""}">
            <div class="session-item-title">${escapeHtml(title)}</div>
            <div class="session-item-time">${escapeHtml(when || session?.id || "")}</div>
          </button>
        `;
      })
      .join("");
  }

  function renderAttachments(params) {
    const { attachmentListEl, uploadedImages, escapeHtml } = params || {};
    if (!(attachmentListEl instanceof HTMLElement)) return;
    if (!Array.isArray(uploadedImages) || uploadedImages.length === 0) {
      attachmentListEl.innerHTML = "";
      return;
    }

    attachmentListEl.innerHTML = uploadedImages
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

  global.ChatSessionUiUtils = Object.freeze({
    renderSessionList,
    renderAttachments,
  });
})(window);
