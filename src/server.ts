import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  chatWithSession,
  createNewSession,
  getSessionCwd,
  getSessionStats,
  getSessionMessages,
  listSessions,
} from "./domain/session-service";

const app = new Hono();
const activeSessionRuns = new Map<string, number>();
let activeRunCount = 0;
const ERROR_LOG_PATH = "./logs/error.log";
const MODEL_PATTERN = /^[a-zA-Z0-9._:-]{1,80}$/;
const PREFERRED_DEFAULT_MODEL = "gpt-5.3-codex";
const AVAILABLE_MODELS = [
  "gpt-5.2",
  "gpt-5.3-codex",
  "gpt-5.2-codex",
  "gpt-5.4-mini",
  "gpt-5.4",
  "gpt-5.1-codex-max",
  "gpt-5.1-codex-mini",
];
const MODEL_PROBE_PROMPT = "Reply with exactly OK.";
const MODEL_DISCOVERY_TTL_MS = 5 * 60 * 1000;
const MODEL_PROBE_TIMEOUT_MS = 8 * 1000;
const MODEL_LIST_TIMEOUT_MS = 3 * 1000;

type ErrorLogMeta = Record<string, unknown>;
type ModelProbeCache = {
  at: number;
  models: string[];
  source: "codex-model" | "probe" | "fallback";
};

let modelProbeCache: ModelProbeCache | null = null;
let backgroundModelRefreshPromise: Promise<void> | null = null;

const pickDefaultModel = (models: string[]): string | null => {
  if (!Array.isArray(models) || models.length === 0) return null;
  if (models.includes(PREFERRED_DEFAULT_MODEL)) return PREFERRED_DEFAULT_MODEL;
  return models[0] ?? null;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const toErrorStack = (error: unknown): string =>
  error instanceof Error && error.stack ? error.stack : "";

const normalizeRequestedModel = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (!MODEL_PATTERN.test(normalized)) {
    throw new Error("Invalid model");
  }
  return normalized;
};

const withTimeout = async <T>(
  promiseFactory: () => Promise<T>,
  timeoutMs: number
): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    void promiseFactory()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const probeSingleModel = async (model: string): Promise<boolean> => {
  let proc: any = null;
  try {
    const ok = await withTimeout(async () => {
      proc = Bun.spawn(
        ["codex", "exec", "-m", model, "-s", "danger-full-access", "--skip-git-repo-check", "--json", "-"],
        {
          cwd: process.cwd(),
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
        }
      );

      if (proc.stdin && typeof proc.stdin !== "number") {
        proc.stdin.write(`${MODEL_PROBE_PROMPT}\n`);
        proc.stdin.end();
      }

      let sawTurnCompleted = false;
      const reader = proc.stdout && typeof proc.stdout !== "number" ? proc.stdout.getReader() : null;
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let row: any;
            try {
              row = JSON.parse(line);
            } catch {
              continue;
            }
            if (row?.type === "turn.completed") {
              sawTurnCompleted = true;
            }
          }
        }
      }

      const exitCode = await proc.exited;
      return exitCode === 0 && sawTurnCompleted;
    }, MODEL_PROBE_TIMEOUT_MS);

    return ok;
  } catch {
    return false;
  } finally {
    if (proc) {
      try {
        proc.kill();
      } catch {
        // ignore
      }
    }
  }
};

const discoverAccessibleModels = async (): Promise<string[]> => {
  const checks = await Promise.all(
    AVAILABLE_MODELS.map(async (model) => ({ model, ok: await probeSingleModel(model) }))
  );
  const models = checks.filter((item) => item.ok).map((item) => item.model);
  return models.length > 0 ? models : AVAILABLE_MODELS;
};

const parseModelsFromText = (raw: string): string[] => {
  if (!raw) return [];
  const found = new Set<string>();
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const firstToken = line.split(/\s+/)[0]?.trim();
    if (!firstToken) continue;
    if (!MODEL_PATTERN.test(firstToken)) continue;
    found.add(firstToken);
  }
  return Array.from(found).filter((model) => AVAILABLE_MODELS.includes(model));
};

