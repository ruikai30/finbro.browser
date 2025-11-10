/**
 * StatusBar Component (React)
 * 
 * Displays status counts for tab automation states
 * Mini tab-style badges with glassmorphic design
 */

import React from 'react';

interface StatusBarProps {
  inProgressCount: number;
  successCount: number;
  failedCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  inProgressCount,
  successCount,
  failedCount,
}) => {
  return (
    <div className="status-bar">
      <div className="status-badge status-badge-in-progress">
        <span className="status-badge-label">In Progress</span>
        <span className="status-badge-count">{inProgressCount}</span>
      </div>
      
      <div className="status-badge status-badge-success">
        <span className="status-badge-label">Success</span>
        <span className="status-badge-count">{successCount}</span>
      </div>
      
      <div className="status-badge status-badge-failed">
        <span className="status-badge-label">Failed</span>
        <span className="status-badge-count">{failedCount}</span>
      </div>
    </div>
  );
};

