import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const Tooltip = ({ children, content, className, side = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const variants = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    };

    const positions = {
        top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
        bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
        left: '-left-2 top-1/2 -translate-y-1/2 -translate-x-full',
        right: '-right-2 top-1/2 -translate-y-1/2 translate-x-full',
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={variants}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded shadow-sm whitespace-nowrap pointer-events-none',
                            positions[side],
                            className
                        )}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { Tooltip };
