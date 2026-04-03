(function initChatStreamOrchestratorUtils(global) {
  async function sendWithoutStream(ctx, promptWithImages) {
    if (typeof ctx?.sendChatNonStream !== "function") {
      throw new Error("sendChatNonStream unavailable");
    }
    const data = await ctx.sendChatNonStream({
      sessionId: ctx?.sessionId || null,
      prompt: promptWithImages,
      model: ctx?.currentModel || null,
    });

    const nextSessionId = data?.sessionId ? String(data.sessionId) : String(ctx?.sessionId || "");
    if (nextSessionId && typeof ctx?.setSessionId === "function") {
      ctx.setSessionId(nextSessionId);
    }
    if (nextSessionId && typeof ctx?.updateUrl === "function") {
      ctx.updateUrl(nextSessionId);
    }

    if (typeof ctx?.loadSessions === "function") {
      await ctx.loadSessions();
    }
    if (nextSessionId && typeof ctx?.setPickerValue === "function") {
      ctx.setPickerValue(nextSessionId);
    }
    if (nextSessionId && typeof ctx?.loadMessages === "function") {
      await ctx.loadMessages(nextSessionId, { showLoading: false });
    }
  }

  async function recoverAfterStreamInterruption(ctx, sessionId) {
    if (!sessionId) return false;
    try {
      if (typeof ctx?.loadSessions === "function") await ctx.loadSessions();
      if (typeof ctx?.setPickerValue === "function") ctx.setPickerValue(sessionId);
      if (typeof ctx?.syncMessagesWithRetry === "function") {
        await ctx.syncMessagesWithRetry(sessionId, Number(ctx?.syncRetries || 3), Number(ctx?.syncDelayMs || 300));
      }
      if (typeof ctx?.loadStats === "function") await ctx.loadStats(sessionId);
      if (typeof ctx?.reconcileAssistantSplitFromSession === "function") {
        await ctx.reconcileAssistantSplitFromSession(sessionId);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function reconcileAssistantSplitFromSession(ctx, sessionId) {
    if (!sessionId) return;
    const state = ctx?.liveStreamState;
    if (!state || state.splitReconciled) return;
    const firstBubble = state.currentAssistantBubble;
    if (!(firstBubble instanceof HTMLElement)) return;

    if (typeof ctx?.fetchSessionMessages !== "function") return;
    let data;
    try {
      data = await ctx.fetchSessionMessages(sessionId);
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

    const phaseFinalAnswer = String(ctx?.phaseFinalAnswer || "final_answer");
    const processItems = textTail.filter(
      (m) => String(m?.phase || "").trim() !== phaseFinalAnswer
    );
    const finalItems = textTail.filter(
      (m) => String(m?.phase || "").trim() === phaseFinalAnswer
    );
    if (!processItems.length || !finalItems.length) return;

    const firstProcess = processItems[0];
    const processPhase = String(firstProcess?.phase || "").trim();
    const processText = processItems.map((m) => String(m?.text || "")).filter(Boolean).join("\n\n");
    const processPhaseLabel =
      typeof ctx?.localizePhase === "function" ? ctx.localizePhase(processPhase) : processPhase;
    const roleAssistant = String(ctx?.roleAssistant || "assistant");
    const processMeta = `${roleAssistant}${processPhaseLabel ? ` · ${processPhaseLabel}` : ""}${
      firstProcess?.timestamp && typeof ctx?.formatTimestamp === "function"
        ? ` · ${ctx.formatTimestamp(firstProcess.timestamp)}`
        : ""
    }`;

    if (typeof ctx?.replaceBubbleWithProcessBlock === "function") {
      ctx.replaceBubbleWithProcessBlock(firstBubble, processText, processMeta, false, processPhase);
    }
    if (typeof ctx?.appendAssistantByPhase === "function") {
      for (const msg of finalItems) {
        ctx.appendAssistantByPhase(msg.text || "", msg.phase || "", msg.timestamp || "");
      }
    }
    if (typeof ctx?.refreshFinalDividers === "function") {
      ctx.refreshFinalDividers();
    }
    state.splitReconciled = true;
  }

  global.ChatStreamOrchestratorUtils = Object.freeze({
    sendWithoutStream,
    recoverAfterStreamInterruption,
    reconcileAssistantSplitFromSession,
  });
})(window);