const tryListModelsViaCodexCommand = async (): Promise<string[]> => {
  let proc: any = null;
  try {
    return await withTimeout(async () => {
      proc = Bun.spawn(["codex", "model"], {
        cwd: process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdoutReader = proc.stdout && typeof proc.stdout !== "number" ? proc.stdout.getReader() : null;
      const stderrReader = proc.stderr && typeof proc.stderr !== "number" ? proc.stderr.getReader() : null;
      const decoder = new TextDecoder();

      let stdoutText = "";
      let stderrText = "";

      if (stdoutReader) {
        while (true) {
          const { done, value } = await stdoutReader.read();
          if (done) break;
          stdoutText += decoder.decode(value, { stream: true });
        }
      }
      if (stderrReader) {
        while (true) {
          const { done, value } = await stderrReader.read();
          if (done) break;
          stderrText += decoder.decode(value, { stream: true });
        }
      }

      const exitCode = await proc.exited;
      if (exitCode !== 0) return [];
      return parseModelsFromText(`${stdoutText}\n${stderrText}`);
    }, MODEL_LIST_TIMEOUT_MS);
  } catch {
    return [];
  } finally {
    if (proc) {
      try {
        proc.kill();
      } catch {
        // ignore
      }
    }
  }
};

const getAccessibleModels = async (forceRefresh = false): Promise<ModelProbeCache> => {
  if (!forceRefresh && modelProbeCache && Date.now() - modelProbeCache.at < MODEL_DISCOVERY_TTL_MS) {
    return modelProbeCache;
  }

  const fromCodexModel = await tryListModelsViaCodexCommand();
  if (fromCodexModel.length > 0) {
    modelProbeCache = {
      at: Date.now(),
      models: fromCodexModel,
      source: "codex-model",
    };
    return modelProbeCache;
  }

  if (!forceRefresh) {
    if (!modelProbeCache) {
      modelProbeCache = {
        at: Date.now(),
        models: AVAILABLE_MODELS,
        source: "fallback",
      };
    }
    if (!backgroundModelRefreshPromise) {
      backgroundModelRefreshPromise = (async () => {
        try {
          const probed = await discoverAccessibleModels();
          if (probed.length > 0) {
            modelProbeCache = {
              at: Date.now(),
              models: probed,
              source: "probe",
            };
          }
        } finally {
          backgroundModelRefreshPromise = null;
        }
      })();
    }
    return modelProbeCache;
  }

  const probed = await discoverAccessibleModels();
  if (probed.length > 0) {
    modelProbeCache = {
      at: Date.now(),
      models: probed,
      source: "probe",
    };
    return modelProbeCache;
  }

  modelProbeCache = {
    at: Date.now(),
    models: AVAILABLE_MODELS,
    source: "fallback",
  };
  return modelProbeCache;
};

type ActivitySummary = {
  code: string;
  text: string;
};

const truncateForActivity = (text: string, max = 120): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
};

const isReconnectHeaderDecodeNoise = (message: string): boolean => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("reconnecting") &&
    normalized.includes("stream disconnected before completion") &&
    normalized.includes("x-codex-turn-metadata") &&
    normalized.includes("failed to convert header to a str")
  );
};

const parseJsonObject = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const summarizeFunctionCall = (name: string, argsRaw: unknown): string => {
  const args = parseJsonObject(argsRaw);
  if (!args) return `Tool call: ${name}`;

  if (name === "shell_command" && typeof args.command === "string") {
    return `Tool call: shell_command — ${truncateForActivity(args.command, 100)}`;
  }

  const preferredKeys = ["path", "file", "uri", "ref_id", "pattern", "q", "id"];
  for (const key of preferredKeys) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) {
      return `Tool call: ${name} — ${key}=${truncateForActivity(value, 80)}`;
    }
    if (typeof value === "number") {
      return `Tool call: ${name} — ${key}=${value}`;
    }
  }

  return `Tool call: ${name}`;
};

