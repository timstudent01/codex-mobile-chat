export type ChatLocale = "en" | "zh";

type LocalizedEntry = Record<ChatLocale, string>;

export type ChatI18nMap = {
  phase: Record<string, LocalizedEntry>;
  status: Record<string, LocalizedEntry>;
  activityCode: Record<string, LocalizedEntry>;
};

export const CHAT_I18N_MAP: ChatI18nMap = Object.freeze({
  phase: Object.freeze({
    final_answer: Object.freeze({ en: "Final answer", zh: "最終回覆" }),
    final_anser: Object.freeze({ en: "Final answer", zh: "最終回覆" }),
    reasoning: Object.freeze({ en: "Reasoning", zh: "推理" }),
    analysis: Object.freeze({ en: "Analysis", zh: "分析" }),
    commentary: Object.freeze({ en: "Commentary", zh: "說明" }),
  }),
  status: Object.freeze({
    started: Object.freeze({ en: "Started", zh: "已開始" }),
    thinking: Object.freeze({ en: "Thinking", zh: "思考中" }),
    done: Object.freeze({ en: "Done", zh: "完成" }),
  }),
  activityCode: Object.freeze({
    thread_started: Object.freeze({ en: "Thread started", zh: "對話已建立" }),
    turn_started: Object.freeze({ en: "Turn started", zh: "回合開始" }),
    turn_completed: Object.freeze({ en: "Turn completed", zh: "回合完成" }),
    item_started: Object.freeze({ en: "Item started", zh: "步驟開始" }),
    item_completed: Object.freeze({ en: "Item completed", zh: "步驟完成" }),
    tool_call: Object.freeze({ en: "Tool call", zh: "工具呼叫" }),
    tool_output: Object.freeze({ en: "Tool output", zh: "工具輸出" }),
    reasoning_update: Object.freeze({ en: "Reasoning update", zh: "推理更新" }),
    error_event: Object.freeze({ en: "Error event", zh: "錯誤事件" }),
  }),
});
