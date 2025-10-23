# Finbro Browser — Full Implementation Blueprint (Electron)

This document provides a **complete, context-free implementation plan** to build a downloadable desktop browser (“Finbro Browser”) using **Electron (Chromium + Node.js)**.  
It assumes no prior knowledge of our discussion.

---

## 🧭 Overview

### Objective
Create a **custom Chromium-based desktop browser** with these features:
- Opens multiple tabs (e.g. Finbro web app, Gmail, and user-specified forms)
- Includes an **Autofill** button to fill forms automatically using profile data
- Syncs profile data and form URLs from a backend API
- Runs locally (no cloud rendering)
- Fully brandable, distributable as `.app` / `.exe`

### Tech Stack
| Layer | Technology | Purpose |
|--------|-------------|----------|
| Browser Engine | Electron (Chromium + Node.js) | Provides web rendering |
| Language | TypeScript | Type-safe application logic |
| UI | HTML + CSS (optional React) | Toolbar and controls |
| Storage | JSON / Electron Store | Config and local data |
| Packaging | electron-builder | Build signed binaries |

---

## 🧩 Features Summary

| Category | Description |
|-----------|--------------|
| **Tabs** | Open multiple pages programmatically (Finbro dashboard, Gmail, forms) |
| **Autofill** | Inject JS that fills inputs using profile data |
| **Backend Integration** | Fetch `/profile` and `/targets` via REST API |
| **UI Toolbar** | Buttons: Autofill, Sync, Tabs |
| **Local Config** | Save API base URL, token, startup tabs |
| **Security** | Context isolation, sandboxed BrowserViews |
| **Packaging** | Builds for macOS, Windows, Linux |

---

## ⚙️ Folder Structure

```
finbro-browser/
  package.json
  tsconfig.json
  electron-builder.yml
  build/
    icon.icns
    icon.ico
  src/
    main/
      main.ts
      windows.ts
      tabs.ts
      ipc.ts
      config.ts
    preload/
      preload.ts
    renderer/
      index.html
      index.ts
      styles.css
    autofill/
      autofill.ts
      rules/example.json
  scripts/
    dev.mjs
```

---

## 🧱 Setup Steps

### 1️⃣ Install dependencies
```bash
npm init -y
npm install electron electron-builder electron-store dotenv
npm install --save-dev typescript ts-node @types/node @types/electron
npx tsc --init
```

### 2️⃣ Configure package.json
```json
{
  "name": "finbro-browser",
  "version": "0.1.0",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "ts-node src/main/main.ts",
    "build": "tsc && electron-builder -mwl"
  }
}
```

### 3️⃣ Electron builder config (electron-builder.yml)
```yaml
appId: com.finbro.browser
productName: Finbro Browser
files:
  - dist/**
  - build/**
mac:
  category: public.app-category.productivity
  icon: build/icon.icns
win:
  icon: build/icon.ico
artifactName: ${productName}-${version}-${os}-${arch}.${ext}
```

---

## 🔩 Core Source Files

### src/main/main.ts
```ts
import { app } from 'electron';
import { createMainWindow } from './windows';
import './ipc';

app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

---

### src/main/windows.ts
```ts
import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { getTabsManager } from './tabs';
import { loadConfig } from './config';

let mainWindow: BrowserWindow | null = null;
const TOOLBAR_HEIGHT = 60;

export async function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(width, 1400),
    height: Math.min(height, 900),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'Finbro Browser'
  });

  await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  const cfg = await loadConfig();
  const tm = getTabsManager(mainWindow);

  for (const url of cfg.startupTabs) await tm.createTab(url);
  tm.switchTo(0);
  mainWindow.on('resize', () => tm.layoutAll(TOOLBAR_HEIGHT));
}
```

---

### src/main/tabs.ts
```ts
import { BrowserWindow, BrowserView } from 'electron';

