# Finbro Browser - Architecture Documentation

**Version:** 0.1.0  
**Last Updated:** October 23, 2025

---

## 🎯 Architecture Overview

Finbro Browser is built on **Electron**, leveraging Chromium's rendering engine with Node.js backend capabilities. The architecture emphasizes **security, modularity, and clean integration points**.

---

## 🧩 Core Principles

### 1. **Separation of Concerns**
- **Main Process:** Business logic, system APIs, file I/O
- **Preload Scripts:** Secure bridge between contexts
- **Renderer Process:** UI only, no privileged access

### 2. **Type Safety**
- Shared TypeScript interfaces across processes
- Strong typing for IPC messages
- No `any` types in production code

### 3. **Security First**
- Context isolation enabled
- No Node.js in renderer
- Sandboxed BrowserViews
- Minimal IPC surface area

### 4. **Extensibility**
- Plugin-ready architecture
- Config-driven behavior
- Clear integration contracts

---

## 📐 System Architecture

```
┌───────────────────────────────────────────────────────┐
│                    ELECTRON APP                        │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │         MAIN PROCESS (Node.js)               │   │
│  │                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────┐│   │
│  │  │  main.ts   │──│ windows.ts │──│ tabs.ts││   │
│  │  │(lifecycle) │  │ (UI coord) │  │(views) ││   │
│  │  └────────────┘  └────────────┘  └────────┘│   │
│  │                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────┐│   │
│  │  │  ipc.ts    │  │ config.ts  │  │ api.ts ││   │
│  │  │ (handlers) │  │ (persist)  │  │(stub)  ││   │
│  │  └────────────┘  └────────────┘  └────────┘│   │
│  │                                              │   │
│  │  ┌────────────┐                             │   │
│  │  │autofill.ts │  ← Integration Point        │   │
│  │  │  (stub)    │                             │   │
│  │  └────────────┘                             │   │
│  └──────────────────────────────────────────────┘   │
│                       ▲                              │
│                       │ IPC (secure)                 │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │           PRELOAD BRIDGE                     │   │
│  │  ┌────────────────────────────────────────┐ │   │
│  │  │  contextBridge.exposeInMainWorld()    │ │   │
│  │  │  - window.Finbro.tabs.*               │ │   │
│  │  │  - window.Finbro.autofill.*           │ │   │
│  │  │  - window.Finbro.config.*             │ │   │
│  │  └────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                       ▲                              │
│                       │ window.Finbro API            │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │         RENDERER PROCESS (Browser)           │   │
│  │  ┌────────────────────────────────────────┐ │   │
│  │  │  Toolbar (index.html + index.ts)       │ │   │
│  │  │  [Autofill] [Sync] [Status Display]   │ │   │
│  │  └────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │         BROWSER VIEWS (Tabs)                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────┐│   │
│  │  │   Tab 0    │  │   Tab 1    │  │  Tab N ││   │
│  │  │ (DV Form)  │  │  (Google)  │  │  (...)  ││   │
│  │  └────────────┘  └────────────┘  └────────┘│   │
│  │  (Sandboxed, isolated, JS injectable)      │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Context Isolation
```typescript
// All BrowserWindows and BrowserViews use:
webPreferences: {
  contextIsolation: true,    // Separate worlds
  nodeIntegration: false,    // No Node in renderer
  sandbox: true              // Additional protection
}
```

### IPC Communication
```typescript
// Renderer → Main (invoke/handle pattern)
// Preload exposes limited API
contextBridge.exposeInMainWorld('Finbro', {
  tabs: {
    create: (url) => ipcRenderer.invoke('tabs:create', url),
    switch: (id) => ipcRenderer.invoke('tabs:switch', id)
  },
  autofill: {
    execute: (profile) => ipcRenderer.invoke('autofill:execute', profile)
  }
});

// Main process handlers (ipc.ts)
ipcMain.handle('tabs:create', async (event, url: string) => {
  // Validation, authentication, business logic
  return await tabsManager.createTab(url);
});
```

**Security Benefits:**
- Renderer cannot call arbitrary IPC channels
- Type-safe contracts
- Validation at IPC boundary
- No direct access to Node.js APIs

---

## 🗂️ Module Responsibilities

### `main.ts`
**Role:** Application lifecycle coordinator  
**Responsibilities:**
- Initialize Electron app
- Handle app-level events (ready, quit, activate)
- Delegate to specialized modules

**Key Methods:**
- `app.whenReady()` → create window
- `app.on('window-all-closed')` → quit app

---

### `windows.ts`
**Role:** Window management  
**Responsibilities:**
- Create/destroy BrowserWindows
- Configure window preferences
- Load renderer HTML
- Coordinate with tabs manager

**Key Methods:**
- `createMainWindow()` → setup UI
- Window event handlers (resize, close)

---

### `tabs.ts`
**Role:** Tab/BrowserView lifecycle  
**Responsibilities:**
- Create/destroy BrowserViews
- Switch active tab
- Manage tab layout (bounds calculation)
- Execute code in tab context

**Key Methods:**
```typescript
createTab(url: string): Promise<TabId>
switchTo(tabId: TabId): void
closeTab(tabId: TabId): void
executeInTab(tabId: TabId, code: string): Promise<any>
layoutAll(toolbarHeight: number): void
```

**Design Pattern:** Singleton manager per window

---

### `ipc.ts`
**Role:** Inter-Process Communication hub  
**Responsibilities:**
- Register IPC handlers
- Route messages to appropriate modules
- Input validation
- Error handling/logging

**Message Types:**
```typescript
// tabs:* - Tab management
'tabs:create' → (url: string) → TabId
'tabs:switch' → (id: TabId) → void
'tabs:close' → (id: TabId) → void