const summarizeFunctionOutput = (name: string, outputRaw: unknown): string => {
  if (typeof outputRaw === "string") {
    const exitMatch = outputRaw.match(/Exit code:\s*(-?\d+)/i);
    if (exitMatch) {
      return `Tool output: ${name} (exit ${exitMatch[1]})`;
    }
  }
  return `Tool output: ${name}`;
};

const summarizeCodexEvent = (
  row: any,
  toolNameByCallId: Map<string, string>
): ActivitySummary | null => {
  if (!row || typeof row !== "object") return null;

  if (row.type === "thread.started") return { code: "thread_started", text: "Thread started" };
  if (row.type === "turn.started") return { code: "turn_started", text: "Turn started" };
  if (row.type === "turn.completed") return { code: "turn_completed", text: "Turn completed" };

  if (row.type === "item.started" || row.type === "item.completed") {
    const item = row.item ?? row.payload ?? {};
    const kind = String(item?.type ?? "").trim();
    if (!kind || kind === "agent_message" || kind === "reasoning") return null;

    if (kind === "command_execution") {
      const command = typeof item?.command === "string" ? truncateForActivity(item.command, 120) : "";
      const exitCode =
        typeof item?.exit_code === "number" ? ` (exit ${item.exit_code})` : "";
      if (row.type === "item.started") {
        return {
          code: "item_started",
          text: command ? `Run: ${command}` : "Start: command_execution",
        };
      }
      return {
        code: "item_completed",
        text: command
          ? `Done: ${command}${exitCode}`
          : `Done: command_execution${exitCode}`,
      };
    }

    const label =
      String(item?.name ?? item?.tool_name ?? kind)
        .replace(/[^\w.\-:/ ]/g, "")
        .trim() || kind;
    return {
      code: row.type === "item.started" ? "item_started" : "item_completed",
      text: `${row.type === "item.started" ? "Start" : "Done"}: ${label}`,
    };
  }

  if (row.type === "event_msg") {
    const payloadType = String(row?.payload?.type ?? "").trim();
    if (payloadType === "reasoning") {
      return { code: "reasoning_update", text: "Reasoning update" };
    }
  }

  if (row.type === "response_item") {
    const payload = row.payload ?? {};
    const kind = String(payload?.type ?? "").trim();
    if (kind === "function_call") {
      const name = String(payload?.name ?? payload?.function?.name ?? "tool").trim();
      const callId = String(payload?.call_id ?? "").trim();
      if (callId && name) {
        toolNameByCallId.set(callId, name);
      }
      return {
        code: "tool_call",
        text: summarizeFunctionCall(name || "tool", payload?.arguments),
      };
    }
    if (kind === "function_call_output") {
      const callId = String(payload?.call_id ?? "").trim();
      const resolved = callId ? toolNameByCallId.get(callId) : null;
      const name = String(payload?.name ?? payload?.function?.name ?? resolved ?? "tool").trim();
      return {
        code: "tool_output",
        text: summarizeFunctionOutput(name || "tool", payload?.output),
      };
    }
  }

  if (row.type === "error") {
    const message =
      typeof row?.message === "string"
        ? row.message.trim()
        : typeof row?.error?.message === "string"
          ? row.error.message.trim()
          : "";
    if (!message) return null;
    // Suppress repeated reconnect noise from codex transport internals.
    // We'll surface a single final error if the turn eventually fails.
    if (isReconnectHeaderDecodeNoise(message)) return null;
    return { code: "error_event", text: `Error: ${truncateForActivity(message, 220)}` };
  }
  return null;
};

const extractTextFromContentPart = (part: any): string => {
  if (!part) return "";
  if (typeof part === "string") return part;
  if (typeof part.text === "string") return part.text;
  if (typeof part.output_text === "string") return part.output_text;
  if (typeof part.delta === "string") return part.delta;
  if (typeof part.value === "string") return part.value;
  if (typeof part.content === "string") return part.content;
  if (typeof part.message === "string") return part.message;
  return "";
};

