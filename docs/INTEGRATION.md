# Finbro Browser - Integration Guide

**For:** Backend API Team & Autofill Logic Team  
**Last Updated:** October 23, 2025

---

## 🎯 Purpose

This document provides **clear integration contracts** for external teams to plug their implementations into the Finbro Browser skeleton. All stub modules are designed to be **drop-in replaceable** without touching the core architecture.

---

## 🔌 Integration Points Overview

| Module | Location | Status | Owner |
|--------|----------|--------|-------|
| API Client | `src/main/api.ts` | STUB | Backend API Team |
| Autofill Engine | `src/main/autofill.ts` | DEMO | Autofill Logic Team |
| Config Schema | `src/types/config.types.ts` | STABLE | Shared |

---

## 📡 API Client Integration

### File: `src/main/api.ts`

### Current Implementation (STUB)
```typescript
export async function fetchProfile(): Promise<ProfileData> {
  // TODO: Replace with real API call
  return {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+65 9123 4567",
    linkedin: "https://linkedin.com/in/johndoe"
  };
}

export async function fetchTargets(): Promise<TargetUrl[]> {
  // TODO: Replace with real API call
  return [
    {
      url: "https://job-boards.greenhouse.io/dvtrading/jobs/4592920005",
      label: "DV Trading Application",
      enabled: true
    }
  ];
}
```

---

### Integration Contract

#### Required Functions

##### `fetchProfile()`
**Purpose:** Retrieve user profile data from backend API

**Signature:**
```typescript
export async function fetchProfile(): Promise<ProfileData>
```

**Returns:**
```typescript
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  // Add additional fields as needed
  [key: string]: any;
}
```

**Implementation Requirements:**
- Use stored API token from config (`config.get('apiToken')`)
- Handle authentication errors gracefully
- Return typed `ProfileData` object
- Throw descriptive errors on failure

**Example Implementation:**
```typescript
import { getConfig } from './config';

export async function fetchProfile(): Promise<ProfileData> {
  const config = await getConfig();
  
  const response = await fetch(`${config.apiBaseUrl}/profile`, {
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Map API response to ProfileData interface
  return {
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    linkedin: data.linkedin_url
  };
}
```

---

##### `fetchTargets()`
**Purpose:** Retrieve list of target URLs/forms to open

**Signature:**
```typescript
export async function fetchTargets(): Promise<TargetUrl[]>
```

**Returns:**
```typescript
interface TargetUrl {
  url: string;          // Full URL to open
  label: string;        // Display name
  enabled: boolean;     // Whether to auto-open on startup
  rules?: AutofillRules; // Optional: site-specific autofill rules
}
```

