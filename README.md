# Finbro Browser

A minimal Electron-based Chromium browser designed for automated web interactions via CDP (Chrome DevTools Protocol).

---

## 🎯 What This Is

**A lightweight browser with one purpose: enable programmatic control via CDP WebSocket.**

- **Browser:** Pure execution layer (tabs, navigation, JavaScript injection)
- **CDP Client:** WebSocket connection for remote control
- **5 Core Tools:** Tab management + JavaScript execution
- **Minimal UI:** Tabs, URL bar, and a single "Autofill" button

---

## 🏗️ Architecture

```
FastAPI Server (Your Code)
  - Business Logic
  - CDP Commands
  - WebSocket Server
        ↕
CDP WebSocket Client
        ↕
Finbro Browser (This App)
  - Tab Management
  - CDP Command Execution
  - JavaScript Injection
```

**Key Principle:** The browser has **zero business logic**. All intelligence lives in your server.

---

## 📁 Project Structure

```
finbro.browser/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Entry point, app lifecycle
│   │   ├── windows.ts          # Window management
│   │   ├── tabs.ts             # Tab management (BrowserView)
│   │   ├── ipc.ts              # IPC handler registry
│   │   ├── config.ts           # Persistent config (electron-store)
│   │   ├── cdp-client.ts       # CDP WebSocket client
│   │   └── tools/              # Tool system
│   │       ├── registry.ts     # Tool definitions
│   │       └── executor.ts     # Tool execution router
│   │
│   ├── preload/                # Security bridge
│   │   └── preload.ts          # Exposes window.Finbro API
│   │
│   ├── renderer/               # UI process
│   │   ├── index.html          # Main UI structure
│   │   ├── index.ts            # Tab rendering, CDP button
│   │   └── styles.css          # Minimal styling
│   │
│   └── types/                  # TypeScript definitions
│       ├── tool.types.ts       # Tool schemas
│       ├── ipc.types.ts        # IPC channels
│       └── config.types.ts     # Configuration
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤖 5 Core Tools

These tools are exposed via the WebSocket connection:

### 1. `newTab`
Opens a new browser tab.
```json
{
  "tool": "newTab",
  "params": {
    "url": "https://example.com",
    "focus": true  // Optional, default true
  }
}
```
Returns: `{ "tabId": 1 }`

### 2. `closeTab`
Closes a tab by ID.
```json
{
  "tool": "closeTab",
  "params": { "tabId": 1 }
}
```

### 3. `switchTab`
Switches focus to a specific tab.
```json
{
  "tool": "switchTab",
  "params": { "tabId": 1 }
}
```

### 4. `getAllTabs`
Gets all open tabs.
```json
{
  "tool": "getAllTabs",
  "params": {}
}
```
Returns: `{ "tabs": [...], "currentTabId": 1 }`

### 5. `executeJS`
**The most powerful tool** - executes arbitrary JavaScript in a tab.
```json
{
  "tool": "executeJS",
  "params": {
    "code": "document.querySelector('#email').value = 'test@example.com'",
    "tabId": 1  // Optional, defaults to current tab
  }
}
```

**Use cases:**
- Fill forms: `document.querySelector('#field').value = 'data'`
- Click buttons: `document.querySelector('#submit').click()`
- Extract data: `document.querySelectorAll('.item').length`
- Scroll pages: `window.scrollBy(0, 500)`
- Get URL: `window.location.href`
- Get page text: `document.body.innerText`

---

## 🔌 CDP WebSocket Protocol

### Connection
The browser connects to your FastAPI server via WebSocket:
```
ws://127.0.0.1:8000/ws/browser
```

### Message Format

**Request (Server → Browser):**
```json
{
  "id": "unique-request-id",
  "method": "Page.navigate",
  "params": { "url": "https://example.com" }
}
```

**Response (Browser → Server):**
```json
{
  "id": "unique-request-id",
  "result": { "frameId": "..." }
}
```

### CDP Methods Supported
The browser executes CDP commands via `webContents.debugger.sendCommand()`:
- `Page.navigate` - Navigate to URL
- `Runtime.evaluate` - Execute JavaScript
- `DOM.getDocument` - Get DOM structure
- `Input.dispatchMouseEvent` - Simulate clicks
- `Input.insertText` - Type text
- And all other standard CDP commands

---

## ⚙️ Configuration

**Location:** `~/Library/Application Support/finbro-browser/finbro-config.json`

```json
{
  "startupTabs": ["https://finbro.me"],
  "debugMode": false,
  "toolbarHeight": 100,
  "cdpEnabled": false,
  "cdpWebSocketUrl": "ws://127.0.0.1:8000/ws/browser"
}
```

**Fields:**
- `startupTabs` - URLs to open on launch
- `debugMode` - Enable DevTools and verbose logging
- `cdpEnabled` - Auto-connect to CDP on startup (default: false)
- `cdpWebSocketUrl` - CDP WebSocket server URL

---

## 🛠️ Development

### Setup
```bash
npm install
```

### Run
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Package
```bash
npm run dist
```

---

## 🎨 UI Overview

```
┌──────────────────────────────────────────────┐
│ [Tab 1] [Tab 2] [+]        [⚡ Autofill] ●  │  ← Toolbar (40px)
├──────────────────────────────────────────────┤
│ [URL Bar                                   ] │  ← URL Input (36px)
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│        Tab Content (BrowserView)             │  ← Full width
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Autofill Button:**
- Click to connect/disconnect CDP WebSocket
- Purple when disconnected
- Green when connected
- Status indicator (●) pulses when connected

