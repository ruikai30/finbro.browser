# Finbro Browser - Development Guide

**Last Updated:** October 23, 2025

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Package for distribution
npm run package
```

---

## 📋 Prerequisites

- **Node.js:** v18+ (LTS recommended)
- **npm:** v9+
- **OS:** macOS, Windows, or Linux
- **IDE:** VS Code (recommended)

---

## 🛠️ Development Workflow

### 1. **Start Dev Server**
```bash
npm run dev
```
This will:
- Compile TypeScript in watch mode
- Launch Electron with hot reload
- Open DevTools automatically

### 2. **Make Changes**
- Edit files in `src/`
- Save → auto-recompile
- Refresh or restart Electron to see changes

### 3. **Check for Errors**
```bash
# TypeScript compilation
npm run build

# Linting (if configured)
npm run lint
```

---

## 🏗️ Project Structure

```
finbro.browser/
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # System design
│   ├── INTEGRATION.md        # Integration guide
│   └── DEVELOPMENT.md        # This file
├── src/
│   ├── main/                 # Main process (Node.js)
│   │   ├── main.ts          # App entry point
│   │   ├── windows.ts       # Window management
│   │   ├── tabs.ts          # Tab/BrowserView manager
│   │   ├── ipc.ts           # IPC handlers
│   │   ├── config.ts        # Config persistence
│   │   ├── api.ts           # API client (STUB)
│   │   └── autofill.ts      # Autofill engine (STUB)
│   ├── preload/
│   │   └── preload.ts       # Secure IPC bridge
│   ├── renderer/
│   │   ├── index.html       # Toolbar UI
│   │   ├── index.ts         # UI logic
│   │   └── styles.css       # Styling
│   └── types/               # Shared TypeScript types
│       ├── api.types.ts
│       ├── config.types.ts
│       └── ipc.types.ts
├── build/                    # Build assets (icons)
├── dist/                     # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── .gitignore
├── README.md
└── PROGRESS.md
```

---

## 🐛 Debugging

### Main Process
```typescript
// Add debug logs
console.log('[Main]', 'Debug info:', data);

// In terminal when running npm run dev:
// All console.log from main process appear here
```

### Renderer Process
```typescript
// Add debug logs
console.log('[Renderer]', 'Debug info:', data);

// In Electron DevTools Console:
// Right-click → Inspect Element → Console tab
```

### Tab Content (BrowserViews)
```typescript
// Listen to console messages from tabs
tabView.webContents.on('console-message', (event, level, message) => {
  console.log(`[Tab]:`, message);
});

// Or manually inspect:
// tabView.webContents.openDevTools();
```

---

## 🔧 Common Issues

### Issue: "Cannot find module"
**Cause:** Missing dependency  
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors
**Cause:** Type mismatches  
**Fix:**
- Check `src/types/*.ts` for interface definitions
- Ensure imports are correct
- Run `npm run build` to see all errors

### Issue: Electron doesn't start
**Cause:** Build artifacts missing  
**Fix:**
```bash
npm run build
npm run dev
```

### Issue: Changes not reflected
**Cause:** Need to rebuild  
**Fix:**
- Save file
- Wait for TypeScript compilation
- Restart Electron (Ctrl+C, then `npm run dev`)

### Issue: IPC not working
**Cause:** Preload script not loaded or context isolation issue  
**Fix:**
- Check `webPreferences.preload` path in `windows.ts`
- Ensure `contextBridge.exposeInMainWorld` in `preload.ts`
- Verify IPC channel names match

---

## 📦 Building for Production

### Compile TypeScript
```bash
npm run build
```

### Package Application
```bash
npm run package
```

This creates:
- **macOS:** `dist/Finbro Browser.app`
- **Windows:** `dist/Finbro Browser.exe`
- **Linux:** `dist/finbro-browser`

### Distribution Files
```bash
npm run dist
```

Creates installer packages:
- **macOS:** `.dmg` file
- **Windows:** `.exe` installer
- **Linux:** `.deb`, `.AppImage`

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] App launches without errors
- [ ] All tabs open correctly
- [ ] Tab switching works
- [ ] Window resize adjusts tab bounds
- [ ] Buttons respond to clicks
- [ ] Autofill executes on target tab
- [ ] Status messages display correctly
- [ ] Config persists across restarts

### Test Sites
- DV Trading form (primary)
- Google.com (search test)
- GitHub.com (generic test)

---

## 📝 Code Style

### TypeScript
- Use `async/await` over Promises
- Prefer `interface` over `type` for object shapes
- Strong types (avoid `any`)
- Descriptive variable names

### Naming Conventions
- **Files:** kebab-case (`tab-manager.ts`)
- **Classes:** PascalCase (`TabsManager`)
- **Functions:** camelCase (`createTab`)
- **Constants:** UPPER_SNAKE_CASE (`TOOLBAR_HEIGHT`)

### Comments
```typescript
/**
 * Creates a new browser tab
 * @param url - URL to load
 * @returns Tab ID
 */
async function createTab(url: string): Promise<number> {
  // Implementation
}
```

---

## 🔐 Security Checklist

When modifying code, ensure:
- [ ] `contextIsolation: true` in all BrowserWindows
- [ ] `nodeIntegration: false` in renderer
- [ ] `sandbox: true` for BrowserViews
- [ ] All IPC channels validated
- [ ] No `eval()` or unsafe code execution
- [ ] User input sanitized before injection

---

## 🚀 Performance Tips

### Optimize Startup
- Lazy-load tabs (don't create all at once)
- Cache API responses
- Minimize synchronous operations

### Memory Management
- Close unused tabs (destroy BrowserViews)
- Limit concurrent tabs
- Clear caches periodically

### Responsiveness
- All IPC handlers should be async
- Show loading states
- Don't block main thread

---

## 📚 Resources

### Electron Docs
- [Electron API](https://www.electronjs.org/docs/latest/api/app)
- [BrowserView](https://www.electronjs.org/docs/latest/api/browser-view)
- [IPC](https://www.electronjs.org/docs/latest/api/ipc-main)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TS Config Reference](https://www.typescriptlang.org/tsconfig)

### Project Docs
- `docs/ARCHITECTURE.md` - System design
- `docs/INTEGRATION.md` - Integration guide
- `PROGRESS.md` - Development progress

---

## ✅ Pre-Commit Checklist

Before committing code:
- [ ] TypeScript compiles without errors
- [ ] App runs in dev mode
- [ ] No console errors
- [ ] Changes documented in PROGRESS.md
- [ ] Code follows style guide
- [ ] No hardcoded secrets/tokens

---

**End of Development Guide**

