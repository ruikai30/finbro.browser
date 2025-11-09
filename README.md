# Finbro Browser

A minimal Electron-based Chromium browser for automated web interactions. Built as a "dumb executor" - all intelligence lives in your server, the browser just executes commands.

---

## 🎯 What This Is

**An ultra-minimal browser controlled via WebSocket + Chrome DevTools Protocol (CDP).**

- **Browser:** Tab management + CDP command execution
- **Authentication:** JWT token bridge from finbro.me web app
- **WebSocket:** Single persistent connection to automation server
- **Zero Business Logic:** All orchestration happens on the server

---

## 🏗️ Architecture

```
Finbro.me Web App
  └─> Sends JWT token
        ↓
Finbro Browser (Electron)
  ├─> Connects to automation server via WebSocket
  ├─> Executes tab commands (newTab, switchTab, closeTab)
  └─> Executes CDP commands (navigate, click, fill forms, etc.)
        ↓
FastAPI Automation Server
  ├─> Orchestrates automation workflows
  ├─> Sends commands via WebSocket
  └─> Receives results
```

**Key Principle:** The browser is a **stateless executor**. Commands in → Actions → Results out.

---

## 📁 Project Structure

```
finbro.browser/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Entry point, app lifecycle
│   │   ├── windows.ts          # Window + tab manager setup
│   │   ├── tabs.ts             # BrowserView tab management
│   │   ├── ipc.ts              # Renderer ↔ Main communication
│   │   ├── config.ts           # Persistent config (electron-store)
│   │   ├── auth.ts             # JWT token management
│   │   └── websocket-client.ts # Unified command handler
│   │
│   ├── preload/                # Security bridge
│   │   └── preload.ts          # Exposes window.Finbro + window.finbro
│   │
│   ├── renderer/               # React UI process
│   │   ├── components/         # React components
│   │   │   ├── TabBar.tsx      # Tab bar component
│   │   │   └── UrlBar.tsx      # URL input component
│   │   ├── App.tsx             # Main app component
│   │   ├── index.tsx           # React entry point
│   │   ├── types.ts            # Renderer type definitions
│   │   ├── index.html          # HTML shell
│   │   └── styles.css          # Component styling
│   │
│   └── types/                  # TypeScript definitions
│       ├── ipc.types.ts        # IPC channels
│       └── config.types.ts     # Configuration schema
│
├── package.json
├── tsconfig.json
├── tsconfig.main.json          # Main process TypeScript config
├── vite.config.ts              # Vite bundler config
└── README.md
```

---

## 🔌 WebSocket Protocol

### Connection Flow
1. User logs into finbro.me web app
2. Web app detects Electron via `window.__FINBRO_ENV__.isElectron`
3. Web app calls `window.finbro.sendAuthToken(jwt)`
4. Electron connects to `ws://127.0.0.1:8000/browser/ws` with JWT
5. Server routes commands to this specific browser instance

### Message Format

**Command (Server → Browser):**
```json
{
  "id": "unique-command-id",
  "action": "newTab",
  "params": { "url": "https://example.com" }
}
```

**Response (Browser → Server):**
```json
{
  "id": "unique-command-id",
  "result": { "tabId": 2 }
}
```

**Error Response:**
```json
{
  "id": "unique-command-id",
  "error": "Tab not found"
}
```

---

## 🤖 Supported Commands

### Tab Commands

#### `newTab`
```json
{
  "id": "1",
  "action": "newTab",
  "params": {
    "url": "https://example.com",
    "focus": true  // Optional, default true
  }
}
```
**Returns:** `{ "tabId": 2 }`

#### `switchTab`
```json
{
  "id": "2",
  "action": "switchTab",
  "params": { "tab_id": 2 }
}
```
**Returns:** `{}`

#### `closeTab`
```json
{
  "id": "3",
  "action": "closeTab",
  "params": { "tab_id": 2 }
}
```
**Returns:** `{}`

#### `getAllTabs`
```json
{
  "id": "4",
  "action": "getAllTabs",
  "params": {}
}
```
**Returns:** 
```json
{
  "tabs": [
    { "id": 1, "url": "https://finbro.me", "title": "Finbro" },
    { "id": 2, "url": "https://example.com", "title": "Example Domain" }
  ],
  "current_tab_id": 1
}
```

### CDP Commands

Execute any Chrome DevTools Protocol command:

```json
{
  "id": "5",
  "action": "cdp",
  "params": {
    "tab_id": 2,
    "method": "Page.navigate",
    "args": { "url": "https://github.com" }
  }
}
```

**Common CDP Methods:**
- `Page.navigate` - Navigate to URL
- `Page.captureScreenshot` - Take screenshot
- `Runtime.evaluate` - Execute JavaScript
- `Input.dispatchKeyEvent` - Type text
- `Input.dispatchMouseEvent` - Click elements
- `DOM.getDocument` - Get DOM structure

