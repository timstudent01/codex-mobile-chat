import path from "node:path";
import { CHAT_EXECUTION_MODE } from "../constants/chat-stream";
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

type SessionMessageBase = {
  role: "user" | "assistant";
  timestamp: string;
  phase?: string;
};

export type SessionTextMessage = SessionMessageBase & {
  type: "text";
  text: string;
};

export type SessionImageMessage = SessionMessageBase & {
  type: "image";
  imageUrl: string;
  fileName: string;
};

export type SessionMessage = SessionTextMessage | SessionImageMessage;

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

type TokenCountSnapshot = {
  payload: any;
  timestamp: string | null;
};

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODEL_PATTERN = /^[a-zA-Z0-9._:-]{1,80}$/;
const ASCII_ONLY_PATTERN = /^[\x00-\x7F]*$/;
const HIDDEN_SESSION_TITLES = new Set(["Reply with exactly OK."]);

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

function sanitizeUserRenderText(text: string): string {
  if (!text) return "";
  const withoutImageTags = text.replace(/<\/?image\b[^>]*>/gi, " ");
  const withoutLegacyMarkdownImages = withoutImageTags.replace(
    /!\[[^\]]*]\((?:data:image\/[^)]+|https?:\/\/[^)\s]*\/public\/uploads\/[^)]+|\/public\/uploads\/[^)]+)\)/gi,
    " "
  );
  return withoutLegacyMarkdownImages
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

type MarkdownImageRef = {
  url: string;
  fileName: string;
};

function parseFileNameFromImageUrl(imageUrl: string): string {
  const trimmed = String(imageUrl || "").trim();
  if (!trimmed) return "image";
  if (/^data:image\//i.test(trimmed)) {
    const m = trimmed.match(/^data:image\/([a-zA-Z0-9.+-]+);/i);
    const ext = m?.[1]?.toLowerCase() || "png";
    return `image.${ext}`;
  }
  try {
    const urlObj = new URL(trimmed, "http://local");
    const pathname = urlObj.pathname || "";
    const fromPath = path.posix.basename(pathname);
    return fromPath && fromPath !== "/" ? fromPath : "image";
  } catch {
    return "image";
  }
}

function extractMarkdownImages(text: string): { text: string; images: MarkdownImageRef[] } {
  const source = String(text || "");
  if (!source) return { text: "", images: [] };

  const images: MarkdownImageRef[] = [];
  const cleaned = source.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, altRaw, urlRaw) => {
      const url = String(urlRaw || "").trim().replace(/^<|>$/g, "");
      if (!url) return "";
      if (!/^(https?:\/\/|data:image\/|\/public\/uploads\/)/i.test(url)) return "";
      const alt = String(altRaw || "").trim();
      images.push({
        url,
        fileName: alt || parseFileNameFromImageUrl(url),
      });
      return "";
    }
  );

  return {
    text: cleaned.replace(/\n{3,}/g, "\n\n").trim(),
    images,
  };
}

function getImageUrlsFromContent(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const urls: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const type = (part as { type?: unknown }).type;
    if (type !== "input_image") continue;
    const imageUrl = (part as { image_url?: unknown }).image_url;
    if (typeof imageUrl === "string" && imageUrl.trim()) {
      urls.push(imageUrl.trim());
    }
  }
  return urls;
}

function shouldHideUserMessage(text: string): boolean {
  return text.includes("<environment_context>") || text.includes("<cwd>");
}

function toSessionTitle(text: string, maxLen = 56): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (!singleLine) return "";
  return singleLine.length > maxLen ? `${singleLine.slice(0, maxLen - 1)}...` : singleLine;
}

function normalizeCwdForCodex(cwd: string | null | undefined): string {
  const fallback = process.cwd();
  if (typeof cwd !== "string") return fallback;
  const normalized = cwd.trim();
  if (!normalized) return fallback;
  if (!ASCII_ONLY_PATTERN.test(normalized)) return fallback;
  return normalized;
}

async function findSessionFile(sessionId: string): Promise<string | null> {
  const codexHome = getCodexHome().replaceAll("\\", "/");
  const pattern = `${codexHome}/sessions/**/rollout-*-${sessionId}.jsonl`;
  for await (const file of new Bun.Glob(pattern).scan()) {
    return file;
  }
  return null;
}

async function getLatestTokenCountFromFile(filePath: string): Promise<TokenCountSnapshot | null> {
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

  if (!latest) return null;
  return { payload: latest, timestamp: latestTs };
}

const GLOBAL_STATS_CACHE_TTL_MS = 8_000;
let cachedGlobalTokenCount: {
  expiresAt: number;
  snapshot: TokenCountSnapshot | null;
} | null = null;

