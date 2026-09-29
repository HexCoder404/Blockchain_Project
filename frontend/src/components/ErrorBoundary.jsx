import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-200 dark:border-red-900/50 max-w-lg text-center shadow-xl">
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong</h2>
            <p className="text-red-500 dark:text-red-300 mb-8 font-mono text-sm bg-white dark:bg-black/20 p-4 rounded-xl break-all">
              {this.state.error?.message || "An unexpected rendering error occurred in the UI."}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg"
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