const collectAssistantTextsFromRow = (row: any): string[] => {
  if (!row || typeof row !== "object") return [];
  const results: string[] = [];

  const pushIfText = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      results.push(value);
    }
  };

  const pushFromContentArray = (content: unknown) => {
    if (!Array.isArray(content)) return;
    for (const part of content) {
      const text = extractTextFromContentPart(part);
      if (text.trim()) results.push(text);
    }
  };

  const rowType = String(row.type ?? "").trim();

  if (rowType === "item.completed" || rowType === "item.updated" || rowType === "item.delta") {
    const item = row.item ?? row.payload ?? {};
    const itemType = String(item?.type ?? "").trim();
    const role = String(item?.role ?? "").trim();
    const isAssistantish =
      itemType === "agent_message" ||
      itemType === "assistant_message" ||
      (itemType === "message" && role === "assistant");

    if (isAssistantish) {
      pushIfText(item?.text);
      pushIfText(item?.delta);
      pushIfText(item?.text_delta);
      pushIfText(item?.message);
      pushFromContentArray(item?.content);
    }
  }

  if (rowType === "response_item") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    const role = String(payload?.role ?? "").trim();

    if (payloadType === "message" && role === "assistant") {
      pushIfText(payload?.text);
      pushIfText(payload?.delta);
      pushFromContentArray(payload?.content);
    }

    if (
      payloadType === "assistant_message" ||
      payloadType === "assistant_message_delta" ||
      payloadType === "output_text" ||
      payloadType === "output_text_delta"
    ) {
      pushIfText(payload?.text);
      pushIfText(payload?.delta);
      pushIfText(payload?.output_text);
      pushFromContentArray(payload?.content);
    }
  }

  if (rowType === "event_msg") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    if (
      payloadType === "assistant_message" ||
      payloadType === "assistant_message_delta" ||
      payloadType === "agent_message" ||
      payloadType === "agent_message_delta"
    ) {
      pushIfText(payload?.text);
      pushIfText(payload?.delta);
      pushFromContentArray(payload?.content);
    }
  }

  return results;
};

const collectAssistantPhaseFromRow = (row: any): string => {
  if (!row || typeof row !== "object") return "";
  const normalize = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  const rowType = String(row.type ?? "").trim();

  if (rowType === "item.completed" || rowType === "item.updated" || rowType === "item.delta") {
    const item = row.item ?? row.payload ?? {};
    const itemType = String(item?.type ?? "").trim();
    const role = String(item?.role ?? "").trim();
    const isAssistantish =
      itemType === "agent_message" ||
      itemType === "assistant_message" ||
      (itemType === "message" && role === "assistant");
    if (isAssistantish) return normalize(item?.phase);
  }

  if (rowType === "response_item") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    const role = String(payload?.role ?? "").trim();

    if (payloadType === "message" && role === "assistant") {
      return normalize(payload?.phase);
    }

    if (
      payloadType === "assistant_message" ||
      payloadType === "assistant_message_delta" ||
      payloadType === "output_text" ||
      payloadType === "output_text_delta"
    ) {
      return normalize(payload?.phase);
    }
  }

  if (rowType === "event_msg") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    if (
      payloadType === "assistant_message" ||
      payloadType === "assistant_message_delta" ||
      payloadType === "agent_message" ||
      payloadType === "agent_message_delta"
    ) {
      return normalize(payload?.phase);
    }
  }

  return "";
};

const isAssistantBoundaryRow = (row: any): boolean => {
  if (!row || typeof row !== "object") return false;
  const rowType = String(row.type ?? "").trim();

  if (rowType === "item.completed") {
    const item = row.item ?? row.payload ?? {};
    const itemType = String(item?.type ?? "").trim();
    const role = String(item?.role ?? "").trim();
    return (
      itemType === "agent_message" ||
      itemType === "assistant_message" ||
      (itemType === "message" && role === "assistant")
    );
  }

  if (rowType === "response_item") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    const role = String(payload?.role ?? "").trim();
    return (
      (payloadType === "message" && role === "assistant") ||
      payloadType === "assistant_message" ||
      payloadType === "output_text"
    );
  }

  if (rowType === "event_msg") {
    const payload = row.payload ?? {};
    const payloadType = String(payload?.type ?? "").trim();
    return payloadType === "assistant_message" || payloadType === "agent_message";
  }

  return false;
};

