import React from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in child component tree
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 * 
 * Or with custom fallback:
 *   <ErrorBoundary fallback={<CustomError />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Store error info for potential reporting
        this.setState({ errorInfo });

        // TODO: Send to error reporting service (e.g., Sentry)
        // if (typeof Sentry !== 'undefined') {
        //     Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    resetErrorBoundary = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Render custom fallback UI or default ErrorFallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={this.resetErrorBoundary}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
