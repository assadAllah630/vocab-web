import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

const SlideOver = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    width = 'max-w-md'
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed inset-y-0 right-0 z-50 flex flex-col bg-background shadow-2xl border-l border-border",
                            width
                        )}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                                {title}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>

                        {footer && (
                            <div className="border-t border-border px-6 py-4 bg-muted/30">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export { SlideOver };
