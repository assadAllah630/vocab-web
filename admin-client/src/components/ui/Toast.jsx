import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ title, description, type = 'info', duration = 5000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ id, title, description, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-success" />,
        warning: <AlertTriangle className="w-5 h-5 text-warning" />,
        error: <AlertCircle className="w-5 h-5 text-error" />,
        info: <Info className="w-5 h-5 text-primary" />,
    };

    const bgColors = {
        success: 'bg-success/10 border-success/20',
        warning: 'bg-warning/10 border-warning/20',
        error: 'bg-error/10 border-error/20',
        info: 'bg-primary/10 border-primary/20',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto relative w-full rounded-lg border p-4 shadow-lg backdrop-blur-md",
                "bg-white/90 dark:bg-slate-900/90",
                bgColors[type] || bgColors.info
            )}
        >
            <div className="flex items-start gap-3">
                {icons[type] || icons.info}
                <div className="flex-1">
                    {title && <h3 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark">{title}</h3>}
                    {description && <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">{description}</p>}
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};
