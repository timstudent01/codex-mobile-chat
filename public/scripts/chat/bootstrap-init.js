(function initChatBootstrapInitUtils(global) {
  async function runBootstrap(ctx) {
    let modelLoadFailed = false;
    try {
      if (typeof ctx?.addActivity === "function") {
        ctx.addActivity(ctx?.appStartedText || "App started");
      }
      ctx?.setModelLoadingMask?.(true, false);
      ctx?.setLoading?.();
      await (ctx?.loadI18nMap?.() || Promise.resolve()).catch(() => {});
      modelLoadFailed = !(await (ctx?.loadModelOptions?.() || Promise.resolve(false)));
      ctx?.setModelLoadingMask?.(false, modelLoadFailed);
      await (ctx?.loadSessions?.() || Promise.resolve());
      await (ctx?.loadMessages?.(ctx?.getSelectedSessionId?.()) || Promise.resolve());
      await (ctx?.refreshServerLock?.() || Promise.resolve());
      ctx?.applyLanguage?.();
      ctx?.autoResizePrompt?.();
      ctx?.updateScrollToBottomButton?.();
      ctx?.focusPromptInput?.();
      ctx?.startServerLockPolling?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      ctx?.setEmpty?.(message);
      ctx?.setStatus?.("Error");
      ctx?.setModelLoadingMask?.(false, modelLoadFailed);
      if (typeof ctx?.addActivity === "function") {
        ctx.addActivity(ctx?.buildInitErrorText?.(message) || `Init error: ${message}`);
      }
    }
  }

  global.ChatBootstrapInitUtils = Object.freeze({
    runBootstrap,
  });
})(window);