async function logError(scope: string, error: unknown, meta: ErrorLogMeta = {}) {
  const timestamp = new Date().toISOString();
  const metaText =
    Object.keys(meta).length > 0 ? `\nmeta=${JSON.stringify(meta, null, 2)}` : "";
  const stack = toErrorStack(error);
  const line =
    `[${timestamp}] scope=${scope}\n` +
    `message=${toErrorMessage(error)}${metaText}` +
    `${stack ? `\nstack=${stack}` : ""}\n\n`;

  try {
    await mkdir("./logs", { recursive: true });
    await appendFile(ERROR_LOG_PATH, line, "utf8");
  } catch (writeError) {
    console.error("Failed to write error log:", writeError);
  }
}

const markSessionStart = (sessionId: string) => {
  const current = activeSessionRuns.get(sessionId) ?? 0;
  activeSessionRuns.set(sessionId, current + 1);
};

const markSessionDone = (sessionId: string) => {
  const current = activeSessionRuns.get(sessionId) ?? 0;
  if (current <= 1) {
    activeSessionRuns.delete(sessionId);
    return;
  }
  activeSessionRuns.set(sessionId, current - 1);
};

const serveChatPage = async (c: any) => {
  const html = await Bun.file("./public/chat.html").text();
  return c.body(html, 200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
  });
};

app.get("/", serveChatPage);
app.get("/chat", serveChatPage);
app.get("/api/sessions", async (c) => {
  const sessions = await listSessions();
  return c.json({ sessions });
});

app.get("/api/models", async (c) => {
  try {
    const forceRefresh = c.req.query("refresh") === "1";
    const resolved = await getAccessibleModels(forceRefresh);
    return c.json({
      models: resolved.models.map((model) => ({ value: model, label: model })),
      defaultModel: pickDefaultModel(resolved.models),
      source: resolved.source,
      cachedAt: resolved.at,
    });
  } catch (error) {
    await logError("GET /api/models", error, {
      method: c.req.method,
      path: c.req.path,
    });
    return c.json({
      models: AVAILABLE_MODELS.map((model) => ({ value: model, label: model })),
      defaultModel: pickDefaultModel(AVAILABLE_MODELS),
      source: "fallback",
    });
  }
});

app.get("/api/sessions/:sessionId/messages", async (c) => {
  const sessionId = c.req.param("sessionId");
  try {
    const messages = await getSessionMessages(sessionId);
    return c.json({ sessionId, messages });
  } catch (error) {
    await logError("GET /api/sessions/:sessionId/messages", error, {
      sessionId,
      method: c.req.method,
      path: c.req.path,
    });
    const message = toErrorMessage(error);
    return c.json({ error: message }, 400);
  }
});

app.get("/api/sessions/:sessionId/stats", async (c) => {
  const sessionId = c.req.param("sessionId");
  try {
    const stats = await getSessionStats(sessionId);
    return c.json({ sessionId, stats });
  } catch (error) {
    await logError("GET /api/sessions/:sessionId/stats", error, {
      sessionId,
      method: c.req.method,
      path: c.req.path,
    });
    const message = toErrorMessage(error);
    return c.json({ error: message }, 400);
  }
});

app.get("/api/chat/status", (c) => {
  return c.json({
    activeRunCount,
    activeSessionIds: Array.from(activeSessionRuns.keys()),
  });
});

app.post("/api/uploads", async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const rawFile = body.file;
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!(file instanceof File)) {
      return c.json({ error: "Image file is required" }, 400);
    }

    if (!String(file.type || "").startsWith("image/")) {
      return c.json({ error: "Only image uploads are allowed" }, 400);
    }

    await mkdir("./public/uploads", { recursive: true });

    const sourceName = file.name || "upload-image";
    const ext = path.extname(sourceName) || ".png";
    const storedName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const relativePath = `/public/uploads/${storedName}`;
    const writePath = `./public/uploads/${storedName}`;

    await Bun.write(writePath, file);

    const host = c.req.header("host");
    const protocol = c.req.header("x-forwarded-proto") || "http";
    const url = host ? `${protocol}://${host}${relativePath}` : relativePath;

    return c.json({
      fileName: sourceName,
      contentType: file.type,
      size: file.size,
      url,
      relativePath,
      absolutePath: path.resolve(writePath),
    });
  } catch (error) {
    await logError("POST /api/uploads", error, {
      method: c.req.method,
      path: c.req.path,
    });
    return c.json({ error: toErrorMessage(error) }, 400);
  }
});

