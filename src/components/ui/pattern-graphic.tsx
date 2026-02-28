import React from "react";
import { cn } from "@/lib/utils";

interface PatternGraphicProps {
    seed: string;
    className?: string;
    variant?: "pink" | "beige" | "dark";
}

export function PatternGraphic({
    seed,
    className,
    variant = "pink",
}: PatternGraphicProps) {
    // Simple hash function to generate deterministic values from a seed string
    const hash = Array.from(seed).reduce(
        (acc, char) => (acc << 5) - acc + char.charCodeAt(0),
        0
    );

    // Deterministic pseudo-random number generator
    const prng = (min: number, max: number, offset = 0) => {
        const val = Math.abs(Math.sin(hash + offset)) * 10000;
        return min + (val - Math.floor(val)) * (max - min);
    };

    const bgColors = {
        pink: "bg-[#FF52A2]",
        beige: "bg-[#E6D5C3]",
        dark: "bg-[#141414]",
    };

    const shapeColors = {
        pink: ["#000000", "#FFFFFF", "#E6D5C3"],
        beige: ["#000000", "#FF52A2", "#FFFFFF"],
        dark: ["#FF52A2", "#E6D5C3", "#FFFFFF"],
    };

    const colors = shapeColors[variant];

    // Decide what shapes to render based on hash
    const numShapes = Math.floor(prng(3, 6, 1));
    const shapes = [];

    for (let i = 0; i < numShapes; i++) {
        const shapeType = Math.floor(prng(0, 4, i * 10)); // 0: Pill, 1: Circle, 2: Zigzag, 3: Sparkle
        const x = prng(10, 90, i * 11);
        const y = prng(10, 90, i * 12);
        const size = prng(20, 80, i * 13);
        const rotation = prng(0, 360, i * 14);
        const color = colors[Math.floor(prng(0, colors.length, i * 15))];

        shapes.push({ id: i, type: shapeType, x, y, size, rotation, color });
    }

    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden flex items-center justify-center isolation-auto",
                bgColors[variant],
                className
            )}
        >
            {/* Decorative radial gradient background mix */}
            <div
                className="absolute inset-0 opacity-50 mix-blend-overlay"
                style={{
                    background: `radial-gradient(circle at ${prng(20, 80, 99)}% ${prng(20, 80, 100)}%, rgba(255,255,255,0.2) 0%, transparent 70%)`
                }}
            />

            <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
                {shapes.map((shape) => {
                    const transform = `translate(${shape.x * 2}, ${shape.y * 2}) rotate(${shape.rotation})`;

                    if (shape.type === 0) {
                        // Pill
                        return (
                            <rect
                                key={shape.id}
                                x={-shape.size}
                                y={-shape.size / 3}
                                width={shape.size * 2}
                                height={shape.size / 1.5}
                                rx={shape.size / 3}
                                fill={shape.color}
                                transform={transform}
                            />
                        );
                    } else if (shape.type === 1) {
                        // Circle
                        return (
                            <circle
                                key={shape.id}
                                cx={0}
                                cy={0}
                                r={shape.size / 2}
                                fill={shape.color}
                                transform={transform}
                            />
                        );
                    } else if (shape.type === 2) {
                        // Zigzag / wavy line abstraction
                        return (
                            <path
                                key={shape.id}
                                d={`M ${-shape.size} 0 L ${-shape.size / 2} ${shape.size / 2} L 0 0 L ${shape.size / 2} ${shape.size / 2} L ${shape.size} 0`}
                                stroke={shape.color}
                                strokeWidth={shape.size / 5}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={transform}
                            />
                        );
                    } else {
                        // Sparkle (Four-point star)
                        const s = shape.size / 1.5;
                        return (
                            <path
                                key={shape.id}
                                d={`M 0 ${-s} Q 0 0 ${s} 0 Q 0 0 0 ${s} Q 0 0 ${-s} 0 Q 0 0 0 ${-s} Z`}
                                fill={shape.color}
                                transform={transform}
                            />
                        );
                    }
                })}
            </svg>

            {/* Granular noise overlay for texture */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full opacity-[0.15] mix-blend-overlay pointer-events-none">
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
}
