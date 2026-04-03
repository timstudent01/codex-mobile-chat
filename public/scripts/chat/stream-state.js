(function initChatStreamStateUtils(global) {
  function setBubbleMetaText(bubbleEl, text) {
    if (!(bubbleEl instanceof HTMLElement)) return;
    const metaEl = bubbleEl.querySelector(".meta");
    if (!(metaEl instanceof HTMLElement)) return;
    metaEl.textContent = text;
  }

  function resetLiveStream(ctx) {
    if (typeof ctx?.clearScheduledCollapse === "function") {
      ctx.clearScheduledCollapse();
    }
    return null;
  }

  function initLiveStream(ctx) {
    const bubble = ctx?.streamingAssistantBubble;
    const contentEl = bubble?.querySelector(".message-content");
    if (!(contentEl instanceof HTMLElement)) {
      return ctx?.currentState || null;
    }

    if (typeof ctx?.clearScheduledCollapse === "function") {
      ctx.clearScheduledCollapse();
    }

    const nextState = {
      assistantContentEl: contentEl,
      commandStarts: new Map(),
      streamStartedAt: Date.now(),
      commandLogs: [],
      commandSeq: 0,
      seenDoneKeys: new Set(),
      textBuffer: "",
      hasRealAssistantText: false,
      currentAssistantBubble: bubble,
      currentAssistantPhase: "",
      splitReconciled: false,
      bubbleCommandState: new WeakMap(),
    };

    contentEl.textContent = String(ctx?.thinkingWord || "");
    return nextState;
  }

  function appendStreamNote(ctx, chunkText) {
    const state = ctx?.currentState;
    const normalized = String(chunkText || "");
    if (!normalized || !state) return state || null;

    if (!(state.assistantContentEl instanceof HTMLElement)) return state;
    state.textBuffer = `${state.textBuffer || ""}${normalized}`;
    const compact = state.textBuffer.trim();
    if (compact) {
      state.hasRealAssistantText = true;
      state.assistantContentEl.textContent = compact;
    } else if (!state.hasRealAssistantText) {
      state.assistantContentEl.textContent = String(ctx?.thinkingWord || "");
    }
    return state;
  }

  function updateLiveAssistantPhase(ctx, phase) {
    const state = ctx?.currentState;
    const normalized = String(phase || "").trim();
    if (!normalized || !state) return state || null;
    if (normalized === state.currentAssistantPhase) return state;

    const localizePhase = typeof ctx?.localizePhase === "function" ? ctx.localizePhase : null;
    const phaseLabel = localizePhase ? localizePhase(normalized) || normalized : normalized;
    const roleAssistant = String(ctx?.roleAssistant || "");
    const nextMeta = `${roleAssistant} · ${phaseLabel}`;
    const activeBubble = state.currentAssistantBubble;

    if (
      activeBubble instanceof HTMLElement &&
      !state.hasRealAssistantText &&
      !String(state.textBuffer || "").trim()
    ) {
      setBubbleMetaText(activeBubble, nextMeta);
      state.currentAssistantPhase = normalized;
      return state;
    }

    const appendMessage = typeof ctx?.appendMessage === "function" ? ctx.appendMessage : null;
    if (!appendMessage) return state;
    const bubble = appendMessage("assistant", String(ctx?.thinkingWord || ""), nextMeta);
    const nextContentEl = bubble?.querySelector(".message-content");
    if (!(nextContentEl instanceof HTMLElement)) return state;

    state.currentAssistantBubble = bubble;
    state.assistantContentEl = nextContentEl;
    state.textBuffer = "";
    state.hasRealAssistantText = false;
    state.currentAssistantPhase = normalized;
    return state;
  }

  function splitLiveAssistantBubble(ctx, forcePhase) {
    const state = ctx?.currentState;
    if (!state) return state || null;
    const currentBubble = state.currentAssistantBubble;
    if (!(currentBubble instanceof HTMLElement)) return state;

    const hasText = state.hasRealAssistantText || Boolean(String(state.textBuffer || "").trim());
    if (!hasText) return state;

    const normalized = String(forcePhase || state.currentAssistantPhase || "").trim();
    const localizePhase = typeof ctx?.localizePhase === "function" ? ctx.localizePhase : null;
    const phaseLabel = normalized ? (localizePhase ? localizePhase(normalized) || normalized : normalized) : "";
    const roleAssistant = String(ctx?.roleAssistant || "");
    const metaText = `${roleAssistant}${phaseLabel ? ` · ${phaseLabel}` : ""}`;
    const appendMessage = typeof ctx?.appendMessage === "function" ? ctx.appendMessage : null;
    if (!appendMessage) return state;
    const bubble = appendMessage("assistant", String(ctx?.thinkingWord || ""), metaText);
    const nextContentEl = bubble?.querySelector(".message-content");
    if (!(nextContentEl instanceof HTMLElement)) return state;

    state.currentAssistantBubble = bubble;
    state.assistantContentEl = nextContentEl;
    state.textBuffer = "";
    state.hasRealAssistantText = false;
    return state;
  }

  global.ChatStreamStateUtils = Object.freeze({
    resetLiveStream,
    initLiveStream,
    appendStreamNote,
    updateLiveAssistantPhase,
    splitLiveAssistantBubble,
  });
})(window);
