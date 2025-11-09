/**
 * UrlBar Component (React)
 * 
 * URL input with navigation.
 */

import React, { useState } from 'react';

interface UrlBarProps {
  onNavigate: (url: string) => void;
}

export const UrlBar: React.FC<UrlBarProps> = ({ onNavigate }) => {
  const [url, setUrl] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let processedUrl = url.trim();
      
      if (!processedUrl) return;
      
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }
      
      onNavigate(processedUrl);
      setUrl('');
    }
  };

  return (
    <div className="url-bar">
      <input
        type="text"
        className="url-input"
        placeholder="Enter URL and press Enter..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
