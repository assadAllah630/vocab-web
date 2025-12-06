import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorFallback - Displayed when an error is caught by ErrorBoundary
 * Professional UI with retry and home navigation options
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: '#0A0A0B' }}
        >
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: '#EF444420' }}
                >
                    <AlertTriangle size={40} style={{ color: '#EF4444' }} />
                </div>

                {/* Title */}
                <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: '#FAFAFA' }}
                >
                    Something went wrong
                </h1>

                {/* Description */}
                <p
                    className="text-sm mb-6"
                    style={{ color: '#71717A' }}
                >
                    We're sorry, but something unexpected happened.
                    Please try again or go back to the home page.
                </p>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && error && (
                    <div
                        className="mb-6 p-4 rounded-xl text-left overflow-auto max-h-32"
                        style={{
                            backgroundColor: '#18181B',
                            border: '1px solid #27272A'
                        }}
                    >
                        <p
                            className="text-xs font-mono"
                            style={{ color: '#EF4444' }}
                        >
                            {error.message}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={resetErrorBoundary}
                        className="px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            color: '#FFFFFF'
                        }}
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#18181B',
                            border: '1px solid #27272A',
                            color: '#A1A1AA'
                        }}
                    >
                        <Home size={18} />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
