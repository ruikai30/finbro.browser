/**
 * Purple Glow Overlay Component
 * 
 * Displays purple ambient glow animation with border pulse.
 * Blocks all user interaction with underlying page.
 */

import React from 'react';
import './PurpleGlow.css';

export const PurpleGlow: React.FC = () => {
  return (
    <div className="purple-glow-overlay">
      {/* Overlay is rendered via CSS pseudo-elements and blocker */}
    </div>
  );
};

