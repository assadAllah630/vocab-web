import React, { useRef, useEffect, useState } from 'react';

const AudioVisualizer = ({ audioRef, isPlaying }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);
    const [useSimulation, setUseSimulation] = useState(true); // Default to simulation for external audio to avoid CORS issues initially

    // Configuration for the "Siri-style" waves
    const waves = [
        { color: 'rgba(99, 102, 241, 0.5)', speed: 0.01, amplitude: 0.5, offset: 0 },   // Indigo
        { color: 'rgba(168, 85, 247, 0.5)', speed: 0.02, amplitude: 0.4, offset: 2 },   // Purple
        { color: 'rgba(236, 72, 153, 0.5)', speed: 0.015, amplitude: 0.3, offset: 4 },  // Pink
        { color: 'rgba(59, 130, 246, 0.3)', speed: 0.03, amplitude: 0.6, offset: 1 },   // Blue
    ];

    useEffect(() => {
        // Attempt to connect to real audio if possible, but external podcasts usually block this via CORS.
        // For now, we'll stick to a high-quality simulation that reacts to "isPlaying".
        // Real analysis would require a proxy or backend processing which adds latency/cost.

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let phase = 0;

        const render = () => {
            if (!canvas) return;

            // Handle localized responsive resizing
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // Only resize if dimensions changed to avoid performance hit
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }

            const width = rect.width;
            const height = rect.height;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            if (isPlaying) {
                phase += 0.05;
            } else {
                // Slow breathing when paused
                if (Math.abs(Math.sin(phase)) > 0.01) phase += 0.02;
            }

            // Global amplitude modulation (breathing effect)
            const globalAmp = isPlaying ? 1 : 0.2;

            waves.forEach((wave, i) => {
                ctx.beginPath();
                ctx.strokeStyle = wave.color;
                ctx.lineWidth = 2;

                // Draw sine wave
                for (let x = 0; x < width; x += 5) {
                    // Normalized position (-1 to 1)
                    const normX = (x / width) * 2 - 1;

                    // Attenuation at edges (make it fade out at sides)
                    const attenuation = Math.pow(1 - Math.pow(normX, 2), 2);

                    // Frequency modulation
                    const freq = 2 + i + Math.sin(phase * 0.1);

                    // Main sine formula
                    const y = centerY +
                        Math.sin(x * 0.01 * freq + phase * wave.speed + wave.offset) *
                        (height * 0.3) * // Max height 30% of container
                        wave.amplitude *
                        attenuation *
                        globalAmp;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
                // Ensure it takes parent size but doesn't distort
                width: '100%',
                height: '100%'
            }}
        />
    );
};

export default AudioVisualizer;
