# Finbro Browser - Master Documentation

**Version:** 0.1.0  
**Status:** ✅ Ultra-Lean AI Tool Executor (5 Tools Only)

---

## 🎯 What This Is

**The absolute minimum browser for AI agent control.**

**Design:**
- Browser = Pure executor (no logic)
- AI Agent = All intelligence (your FastAPI)
- 5 essential tools only
- Everything else via `executeJS`

---

## 🏗️ Architecture

```
FastAPI (Your Server)
  - AI Agent
  - ALL logic
  - WebSocket Server
        ↕
Browser (This App)
  - WebSocket Client
  - 5 Tools
  - Execute & return
```

---

## 📁 Structure

```
finbro.browser/
├── MASTER.md         ← This file
├── PROGRESS.md       ← Session summary
│
├── package.json
├── tsconfig.json
├── .gitignore
│
└── src/ (15 files, 1,857 lines)
    ├── main/ (6 files)
    │   ├── main.ts
    │   ├── windows.ts
    │   ├── tabs.ts
    │   ├── ipc.ts
    │   ├── config.ts
    │   ├── agent-bridge.ts
    │   └── tools/
    │       ├── registry.ts (5 tools)
    │       └── executor.ts
    ├── preload/
    │   └── preload.ts
    ├── renderer/
    │   ├── index.html
    │   ├── index.ts
    │   └── styles.css
    └── types/
        ├── tool.types.ts
        ├── config.types.ts
        └── ipc.types.ts
```

---

## 🎨 UI

```
┌────────────────────────────────────┐
│ [🚀 finbro.me ✕]              [+] │ ← Tabs
├────────────────────────────────────┤
│                  [Disconnected]    │ ← ONE button
├────────────────────────────────────┤
│       finbro.me content            │
└────────────────────────────────────┘
```

**On start:** 1 tab, disconnected  
**Click button:** Connects to FastAPI  
**All control:** Via AI tools

---

## 🤖 5 Essential Tools

### Browser Control (Can't Do via JS):

**1. newTab**  
Open new tab (auto-focus by default)  
`{ url: string, focus?: boolean }` → `{ tabId: number }`
  - Default: `focus = true` (switches to the new tab)
  - Opt-out: pass `{"focus": false}` to keep current tab active

**2. closeTab**  
Close tab  
`{ tabId: number }` → `null`

**3. switchTab**  
Switch to tab  
`{ tabId: number }` → `null`

**4. getAllTabs**  
Get all tabs  
`{}` → `{ tabs: [{id, url, title}], currentTabId }`

### Page Control (Does Everything):

**5. executeJS**  
Execute any JavaScript  
`{ code: string, tabId?: number }` → `{ result: any }`

**Examples:**
```javascript
// Get URL
{"tool":"executeJS","params":{"code":"window.location.href"}}

// Get page text
{"tool":"executeJS","params":{"code":"document.body.innerText"}}

// Scroll down
{"tool":"executeJS","params":{"code":"window.scrollBy(0,500)"}}

// Click button
{"tool":"executeJS","params":{"code":"document.querySelector('#submit').click()"}}

// Fill form
{"tool":"executeJS","params":{"code":"document.querySelector('#email').value='test@test.com'"}}

// Extract data
{"tool":"executeJS","params":{"code":"Array.from(document.querySelectorAll('.item')).map(e=>e.textContent)"}}
```

**Your AI has unlimited power via executeJS.**

---

## ⚙️ Config

**File:** `~/Library/Application Support/finbro-browser/finbro-config.json`

```json
{
  "startupTabs": ["https://finbro.me"],
  "debugMode": false,
  "toolbarHeight": 100,
  "agentBridgeEnabled": false,
  "agentBridgeUrl": "ws://127.0.0.1:8000/browseragent/ws",
  "agentToken": "test-token-123"
}
```

**Note:** `agentBridgeEnabled: false` - Manual connect only

---

## 🔄 How It Works

### Startup:
```
1. npm run dev
2. finbro.me loads in ONE tab
3. Button shows "Disconnected"
4. Agent bridge initialized (but NOT connected)
5. User clicks "Connect" button
6. Connects to ws://127.0.0.1:8000/browseragent/ws
7. Button shows "Connected ✅"
8. Browser waits for tool calls from FastAPI
```

### WebSocket Communication Pattern:

**CRITICAL:** Every `send_json()` MUST be followed by `receive_json()` to get the result!

```python
# FastAPI sends tool call
await websocket.send_json({
    "tool": "executeJS",
    "params": {"code": "window.location.href"}
})

# Browser receives, executes, sends back result

# FastAPI MUST receive the result
result = await websocket.receive_json()
# Returns: {"success": true, "data": {"result": "https://..."}, "callId": "..."}
```

**Why you need `receive_json()`:**
- Get return values (tab IDs, extracted data, etc.)
- Know if operation succeeded or failed
- Make decisions based on results
- Handle errors gracefully

---

## 📡 WebSocket Message Examples

### Example 1: Create Tab (Need Tab ID!)

**Send:**
```python
await websocket.send_json({
    "tool": "newTab",
    "params": {"url": "https://github.com"},
    "callId": "create-github"
})
```

**Receive:**
```python
result = await websocket.receive_json()
# Returns:
{
    "success": true,
    "data": {"tabId": 1},  # ← YOU NEED THIS to switch/close the tab later!
    "callId": "create-github"
}

# Save the tab ID:
github_tab = result['data']['tabId']
```

---

### Example 2: Extract Data from Page

