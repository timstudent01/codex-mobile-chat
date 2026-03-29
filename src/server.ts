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




