# Finbro Browser - Complete Documentation

**Version:** 0.1.0  
**Status:** ✅ AI-Controlled Browser Working End-to-End

---

## 🎯 What This Is

A **custom Chromium browser** built with Electron that can be controlled by AI agents via WebSocket.

**Core Capability:**
- Browser connects to your FastAPI server via WebSocket
- AI agent sends tool commands (`newTab`, `switchTab`, `autofill`, etc.)
- Browser executes them and returns results
- **Cloud AI controls desktop browser remotely**

---

## 🏗️ Architecture

```
FastAPI (Your Server)
  - AI Agent
  - WebSocket Server (/browseragent/ws)
  - Sends tool calls
        ↕ WebSocket
Finbro Browser (Desktop)
  - WebSocket Client (agent-bridge.ts)
  - Tool Executor (7 tools)
  - Tab Manager (BrowserViews)
  - Returns results
```

---

## 📁 Project Structure

```
finbro.browser/
├── MASTER.md                    ← This file
├── AGENT_BRIDGE.md              ← Phases 1-7 implementation roadmap
├── FASTAPI_INTEGRATION.md       ← FastAPI WebSocket code
├── PROGRESS.md                  ← Session summary
│
├── package.json
├── tsconfig.json
├── .gitignore
│
└── src/
    ├── main/                    ← Main process (Node.js)
    │   ├── main.ts             ← Entry point, app lifecycle
    │   ├── windows.ts          ← Window creation
    │   ├── tabs.ts             ← BrowserView tab manager
    │   ├── ipc.ts              ← IPC message router
    │   ├── config.ts           ← Config persistence
    │   ├── agent-bridge.ts     ← WebSocket client
    │   ├── api.ts              ← Backend API (STUB)
    │   ├── autofill.ts         ← Form filler (DEMO)
    │   └── tools/
    │       ├── registry.ts     ← Tool schemas (7 tools)
    │       └── executor.ts     ← Tool execution
    │
    ├── preload/
    │   └── preload.ts          ← Security bridge
    │
    ├── renderer/
    │   ├── index.html          ← Toolbar UI
    │   ├── index.ts            ← UI logic
    │   └── styles.css          ← Finbro styling
    │
    └── types/
        ├── tool.types.ts       ← Tool system types
        ├── api.types.ts        ← API types
        ├── config.types.ts     ← Config schema
        └── ipc.types.ts        ← IPC types
```

**19 source files, ~2,350 lines of code**

---

## 💻 Source Files Explained

### Main Process

**`main.ts`** (127 lines) - App entry point
- Initialize Electron
- Register IPC handlers
- Create main window
- Connect to agent server (if enabled)
- Handle app lifecycle events

**`windows.ts`** (133 lines) - Window management
- Create BrowserWindow
- Load toolbar HTML
- Create TabsManager
- Handle resize, close events

**`tabs.ts`** (286 lines) - Tab management
- `TabsManager` class manages BrowserView instances
- Create/switch/close tabs
- Execute JavaScript in tab context
- Layout tabs below 100px toolbar
- Track URLs and titles

**`ipc.ts`** (248 lines) - IPC routing
- Register all IPC handlers (12 total)
- Route renderer messages to main modules
- Provide TabsManager to tools
- Cache profile data

**`config.ts`** (79 lines) - Configuration
- electron-store wrapper
- Get/set config values
- Merge with defaults
- Storage: `~/Library/Application Support/finbro-browser/finbro-config.json`

**`agent-bridge.ts`** (233 lines) - WebSocket client
- Connect to FastAPI WebSocket
- Receive tool calls (JSON)
- Execute via `executeTool()`
- Send results back
- Auto-reconnect (exponential backoff, max 10 attempts)
- Token auth (query param)

**`api.ts`** (152 lines) - Backend API **STUB**
- Mock implementation
- Returns hardcoded data with delays
- **TODO:** Replace with real HTTP calls

**`autofill.ts`** (180 lines) - Form autofill **DEMO**
- Hardcoded for DV Trading Greenhouse forms
- Fills: first_name, last_name, email, phone, linkedin
- Triggers React/Vue/Angular events
- **TODO:** Replace with smart field detection

### Tools System

