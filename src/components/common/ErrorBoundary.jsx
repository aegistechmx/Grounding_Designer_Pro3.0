import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">⚠️</span>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                Algo salió mal
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {this.state.error?.message || 'Error inesperado en la aplicación'}
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono overflow-auto max-h-32 mb-4">
              {this.state.errorInfo?.componentStack || 'Sin detalles adicionales'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;