(function initChatBootstrapEventsUtils(global) {
  function bindBootstrapEvents(ctx) {
    const el = ctx?.elements || {};
    const h = ctx?.handlers || {};

    el.picker?.addEventListener("change", async (e) => {
      if (typeof h.onPickerChange === "function") {
        await h.onPickerChange(e?.target?.value);
      }
    });

    el.menuBtn?.addEventListener("click", () => h.onMenuClick?.());
    el.drawerCloseBtn?.addEventListener("click", () => h.onDrawerClose?.());
    el.drawerBackdrop?.addEventListener("click", (e) => h.onDrawerBackdropClick?.(e));

    el.sessionList?.addEventListener("click", async (e) => {
      if (typeof h.onSessionListClick === "function") {
        await h.onSessionListClick(e);
      }
    });

    el.chat?.addEventListener("click", (e) => h.onChatClick?.(e));
    el.chat?.addEventListener("scroll", () => h.onChatScroll?.());
    el.scrollToBottomBtn?.addEventListener("click", () => h.onScrollToBottomClick?.());

    el.imageViewerClose?.addEventListener("click", () => h.onImageViewerClose?.());
    el.imageViewerPrev?.addEventListener("click", () => h.onImageViewerPrev?.());
    el.imageViewerNext?.addEventListener("click", () => h.onImageViewerNext?.());
    el.imageViewer?.addEventListener("click", (e) => h.onImageViewerClick?.(e));

    document.addEventListener("keydown", (e) => h.onDocumentKeydown?.(e));
    document.addEventListener("click", (e) => h.onDocumentClick?.(e));
    window.addEventListener("resize", () => h.onWindowResize?.());

    el.newSessionBtn?.addEventListener("click", () => h.onNewSessionClick?.());
    el.form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (typeof h.onSubmit === "function") {
        await h.onSubmit();
      }
    });
    el.attachBtn?.addEventListener("click", () => h.onAttachClick?.());
    el.imageInput?.addEventListener("change", async (e) => {
      if (typeof h.onImageInputChange === "function") {
        await h.onImageInputChange(Array.from(e?.target?.files || []));
      }
    });
    el.attachmentList?.addEventListener("click", (e) => h.onAttachmentListClick?.(e));
    el.promptInput?.addEventListener("input", () => h.onPromptInput?.());
    el.promptInput?.addEventListener("keydown", (e) => h.onPromptKeydown?.(e));
    el.langBtn?.addEventListener("click", () => h.onLanguageToggle?.());
    el.modelPicker?.addEventListener("change", () => h.onModelChange?.(el.modelPicker?.value));
    el.helpBtn?.addEventListener("click", (e) => h.onHelpClick?.(e));
    el.activityBtn?.addEventListener("click", (e) => h.onActivityClick?.(e));
  }

  global.ChatBootstrapEventsUtils = Object.freeze({
    bindBootstrapEvents,
  });
})(window);
