// Error Boundary component to catch React errors
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] flex items-center justify-center px-6 py-12 text-white">
          <div className="max-w-md w-full rounded-3xl border border-rose-400/20 bg-rose-500/10 p-8 text-center shadow-[0_20px_60px_rgba(19,46,83,0.45)]">
            <div className="text-rose-400 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-white/70 mb-6">
              We encountered an unexpected error. Please refresh the page to continue.
            </p>
            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm text-white/50 hover:text-white/80 transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs text-white/60 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#2ce695] px-6 py-3 text-sm font-semibold text-[#0b1b14] transition hover:bg-[#7affd0]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

