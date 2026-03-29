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
const AVAILABLE_MODELS = [
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.3-codex",
  "gpt-5.2-codex",
  "gpt-5.2",
  "gpt-5.1-codex-max",
  "gpt-5.1-codex-mini",
];

type ErrorLogMeta = Record<string, unknown>;

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

type ActivitySummary = {
  code: string;
  text: string;
};

const truncateForActivity = (text: string, max = 120): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
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

  if (row.type === "error") return { code: "error_event", text: "Error event" };
  return null;
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

app.get("/api/models", (c) => {
  return c.json({
    models: AVAILABLE_MODELS.map((model) => ({ value: model, label: model })),
    defaultModel: AVAILABLE_MODELS[0] ?? null,
  });
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
      let trackedSessionId = normalizedSessionId || "";
      if (trackedSessionId) {
        markSessionStart(trackedSessionId);
      }

      const encoder = new TextEncoder();
      const toolNameByCallId = new Map<string, string>();
      const push = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
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
            await delay(40);
          }
          return;
        }

        const chunkSize = 24;
        for (let i = 0; i < normalized.length; i += chunkSize) {
          push({ type: "assistant", text: normalized.slice(i, i + chunkSize) });
          await delay(30);
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

        const proc = Bun.spawn(args, {
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

              const activity = summarizeCodexEvent(row, toolNameByCallId);
              if (activity) {
                push({ type: "activity", code: activity.code, text: activity.text });
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

              if (row?.type === "item.completed" && row?.item?.type === "agent_message") {
                await pushAssistantChunked(String(row.item.text ?? ""));
                continue;
              }

              if (row?.type === "response_item") {
                const payload = row.payload;
                if (
                  payload?.type === "message" &&
                  payload?.role === "assistant" &&
                  Array.isArray(payload.content)
                ) {
                  const text = payload.content
                    .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
                    .join("\n\n")
                    .trim();
                  if (text) {
                    await pushAssistantChunked(text);
                  }
                }
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
        if (exitCode !== 0) {
          await logError("POST /api/chat/stream codex exited", new Error("codex non-zero exit"), {
            exitCode,
            sessionId: trackedSessionId || normalizedSessionId || null,
            stderr: stderrText.trim(),
          });
          push({
            type: "error",
            message: stderrText.trim() || `codex exited with code ${exitCode}`,
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
        controller.close();
      }
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




