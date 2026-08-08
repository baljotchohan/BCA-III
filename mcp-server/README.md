# BCA III Hub — Professional Multi-AI Connector (MCP + REST + OpenAPI)

Connect **Claude (Desktop & Web)**, **ChatGPT (Custom GPTs)**, **Cursor**, and **Antigravity** directly to your **BCA III Hub** web app to create notes, generate visual study diagrams, post announcements, and manage study tasks in real-time.

---

## 🌟 Supported Transports

1. **MCP Stdio Protocol** (`node index.js`) — Native for Claude Desktop, Cursor, Antigravity.
2. **MCP SSE Protocol** (`http://localhost:3000/sse`) — For Claude Web Connectors, OpenWebUI, and remote AI tools.
3. **OpenAPI 3.0 / REST API** (`http://localhost:3000/openapi.json`) — For ChatGPT Custom GPT Actions.

---

## 🚀 How to Connect Each AI Tool

### 1. Claude Desktop App (Native Stdio)
Add this to `claude_desktop_config.json`:
* macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
* Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bca3-hub": {
      "command": "node",
      "args": [
        "/Users/baljotchohan/Desktop/BCA III/mcp-server/index.js"
      ]
    }
  }
}
```

---

### 2. Claude Web / Remote Connectors (SSE URL)
1. Run the HTTP server mode:
   ```bash
   npm run dev
   ```
2. Paste the SSE Endpoint into Claude Connectors:
   ```
   http://localhost:3000/sse
   ```
   *(Or your public tunnel URL like `https://your-app.ngrok-free.app/sse`)*

---

### 3. ChatGPT (Custom GPT Actions)
1. Create a **Custom GPT** in ChatGPT.
2. Go to **Configure -> Actions -> Import from URL**.
3. Paste:
   ```
   http://localhost:3000/openapi.json
   ```
4. ChatGPT will instantly import `get_notes`, `add_note` (with visual diagram image support), and `add_todo`!

---

### 4. Cursor IDE / Antigravity AI
Add an MCP server entry:
* **Type**: `command` (stdio)
* **Command**: `node /Users/baljotchohan/Desktop/BCA III/mcp-server/index.js`

---

## 🎨 Visual Notes Feature
When any AI tool invokes `add_note`, it can pass:
* `subject`: `comp-arch`, `java`, `dbms`, `web-dev`, or `env-sci`
* `topic`: Topic name
* `notes`: Detailed text explanation
* `imageUrl`: **URL of an AI visual image / diagram / flowchart**

The note instantly appears on your live website dashboard complete with the visual diagram formatted for students!