app.post("/api/chat/stream", async (c) => {
  const { sessionId, prompt, model } = await c.req.json<{
    sessionId?: string | null;
    prompt?: string;
    model?: string | null;
  }>();
  const userPrompt = (prompt ?? "").trim();
  const normalizedSessionId = (sessionId ?? "").trim();
  const normalizedModel = normalizeRequestedModel(model);

  if (!userPrompt) {
    return c.json({ error: "Prompt is required" }, 400);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      activeRunCount += 1;
      let streamClosed = false;
      let proc: Bun.Subprocess | null = null;
      let procExited = false;
      let trackedSessionId = normalizedSessionId || "";
      if (trackedSessionId) {
        markSessionStart(trackedSessionId);
      }

      const encoder = new TextEncoder();
      const toolNameByCallId = new Map<string, string>();
      let lastCodexErrorMessage = "";
      let sawReconnectHeaderDecodeNoise = false;
      let lastAssistantPhase = "";
      const push = (event: Record<string, unknown>) => {
        if (streamClosed) return false;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          return true;
        } catch {
          streamClosed = true;
          return false;
        }
      };
      const pushAssistantChunked = async (text: string) => {
        const normalized = text.trim();
        if (!normalized) return;

        const lines = normalized
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length > 1) {
          for (const line of lines) {
            push({ type: "assistant", text: line });
          }
          return;
        }

        const chunkSize = 120;
        for (let i = 0; i < normalized.length; i += chunkSize) {
          push({ type: "assistant", text: normalized.slice(i, i + chunkSize) });
        }
      };

      try {
        const cwd = normalizedSessionId
          ? ((await getSessionCwd(normalizedSessionId)) ?? process.cwd())
          : process.cwd();

        const args = ["codex", "exec"] as string[];
        if (normalizedModel) {
          args.push("-m", normalizedModel);
        }
        if (normalizedSessionId) {
          args.push(
            "-s",
            "danger-full-access",
            "resume",
            normalizedSessionId,
            "-",
            "--skip-git-repo-check",
            "--json"
          );
        } else {
          args.push("-s", "danger-full-access", "--skip-git-repo-check", "--json", "-");
        }

        proc = Bun.spawn(args, {
          cwd,
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
        });

        if (proc.stdin) {
          proc.stdin.write(`${userPrompt}\n`);
          proc.stdin.end();
        }

        push({ type: "status", text: "started" });

        const reader = proc.stdout?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;

              let row: any;
              try {
                row = JSON.parse(line);
              } catch {
                continue;
              }

              if (row?.type === "error") {
                const message =
                  typeof row?.message === "string"
                    ? row.message.trim()
                    : typeof row?.error?.message === "string"
                      ? row.error.message.trim()
                      : "";
                if (message) {
                  if (isReconnectHeaderDecodeNoise(message)) {
                    sawReconnectHeaderDecodeNoise = true;
                  }
                  lastCodexErrorMessage = message;
                }
              }

              const activity = summarizeCodexEvent(row, toolNameByCallId);
              if (activity) {
                push({ type: "activity", code: activity.code, text: activity.text });
              }

              const assistantPhase = collectAssistantPhaseFromRow(row);
              if (assistantPhase && assistantPhase !== lastAssistantPhase) {
                lastAssistantPhase = assistantPhase;
                push({ type: "assistant_phase", phase: assistantPhase });
              }

              if (row?.type === "thread.started" && typeof row.thread_id === "string") {
                if (!trackedSessionId) {
                  trackedSessionId = row.thread_id;
                  markSessionStart(trackedSessionId);
                }
                push({ type: "session", sessionId: row.thread_id });
                continue;
              }

              if (row?.type === "turn.started") {
                push({ type: "status", text: "thinking" });
                continue;
              }

              const assistantTexts = collectAssistantTextsFromRow(row);
              if (assistantTexts.length > 0) {
                if (isAssistantBoundaryRow(row)) {
                  push({ type: "assistant_boundary" });
                }
                for (const text of assistantTexts) {
                  await pushAssistantChunked(text);
                }
                continue;
              }
            }
          }
        }

        let stderrText = "";
        const stderrReader = proc.stderr?.getReader();
        if (stderrReader) {
          const stderrDecoder = new TextDecoder();
          while (true) {
            const { done, value } = await stderrReader.read();
            if (done) break;
            stderrText += stderrDecoder.decode(value);
          }
        }

        const exitCode = await proc.exited;
        procExited = true;
        if (exitCode !== 0) {
          await logError("POST /api/chat/stream codex exited", new Error("codex non-zero exit"), {
            exitCode,
            sessionId: trackedSessionId || normalizedSessionId || null,
            stderr: stderrText.trim(),
            lastCodexErrorMessage: lastCodexErrorMessage || null,
          });
          push({
            type: "error",
            message:
              (sawReconnectHeaderDecodeNoise
                ? "Network stream decode error detected during reconnect attempts. Please check network stability/VPN path and retry."
                : "") ||
              lastCodexErrorMessage ||
              stderrText.trim() ||
              `codex exited with code ${exitCode}`,
          });
        }

        push({ type: "done" });
      } catch (error) {
        await logError("POST /api/chat/stream", error, {
          sessionId: trackedSessionId || normalizedSessionId || null,
          method: c.req.method,
          path: c.req.path,
        });
        push({
          type: "error",
          message: toErrorMessage(error),
        });
        push({ type: "done" });
      } finally {
        activeRunCount = Math.max(0, activeRunCount - 1);
        if (trackedSessionId) {
          markSessionDone(trackedSessionId);
        }
        if (proc && !procExited) {
          try {
            proc.kill();
          } catch {
            // ignore kill errors during disconnect/teardown
          }
        }
        if (!streamClosed) {
          try {
            controller.close();
          } catch {
            // already closed by runtime/client disconnect
          }
        }
      }
    },
    cancel() {
      // Reader side is gone; let push() become no-op through enqueue failures.
    },
  });

  return c.body(stream, 200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
});