**Send:**
```python
await websocket.send_json({
    "tool": "executeJS",
    "params": {
        "code": "document.querySelector('.job-title').textContent"
    }
})
```

**Receive:**
```python
result = await websocket.receive_json()
# Returns:
{
    "success": true,
    "data": {"result": "Senior Software Engineer"},  # ← THE DATA YOU WANTED!
    "callId": None
}

job_title = result['data']['result']  # Use the extracted data
```

---

### Example 3: Fill Form Field

**Send:**
```python
await websocket.send_json({
    "tool": "executeJS",
    "params": {
        "code": "document.querySelector('#first_name').value = 'John';"
    }
})
```

**Receive:**
```python
result = await websocket.receive_json()
# Returns:
{
    "success": true,
    "data": {"result": "John"},  # ← Return value of the assignment
    "callId": None
}

# Confirms it succeeded
```

---

### Example 4: Scroll Page

**Send:**
```python
await websocket.send_json({
    "tool": "executeJS",
    "params": {
        "code": "window.scrollBy(0, 500);"  # Scroll down 500px
    }
})
```

**Receive:**
```python
result = await websocket.receive_json()
# Returns:
{
    "success": true,
    "data": {"result": undefined},  # scrollBy returns undefined (that's ok!)
    "callId": None
}
```

---

### Example 5: Error Handling

**Send:**
```python
await websocket.send_json({
    "tool": "switchTab",
    "params": {"tabId": 999}  # Non-existent tab
})
```

**Receive:**
```python
result = await websocket.receive_json()
# Returns:
{
    "success": false,  # ← FAILED!
    "error": "Tab not found: 999",
    "callId": None
}

# Handle the error:
if not result['success']:
    print(f"Error: {result['error']}")
```

---

## 🎯 Real AI Agent Pattern

```python
async def intelligent_agent(websocket):
    # Open job application
    await websocket.send_json({"tool": "newTab", "params": {"url": "https://jobs.com/apply"}})
    result = await websocket.receive_json()
    job_tab = result['data']['tabId']  # ← MUST receive to get tab ID
    
    # Switch to it
    await websocket.send_json({"tool": "switchTab", "params": {"tabId": job_tab}})
    await websocket.receive_json()  # ← MUST receive (confirms switched)
    
    # Wait for page load
    await asyncio.sleep(2)
    
    # Check if form exists
    await websocket.send_json({
        "tool": "executeJS",
        "params": {"code": "document.querySelector('#apply-form') !== null"}
    })
    check = await websocket.receive_json()  # ← MUST receive to know if form exists
    
    if check['data']['result']:  # ← Make decision based on result
        # Fill the form
        await websocket.send_json({
            "tool": "executeJS",
            "params": {
                "code": """
                    document.querySelector('#first_name').value = 'John';
                    document.querySelector('#email').value = 'john@test.com';
                    'filled'
                """
            }
        })
        fill_result = await websocket.receive_json()  # ← Confirm filled
        print(f"Form filled: {fill_result['data']['result']}")
    else:
        print("Form not found, navigating elsewhere...")
```

**That's it. Pure tool execution with full visibility.**

---

## 💻 File Breakdown

### Main (6 files, ~1,100 lines)
- `main.ts` (120) - Entry point
- `windows.ts` (133) - Window mgmt
- `tabs.ts` (286) - Tab mgmt
- `ipc.ts` (204) - IPC router
- `config.ts` (79) - Config storage
- `agent-bridge.ts` (233) - WebSocket

### Tools (2 files, ~210 lines)
- `registry.ts` (95) - 5 tool schemas
- `executor.ts` (110) - Tool router

### Bridge (1 file, ~140 lines)
- `preload.ts` (142) - Security

### UI (3 files, ~580 lines)
- `index.html` (31) - Structure
- `index.ts` (275) - Logic
- `styles.css` (271) - Styling

### Types (3 files, ~160 lines)
- `tool.types.ts` (42)
- `config.types.ts` (38)
- `ipc.types.ts` (79)

---

## 🛠️ Commands

```bash
npm run dev      # Launch (ONE tab, disconnected)
npm run build    # Compile
```

---

## 🧪 Test

```javascript
// DevTools console
await window.Finbro.bridge.connect();
await window.Finbro.tools.execute({
  tool: 'executeJS',
  params: { code: 'alert("AI in control!")' }
});
```

---

## 📊 Evolution

**Start → Now:**
- Files: 19 → 15 (21% less)
- Lines: 2,500 → 1,857 (26% less)
- Tools: 7 → 5 (29% less, but more powerful!)
- Buttons: 4 → 1 (75% less)
- Tabs: 3 → 1 (66% less)
- Docs: 10+ → 2 (80% less)

---

## ✅ What This Repo Does

**Only 3 things:**
1. **Manage tabs** (newTab, closeTab, switchTab, getAllTabs)
2. **Execute JS** (executeJS)
3. **Connect to AI** (WebSocket client)

**That's it. Nothing more.**

---

## 🚀 What Your AI Does

**Everything else:**
- Form filling (via executeJS)
- Button clicking (via executeJS)
- Data extraction (via executeJS)
- Scrolling (via executeJS)
- Waiting (via executeJS)
- Navigation logic
- Workflow orchestration
- Decision making

**Perfect separation.**

---

**For FastAPI code:** See `FASTAPI_INTEGRATION.md` (if not deleted)  
**For session history:** See `PROGRESS.md`

**Status:** ✅ Ultra-lean. Can't get leaner without losing core functionality.