**`tools/registry.ts`** (125 lines) - Tool definitions
- 7 tools with OpenAI/Anthropic schemas
- `getAllToolDefinitions()` returns all

**`tools/executor.ts`** (134 lines) - Tool execution
- Switch statement routes tool name to implementation
- Calls TabsManager methods
- Returns structured ToolResult

### Preload

**`preload/preload.ts`** (154 lines) - Security bridge
- Exposes `window.Finbro` API to renderer
- Wraps IPC calls
- Inlines IpcChannel enum (can't import types)

### Renderer

**`renderer/index.html`** (52 lines) - UI structure
- Tab bar (Chrome-style)
- Control buttons (Autofill, Sync, Demo)
- Status display

**`renderer/index.ts`** (396 lines) - UI logic
- Render tabs dynamically
- Poll for updates (1 sec)
- Handle button clicks
- Tab switching/creation/closing

**`renderer/styles.css`** (349 lines) - Styling
- Finbro purple (#290E99)
- Chrome-style tabs
- Button states
- Animations

### Types

**`types/tool.types.ts`** (42 lines)
- `ToolDefinition`, `ToolCall`, `ToolResult`

**`types/api.types.ts`** (62 lines)
- `ProfileData`, `TargetUrl`, `AutofillResult`

**`types/config.types.ts`** (71 lines)
- `AppConfig` schema + `DEFAULT_CONFIG`

**`types/ipc.types.ts`** (102 lines)
- `IpcChannel` enum (12 channels)
- Request/response types

---

## 🔄 How It Works

### 1. Startup Flow
```
main.ts
  → registerIpcHandlers()
  → createMainWindow()
    → Create tabs (Finbro, Gmail, DV Trading)
  → initAgentBridge() (if enabled)
    → Connect to ws://127.0.0.1:8000/browseragent/ws?token=test-token-123
```

### 2. AI Agent Sends Tool Call
```
FastAPI sends: {"tool":"newTab","params":{"url":"https://github.com"},"callId":"123"}
  ↓
agent-bridge.ts receives
  ↓
executeTool(call)
  ↓
tabsManager.createTab(url)
  ↓
Returns: {"success":true,"data":{"tabId":3},"callId":"123"}
  ↓
agent-bridge.ts sends result back
```

### 3. User Clicks Autofill
```
Button click
  ↓
window.Finbro.autofill.execute(profile)
  ↓
IPC 'autofill:execute'
  ↓
executeAutofill()
  ↓
Generate injection code
  ↓
tabs.executeInTab(code)
  ↓
Form fields fill
```

---

## 🤖 AI Agent Tools (7)

### 1. newTab
Open new tab  
**Params:** `{ url: string }`  
**Returns:** `{ tabId: number }`

### 2. closeTab
Close tab by ID  
**Params:** `{ tabId: number }`  
**Returns:** `null`

### 3. switchTab
Switch to tab  
**Params:** `{ tabId: number }`  
**Returns:** `null`

### 4. getAllTabs
Get all open tabs  
**Params:** `{}`  
**Returns:** `{ tabs: [{id, url, title}], currentTabId }`

### 5. getCurrentUrl
Get URL of tab  
**Params:** `{ tabId?: number }`  
**Returns:** `{ url: string }`

### 6. getPageText
Extract page text  
**Params:** `{ tabId?: number }`  
**Returns:** `{ text: string }`

### 7. autofill
Fill form fields  
**Params:** `{ profile: {firstName, lastName, email, phone, ...}, tabId?: number }`  
**Returns:** `{ success, fieldsFilled, errors }`

---

## ⚙️ Configuration

**File:** `~/Library/Application Support/finbro-browser/finbro-config.json`

**Key Settings:**
```json
{
  "agentBridgeEnabled": true,
  "agentBridgeUrl": "ws://127.0.0.1:8000/browseragent/ws",
  "agentToken": "test-token-123",
  "startupTabs": [
    "https://finbro.me",
    "https://mail.google.com",
    "https://job-boards.greenhouse.io/dvtrading/jobs/4592920005"
  ],
  "debugMode": false,
  "toolbarHeight": 100
}
```

**Change WebSocket URL** for production:
```json
"agentBridgeUrl": "wss://api.finbro.sg/browseragent/ws"
```

---

## 🛠️ Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Build and launch
npm run clean        # Remove dist/
```

---

## 🧪 Testing

### Local Tool Testing
Open DevTools console:
```javascript
// Get all tools
const { tools } = await window.Finbro.tools.getAll();
console.table(tools);

// Execute tool
await window.Finbro.tools.execute({
  tool: 'newTab',
  params: { url: 'https://github.com' }
});
```

### WebSocket Testing
1. Run FastAPI with WebSocket endpoint (see `FASTAPI_INTEGRATION.md`)
2. Launch browser: `npm run dev`
3. Browser auto-connects
4. FastAPI sends scripted test sequence
5. All tests should pass

---

## 🔐 Security

**Main Window:**
- Context isolation: ✅
- Node integration: ❌
- Sandbox: ✅

**BrowserViews (Tabs):**
- Context isolation: ✅
- Node integration: ❌
- Sandbox: ✅
- Web security: disabled in debug mode only

**IPC:**
- Only whitelisted APIs via contextBridge
- No Node.js in renderer

**WebSocket:**
- Token auth (query param)
- Auth failure (code 4001) → no reconnect

---

## 🎨 UI

### Layout
```
┌────────────────────────────────────┐
│ [🚀 Tab1] [📧 Tab2] [💼 Tab3] [+] │ ← 40px tabs
├────────────────────────────────────┤
│ FINBRO [Autofill] [Sync]    Ready │ ← 60px controls
├────────────────────────────────────┤
│        Web content here            │ ← BrowserViews
└────────────────────────────────────┘
```

### Brand Colors
```css
--finbro-purple: #290E99       /* Primary */
--finbro-grey: #848484         /* Inactive */
--finbro-light-grey: #D8D8D8   /* Backgrounds */
```

---

## 🔧 Integration Points

### Replace API Stub (`api.ts`)
```typescript
// Current: return mock data
export async function fetchProfile(): Promise<ProfileData> {
  return { firstName: "John", ... };
}

// Replace with:
export async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch(`${apiUrl}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}
```

### Replace Autofill Demo (`autofill.ts`)
```typescript
// Current: Hardcoded selectors
fillByName('first_name', firstName);

// Replace with: Smart field detection
// Your AI agent will handle this
```

---

## 🐛 Troubleshooting

**Can't connect to FastAPI:**
- Verify FastAPI running: `curl http://127.0.0.1:8000/docs`
- Check browser logs for `[AgentBridge]` messages
- Verify token matches

**Tabs not showing:**
- Delete config: `rm ~/Library/Application Support/finbro-browser/finbro-config.json`
- Restart: `npm run dev`

**Tools fail:**
- Check FastAPI endpoint is `/browseragent/ws`
- Check JSON format matches ToolCall interface
- Test locally first via DevTools

**Build errors:**
```bash
npm run build
```
Check TypeScript errors, fix imports/types

---

## 📊 Status

### ✅ Complete
- Chrome-style tabs with UI
- 7 AI tools via WebSocket
- End-to-end FastAPI connection
- Token authentication
- Auto-reconnect (exponential backoff)
- Form autofill (DV Trading demo)
- Clean code (dead code removed)

### ⚠️ Stubs (Intentional)
- `api.ts` - Your FastAPI handles this
- `autofill.ts` - Your AI handles smart detection

### 🔜 Future (Optional)
- Advanced tools: screenshot, click, type, wait
- Production WSS with SSL
- Environment-based config
- UI connection status indicator

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Run
npm run dev

# 3. Test locally
# Open DevTools → Console:
await window.Finbro.tools.execute({
  tool: 'getAllTabs',
  params: {}
});

# 4. Connect to FastAPI
# Add WebSocket endpoint (see FASTAPI_INTEGRATION.md)
# Browser auto-connects on startup
```

---

## 📚 Additional Docs

- **AGENT_BRIDGE.md** - Phase-by-phase implementation guide
- **FASTAPI_INTEGRATION.md** - FastAPI WebSocket endpoint code  
- **PROGRESS.md** - Session summary & achievements

---

**That's it. Everything you need to know.**

**For detailed phase-by-phase roadmap:** See `AGENT_BRIDGE.md`  
**For FastAPI integration:** See `FASTAPI_INTEGRATION.md`  
**For session history:** See `PROGRESS.md`
