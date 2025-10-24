/**
 * API Client (STUB)
 * 
 * This is a STUB implementation that returns mock data.
 * 
 * INTEGRATION POINT:
 * Replace the function bodies with real HTTP calls to your backend API.
 * Keep the function signatures and return types as-is.
 * 
 * See docs/INTEGRATION.md for detailed integration guide.
 */

import { ProfileData, TargetUrl, AuthResult } from '../types/api.types';
import { getConfigValue } from './config';

/**
 * Fetch user profile from backend API
 * 
 * TODO: Replace with real API call
 * Current: Returns mock data
 * 
 * @returns User profile data
 */
export async function fetchProfile(): Promise<ProfileData> {
  const apiUrl = getConfigValue('apiBaseUrl');
  const token = getConfigValue('apiToken');
  
  console.log('[API] fetchProfile() called');
  console.log('[API] Would call:', `${apiUrl}/profile`);
  console.log('[API] With token:', token ? '***' : 'none');
  
  // TODO: Implement real API call
  // Example implementation:
  // const response = await fetch(`${apiUrl}/profile`, {
  //   headers: {
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json'
  //   }
  // });
  // 
  // if (!response.ok) {
  //   throw new Error(`API error: ${response.status}`);
  // }
  // 
  // return await response.json();
  
  // STUB: Return mock data
  await simulateNetworkDelay(300);
  
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+65 9123 4567',
    linkedin: 'https://linkedin.com/in/johndoe'
  };
}

/**
 * Fetch target URLs/forms from backend API
 * 
 * TODO: Replace with real API call
 * Current: Returns mock data
 * 
 * @returns List of target URLs to open
 */
export async function fetchTargets(): Promise<TargetUrl[]> {
  const apiUrl = getConfigValue('apiBaseUrl');
  const token = getConfigValue('apiToken');
  
  console.log('[API] fetchTargets() called');
  console.log('[API] Would call:', `${apiUrl}/targets`);
  
  // TODO: Implement real API call
  
  // STUB: Return mock data
  await simulateNetworkDelay(200);
  
  return [
    {
      url: 'https://job-boards.greenhouse.io/dvtrading/jobs/4592920005',
      label: 'DV Trading Application',
      enabled: true
    },
    {
      url: 'https://google.com',
      label: 'Google Search',
      enabled: true
    },
    {
      url: 'https://github.com',
      label: 'GitHub',
      enabled: true
    }
  ];
}

/**
 * Authenticate user and obtain API token
 * 
 * TODO: Implement real authentication
 * Current: Returns mock success
 * 
 * @param username - Username or email
 * @param password - Password
 * @returns Authentication result with token
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthResult> {
  const apiUrl = getConfigValue('apiBaseUrl');
  
  console.log('[API] authenticateUser() called');
  console.log('[API] Would call:', `${apiUrl}/auth/login`);
  console.log('[API] Username:', username);
  
  // TODO: Implement real authentication
  // Example:
  // const response = await fetch(`${apiUrl}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, password })
  // });
  // 
  // const data = await response.json();
  // return {
  //   success: response.ok,
  //   token: data.token,
  //   error: data.error
  // };
  
  // STUB: Return mock success
  await simulateNetworkDelay(500);
  
  return {
    success: true,
    token: 'mock-token-' + Date.now(),
    error: undefined
  };
}

/**
 * Helper: Simulate network delay for realistic stub behavior
 */
function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Removed unused: __testing export

