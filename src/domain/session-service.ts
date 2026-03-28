import path from "node:path";

type SessionIndexRow = {
  id: string;
  thread_name?: string;
  updated_at?: string;
};

export type SessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type SessionMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  phase?: string;
};

export type SessionChatResult = {
  sessionId: string;
  assistantText: string;
  exitCode: number;
};

export type SessionStats = {
  contextWindow: number | null;
  contextUsed: number | null;
  contextRemaining: number | null;
  fiveHourUsedPercent: number | null;
  weekUsedPercent: number | null;
  updatedAt: string | null;
};

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSessionIdFromRolloutPath(filePath: string): string | null {
  const match = filePath.match(/rollout-.*-([0-9a-f-]{36})\.jsonl$/i);
  if (!match) return null;
  const id = match[1] ?? "";
  return ID_PATTERN.test(id) ? id : null;
}

function getCodexHome(): string {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  if (process.env.USERPROFILE) return path.join(process.env.USERPROFILE, ".codex");
  return path.join(process.env.HOME ?? ".", ".codex");
}

function getTextFromContent(content: unknown): string {
  if (!Array.isArray(content)) return "";

  const chunks: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const maybeText = (part as { text?: unknown }).text;
    if (typeof maybeText === "string" && maybeText.trim()) {
      chunks.push(maybeText.trim());
    }
  }
  return chunks.join("\n\n").trim();
}

function shouldHideUserMessage(text: string): boolean {
  return text.includes("<environment_context>") || text.includes("<cwd>");
}

function toSessionTitle(text: string, maxLen = 56): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (!singleLine) return "";
  return singleLine.length > maxLen ? `${singleLine.slice(0, maxLen - 1)}...` : singleLine;
}

async function findSessionFile(sessionId: string): Promise<string | null> {
  const codexHome = getCodexHome().replaceAll("\\", "/");
  const pattern = `${codexHome}/sessions/**/rollout-*-${sessionId}.jsonl`;
  for await (const file of new Bun.Glob(pattern).scan()) {
    return file;
  }
  return null;
}

async function readSessionMetaCwd(sessionId: string): Promise<string | null> {
  const filePath = await findSessionFile(sessionId);
  if (!filePath) return null;

  const text = await Bun.file(filePath).text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as any;
      if (row?.type === "session_meta") {
        const cwd = row?.payload?.cwd;
        if (typeof cwd === "string" && cwd.trim()) return cwd;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function inferSessionTitleFromRollout(sessionId: string): Promise<string | null> {
  const filePath = await findSessionFile(sessionId);
  if (!filePath) return null;

  const text = await Bun.file(filePath).text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    if (row?.type !== "response_item") continue;
    const payload = row.payload;
    if (!payload || payload.type !== "message" || payload.role !== "user") continue;

    const content = getTextFromContent(payload.content);
    if (!content || shouldHideUserMessage(content)) continue;

    const title = toSessionTitle(content);
    if (title) return title;
  }

  return null;
}

export async function getSessionCwd(sessionId: string): Promise<string | null> {
  return readSessionMetaCwd(sessionId);
}

function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  return (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }
    return result;
  })();
}

function getLastAssistantFromJsonl(output: string): string {
  const lines = output.split(/\r?\n/).filter(Boolean);
  let last = "";

  for (const line of lines) {
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    if (row?.type === "response_item") {
      const payload = row.payload;
      if (!payload || payload.type !== "message" || payload.role !== "assistant") continue;
      const text = getTextFromContent(payload.content);
      if (text) last = text;
      continue;
    }

    if (row?.type === "item.completed" && row?.item?.type === "agent_message") {
      const text = row.item?.text;
      if (typeof text === "string" && text.trim()) {
        last = text.trim();
      }
    }
  }

  return last;
}

function getThreadIdFromJsonl(output: string): string {
  const lines = output.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row?.type === "thread.started" && typeof row.thread_id === "string") {
      return row.thread_id;
    }
  }
  return "";
}