**Example Implementation:**
```typescript
export async function fetchTargets(): Promise<TargetUrl[]> {
  const config = await getConfig();
  
  const response = await fetch(`${config.apiBaseUrl}/targets`, {
    headers: {
      'Authorization': `Bearer ${config.apiToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch targets: ${response.status}`);
  }
  
  const data = await response.json();
  return data.targets; // Assume API returns { targets: [...] }
}
```

---

##### `authenticateUser()` (Optional)
**Purpose:** Authenticate user and obtain API token

**Signature:**
```typescript
export async function authenticateUser(
  username: string, 
  password: string
): Promise<AuthResult>
```

**Returns:**
```typescript
interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}
```

---

### Error Handling

**All API functions should:**
1. Throw descriptive errors (don't swallow exceptions)
2. Include HTTP status codes in error messages
3. Handle network timeouts
4. Handle rate limiting

**Example Error Handling:**
```typescript
try {
  const profile = await fetchProfile();
  return profile;
} catch (error) {
  if (error instanceof Error) {
    console.error('[API] fetchProfile failed:', error.message);
    // Main process will handle and show error to user
  }
  throw error; // Re-throw for upstream handling
}
```

---

### Configuration Access

**API functions can access config:**
```typescript
import { getConfig, setConfig } from './config';

// Read config
const config = await getConfig();
const apiUrl = config.apiBaseUrl;
const token = config.apiToken;

// Update config (e.g., save new token)
await setConfig({ apiToken: 'new-token-here' });
```

---

## 🤖 Autofill Engine Integration

### File: `src/main/autofill.ts`

### Current Implementation (DEMO)
```typescript
import { TabsManager } from './tabs';
import { ProfileData } from '../types/api.types';

export async function executeAutofill(
  tabsManager: TabsManager,
  tabId: number,
  profile: ProfileData
): Promise<AutofillResult> {
  // DEMO: Hardcoded for DV Trading form
  const code = `
    (function() {
      const results = { filled: 0, errors: [] };
      
      try {
        // First Name
        const firstName = document.querySelector('input[name="first_name"]');
        if (firstName) {
          firstName.value = '${profile.firstName}';
          firstName.dispatchEvent(new Event('input', { bubbles: true }));
          results.filled++;
        }
        
        // Last Name
        const lastName = document.querySelector('input[name="last_name"]');
        if (lastName) {
          lastName.value = '${profile.lastName}';
          lastName.dispatchEvent(new Event('input', { bubbles: true }));
          results.filled++;
        }
        
        // Email
        const email = document.querySelector('input[name="email"]');
        if (email) {
          email.value = '${profile.email}';
          email.dispatchEvent(new Event('input', { bubbles: true }));
          results.filled++;
        }
        
        // Phone
        const phone = document.querySelector('input[name="phone"]');
        if (phone) {
          phone.value = '${profile.phone}';
          phone.dispatchEvent(new Event('input', { bubbles: true }));
          results.filled++;
        }
        
      } catch (err) {
        results.errors.push(err.message);
      }
      
      return results;
    })();
  `;
  
  try {
    const result = await tabsManager.executeInTab(tabId, code);
    return {
      success: result.filled > 0,
      fieldsFilled: result.filled,
      errors: result.errors
    };
  } catch (error) {
    return {
      success: false,
      fieldsFilled: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
```

---

### Integration Contract

#### Required Function

##### `executeAutofill()`
**Purpose:** Fill form fields on the active tab using profile data

**Signature:**
```typescript
export async function executeAutofill(
  tabsManager: TabsManager,
  tabId: number,
  profile: ProfileData,
  rules?: AutofillRules
): Promise<AutofillResult>
```

**Parameters:**
- `tabsManager`: Manager instance (provides `executeInTab()` method)
- `tabId`: ID of the tab to autofill
- `profile`: User profile data to inject
- `rules`: Optional site-specific autofill rules

**Returns:**
```typescript
interface AutofillResult {
  success: boolean;      // Overall success
  fieldsFilled: number;  // Count of fields filled
  errors?: string[];     // List of errors encountered
}
```

---

### Implementation Strategy

#### Option 1: Rule-Based Engine
```typescript
interface AutofillRules {
  selectors: {
    [fieldName: string]: string; // e.g., { "firstName": "input[name='first_name']" }
  };
  fieldMapping: {
    [fieldName: string]: string; // e.g., { "firstName": "profile.firstName" }
  };
}

export async function executeAutofill(
  tabsManager: TabsManager,
  tabId: number,
  profile: ProfileData,
  rules?: AutofillRules
): Promise<AutofillResult> {
  
  // 1. Load rules (from parameter or detect site)
  const activeRules = rules || await detectSiteRules(tabsManager, tabId);
  
  // 2. Generate injection code based on rules
  const code = generateInjectionCode(profile, activeRules);
  
  // 3. Execute in tab
  const result = await tabsManager.executeInTab(tabId, code);
  
  return result;
}
```

#### Option 2: AI/ML-Based Detection
```typescript
export async function executeAutofill(
  tabsManager: TabsManager,
  tabId: number,
  profile: ProfileData
): Promise<AutofillResult> {
  
  // 1. Extract page structure
  const pageAnalysis = await tabsManager.executeInTab(tabId, `
    (function() {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs.map(el => ({
        tag: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        label: el.labels?.[0]?.textContent
      }));
    })()
  `);
  
  // 2. Use ML model to map fields to profile data
  const fieldMapping = await mlModel.predictFieldMapping(pageAnalysis, profile);
  
  // 3. Generate and execute injection code
  const code = generateSmartInjectionCode(fieldMapping);
  const result = await tabsManager.executeInTab(tabId, code);
  
  return result;
}
```

---

### Code Injection Best Practices

#### 1. **Escape User Data**
```typescript
function escapeForInjection(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// Use in injection:
const code = `
  element.value = '${escapeForInjection(profile.firstName)}';
`;
```

#### 2. **Trigger Framework Events**
```typescript
// For React/Vue/Angular forms:
element.value = 'new value';
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
element.dispatchEvent(new Event('blur', { bubbles: true }));
```

#### 3. **Error Handling in Injection**
```typescript
const code = `
  (function() {
    const results = { filled: 0, errors: [] };
    
    try {
      // Autofill logic
    } catch (err) {
      results.errors.push(err.message);
    }
    
    return results; // MUST return serializable data
  })();
`;
```

#### 4. **Avoid Side Effects**
- Don't submit forms automatically (unless explicitly requested)
- Don't click buttons
- Don't navigate away from page
- Only fill fields, don't modify page structure

---

### Accessing Tab Context

**TabsManager provides:**
```typescript
interface TabsManager {
  executeInTab(tabId: number, code: string): Promise<any>;
  getCurrentTabId(): number;
  getTabUrl(tabId: number): string;
}
```

**Get current page URL:**
```typescript
const url = tabsManager.getTabUrl(tabId);
const hostname = new URL(url).hostname;

// Load site-specific rules based on hostname
const rules = await loadRulesForSite(hostname);
```

---

### Testing Your Integration

**Test Cases:**
1. **Basic fields:** name, email, phone
2. **Complex fields:** dropdowns, date pickers, file uploads
3. **Framework forms:** React, Vue, Angular
4. **Dynamic fields:** AJAX-loaded, conditionally shown
5. **Error cases:** missing fields, read-only fields, validation

**Debugging:**
```typescript
// Add logging in injection code
const code = `
  console.log('[Autofill] Starting...');
  // ... your code ...
  console.log('[Autofill] Filled:', results.filled, 'fields');
  return results;
`;

// Main process can see these logs via:
tabsManager.getTabWebContents(tabId).on('console-message', (event, level, message) => {
  console.log(`[Tab ${tabId}]:`, message);
});
```

---

## 🔄 Data Flow: API → Autofill

```
1. User clicks "Sync Profile"
   ↓
2. Renderer → IPC 'api:syncProfile'
   ↓
3. Main calls api.fetchProfile()
   ↓ [YOUR CODE HERE]
4. HTTP request to backend API
   ↓
5. Profile data returned
   ↓
6. Cached in main process
   ↓
7. Returned to renderer for display

---

8. User clicks "Autofill"
   ↓
9. Renderer → IPC 'autofill:execute'
   ↓
10. Main calls autofill.executeAutofill(tabId, profile)
    ↓ [YOUR CODE HERE]
11. Generate injection code
    ↓
12. tabsManager.executeInTab(code)
    ↓
13. JS runs in tab context, fills fields
    ↓
14. Result returned to renderer
    ↓
15. Status display updated
```

---

## 🛠️ Development Setup for Integration

### 1. Clone and Setup
```bash
git clone <repo>
cd finbro.browser
npm install
```

### 2. Replace Stub Modules
- Copy your `api.ts` → `src/main/api.ts`
- Copy your `autofill.ts` → `src/main/autofill.ts`

### 3. Test in Dev Mode
```bash
npm run dev
```

### 4. Check Integration
- App launches without errors
- API calls succeed (check console)
- Autofill works on test sites

---

## ⚠️ Important Notes

### Do NOT modify:
- `src/main/main.ts`
- `src/main/windows.ts`
- `src/main/tabs.ts`
- `src/main/ipc.ts`
- `src/preload/preload.ts`

### Safe to modify:
- `src/main/api.ts` (your code)
- `src/main/autofill.ts` (your code)
- `src/types/api.types.ts` (extend types as needed)
- Config schema (coordinate with team)

### If you need to change interfaces:
1. Update `src/types/*.ts` first
2. Notify core team
3. Test all affected modules

---

## 📞 Support

**Questions?**
- Check `docs/ARCHITECTURE.md` for design details
- Review `PROGRESS.md` for current status
- Check example code in stub files

**Found issues?**
- Document in `PROGRESS.md` → Issues Log
- Provide error messages, stack traces
- Include reproduction steps

---

## ✅ Integration Checklist

### API Team
- [ ] Implement `fetchProfile()`
- [ ] Implement `fetchTargets()`
- [ ] Add authentication logic
- [ ] Handle errors gracefully
- [ ] Test with real backend
- [ ] Document any new config fields needed

### Autofill Team
- [ ] Implement `executeAutofill()`
- [ ] Test on 5+ different sites
- [ ] Handle dynamic content
- [ ] Add error recovery
- [ ] Document supported field types
- [ ] Provide example rules JSON

---

**End of Integration Guide**

