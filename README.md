# codex-mobile-chat
[繁體中文](./README.zh-TW.md)

A Bun + Hono service for viewing and chatting with local Codex sessions from mobile/desktop browsers.

> Default runtime mode is **full access** (`danger-full-access`).

## Demo Video

### Codex Mobile Chat Demo

[![Codex Mobile Chat Demo](https://img.youtube.com/vi/j081WtTBwgI/maxresdefault.jpg)](https://youtu.be/j081WtTBwgI)

## Features

- Mobile-friendly chat UI (`/chat`) with ChatGPT-like bubbles
- Browse local sessions from `~/.codex/session_index.jsonl`
- Read messages from session JSONL files
- Continue an existing session
- Create a new session from the UI (`New Session`)
- Uses `codex exec -s danger-full-access` for writable agent runs
- Supports image upload and in-chat image preview

## Requirements

- [Bun](https://bun.com) v1.3+
- Codex CLI installed and logged in (`codex --help` should work)
- Windows/macOS/Linux with access to local `~/.codex`

## Install

```bash
bun install
```

## Run

```bash
bun run src/server.ts
```

Development watch mode (nodemon-like):

```bash
bun run dev
```

Hot reload mode:

```bash
bun run dev:hot
```

Optional custom port:

```bash
PORT=3001 bun run src/server.ts
```

Server binds to `0.0.0.0` by default.

## Access From Phone With Tailscale

Use this when your phone and computer are on different networks and you still want secure direct access.

1. Install Tailscale on your computer and phone, then log in with the same Tailnet account.
2. On your computer, run this app and confirm it is listening on `0.0.0.0` (default in this project).
3. Find your computer's Tailscale IP (example: `100.x.x.x`) from the Tailscale app.
4. On phone browser, open:
   - `http://<tailscale-ip>:3000/chat`
5. If your port is different, replace `3000` with your configured `PORT`.

Security notes:

- Keep your Tailnet private (do not share devices you do not trust).
- Avoid exposing this service directly to public internet.
- Stop the server when you do not need remote access.

## Pages

- `/` chat UI (mobile-first)
- `/chat` chat UI (same as `/`)

## API

### `GET /api/sessions`

Returns available session list:

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

Returns parsed user/assistant messages for a session.

### `POST /api/sessions/:sessionId/chat`

Continues an existing session.

Request:

```json
{ "prompt": "Your message" }
```

### `POST /api/sessions/new/chat`

Creates a brand new session with the first prompt.

Request:

```json
{ "prompt": "Start message" }
```

### `POST /api/chat/stream`

Streams chat events in NDJSON for real-time UI updates.

Request:

```json
{ "sessionId": "optional-existing-id", "prompt": "Your message" }
```

Event types:

- `status` (`started`, `thinking`)
- `session` (returns `sessionId`)
- `assistant` (assistant message chunks/messages)
- `error`
- `done`

## Project Structure

```txt
src/
  server.ts
  domain/
    session-service.ts
public/
  chat.html
```

## Notes

- Session data source is local Codex files under `~/.codex`.
- Non-interactive runs may not always appear live in every Codex Desktop view.
- If `rg` is unavailable on your machine, this project falls back to Bun/PowerShell file operations.