// autofill:* - Autofill operations
'autofill:execute' → (profile: Profile) → AutofillResult

// config:* - Configuration
'config:get' → () → Config
'config:set' → (config: Partial<Config>) → void

// api:* - Backend API calls
'api:syncProfile' → () → Profile
'api:syncTargets' → () → TargetUrl[]
```

---

### `config.ts`
**Role:** Configuration persistence  
**Responsibilities:**
- Load/save config (electron-store)
- Provide defaults
- Schema validation
- Type-safe config access

**Config Schema:**
```typescript
interface AppConfig {
  apiBaseUrl: string;
  apiToken?: string;
  startupTabs: string[];
  defaultProfile: ProfileData;
  autofillEnabled: boolean;
  debugMode: boolean;
}
```

**Storage Location:** `~/Library/Application Support/finbro-browser/config.json` (macOS)

---

### `api.ts` ⚠️ STUB MODULE
**Role:** Backend API client  
**Status:** Mock implementation  
**Responsibilities:**
- HTTP client setup (fetch/axios)
- Authentication headers
- Error handling/retry logic
- Response type mapping

**Integration Contract:**
```typescript
export interface ApiClient {
  fetchProfile(): Promise<ProfileData>;
  fetchTargets(): Promise<TargetUrl[]>;
  authenticate(token: string): Promise<boolean>;
}

// Current: Returns hardcoded data
// Future: Real HTTP calls to backend API
```

---

### `autofill.ts` ⚠️ STUB MODULE
**Role:** Form autofill engine  
**Status:** Demo implementation (hardcoded DV Trading)  
**Responsibilities:**
- Generate injection code
- Field detection logic
- Value mapping
- Execution orchestration

**Integration Contract:**
```typescript
export interface AutofillEngine {
  generateCode(profile: ProfileData, rules?: Rules): string;
  execute(tabId: TabId, profile: ProfileData): Promise<AutofillResult>;
}

interface AutofillResult {
  success: boolean;
  fieldsFilled: number;
  errors?: string[];
}
```

**Current Implementation:** Hardcoded selectors for DV Trading form  
**Future:** Intelligent field detection, rule-based mapping

---

## 🔄 Data Flow Examples

### Example 1: User Clicks "Autofill" Button

```
1. User clicks button (renderer/index.ts)
   ↓
2. window.Finbro.autofill.execute(profile) called
   ↓
3. Preload bridge forwards via IPC
   ↓
4. Main process receives 'autofill:execute' (ipc.ts)
   ↓
5. IPC handler calls autofill.execute()
   ↓
6. autofill.ts generates injection code
   ↓
7. tabs.executeInTab(activeTabId, code) runs JS in tab
   ↓
8. Tab's webContents.executeJavaScript() injects code
   ↓
9. Code fills form fields in target page
   ↓
10. Result returned up the chain to renderer
    ↓
11. UI updates status display
```

### Example 2: App Startup

```
1. main.ts → app.whenReady()
   ↓
2. windows.createMainWindow()
   ↓
3. config.loadConfig() reads stored settings
   ↓
4. For each url in config.startupTabs:
     tabs.createTab(url)
   ↓
5. tabs.switchTo(0) activates first tab
   ↓
6. Window loads renderer/index.html
   ↓
7. Renderer calls api:syncProfile
   ↓
8. Profile data loaded and cached
   ↓
9. App ready for user interaction
```

---

## 🧪 Testing Strategy

### Unit Tests (Future)
- Each module tested in isolation
- Mock IPC, config, tabs for API/autofill tests
- Jest or Vitest

### Integration Tests
- Full IPC round-trips
- Tab creation/switching
- Autofill execution
- Config persistence

### E2E Tests
- Spectron or Playwright for Electron
- Automated user flows
- Screenshot comparisons

---

## 🔧 Build & Compilation

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  }
}
```

### Build Process
```
1. tsc → Compile TypeScript to JavaScript (dist/)
2. electron-builder → Package into native binaries
3. Code signing (production)
4. DMG/EXE creation
```

---

## 📦 Distribution

### macOS (.app)
- Code signed with Apple Developer ID
- Notarized for Gatekeeper
- DMG installer

### Windows (.exe)
- Code signed with certificate
- NSIS installer
- Auto-update support

### Linux (.deb, .AppImage)
- Multiple formats for compatibility

---

## 🚀 Performance Considerations

### Memory
- Each BrowserView is a separate renderer process (~50-100MB)
- Limit concurrent tabs (suggest max 10)
- Destroy tabs when closed (not just hide)

### Startup Time
- Lazy-load tabs (create on-demand vs all at startup)
- Cache API responses
- Minimize synchronous operations in main thread

### Responsiveness
- All IPC handlers should be async
- Long operations → separate worker thread
- UI updates via status events

---

## 🔮 Future Enhancements

### Architectural Improvements
1. **Plugin System:** Load autofill rules dynamically
2. **Multi-Window:** Support multiple browser windows
3. **Session Management:** Save/restore tab states
4. **Offline Mode:** Cache profiles, work without API
5. **Logging:** Structured logs to file (winston/pino)
6. **Metrics:** Track autofill success rates, performance

### Security Enhancements
1. **CSP Headers:** Strict content security policy
2. **Certificate Pinning:** For API calls
3. **Encrypted Storage:** Protect tokens/sensitive config
4. **Audit Log:** Track all autofill operations

---

## 📚 References

- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [BrowserView API](https://www.electronjs.org/docs/latest/api/browser-view)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC Best Practices](https://www.electronjs.org/docs/latest/tutorial/ipc)

---

**End of Architecture Documentation**

