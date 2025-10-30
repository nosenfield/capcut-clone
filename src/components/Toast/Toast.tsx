/**
 * Toast Notification Component
 * 
 * Displays temporary error and success messages to the user.
 * Auto-dismisses after a delay.
 * Shows full debug details in expandable section.
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';

export const Toast: React.FC = () => {
  const error = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (error) {
      // Auto-dismiss after 10 seconds (longer for debug details)
      const timer = setTimeout(() => {
        setError(null);
        setShowDetails(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  const displayMessage = error.userMessage || error.message;
  const hasDebugInfo = error.debug || error.context || error.code;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-2xl">
      <div className="bg-red-600 text-white rounded-lg shadow-lg overflow-hidden">
        {/* Main error message */}
        <div className="px-6 py-3 flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium break-words">{displayMessage}</p>
            {hasDebugInfo && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-sm text-red-100 hover:text-white underline"
              >
                {showDetails ? 'Hide' : 'Show'} debug details
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setError(null);
              setShowDetails(false);
            }}
            className="text-white hover:text-gray-200 transition-colors ml-2 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Expandable debug details */}
        {showDetails && hasDebugInfo && (
          <div className="px-6 py-3 bg-red-700 border-t border-red-800">
            <div className="space-y-2 text-sm font-mono">
              {error.code && (
                <div>
                  <span className="text-red-200">Code:</span> {error.code}
                </div>
              )}
              {error.message !== displayMessage && (
                <div>
                  <span className="text-red-200">Original message:</span>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words">{error.message}</pre>
                </div>
              )}
              {error.debug && (
                <div>
                  <span className="text-red-200">Debug info:</span>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                    {error.debug}
                  </pre>
                </div>
              )}
              {error.context && Object.keys(error.context).length > 0 && (
                <div>
                  <span className="text-red-200">Context:</span>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <span className="text-red-200">Stack trace:</span>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

