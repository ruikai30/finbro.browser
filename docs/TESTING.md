# Finbro Browser - Testing Guide

**Last Updated:** October 23, 2025

---

## 🧪 Manual Testing Checklist

### 1. Application Launch
- [ ] Run `npm run dev`
- [ ] App window opens without errors
- [ ] Console shows initialization messages
- [ ] Three tabs are created automatically

**Expected tabs:**
1. DV Trading job application form
2. Google.com
3. GitHub.com

---

### 2. Toolbar UI
- [ ] Toolbar displays with gradient background
- [ ] "Finbro Browser" title visible
- [ ] Three buttons present: Autofill, Sync Profile, Demo Search
- [ ] Status display shows "Ready"
- [ ] All buttons are clickable (not disabled)

---

### 3. Tab Management

#### Tab Creation
- [ ] All three startup tabs load successfully
- [ ] First tab (DV Trading) is visible by default
- [ ] No console errors during tab creation

#### Tab Switching
Manual test (via console):
```javascript
// Open DevTools: View → Toggle Developer Tools
// Switch to tab 1 (Google)
await window.Finbro.tabs.switch(1)

// Switch to tab 2 (GitHub)
await window.Finbro.tabs.switch(2)

// Switch back to tab 0 (DV Trading)
await window.Finbro.tabs.switch(0)
```

**Expected:** 
- Tab content switches correctly
- No flickering or layout issues
- Console logs tab switch events (in debug mode)

---

### 4. Configuration System

#### Test Config Loading
```javascript
// In DevTools console
const { config } = await window.Finbro.config.get()
console.log(config)
```

**Expected output:**
```javascript
{
  apiBaseUrl: "https://api.finbro.sg",
  startupTabs: [...],
  defaultProfile: {...},
  autofillEnabled: true,
  debugMode: false,
  toolbarHeight: 60,
  showStatusBar: true
}
```

#### Test Config Update
```javascript
await window.Finbro.config.set({ debugMode: true })
// Restart app and verify logs are more verbose
```

---

### 5. API Sync (Mock)

#### Sync Profile
1. Click "Sync Profile" button
2. Wait for ~300ms (simulated network delay)

**Expected:**
- Status changes to "Syncing profile..." (blue background)
- Status changes to "Profile loaded: john.doe@example.com" (green background)
- Status returns to "Ready" after 3 seconds
- Console shows profile data

#### Manual Sync
```javascript
const { profile } = await window.Finbro.api.syncProfile()
console.log(profile)
```

**Expected output:**
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+65 9123 4567",
  linkedin: "https://linkedin.com/in/johndoe"
}
```

---

### 6. Autofill Functionality

#### Test on DV Trading Form

**Prerequisites:**
1. Ensure tab 0 (DV Trading form) is active
2. Sync profile first (click "Sync Profile")

**Steps:**
1. Manually verify the form is loaded and visible
2. Click "Autofill" button
3. Watch the form fields

**Expected:**
- Status shows "Running autofill..." (blue)
- Form fields are filled with profile data:
  - First Name: John
  - Last Name: Doe
  - Email: john.doe@example.com
  - Phone: +65 9123 4567
- Status shows "Filled X fields!" (green)
- Console logs autofill result

**Fields that should be filled:**
```
✅ First Name (input[name="first_name"])
✅ Last Name (input[name="last_name"])
✅ Email (input[name="email"])
✅ Phone (input[name="phone"])
```

#### Manual Autofill Test
```javascript
// Ensure you're on the DV Trading tab
await window.Finbro.tabs.switch(0)

// Execute autofill
const profile = {
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: "+1234567890"
}

