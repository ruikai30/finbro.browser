/**
 * Autofill Engine (DEMO)
 * 
 * This is a DEMO implementation hardcoded for the DV Trading form.
 * 
 * INTEGRATION POINT:
 * Replace with your sophisticated autofill logic.
 * Keep the function signature as-is.
 * 
 * See docs/INTEGRATION.md for detailed integration guide.
 */

import { ProfileData, AutofillResult } from '../types/api.types';

/**
 * Execute autofill on the specified tab
 * 
 * CURRENT IMPLEMENTATION:
 * - Hardcoded selectors for DV Trading job application form
 * - Simple field filling with event dispatching
 * 
 * TODO: Replace with intelligent field detection and rule-based engine
 * 
 * @param tabId - ID of the tab to autofill (not used in current impl, passed to executeInTab)
 * @param profile - User profile data to inject
 * @param executeInTab - Function to execute code in tab context
 * @returns Result with count of fields filled
 */
export async function executeAutofill(
  tabId: number,
  profile: ProfileData,
  executeInTab: (tabId: number, code: string) => Promise<any>
): Promise<AutofillResult> {
  
  console.log('[Autofill] Starting autofill on tab', tabId);
  console.log('[Autofill] Profile:', profile);
  
  // Generate injection code
  // This code will run in the target page's context
  const injectionCode = generateInjectionCode(profile);
  
  try {
    // Execute code in tab
    const result = await executeInTab(tabId, injectionCode);
    
    console.log('[Autofill] Result:', result);
    
    return {
      success: result.filled > 0,
      fieldsFilled: result.filled,
      errors: result.errors
    };
  } catch (error) {
    console.error('[Autofill] Execution failed:', error);
    
    return {
      success: false,
      fieldsFilled: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Generate JavaScript code to inject into the page
 * 
 * CURRENT IMPLEMENTATION:
 * Hardcoded for DV Trading Greenhouse form fields:
 * - first_name
 * - last_name  
 * - email
 * - phone
 * 
 * TODO: Replace with dynamic field detection
 */
function generateInjectionCode(profile: ProfileData): string {
  // Escape values to prevent injection attacks
  const firstName = escapeForInjection(profile.firstName || '');
  const lastName = escapeForInjection(profile.lastName || '');
  const email = escapeForInjection(profile.email || '');
  const phone = escapeForInjection(profile.phone || '');
  const linkedin = escapeForInjection(profile.linkedin || '');
  
  // IIFE (Immediately Invoked Function Expression) to avoid polluting global scope
  return `
    (function() {
      const results = { filled: 0, errors: [] };
      
      /**
       * Helper: Set value and trigger events (works with React/Vue/Angular)
       */
      function setValue(element, value) {
        if (!element) return false;
        
        try {
          // Set value
          element.value = value;
          
          // Trigger events for framework compatibility
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true }));
          
          // Also trigger native events
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;
          nativeInputValueSetter.call(element, value);
          
          return true;
        } catch (err) {
          results.errors.push('setValue error: ' + err.message);
          return false;
        }
      }
      
      /**
       * Find and fill field by name attribute
       */
      function fillByName(name, value) {
        const el = document.querySelector('input[name="' + name + '"]');
        if (el && value) {
          if (setValue(el, value)) {
            results.filled++;
            console.log('[Autofill] Filled:', name);
          }
        }
      }
      
      /**
       * Main autofill logic
       * TODO: Replace with smart field detection
       */
      try {
        // DV Trading Greenhouse form fields
        fillByName('first_name', '${firstName}');
        fillByName('last_name', '${lastName}');
        fillByName('email', '${email}');
        fillByName('phone', '${phone}');
        
        // Try LinkedIn field (may have different name)
        const linkedinInput = document.querySelector('input[placeholder*="LinkedIn" i], input[name*="linkedin" i]');
        if (linkedinInput && '${linkedin}') {
          if (setValue(linkedinInput, '${linkedin}')) {
            results.filled++;
            console.log('[Autofill] Filled: linkedin');
          }
        }
        
        console.log('[Autofill] Complete. Filled', results.filled, 'fields');
        
      } catch (err) {
        results.errors.push('Main error: ' + err.message);
        console.error('[Autofill] Error:', err);
      }
      
      return results;
    })();
  `;
}

/**
 * Escape string for safe injection into JavaScript code
 * Prevents injection attacks and syntax errors
 */
function escapeForInjection(value: string): string {
  return value
    .replace(/\\/g, '\\\\')      // Backslash
    .replace(/'/g, "\\'")         // Single quote
    .replace(/"/g, '\\"')         // Double quote
    .replace(/\n/g, '\\n')        // Newline
    .replace(/\r/g, '\\r')        // Carriage return
    .replace(/\t/g, '\\t')        // Tab
    .replace(/\f/g, '\\f')        // Form feed
    .replace(/\v/g, '\\v');       // Vertical tab
}

/**
 * Demo: Google search autofill
 * Demonstrates simple automation (searches "hello" on Google)
 * 
 * @param tabId - Tab ID
 * @param executeInTab - Function to execute code in tab
 */
export async function demoGoogleSearch(
  tabId: number,
  executeInTab: (tabId: number, code: string) => Promise<any>
): Promise<AutofillResult> {
  
  console.log('[Autofill] Demo: Google search on tab', tabId);
  
  const code = `
    (function() {
      const results = { filled: 0, errors: [] };
      
      try {
        // Find Google search input (multiple possible selectors)
        const searchInput = document.querySelector('textarea[name="q"]') ||
                          document.querySelector('input[name="q"]');
        
        if (searchInput) {
          searchInput.value = 'hello';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          results.filled = 1;
          console.log('[Demo] Filled Google search with "hello"');
          
          // Optional: Auto-submit (commented out for safety)
          // const form = searchInput.closest('form');
          // if (form) form.submit();
        } else {
          results.errors.push('Search input not found');
        }
      } catch (err) {
        results.errors.push(err.message);
      }
      
      return results;
    })();
  `;
  
  try {
    const result = await executeInTab(tabId, code);
    
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

// Export for testing
export const __testing = {
  generateInjectionCode,
  escapeForInjection
};

