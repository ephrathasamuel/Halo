'use client';

import { useEffect, useState } from 'react';
import { initializeDemoData } from '@/lib/storage/initializeDemoData';

/**
 * Client component that initializes demo data on first render.
 * Shows recovery messages if corrupted data was detected.
 */
export function AppInitializer() {
  const [recoveryMessages, setRecoveryMessages] = useState([]);

  useEffect(() => {
    const messages = initializeDemoData();
    if (messages.length > 0) {
      setRecoveryMessages(messages);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setRecoveryMessages([]), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (recoveryMessages.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-md"
      role="alert"
    >
      <p className="font-semibold text-amber-800 mb-1">Saved data reset</p>
      {recoveryMessages.map((msg, i) => (
        <p key={i} className="text-sm text-amber-700">{msg}</p>
      ))}
    </div>
  );
}