const result = await window.Finbro.autofill.execute(profile, 0)
console.log(result)
```

**Expected result:**
```javascript
{
  success: true,
  fieldsFilled: 4,  // or more
  errors: []
}
```

---

### 7. Demo Google Search

**Steps:**
1. Click "Demo Search" button
2. Wait for tab switch and execution

**Expected:**
- App switches to Google tab (tab 1)
- Google search input is filled with "hello"
- Status shows "Demo complete!" (green)
- Console logs demo result

**Note:** Form may not auto-submit (intentional for safety)

---

### 8. Window Resize

**Steps:**
1. Resize the application window (drag edges)
2. Make window smaller and larger
3. Switch between tabs

**Expected:**
- Tab content adjusts to fill available space
- Toolbar remains at top (60px height)
- No overflow or clipping issues
- All tabs resize correctly, not just active tab

---

### 9. Configuration Persistence

**Steps:**
1. Update config:
   ```javascript
   await window.Finbro.config.set({ debugMode: true })
   ```
2. Close the app (Cmd+Q or close window)
3. Relaunch the app (`npm run dev`)
4. Check config:
   ```javascript
   const { config } = await window.Finbro.config.get()
   console.log(config.debugMode) // Should be true
   ```

**Expected:**
- Config changes persist across restarts
- Config file located at: `~/Library/Application Support/finbro-browser/config.json` (macOS)

---

### 10. Error Handling

#### Test Network Error (API)
Currently returns mock data, but structure is ready for error handling.

#### Test Invalid Tab ID
```javascript
try {
  await window.Finbro.tabs.switch(999)
} catch (error) {
  console.error('Expected error:', error)
}
```

**Expected:** Error logged, app doesn't crash

#### Test Autofill Without Profile
```javascript
// Don't sync profile first
// Clear cached profile (restart app)
// Click Autofill button
```

**Expected:**
- Status shows error or auto-syncs profile
- App doesn't crash

---

### 11. Console Logs

#### Main Process Logs (Terminal)
When running `npm run dev`, check terminal for:
```
===========================================================
Finbro Browser - Starting
Version: 0.1.0
Electron: 28.x.x
Chrome: xxx.x.xxxx.xxx
Node: xxx.x.x
===========================================================
[Config] Storage path: /Users/.../finbro-browser/config.json
[Main] App ready, initializing...
[Main] Debug mode: false
[Main] API URL: https://api.finbro.sg
[Main] Startup tabs: 3
[IPC] Registering handlers...
[IPC] All handlers registered
[Windows] Creating main window...
[Windows] Creating startup tabs: 3
[Tabs] Manager initialized for window
[Tabs] Creating tab: https://job-boards...
[Windows] Main window created successfully
[Main] Initialization complete
```

#### Renderer Logs (DevTools)
Open DevTools (Cmd+Opt+I), check Console for:
```
[Preload] Loading preload script...
[Preload] API exposed to renderer as window.Finbro
[Renderer] Initializing...
[Renderer] Setting up event listeners...
[Renderer] Config loaded: {...}
[Renderer] Initialized successfully
[Renderer] Status: Ready
```

#### Tab Content Logs
Main process terminal shows tab events:
```
[Tabs] Tab 0 loaded: https://job-boards.greenhouse.io/...
[Tabs] Tab 1 loaded: https://google.com
[Tabs] Tab 2 loaded: https://github.com
```

---

### 12. Security Validation

#### Context Isolation
```javascript
// In DevTools console (renderer)
console.log(typeof require) // Should be "undefined"
console.log(typeof process) // Should be "undefined"
console.log(typeof window.Finbro) // Should be "object"
```

**Expected:**
- ✅ No direct access to Node.js APIs in renderer
- ✅ Only window.Finbro API is exposed
- ✅ Cannot call require() or access process

---

## 🚨 Known Issues & Workarounds

### Issue: Tabs not loading
**Symptom:** Blank tabs or loading errors  
**Workaround:** Check internet connection, ensure URLs are valid

### Issue: Autofill not working
**Symptom:** Fields not filled  
**Possible causes:**
- Profile not synced (click "Sync Profile" first)
- Wrong tab active (ensure DV Trading tab is visible)
- Form structure changed (selectors may need update)

### Issue: Window layout broken after resize
**Symptom:** Tabs don't fill window  
**Workaround:** Switch to another tab and back

---

## ✅ Acceptance Criteria

**The app passes testing if:**

1. ✅ Launches without errors
2. ✅ All three tabs open and load correctly
3. ✅ Profile sync retrieves mock data
4. ✅ Autofill fills at least 4 fields on DV Trading form
5. ✅ Demo search fills Google search box
6. ✅ Window resize works correctly
7. ✅ Config persists across restarts
8. ✅ No console errors (warnings are OK)
9. ✅ UI is responsive and buttons work
10. ✅ Security: No Node.js access in renderer

---

## 📊 Performance Benchmarks

**Target metrics:**
- App launch: < 3 seconds
- Tab creation: < 1 second per tab
- Autofill execution: < 500ms
- API sync (mock): < 500ms
- Window resize: < 100ms

**Memory usage:**
- Main process: ~50-100 MB
- Renderer process: ~50-80 MB
- Per tab (BrowserView): ~50-100 MB
- **Total:** ~250-350 MB for 3 tabs

---

## 🐛 Bug Reporting

If you find issues:

1. **Capture logs:**
   - Terminal output (main process)
   - DevTools console (renderer)
   - Tab console if relevant

2. **Note steps to reproduce:**
   - What button you clicked
   - What tab was active
   - What you expected vs. what happened

3. **Document in PROGRESS.md → Issues Log**

4. **Include environment:**
   - OS version
   - Node version
   - Electron version

---

## 🔧 Debugging Tips

### Enable Debug Mode
```javascript
await window.Finbro.config.set({ debugMode: true })
// Restart app
```

This enables:
- Verbose console logging
- DevTools auto-open
- Web security disabled in tabs (for testing)

### Inspect Tab Content
```javascript
// Get tabs manager (in main process)
// Add to ipc.ts:
ipcMain.handle('debug:openTabDevTools', (event, tabId) => {
  const tab = tabsManager.getTab(tabId)
  tab?.view.webContents.openDevTools()
})
```

### Check Config File
```bash
# macOS
cat ~/Library/Application\ Support/finbro-browser/config.json

# Windows
type %APPDATA%\finbro-browser\config.json

# Linux
cat ~/.config/finbro-browser/config.json
```

---

**End of Testing Guide**

