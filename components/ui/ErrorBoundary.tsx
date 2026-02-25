import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg m-4 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Ein Fehler ist aufgetreten</h2>
          <p className="text-gray-300 mb-4">Die Komponente konnte nicht geladen werden.</p>
          <pre className="text-xs text-red-300 bg-black/30 p-2 rounded overflow-auto max-w-full text-left mb-4">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
          >
            Versuche neu zu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}