Full CDP docs: [chromedevtools.github.io/devtools-protocol/](https://chromedevtools.github.io/devtools-protocol/)

---

## ⚙️ Configuration

**Location:** `~/Library/Application Support/finbro-browser/finbro-config.json`

```json
{
  "startupTabs": ["https://finbro.me"],
  "debugMode": false,
  "toolbarHeight": 100,
  "automationServerUrl": "ws://127.0.0.1:8000/browser/ws"
}
```

**Fields:**
- `startupTabs` - URLs to open on launch
- `debugMode` - Enable DevTools and verbose logging
- `toolbarHeight` - Tab bar height in pixels
- `automationServerUrl` - WebSocket server URL

---

## 🛠️ Development

### Setup
```bash
npm install
```

### Run Development Mode
```bash
npm run dev
```
Builds with Vite + TypeScript and runs Electron.

### Build for Production
```bash
npm run build
```
- Main process: TypeScript → CommonJS (`tsc`)
- Renderer: React + TypeScript → Bundled JS (`vite build`)

### Package Desktop App
```bash
npm run dist
```
Creates distributable `.app` / `.exe` / `.AppImage` files.

### Clean Build Artifacts
```bash
npm run clean
```

---

## 🎨 UI Overview

```
┌──────────────────────────────────────────────┐
│ [Tab 1] [Tab 2] [+]                         │  ← Tab Bar (40px)
├──────────────────────────────────────────────┤
│ [URL: https://example.com              Go]  │  ← URL Bar (36px)
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│        Tab Content (BrowserView)             │  ← Full width
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Features:**
- React-based responsive UI
- Click tabs to switch
- Click **+** to create new tab
- Click **✕** on tab to close
- Type URL and press Enter to navigate
- Clean, minimal design

---

## 🔐 Security

- **Context Isolation:** ✅ Enabled
- **Node Integration:** ❌ Disabled in renderer
- **Sandbox:** ✅ Enabled
- **Preload Script:** Exposes minimal, type-safe API

**Exposed APIs:**
- `window.Finbro.tabs.*` - Tab management (for UI)
- `window.finbro.sendAuthToken()` - JWT bridge (for web app)

---

## 📊 Tech Stack

### Frontend (Renderer)
- **React:** 18.3+ - UI framework
- **TypeScript:** 5.3.3 - Type safety
- **Vite:** 7.2+ - Fast builds & bundling

### Backend (Main Process)
- **Electron:** 28.3.3 - Desktop app framework
- **TypeScript:** 5.3.3 - Type safety
- **ws:** 8.18.3 - WebSocket client
- **electron-store:** 8.1.0 - Config persistence

---

## 🚀 Example: Server-Side Python

```python
import asyncio
from fastapi import WebSocket

async def automate_form_fill(websocket: WebSocket):
    """Example: Open tab, fill form, submit"""
    
    # 1. Open new tab
    await websocket.send_json({
        "id": "1",
        "action": "newTab",
        "params": {"url": "https://example.com/form"}
    })
    response = await websocket.receive_json()
    tab_id = response["result"]["tabId"]
    
    # 2. Wait for page load (2 seconds)
    await asyncio.sleep(2)
    
    # 3. Fill email field
    await websocket.send_json({
        "id": "2",
        "action": "cdp",
        "params": {
            "tab_id": tab_id,
            "method": "Runtime.evaluate",
            "args": {
                "expression": "document.querySelector('#email').value = 'user@example.com'"
            }
        }
    })
    await websocket.receive_json()
    
    # 4. Click submit button
    await websocket.send_json({
        "id": "3",
        "action": "cdp",
        "params": {
            "tab_id": tab_id,
            "method": "Runtime.evaluate",
            "args": {
                "expression": "document.querySelector('#submit').click()"
            }
        }
    })
    await websocket.receive_json()
    
    print("✅ Form submitted!")
```

---

## 🎯 Design Philosophy

### Ultra-Minimal Architecture
- **~200 lines** of core logic (websocket-client.ts)
- **No abstractions** - direct command execution
- **No tool registry** - just two handlers: tab commands + CDP commands
- **No routing layers** - message → execute → respond

### Separation of Concerns
- **Browser (Main):** Executes commands, manages tabs
- **Browser (Renderer):** React UI for visualization
- **Server:** Orchestrates workflows, makes decisions
- **Web App:** Handles authentication

### React UI Architecture
- **Component-based** - TabBar, UrlBar as isolated components
- **Unidirectional data flow** - Props down, events up
- **Type-safe** - Full TypeScript support
- **Scalable** - Easy to add agent indicators, tab grouping, etc.

### Production-Grade Simplicity
- Simple code = fewer bugs
- Direct execution = easier debugging
- Minimal surface area = better security
- Fast builds with Vite

---

## 📈 Stats

- **Source Files:** 15+ TypeScript/TSX files
- **Main Process:** ~1,000 lines (business logic)
- **Renderer (React):** ~180 lines (UI components)
- **Core Logic:** ~200 lines (websocket-client.ts)
- **Build Time:** ~400ms (Vite) + ~1s (main process)
- **Startup Time:** <1 second
- **Bundle Size:** ~196KB (includes React)

---

## 🧪 Testing

### 1. Launch Browser
```bash
npm run dev
```

### 2. Authenticate
- Browser opens https://finbro.me
- Log in with your account
- Web app sends JWT to browser automatically

### 3. Send Commands
Your server can now send commands via WebSocket!

---

## 🤝 Contributing

This is intentionally minimal. Before adding features:
1. **Can it be done server-side?** (probably yes)
2. **Does it maintain the "dumb executor" philosophy?**
3. **Is it truly needed for core functionality?**

If yes to all, submit a PR!

---

## 📄 License

MIT

---

**Built for automation. Designed for simplicity. Powered by Electron + CDP.** ⚡