app.post("/api/sessions/new/chat", async (c) => {
  try {
    const body = await c.req.json<{ prompt?: string; model?: string | null }>();
    const prompt = body.prompt ?? "";
    const model = normalizeRequestedModel(body.model);

    const result = await createNewSession(prompt, model);
    const messages = await getSessionMessages(result.sessionId);

    return c.json({
      sessionId: result.sessionId,
      assistantText: result.assistantText,
      messages,
    });
  } catch (error) {
    await logError("POST /api/sessions/new/chat", error, {
      method: c.req.method,
      path: c.req.path,
    });
    const message = toErrorMessage(error);
    return c.json({ error: message }, 400);
  }
});

app.post("/api/sessions/:sessionId/chat", async (c) => {
  const sessionId = c.req.param("sessionId");
  try {
    const body = await c.req.json<{ prompt?: string; model?: string | null }>();
    const prompt = body.prompt ?? "";
    const model = normalizeRequestedModel(body.model);

    const result = await chatWithSession(sessionId, prompt, model);
    const messages = await getSessionMessages(sessionId);

    return c.json({
      sessionId,
      assistantText: result.assistantText,
      messages,
    });
  } catch (error) {
    await logError("POST /api/sessions/:sessionId/chat", error, {
      sessionId,
      method: c.req.method,
      path: c.req.path,
    });
    const message = toErrorMessage(error);
    return c.json({ error: message }, 400);
  }
});

app.onError(async (error, c) => {
  await logError("Hono onError", error, {
    method: c.req.method,
    path: c.req.path,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

process.on("uncaughtException", (error) => {
  void logError("process uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  void logError("process unhandledRejection", reason);
});

// ?? ??瑼?嚗???
app.use("/public/*", serveStatic({ root: "./" }));

export default {
  hostname: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};




