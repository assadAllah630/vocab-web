import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Words with proper spacing
const words = [
    // Far layer - depth 3 (most faded, most blurred)
    { text: "Connect", size: "text-2xl", weight: "font-medium", x: 10, y: 8, depth: 3 },
    { text: "Read", size: "text-2xl", weight: "font-medium", x: 95, y: 10, depth: 3 },
    { text: "Practice", size: "text-xl", weight: "font-medium", x: 8, y: 25, depth: 3 },
    { text: "Explore", size: "text-xl", weight: "font-medium", x: 92, y: 28, depth: 3 },
    { text: "Write", size: "text-xl", weight: "font-medium", x: 12, y: 45, depth: 3 },
    { text: "Listen", size: "text-xl", weight: "font-medium", x: 15, y: 65, depth: 3 },
    { text: "Improve", size: "text-2xl", weight: "font-medium", x: 92, y: 68, depth: 3 },
    { text: "Master", size: "text-xl", weight: "font-medium", x: 90, y: 88, depth: 3 },

    // Mid layer - depth 2
    { text: "Bonjour", size: "text-4xl", weight: "font-bold", x: 30, y: 28, depth: 2 },
    { text: "Hola", size: "text-4xl", weight: "font-semibold", x: 28, y: 48, depth: 2 },
    { text: "مرحبا", size: "text-4xl", weight: "font-bold", x: 85, y: 48, depth: 2 },
    { text: "Ciao", size: "text-3xl", weight: "font-semibold", x: 20, y: 85, depth: 2 },
    { text: "Namaste", size: "text-3xl", weight: "font-semibold", x: 45, y: 88, depth: 2 },
    { text: "Shalom", size: "text-3xl", weight: "font-semibold", x: 70, y: 86, depth: 2 },
    { text: "Привет", size: "text-3xl", weight: "font-semibold", x: 18, y: 38, depth: 2 },
    { text: "Salaam", size: "text-3xl", weight: "font-semibold", x: 42, y: 58, depth: 2 },
    { text: "Gracias", size: "text-2xl", weight: "font-medium", x: 78, y: 38, depth: 2 },
    { text: "Merci", size: "text-2xl", weight: "font-medium", x: 10, y: 78, depth: 2 },
    { text: "Danke", size: "text-2xl", weight: "font-medium", x: 85, y: 78, depth: 2 },

    // Close layer - depth 1 (most visible, sharp)
    { text: "Hello", size: "text-5xl", weight: "font-bold", x: 25, y: 12, depth: 1 },
    { text: "Vocabulary", size: "text-7xl", weight: "font-black", x: 55, y: 10, depth: 1 },
    { text: "你好", size: "text-4xl", weight: "font-bold", x: 85, y: 15, depth: 1 },
    { text: "Learn", size: "text-6xl", weight: "font-extrabold", x: 65, y: 30, depth: 1 },
    { text: "Fluency", size: "text-6xl", weight: "font-extrabold", x: 58, y: 50, depth: 1 },
    { text: "こんにちは", size: "text-5xl", weight: "font-bold", x: 38, y: 68, depth: 1 },
    { text: "Speak", size: "text-5xl", weight: "font-extrabold", x: 70, y: 70, depth: 1 },
];

const Word = ({ word, mouseX, mouseY }) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smoother spring for depth
    const springConfig = { damping: 40, stiffness: 100, mass: 1.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    useEffect(() => {
        const handleMouseMove = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distanceX = mouseX.get() - centerX;
            const distanceY = mouseY.get() - centerY;
            const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

            const maxDistance = 350;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                // Parallax: far words move less
                const parallaxFactor = word.depth === 3 ? 0.05 : word.depth === 2 ? 0.1 : 0.15;
                const moveX = -(distanceX * force * parallaxFactor);
                const moveY = -(distanceY * force * parallaxFactor);
                x.set(moveX);
                y.set(moveY);
            } else {
                x.set(0);
                y.set(0);
            }
        };

        const unsubscribeX = mouseX.on("change", handleMouseMove);
        const unsubscribeY = mouseY.on("change", handleMouseMove);

        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [mouseX, mouseY, word.depth, x, y]);

    // Dramatic depth: far = very faded/blurred, close = sharp/visible
    const opacity = word.depth === 3 ? 0.08 : word.depth === 2 ? 0.15 : 0.25;
    const blur = word.depth === 3 ? 2 : word.depth === 2 ? 0.8 : 0;

    return (
        <motion.div
            ref={ref}
            className={`absolute ${word.size} ${word.weight} text-white select-none cursor-default`}
            style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                x: springX,
                y: springY,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                transform: 'translate(-50%, -50%)',
            }}
        >
            {word.text}
        </motion.div>
    );
};

const MagneticWords = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* PURE BLACK/GRAY gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-slate-950" />

            {/* Subtle GRAY depth layers - NO COLOR */}
            <motion.div
                animate={{ opacity: [0.02, 0.05, 0.02], scale: [1, 1.02, 1] }}
                transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-30%] right-[-20%] w-[1000px] h-[1000px] bg-gray-500/3 rounded-full blur-[150px]"
            />

            <motion.div
                animate={{ opacity: [0.03, 0.06, 0.03], scale: [1.02, 1, 1.02] }}
                transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-25%] left-[-15%] w-[800px] h-[800px] bg-gray-400/4 rounded-full blur-[120px]"
            />

            {/* The word cloud */}
            {words.map((word, index) => (
                <Word key={index} word={word} mouseX={mouseX} mouseY={mouseY} />
            ))}

            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
        </div>
    );
};

export default MagneticWords;
