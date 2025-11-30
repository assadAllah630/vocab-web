import React, { useRef, useState, useEffect } from 'react';

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(99, 102, 241, 0.15)" }) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
            setIsTouch(true);
        }
    }, []);

    const handleMouseMove = (e) => {
        if (!divRef.current || isTouch) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        if (!isTouch) setOpacity(1);
    };

    const handleBlur = () => {
        if (!isTouch) setOpacity(0);
    };

    const handleMouseEnter = () => {
        if (!isTouch) setOpacity(1);
    };

    const handleMouseLeave = () => {
        if (!isTouch) setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white ${className}`}
        >
            {isTouch ? (
                <div
                    className="pointer-events-none absolute -inset-px transition duration-300 opacity-50 animate-pulse"
                    style={{
                        background: `radial-gradient(600px circle at 50% 50%, ${spotlightColor}, transparent 40%)`,
                    }}
                />
            ) : (
                <div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                    style={{
                        opacity,
                        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
                    }}
                />
            )}
            <div className="relative h-full">
                {children}
            </div>
        </div>
    );
};

export default SpotlightCard;
