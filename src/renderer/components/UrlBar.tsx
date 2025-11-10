/**
 * UrlBar Component (React)
 * 
 * Premium read-only URL display with security indicator
 */

import React from 'react';

interface UrlBarProps {
  currentUrl: string;
}

export const UrlBar: React.FC<UrlBarProps> = ({ currentUrl }) => {
  // Check if URL is HTTPS
  const isSecure = currentUrl.startsWith('https://');
  
  // Extract domain for display
  const getDisplayUrl = (url: string): string => {
    if (!url) return 'No page loaded';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  return (
    <div className="url-bar">
      <div className="url-bar-display">
        {currentUrl && (
          <span className="url-security-icon" title={isSecure ? 'Secure connection' : 'Not secure'}>
            {isSecure ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 6H10V4.5C10 2.57 8.43 1 6.5 1C4.57 1 3 2.57 3 4.5V6H2C1.45 6 1 6.45 1 7V12C1 12.55 1.45 13 2 13H11C11.55 13 12 12.55 12 12V7C12 6.45 11.55 6 11 6ZM6.5 2C7.88 2 9 3.12 9 4.5V6H4V4.5C4 3.12 5.12 2 6.5 2Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.5 6H11V4.5C11 2.57 9.43 1 7.5 1C5.57 1 4 2.57 4 4.5H5C5 3.12 6.12 2 7.5 2C8.88 2 10 3.12 10 4.5V6H2.5C1.95 6 1.5 6.45 1.5 7V12C1.5 12.55 1.95 13 2.5 13H11.5C12.05 13 12.5 12.55 12.5 12V7C12.5 6.45 12.05 6 11.5 6Z" fill="currentColor"/>
              </svg>
            )}
          </span>
        )}
        <div className="url-text">
          {getDisplayUrl(currentUrl)}
        </div>
        <div className="url-shimmer"></div>
      </div>
    </div>
  );
};
