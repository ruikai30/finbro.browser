/**
 * Overlay App Component
 * 
 * Root component for overlay renderer.
 * Manages overlay state and routes to appropriate overlay component.
 */

import React, { useState, useEffect } from 'react';
import { PurpleGlow } from './components/PurpleGlow';
import type { OverlayState } from './types';

export const App: React.FC = () => {
  const [state, setState] = useState<OverlayState | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);

  // Get tab ID from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('tabId');
    if (id) {
      setTabId(Number(id));
    }
  }, []);

  // Fetch initial state
  useEffect(() => {
    if (tabId === null) return;

    window.OverlayAPI.getState(tabId).then(initialState => {
      if (initialState) {
        setState(initialState);
      }
    });
  }, [tabId]);

  // Listen for real-time state updates
  useEffect(() => {
    const unsubscribe = window.OverlayAPI.onUpdate((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Don't render anything if not visible or no state
  if (!state || !state.visible) {
    return null;
  }

  // Route to appropriate overlay component based on type
  switch (state.type) {
    case 'purple_glow':
      return <PurpleGlow />;
    
    default:
      return null;
  }
};