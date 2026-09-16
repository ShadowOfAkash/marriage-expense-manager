import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-zinc-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/80 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="font-serif font-bold text-2xl text-zinc-900 mb-2">
              Something went unexpected
            </h2>
            <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
              We encountered a display issue while loading your wedding suite. Don't worry, your wedding data and plans are safe.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-sm transition-all cursor-pointer border border-zinc-200"
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>

            {this.state.error && (
              <details className="text-left mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-500">
                <summary className="cursor-pointer font-medium text-zinc-600 hover:text-zinc-900">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-zinc-50 rounded-xl overflow-x-auto text-[11px] text-rose-700 font-mono">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
