import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console (or send to an error reporting service)
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-stone-900 flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-rose-700 mb-3">Terjadi kesalahan</h1>
            <p className="text-sm text-rose-700 mb-4">Kami tidak bisa menampilkan halaman ini karena ada error pada aplikasi.</p>
            <pre className="rounded-xl bg-white p-4 text-xs text-rose-800 overflow-x-auto border border-rose-100">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
