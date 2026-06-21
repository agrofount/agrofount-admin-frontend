import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.error(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-gray-500">
            Please refresh the page or try again later.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-[#61BF75] px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