export async function listSessions(limit = 50): Promise<SessionSummary[]> {
  const indexPath = path.join(getCodexHome(), "session_index.jsonl");
  const file = Bun.file(indexPath);
  const latestById = new Map<string, SessionSummary>();
  if (await file.exists()) {
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      let row: SessionIndexRow | null = null;
      try {
        row = JSON.parse(line) as SessionIndexRow;
      } catch {
        continue;
      }

      if (!row || !row.id || !ID_PATTERN.test(row.id)) continue;
      const updatedAt = row.updated_at ?? "";
      const title = row.thread_name?.trim() || row.id;
      const prev = latestById.get(row.id);
      if (!prev || updatedAt > prev.updatedAt) {
        latestById.set(row.id, { id: row.id, title, updatedAt });
      }
    }
  }

  // Fallback: include sessions discovered from rollout files even if index lags.
  const codexHome = getCodexHome().replaceAll("\\", "/");
  const pattern = `${codexHome}/sessions/**/rollout-*-*.jsonl`;
  for await (const sessionFile of new Bun.Glob(pattern).scan()) {
    const id = getSessionIdFromRolloutPath(sessionFile);
    if (!id) continue;

    const existing = latestById.get(id);
    try {
      const stat = await Bun.file(sessionFile).stat();
      const updatedAt = stat.mtime ? stat.mtime.toISOString() : "";
      if (!existing || updatedAt > existing.updatedAt) {
        latestById.set(id, { id, title: existing?.title || id, updatedAt });
      }
    } catch {
      if (!existing) {
        latestById.set(id, { id, title: id, updatedAt: "" });
      }
    }
  }

  const sessions = Array.from(latestById.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);

  // Prefer human-readable titles if index thread_name is unavailable.
  await Promise.all(
    sessions.map(async (session) => {
      if (session.title && session.title !== session.id) return;
      const inferredTitle = await inferSessionTitleFromRollout(session.id);
      if (inferredTitle) session.title = inferredTitle;
    })
  );

  return sessions;
}

export async function getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  if (!ID_PATTERN.test(sessionId)) {
    throw new Error("Invalid session id");
  }

  const filePath = await findSessionFile(sessionId);
  if (!filePath) return [];

  const file = Bun.file(filePath);
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);

  const messages: SessionMessage[] = [];
  for (const line of lines) {
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    if (row?.type !== "response_item") continue;
    const payload = row.payload;
    if (!payload || payload.type !== "message") continue;
    if (payload.role !== "user" && payload.role !== "assistant") continue;

    const content = getTextFromContent(payload.content);
    if (!content) continue;
    if (payload.role === "user" && shouldHideUserMessage(content)) continue;

    messages.push({
      role: payload.role,
      text: content,
      timestamp: row.timestamp ?? "",
      phase: payload.phase,
    });
  }

  return messages;
}

