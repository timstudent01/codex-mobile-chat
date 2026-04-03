(function initChatStreamDispatcher(global) {
  const DEFAULT_EVENTS = Object.freeze({
    STATUS: "status",
    HEARTBEAT: "heartbeat",
    ACTIVITY: "activity",
    SESSION: "session",
    ASSISTANT: "assistant",
    ASSISTANT_BOUNDARY: "assistant_boundary",
    ASSISTANT_PHASE: "assistant_phase",
    ERROR: "error",
    DONE: "done",
  });

  const NOOP = () => {};
  const ASYNC_NOOP = async () => {};

  function safeHandler(value) {
    return typeof value === "function" ? value : ASYNC_NOOP;
  }

  function createStreamDispatcher(config) {
    const streamEvents =
      config?.streamEvents && typeof config.streamEvents === "object"
        ? config.streamEvents
        : DEFAULT_EVENTS;
    const markGotEvent = typeof config?.markGotEvent === "function" ? config.markGotEvent : NOOP;
    const handlers = {
      onStatus: safeHandler(config?.onStatus),
      onHeartbeat: safeHandler(config?.onHeartbeat),
      onActivity: safeHandler(config?.onActivity),
      onSession: safeHandler(config?.onSession),
      onAssistant: safeHandler(config?.onAssistant),
      onAssistantBoundary: safeHandler(config?.onAssistantBoundary),
      onAssistantPhase: safeHandler(config?.onAssistantPhase),
      onError: safeHandler(config?.onError),
      onDone: safeHandler(config?.onDone),
    };

    async function dispatchEvent(event) {
      const type = String(event?.type || "").trim();
      if (!type) return;

      if (type === streamEvents.STATUS) {
        markGotEvent();
        await handlers.onStatus(event);
        return;
      }
      if (type === streamEvents.HEARTBEAT) {
        markGotEvent();
        await handlers.onHeartbeat(event);
        return;
      }
      if (type === streamEvents.ACTIVITY) {
        markGotEvent();
        await handlers.onActivity(event);
        return;
      }
      if (type === streamEvents.SESSION) {
        markGotEvent();
        await handlers.onSession(event);
        return;
      }
      if (type === streamEvents.ASSISTANT) {
        markGotEvent();
        await handlers.onAssistant(event);
        return;
      }
      if (type === streamEvents.ASSISTANT_BOUNDARY) {
        markGotEvent();
        await handlers.onAssistantBoundary(event);
        return;
      }
      if (type === streamEvents.ASSISTANT_PHASE) {
        markGotEvent();
        await handlers.onAssistantPhase(event);
        return;
      }
      if (type === streamEvents.ERROR) {
        await handlers.onError(event);
        return;
      }
      if (type === streamEvents.DONE) {
        await handlers.onDone(event);
      }
    }

    async function dispatchLine(line) {
      const raw = String(line || "").trim();
      if (!raw) return;
      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        return;
      }
      await dispatchEvent(event);
    }

    return { dispatchEvent, dispatchLine };
  }

  global.ChatStreamDispatcher = Object.freeze({ createStreamDispatcher });
})(window);
