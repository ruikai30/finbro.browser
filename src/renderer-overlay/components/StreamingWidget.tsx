/**
 * Streaming Widget Component
 * 
 * Premium mystical UI with purple glassmorphism.
 * Displays real-time streaming messages with world-class design.
 */

import React from 'react';
import './StreamingWidget.css';

interface StreamingWidgetProps {
  message: string;
}

export const StreamingWidget: React.FC<StreamingWidgetProps> = ({ message }) => {
  return (
    <div className="streaming-widget">
      <div className="streaming-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Neural network nodes */}
          <circle className="node node-1" cx="16" cy="8" r="3" />
          <circle className="node node-2" cx="9" cy="20" r="3" />
          <circle className="node node-3" cx="23" cy="20" r="3" />
          <circle className="node node-center" cx="16" cy="16" r="2.5" />
          
          {/* Connecting lines */}
          <line className="connection" x1="16" y1="11" x2="16" y2="13.5" />
          <line className="connection" x1="14.5" y1="17" x2="11" y2="18.5" />
          <line className="connection" x1="17.5" y1="17" x2="21" y2="18.5" />
          
          {/* Outer glow circle */}
          <circle className="glow-ring" cx="16" cy="16" r="13" />
        </svg>
      </div>
      <div className="streaming-message">{message}</div>
    </div>
  );
};

