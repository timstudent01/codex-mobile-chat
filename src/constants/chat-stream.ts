export const CHAT_STREAM_EVENT = {
  STATUS: "status",
  HEARTBEAT: "heartbeat",
  ACTIVITY: "activity",
  SESSION: "session",
  ASSISTANT: "assistant",
  ASSISTANT_BOUNDARY: "assistant_boundary",
  ASSISTANT_PHASE: "assistant_phase",
  ERROR: "error",
  DONE: "done",
} as const;

export const CHAT_STREAM_STATUS = {
  STARTED: "started",
  THINKING: "thinking",
} as const;

export const CHAT_STREAM_ERROR = {
  NETWORK_RECONNECT_DECODE:
    "Network stream decode error detected during reconnect attempts. Please check network stability/VPN path and retry.",
  PROMPT_REQUIRED: "Prompt is required",
  IMAGE_OUTSIDE_UPLOAD_DIR: "Image path is outside allowed upload directory",
  IMAGE_NOT_FOUND_PREFIX: "Image file not found:",
} as const;

export const CHAT_EXECUTION_MODE = {
  FULL_ACCESS: "danger-full-access",
} as const;
