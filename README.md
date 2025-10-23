# Finbro Browser

A custom Chromium-based desktop browser built with Electron, featuring Chrome-style tabs and intelligent autofill capabilities.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

---

## ✨ Features

### Chrome-Style Tab Bar
- **Visual tabs** at the top (not just navigation)
- **Click to switch** between open pages
- **Close button** (✕) on hover
- **New tab button** (+) to open any website
- **Active tab highlighting** with Finbro brand colors

### Default Tabs
1. **finbro.me** - Finbro homepage
2. **Gmail** - Email access
3. **DV Trading** - Job application form (demo autofill target)

### Autofill System
- **One-click autofill** for form fields
- **Demo implementation** for DV Trading Greenhouse forms
- **Framework-compatible** (works with React, Vue, Angular)
- **Extensible architecture** for adding more sites

### Brand Integration
- **Finbro purple** (#290E99) primary color
- **Professional UI** with grey/light-grey accents
- **Clean, modern design** following Chrome patterns

---

## 🏗️ Architecture

### Tech Stack
- **Electron 28.3.3** - Chromium + Node.js
- **TypeScript 5.3.3** - Type-safe development
- **electron-store** - Config persistence
- **BrowserViews** - Secure tab implementation

### Project Structure
```
finbro.browser/
├── src/
│   ├── main/          # Main process (Node.js context)
│   ├── preload/       # Security bridge
│   ├── renderer/      # Toolbar UI (browser context)
│   └── types/         # Shared TypeScript types
├── docs/              # Technical documentation
└── dist/              # Compiled output (generated)
```

---

## 🔌 Integration Points

### API Integration (`src/main/api.ts`)
Currently returns mock data. Replace with real backend calls:
- `fetchProfile()` - Get user profile data
- `fetchTargets()` - Get list of target URLs
- `authenticateUser()` - User authentication

### Autofill Engine (`src/main/autofill.ts`)
Currently hardcoded for DV Trading. Extend with:
- Smart field detection
- Rule-based matching
- Site-specific configurations
- ML-based field identification

See `docs/INTEGRATION.md` for detailed integration guide.

---

## 📚 Documentation

- **QUICKSTART.md** - Get running in 1 minute
- **PROGRESS.md** - Development history & decisions
- **docs/ARCHITECTURE.md** - System design deep dive
- **docs/INTEGRATION.md** - How to integrate your code
- **docs/DEVELOPMENT.md** - Dev setup & troubleshooting
- **docs/TESTING.md** - Testing guide

---

## 🎨 Finbro Brand Colors

```css
--finbro-purple: #290E99     /* Primary brand color */
--finbro-grey: #848484       /* Secondary elements */
--finbro-light-grey: #D8D8D8 /* Backgrounds */
--finbro-black: #000000      /* Text */
--finbro-white: #FFFFFF      /* Active states */
```

---

## 🛠️ Commands

```bash
# Development
npm run dev          # Launch app
npm run build        # Compile TypeScript
npm run clean        # Remove build files

# Production (future)
npm run package      # Create distributable
npm run dist         # Create installers
```

---

## 🔐 Security

- **Context isolation** enabled
- **Node integration** disabled in renderer
- **Sandboxed BrowserViews** for tabs
- **IPC-based** communication only
- **Content Security Policy** enforced

---

## 📊 Status

**Current Version:** 0.1.0 (MVP Complete)

**Working:**
- ✅ Chrome-style tabs
- ✅ Multi-tab management
- ✅ Demo autofill
- ✅ Mock API integration
- ✅ Finbro brand styling
- ✅ Config persistence

**Ready For:**
- 🔌 Real API integration
- 🤖 Advanced autofill logic
- 📦 Production builds

---

## 🚀 Next Steps

1. Integrate real backend API
2. Implement advanced autofill detection
3. Test on more form sites
4. Add error handling & retry logic
5. Build & sign for distribution

---

## 📝 License

MIT

---

**Built with Electron • Styled with Finbro • Ready for Integration**
