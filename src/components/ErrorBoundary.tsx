import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught runtime error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    background: '#fcfcfc'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: 'white',
                        padding: '2.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        border: '1px solid #fee2e2'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩸</div>
                        <h2 style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>Something went wrong</h2>
                        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            We encountered an unexpected issue while loading this page. Don't worry, our team has been notified.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    background: '#d32f2f',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Return to Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
