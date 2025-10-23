/**
 * API Type Definitions
 * 
 * These types define the contract between the browser and the backend API.
 * Integration teams should implement functions that return these types.
 */

/**
 * User profile data fetched from backend API
 */
export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  
  // Extensible: add more fields as needed
  [key: string]: any;
}

/**
 * Target URL configuration (form sites to open)
 */
export interface TargetUrl {
  url: string;           // Full URL to load
  label: string;         // Human-readable name
  enabled: boolean;      // Whether to auto-open on startup
  rules?: AutofillRules; // Optional site-specific autofill rules
}

/**
 * Autofill rules for a specific site
 */
export interface AutofillRules {
  selectors: {
    [fieldName: string]: string; // CSS selector for each field
  };
  fieldMapping: {
    [fieldName: string]: string; // Maps field to profile property
  };
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Result of autofill operation
 */
export interface AutofillResult {
  success: boolean;
  fieldsFilled: number;
  errors?: string[];
}

