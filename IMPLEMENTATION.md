# Finbro Browser – Authentication & WebSocket Integration

## Goal
Integrate Electron browser with finbro.me web app via JWT auth + persistent WebSocket for CDP automation.

## Architecture
- **One Electron instance per user**
- **One persistent WebSocket per instance** 
- **Web app handles auth** (JWT) → Electron connects to automation server
- **Server routes jobs** via WebSocket → Electron executes CDP commands

---

## Implementation Phases

### Phase 1: Electron Detection ✅
- [x] Inject `window.__FINBRO_ENV__ = { isElectron: true }` into BrowserView tabs
- [x] Load `https://finbro.me` as startup tab (already configured)
- [x] Verify web app can detect Electron environment (frontend repo)

### Phase 2: JWT Bridge (IPC) ✅
- [x] Add `window.finbro.sendAuthToken(jwt)` to preload API
- [x] **FIX: Add preload script to BrowserView tabs** (was missing!)
- [x] Create IPC handler to receive JWT from renderer
- [x] Store JWT in main process (in-memory for now)
- [x] Handle logout: `sendAuthToken(null)` clears JWT
- [x] Create WebSocket client stub (logs only, ready for Phase 3)

### Phase 3: WebSocket Registration ✅
- [x] Implement real WebSocket connection to automation server
- [x] Send `{ type: "register", token: "<JWT>" }` on connect
- [x] Handle WS connection lifecycle (open, close, error)
- [x] Close WS on logout
- [x] Add reconnection logic (5 second retry)
- [x] Handle server messages (registered, job, pong, error)

### Phase 4: Backend Routing
- [ ] _(No Electron changes – backend implements /trigger_action API)_

### Phase 5: Job Execution Router
- [ ] Listen for `{ type: "job", job_id, action, params }` from WS
- [ ] Route jobs based on `action` type
- [ ] Implement basic action: `open_tab`
- [ ] Send `{ type: "job_result", job_id, status, data }` back

### Phase 6: CDP Command Execution
- [ ] Implement `screenshot` action
- [ ] Implement `scroll` action  
- [ ] Implement `fill` action (form autofill)
- [ ] Handle multi-tab parallel execution
- [ ] Error handling for failed jobs

### Phase 7: Reliability & Polish
- [ ] WebSocket reconnection logic
- [ ] Heartbeat/ping-pong keep-alive
- [ ] Job timeout handling
- [ ] Connection status UI feedback
- [ ] Analytics/logging

---

## Key Files to Modify

- `src/main/main.ts` – App initialization, WS client
- `src/main/windows.ts` – Inject Electron detection flag
- `src/preload/preload.ts` – Expose JWT bridge API
- `src/main/ipc.ts` – Handle auth IPC channels
- `src/types/` – Auth & WS message types
- `package.json` – Environment variables, dependencies

---

## Design Principles

✅ One WS per user (multiplexed for all tabs)  
✅ JWT verified only by backend  
✅ Web app feature-gates automation via `isElectron` flag  
✅ Multi-tab support via `tab_id` in job params  
✅ Screenshots work on hidden tabs (CDP)  
✅ Future: multi-device support via `browser_id`