---

## 🔐 Security

- **Context Isolation:** ✅ Enabled
- **Node Integration:** ❌ Disabled
- **Sandbox:** ✅ Enabled
- **Web Security:** ✅ Enabled (except in debug mode)
- **Remote Content:** ❌ Only via CDP control

The preload script exposes a minimal, type-safe API (`window.Finbro`) to the renderer.

---

## 📊 Tech Stack

- **Electron:** ^28.0.0 - Desktop app framework
- **TypeScript:** ^5.3.3 - Type safety
- **ws:** ^8.18.3 - WebSocket client
- **electron-store:** ^8.1.0 - Config persistence

---

## 🚀 Use Cases

### 1. Form Automation
```python
# FastAPI server sends CDP command
await send_cdp_command({
    "method": "Runtime.evaluate",
    "params": {
        "expression": "document.querySelector('#email').value = 'user@example.com'"
    }
})
```

### 2. Data Extraction
```python
# Extract all job titles
result = await send_cdp_command({
    "method": "Runtime.evaluate",
    "params": {
        "expression": "Array.from(document.querySelectorAll('.job-title')).map(e => e.textContent)"
    }
})
```

### 3. Multi-tab Workflow
```python
# Open multiple tabs
tab1 = await send_tool("newTab", {"url": "https://site1.com"})
tab2 = await send_tool("newTab", {"url": "https://site2.com"})

# Work with each tab
await send_tool("switchTab", {"tabId": tab1})
await send_tool("executeJS", {"code": "document.title", "tabId": tab1})
```

---

## 🎯 Design Philosophy

**Separation of Concerns:**
- **This Browser:** Executes commands, manages tabs, zero logic
- **Your Server:** Contains all business logic, workflows, decisions

**Flexibility:**
- Need to click a button? Use `executeJS`
- Need to extract data? Use `executeJS`
- Need custom behavior? Use `executeJS`

**Simplicity:**
- 5 tools cover everything
- Minimal UI = maximum screen space
- Clean architecture = easy maintenance

---

## 📝 Example Integration

### FastAPI Server (Your Code)
```python
from fastapi import FastAPI, WebSocket
import json

app = FastAPI()

@app.websocket("/ws/browser")
async def browser_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Send CDP command to navigate
    await websocket.send_json({
        "id": "nav-1",
        "method": "Page.navigate",
        "params": {"url": "https://example.com"}
    })
    
    # Receive response
    response = await websocket.receive_json()
    print(f"Navigation result: {response}")
    
    # Execute JavaScript
    await websocket.send_json({
        "id": "eval-1",
        "method": "Runtime.evaluate",
        "params": {
            "expression": "document.querySelector('h1').textContent"
        }
    })
    
    result = await websocket.receive_json()
    print(f"Page title: {result['result']['value']}")
```

---

## 🔄 Workflow

```
1. Launch Finbro Browser
   ↓
2. Click "Autofill" button to connect
   ↓
3. FastAPI server sends CDP commands
   ↓
4. Browser executes commands
   ↓
5. Browser returns results
   ↓
6. Server makes decisions based on results
   ↓
7. Repeat steps 3-6
```

---

## 📈 Metrics

- **Lines of Code:** ~2,000
- **Source Files:** 14
- **Build Time:** ~2 seconds
- **App Size:** ~150MB (bundled)
- **Startup Time:** <1 second

---

## 🧪 Testing

Launch the browser and test CDP connection:
```bash
npm run dev
```

Click the "Autofill" button. If your FastAPI server is running on `ws://127.0.0.1:8000/ws/browser`, it should connect.

Test tool execution from DevTools console:
```javascript
await window.Finbro.tools.execute({
  tool: 'executeJS',
  params: { code: 'alert("Hello from CDP!")' }
});
```

---

## 🤝 Contributing

This is a minimal, focused browser. Before adding features, ask:
1. Can this be done via `executeJS`?
2. Does this belong in the browser or the server?
3. Does this maintain the clean architecture?

If yes to all three, submit a PR!

---

## 📄 License

MIT

---

## 🎓 Learn More

- **Chrome DevTools Protocol:** [chromedevtools.github.io/devtools-protocol/](https://chromedevtools.github.io/devtools-protocol/)
- **Electron Documentation:** [electronjs.org/docs](https://electronjs.org/docs)
- **WebSocket RFC:** [RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455)

---

**Built for automation. Designed for simplicity. Powered by CDP.** ⚡
