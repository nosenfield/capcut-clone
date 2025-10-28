/**
 * Toast Notification Component
 * 
 * Displays temporary error and success messages to the user.
 * Auto-dismisses after a delay.
 */

import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

export const Toast: React.FC = () => {
  const error = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);

  useEffect(() => {
    if (error) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <div className="text-xl">⚠️</div>
        <p className="flex-1">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-white hover:text-gray-200 transition-colors ml-2"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