export async function chatWithSession(
  sessionId: string,
  prompt: string
): Promise<SessionChatResult> {
  const normalizedSessionId = sessionId.trim();
  if (!ID_PATTERN.test(normalizedSessionId)) {
    throw new Error("Invalid session id");
  }

  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("Prompt is required");
  }

  const cwd = (await readSessionMetaCwd(sessionId)) ?? process.cwd();

  const proc = Bun.spawn(
    [
      "codex",
      "exec",
      "-s",
      "danger-full-access",
      "resume",
      normalizedSessionId,
      "-",
      "--skip-git-repo-check",
      "--json",
    ],
    {
      cwd,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  // Use stdin for prompt payload to avoid Windows argv parsing issues.
  if (proc.stdin) {
    proc.stdin.write(`${userPrompt}\n`);
    proc.stdin.end();
  }

  const stdoutPromise = proc.stdout ? streamToText(proc.stdout) : Promise.resolve("");
  const stderrPromise = proc.stderr ? streamToText(proc.stderr) : Promise.resolve("");

  const [stdout, stderr, exitCode] = await Promise.all([stdoutPromise, stderrPromise, proc.exited]);
  const assistantText = getLastAssistantFromJsonl(stdout);

  if (exitCode !== 0) {
    const errorText = stderr.trim() || stdout.trim() || `codex exited with code ${exitCode}`;
    throw new Error(errorText);
  }

  if (!assistantText) {
    throw new Error("No assistant reply was produced");
  }

  return { sessionId: normalizedSessionId, assistantText, exitCode };
}

export async function createNewSession(prompt: string): Promise<SessionChatResult> {
  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("Prompt is required");
  }

  const proc = Bun.spawn(
    [
      "codex",
      "exec",
      "-s",
      "danger-full-access",
      "--skip-git-repo-check",
      "--json",
      "-",
    ],
    {
      cwd: process.cwd(),
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  if (proc.stdin) {
    proc.stdin.write(`${userPrompt}\n`);
    proc.stdin.end();
  }

  const stdoutPromise = proc.stdout ? streamToText(proc.stdout) : Promise.resolve("");
  const stderrPromise = proc.stderr ? streamToText(proc.stderr) : Promise.resolve("");

  const [stdout, stderr, exitCode] = await Promise.all([stdoutPromise, stderrPromise, proc.exited]);
  const assistantText = getLastAssistantFromJsonl(stdout);
  const sessionId = getThreadIdFromJsonl(stdout);

  if (exitCode !== 0) {
    const errorText = stderr.trim() || stdout.trim() || `codex exited with code ${exitCode}`;
    throw new Error(errorText);
  }

  if (!sessionId || !ID_PATTERN.test(sessionId)) {
    throw new Error("No session id was produced");
  }

  if (!assistantText) {
    throw new Error("No assistant reply was produced");
  }

  return { sessionId, assistantText, exitCode };
}

export async function getSessionStats(sessionId: string): Promise<SessionStats> {
  if (!ID_PATTERN.test(sessionId)) {
    throw new Error("Invalid session id");
  }

  const filePath = await findSessionFile(sessionId);
  if (!filePath) {
    return {
      contextWindow: null,
      contextUsed: null,
      contextRemaining: null,
      fiveHourUsedPercent: null,
      weekUsedPercent: null,
      updatedAt: null,
    };
  }

  const lines = (await Bun.file(filePath).text()).split(/\r?\n/).filter(Boolean);
  let latest: any = null;
  let latestTs: string | null = null;

  for (const line of lines) {
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    if (row?.type === "event_msg" && row?.payload?.type === "token_count") {
      latest = row.payload;
      latestTs = row.timestamp ?? null;
    }
  }

  if (!latest) {
    return {
      contextWindow: null,
      contextUsed: null,
      contextRemaining: null,
      fiveHourUsedPercent: null,
      weekUsedPercent: null,
      updatedAt: latestTs,
    };
  }

  const contextWindow = Number(latest?.info?.model_context_window ?? NaN);
  const contextUsed = Number(latest?.info?.last_token_usage?.total_tokens ?? NaN);
  const fiveHourUsed = Number(latest?.rate_limits?.primary?.used_percent ?? NaN);
  const weekUsed = Number(latest?.rate_limits?.secondary?.used_percent ?? NaN);

  const safeWindow = Number.isFinite(contextWindow) ? contextWindow : null;
  const safeUsed = Number.isFinite(contextUsed) ? contextUsed : null;
  const safeRemaining =
    safeWindow !== null && safeUsed !== null ? Math.max(0, safeWindow - safeUsed) : null;

  return {
    contextWindow: safeWindow,
    contextUsed: safeUsed,
    contextRemaining: safeRemaining,
    fiveHourUsedPercent: Number.isFinite(fiveHourUsed) ? fiveHourUsed : null,
    weekUsedPercent: Number.isFinite(weekUsed) ? weekUsed : null,
    updatedAt: latestTs,
  };
}
