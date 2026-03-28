# codex-mobile-chat
[English](./README.md)

A Bun + Hono 服務，讓你可以在手機或桌面瀏覽器查看並延續本機 Codex session 對話。

## 影片示範

### Codex Mobile Chat Demo

[![Codex Mobile Chat Demo](https://img.youtube.com/vi/j081WtTBwgI/maxresdefault.jpg)](https://youtu.be/j081WtTBwgI)

## 功能

- 手機優先的聊天介面（`/chat`），風格接近 ChatGPT
- 讀取 `~/.codex/session_index.jsonl` 的 session 清單
- 解析各 session 的 JSONL 訊息內容
- 可延續既有 session 對話
- 可由 UI 直接建立新對話（`New Session`）
- 使用 `codex exec -s danger-full-access` 進行可寫入執行
- 支援圖片上傳與聊天中的圖片預覽

## 環境需求

- [Bun](https://bun.com) v1.3+
- 已安裝並登入 Codex CLI（`codex --help` 可正常執行）
- Windows/macOS/Linux，且可存取本機 `~/.codex`

## 安裝

```bash
bun install
```

## 啟動

```bash
bun run src/server.ts
```

開發監看模式（類似 nodemon）：

```bash
bun run dev
```

Hot reload 模式：

```bash
bun run dev:hot
```

自訂連接埠：

```bash
PORT=3001 bun run src/server.ts
```

服務預設綁定在 `0.0.0.0`。

## 使用 Tailscale 從手機連線

當手機與電腦不在同一個網路時，可用 Tailscale 進行安全連線。

1. 在電腦與手機都安裝 Tailscale，並登入同一個 Tailnet 帳號。
2. 在電腦啟動本專案，確認服務監聽於 `0.0.0.0`（本專案預設）。
3. 於 Tailscale App 查看電腦的 Tailscale IP（例如 `100.x.x.x`）。
4. 在手機瀏覽器開啟：
   - `http://<tailscale-ip>:3000/chat`
5. 若你使用不同連接埠，請把 `3000` 改成對應的 `PORT`。

安全建議：

- 保持 Tailnet 為私有，不要加入不信任的裝置。
- 不建議把此服務直接暴露到公網。
- 不使用時請關閉本服務。

## 頁面

- `/` 聊天頁（mobile-first）
- `/chat` 聊天頁（同 `/`）

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

回傳指定 session 解析後的 user / assistant 訊息。

### `POST /api/sessions/:sessionId/chat`

延續既有 session。

Request:

```json
{ "prompt": "Your message" }
```

### `POST /api/sessions/new/chat`

建立全新 session，並送出第一句 prompt。

Request:

```json
{ "prompt": "Start message" }
```

### `POST /api/chat/stream`

以 NDJSON 串流回傳事件，提供即時聊天更新。

Request:

```json
{ "sessionId": "optional-existing-id", "prompt": "Your message" }
```

事件類型：

- `status`（`started`, `thinking`）
- `session`（回傳 `sessionId`）
- `assistant`（助理訊息 chunk / 完整訊息）
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

- Session 資料來源為本機 `~/.codex`。
- 非互動式執行不一定會即時出現在所有 Codex Desktop 視窗。
- 若系統沒有 `rg`，專案會改用 Bun / PowerShell 的檔案操作。
