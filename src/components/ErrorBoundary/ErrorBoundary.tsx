/**
 * Error Boundary Component
 * 
 * React error boundary that catches rendering errors and displays
 * a user-friendly error message instead of crashing the app.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../../utils/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error } = this.state;
      const userMessage = error instanceof AppError 
        ? error.userMessage 
        : 'An unexpected error occurred. Please refresh the application.';

      return (
        <div className="error-boundary min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-red-500 text-5xl">⚠️</div>
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            </div>

            <div className="bg-gray-900 rounded p-4 mb-6">
              <p className="text-gray-300 mb-4">{userMessage}</p>
              
              {(import.meta.env.DEV) && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-gray-400 text-sm mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="text-xs text-gray-500 font-mono bg-black p-3 rounded overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong className="text-red-400">Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong className="text-red-400">Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-red-400">Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