async function getLatestGlobalTokenCount(): Promise<TokenCountSnapshot | null> {
  const now = Date.now();
  if (cachedGlobalTokenCount && cachedGlobalTokenCount.expiresAt > now) {
    return cachedGlobalTokenCount.snapshot;
  }

  const codexHome = getCodexHome().replaceAll("\\", "/");
  const pattern = `${codexHome}/sessions/**/rollout-*-*.jsonl`;
  let latestSnapshot: TokenCountSnapshot | null = null;

  for await (const sessionFile of new Bun.Glob(pattern).scan()) {
    const snapshot = await getLatestTokenCountFromFile(sessionFile);
    if (!snapshot) continue;

    if (!latestSnapshot) {
      latestSnapshot = snapshot;
      continue;
    }

    const currentTs = latestSnapshot.timestamp ? Date.parse(latestSnapshot.timestamp) : NaN;
    const candidateTs = snapshot.timestamp ? Date.parse(snapshot.timestamp) : NaN;
    if (Number.isFinite(candidateTs) && (!Number.isFinite(currentTs) || candidateTs > currentTs)) {
      latestSnapshot = snapshot;
    }
  }

  cachedGlobalTokenCount = {
    expiresAt: now + GLOBAL_STATS_CACHE_TTL_MS,
    snapshot: latestSnapshot,
  };

  return latestSnapshot;
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

    const extracted = extractMarkdownImages(getTextFromContent(payload.content));
    const content = sanitizeUserRenderText(extracted.text);
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

  const sorted = Array.from(latestById.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sessions: SessionSummary[] = [];
  for (const item of sorted) {
    const session = { ...item };
    if (!session.title || session.title === session.id) {
      const inferredTitle = await inferSessionTitleFromRollout(session.id);
      if (inferredTitle) session.title = inferredTitle;
    }
    if (HIDDEN_SESSION_TITLES.has(session.title.trim())) {
      continue;
    }
    sessions.push(session);
    if (sessions.length >= limit) break;
  }

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

    const rawContent = getTextFromContent(payload.content);
    const extracted = extractMarkdownImages(rawContent);
    const content =
      payload.role === "user"
        ? sanitizeUserRenderText(extracted.text)
        : extracted.text;
    const imageUrls = new Set<string>();
    for (const item of extracted.images) {
      if (item.url) imageUrls.add(item.url);
    }
    for (const url of getImageUrlsFromContent(payload.content)) {
      if (url) imageUrls.add(url);
    }

    if (payload.role === "user" && content && shouldHideUserMessage(content)) continue;
    if (!content && imageUrls.size === 0) continue;

    if (content) {
      messages.push({
        role: payload.role,
        type: "text",
        text: content,
        timestamp: row.timestamp ?? "",
        phase: payload.phase,
      });
    }

    for (const imageUrl of imageUrls) {
      messages.push({
        role: payload.role,
        type: "image",
        imageUrl,
        fileName: parseFileNameFromImageUrl(imageUrl),
        timestamp: row.timestamp ?? "",
        phase: payload.phase,
      });
    }
  }

  return messages;
}

export async function chatWithSession(
  sessionId: string,
  prompt: string,
  model?: string | null
): Promise<SessionChatResult> {
  const normalizedSessionId = sessionId.trim();
  if (!ID_PATTERN.test(normalizedSessionId)) {
    throw new Error("Invalid session id");
  }

  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("Prompt is required");
  }
  const normalizedModel = (model ?? "").trim();
  if (normalizedModel && !MODEL_PATTERN.test(normalizedModel)) {
    throw new Error("Invalid model");
  }

  const cwd = normalizeCwdForCodex(await readSessionMetaCwd(sessionId));
  const args = ["codex", "exec"] as string[];
  if (normalizedModel) {
    args.push("-m", normalizedModel);
  }
  args.push(
    "-s",
    CHAT_EXECUTION_MODE.FULL_ACCESS,
    "resume",
    normalizedSessionId,
    "-",
    "--skip-git-repo-check",
    "--json"
  );

  const proc = Bun.spawn(
    args,
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

export async function createNewSession(
  prompt: string,
  model?: string | null
): Promise<SessionChatResult> {
  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("Prompt is required");
  }
  const normalizedModel = (model ?? "").trim();
  if (normalizedModel && !MODEL_PATTERN.test(normalizedModel)) {
    throw new Error("Invalid model");
  }
  const args = ["codex", "exec"] as string[];
  if (normalizedModel) {
    args.push("-m", normalizedModel);
  }
  args.push("-s", CHAT_EXECUTION_MODE.FULL_ACCESS, "--skip-git-repo-check", "--json", "-");

  const proc = Bun.spawn(
    args,
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

  const sessionSnapshot = await getLatestTokenCountFromFile(filePath);
  const latest = sessionSnapshot?.payload ?? null;
  const latestTs = sessionSnapshot?.timestamp ?? null;
  const globalSnapshot = await getLatestGlobalTokenCount();

  if (!latest) {
    return {
      contextWindow: null,
      contextUsed: null,
      contextRemaining: null,
      fiveHourUsedPercent: Number.isFinite(Number(globalSnapshot?.payload?.rate_limits?.primary?.used_percent))
        ? Number(globalSnapshot?.payload?.rate_limits?.primary?.used_percent)
        : null,
      weekUsedPercent: Number.isFinite(Number(globalSnapshot?.payload?.rate_limits?.secondary?.used_percent))
        ? Number(globalSnapshot?.payload?.rate_limits?.secondary?.used_percent)
        : null,
      updatedAt: globalSnapshot?.timestamp ?? latestTs,
    };
  }

  const contextWindow = Number(latest?.info?.model_context_window ?? NaN);
  const contextUsed = Number(latest?.info?.last_token_usage?.total_tokens ?? NaN);
  const fiveHourUsed = Number(globalSnapshot?.payload?.rate_limits?.primary?.used_percent ?? NaN);
  const weekUsed = Number(globalSnapshot?.payload?.rate_limits?.secondary?.used_percent ?? NaN);

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
    updatedAt: globalSnapshot?.timestamp ?? latestTs,
  };
}
