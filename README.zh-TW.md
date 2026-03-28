# codex-mobile-chat
[English](./README.md)

這是一個使用 Bun + Hono 的服務，讓你可以從手機或桌機瀏覽器查看並延續本機 Codex sessions 對話。

## 功能

- 手機友善聊天介面（`/chat`），訊息氣泡風格接近 ChatGPT
- 從 `~/.codex/session_index.jsonl` 瀏覽本機 sessions
- 讀取 session JSONL 訊息
- 延續既有 session
- 從 UI 建立新 session（`New Session`）
- 透過 `codex exec -s danger-full-access` 執行可寫入的 agent run

## 需求

- [Bun](https://bun.com) v1.3+
- 已安裝並登入 Codex CLI（`codex --help` 可用）
- Windows/macOS/Linux，且可存取本機 `~/.codex`

## 安裝

```bash
bun install
```

## 執行

```bash
bun run src/server.ts
```

開發監看模式（類 nodemon）：

```bash
bun run dev
```

熱重載模式：

```bash
bun run dev:hot
```

可選自訂連接埠：

```bash
PORT=3001 bun run src/server.ts
```

伺服器預設綁定 `0.0.0.0`。

## 頁面

- `/` 聊天頁（手機優先）
- `/chat` 聊天頁（與 `/` 相同）

## API

### `GET /api/sessions`

回傳可用 session 清單：

```json
{
  "sessions": [
    {
      "id": "019d...",
      "title": "thread title",
      "updatedAt": "2026-03-27T...Z"
    }
  ]
}
```

### `GET /api/sessions/:sessionId/messages`

回傳指定 session 的 user/assistant 訊息。

### `POST /api/sessions/:sessionId/chat`

延續既有 session。

Request:

```json
{ "prompt": "Your message" }
```

### `POST /api/sessions/new/chat`

建立新 session 並送出第一則 prompt。

Request:

```json
{ "prompt": "Start message" }
```

### `POST /api/chat/stream`

以 NDJSON 串流聊天事件（供即時 UI 更新）。

Request:

```json
{ "sessionId": "optional-existing-id", "prompt": "Your message" }
```

事件類型：

- `status`（`started`, `thinking`）
- `session`（回傳 `sessionId`）
- `assistant`（回覆分段訊息）
- `error`
- `done`

## 專案結構

```txt
src/
  server.ts
  domain/
    session-service.ts
public/
  chat.html
```

## 備註

- Session 資料來源為本機 `~/.codex` 檔案。
- 非互動執行不一定會即時顯示在所有 Codex Desktop 視圖。
- 若本機沒有 `rg`，此專案會退回使用 Bun/PowerShell 進行檔案操作。
