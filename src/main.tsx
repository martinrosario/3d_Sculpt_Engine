import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Sculpt Engine Runtime Error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-100 font-sans">
          <div className="max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
              3D
            </div>
            <h1 className="text-lg font-bold text-zinc-100 mb-2">3D Sculpt Engine</h1>
            <p className="text-xs text-zinc-400 mb-4">
              An unexpected error occurred while initializing the 3D graphics context.
            </p>
            {this.state.error && (
              <pre className="text-[11px] font-mono bg-zinc-950/80 p-3 rounded-lg text-rose-300 text-left overflow-x-auto mb-4 border border-zinc-800">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
