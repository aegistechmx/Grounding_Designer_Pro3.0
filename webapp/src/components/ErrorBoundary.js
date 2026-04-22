import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h2 className="text-lg font-bold text-red-800 mb-2">
            Something went wrong
          </h2>
          <div className="text-red-700 mb-4">
            <p>An unexpected error occurred in the application.</p>
            <p className="text-sm mt-2">
              Please refresh the page and try again. If the problem persists, 
              contact support with the details below.
            </p>
          </div>
          
          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-800">
                Error Details (Development Mode)
              </summary>
              <div className="mt-2 text-xs text-red-600">
                <div className="bg-red-100 p-2 rounded overflow-auto">
                  <p><strong>Error:</strong> {this.state.error?.toString()}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </div>
            </details>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