export function getTabsManager(win: BrowserWindow) {
  const tabs: any[] = [];

  function layoutAll(toolbarHeight: number) {
    const [w, h] = win.getContentSize();
    for (const t of tabs) t.view.setBounds({ x: 0, y: toolbarHeight, width: w, height: h - toolbarHeight });
  }

  async function createTab(url: string) {
    const view = new BrowserView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    win.addBrowserView(view);
    const id = tabs.length;
    tabs.push({ id, view, url });
    await view.webContents.loadURL(url);
    layoutAll(60);
    return id;
  }

  function switchTo(id: number) {
    const t = tabs.find(t => t.id === id);
    if (!t) return;
    win.setTopBrowserView(t.view);
    layoutAll(60);
  }

  async function executeInTab(id: number, code: string) {
    const t = tabs.find(t => t.id === id);
    if (!t) throw new Error('Tab not found');
    return t.view.webContents.executeJavaScript(code, true);
  }

  return { createTab, switchTo, executeInTab, layoutAll };
}
```

---

### src/preload/preload.ts
```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Finbro', {
  tabs: {
    create: (url: string) => ipcRenderer.invoke('tabs:create', url),
    switch: (id: number) => ipcRenderer.invoke('tabs:switch', id)
  },
  autofill: {
    current: (profile: any) => ipcRenderer.invoke('tabs:autofillCurrent', profile)
  }
});
```

---

### src/renderer/index.html
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Finbro Browser</title>
  <link rel="stylesheet" href="./styles.css"/>
</head>
<body>
  <header class="toolbar">
    <button id="btn-autofill">Autofill</button>
    <button id="btn-sync">Sync</button>
    <span id="status">Idle</span>
  </header>
  <script type="module" src="./index.js"></script>
</body>
</html>
```

---

### src/renderer/index.ts
```ts
declare global { interface Window { Finbro: any; } }

const btnAutofill = document.getElementById('btn-autofill')!;
const btnSync = document.getElementById('btn-sync')!;
const status = document.getElementById('status')!;
let profile: any = null;

async function loadProfile() {
  const res = await fetch('https://api.finbro.sg/profile');
  profile = await res.json();
  status.textContent = 'Profile synced';
}

btnSync.addEventListener('click', loadProfile);

btnAutofill.addEventListener('click', async () => {
  if (!profile) await loadProfile();
  status.textContent = 'Running autofill...';
  const result = await window.Finbro.autofill.current(profile);
  status.textContent = 'Autofill complete: ' + JSON.stringify(result);
});
```

---

### src/autofill/autofill.ts
```ts
export function runtimeAutofill(profile: any) {
  function setValue(el: any, v: string) {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const fields = [
    { key: 'email', hints: ['email','login'] },
    { key: 'name', hints: ['name','fullname'] },
    { key: 'phone', hints: ['phone','tel'] }
  ];

  const inputs = Array.from(document.querySelectorAll('input, textarea')) as any[];
  let filled = 0;
  for (const el of inputs) {
    const nm = (el.name || el.id || '').toLowerCase();
    for (const f of fields) {
      if (f.hints.some(h => nm.includes(h))) {
        const v = profile[f.key];
        if (v) { setValue(el, v); filled++; }
      }
    }
  }
  return { filled };
}
```

---

## 🧠 Running the App

### Development
```bash
npm run dev
```
Electron opens `Finbro Browser` with default tabs.

### Build Production Binary
```bash
npm run build
```
Generates installers (`.app`, `.exe`, `.deb`) inside `dist/`.

---

## ✅ MVP Acceptance Criteria
- App opens configured tabs (Finbro web app, Gmail, form pages)
- “Sync” fetches profile data successfully
- “Autofill” fills basic form fields (name/email/phone) on majority of sites
- Works on macOS and Windows
- No unhandled crashes

---

## 🚀 Next Steps (Optional Upgrades)
- Add per-site rules JSON for more precise autofill.
- Add “Autofill All Tabs” command.
- Persist cookies across sessions (`userData` dir).
- Integrate auto-update via `electron-updater`.
- Create branded installer and icon.

---

## ⚖️ Summary

**Electron** gives you full Chromium capabilities with simple Node-based code.  
With this plan, you can build, brand, and distribute a working browser in **3–4 weeks**.  
No C++ compilation, no Chromium source required — just JavaScript, HTML, and TypeScript.

---

**End of Document**  
© Finbro Browser Implementation Guide 2025