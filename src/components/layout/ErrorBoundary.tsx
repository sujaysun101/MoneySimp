"use client";
import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 text-center">
          <div className="space-y-4 max-w-md">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: undefined }); location.reload(); }}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            >Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
