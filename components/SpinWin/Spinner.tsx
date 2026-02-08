import React, { useState, useEffect, useRef } from 'react';

interface Prize {
    id: string;
    name: string;
    color: string;
}

interface SpinnerProps {
    prizes: Prize[];
    winner?: Prize | null;
    onFinish: (prize: Prize) => void;
    isSpinning: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ prizes, winner, onFinish, isSpinning }) => {
    const [rotation, setRotation] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fallback data
    const segments = prizes.length > 0 ? prizes : [
        { id: '1', name: 'Loading...', color: '#cbd5e1' },
        { id: '2', name: 'Please Wait', color: '#94a3b8' }
    ];

    const colors = [
        '#B91c1c', // Tabarak Brand Red (Primary)
        '#0891b2', // Cyan-600 (Cool & Calming)
        '#f59e0b', // Amber-500 (Warm Gold, not Neon)
    ];

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audioRef.current.volume = 0.4;
    }, []);

    useEffect(() => {
        if (isSpinning && winner) {
            // Play Sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }

            const winnerIndex = segments.findIndex(p => p.id === winner.id);
            const prizeCount = segments.length;
            const sliceAngle = 360 / prizeCount;

            // Calculate target rotation
            // We want the winner slice to end up at the TOP (270deg or -90deg visually).
            // But SVG starts at 0deg (Right).
            // Let's assume standard behavior: Arrow is at Top.
            // If Arrow is Top (-90deg), and we rotate the wheel.

            // Random extra spins
            const extraSpins = 5 * 360;

            // To land index i at Top:
            // The slice i is at [i*angle, (i+1)*angle]. Center is (i+0.5)*angle.
            // We want (i+0.5)*angle + rotation = 270 (Top position in standard circle)
            // => rotation = 270 - (i+0.5)*angle

            const centerAngle = (winnerIndex + 0.5) * sliceAngle;
            let targetRotation = 270 - centerAngle;

            // Add randomness within the slice to avoid always landing dead center? Optional.
            // Adjust to be positive and add spins
            targetRotation = targetRotation + extraSpins;

            // Ensure we move forward
            const currentMod = rotation % 360;
            const targetMod = targetRotation % 360;
            let diff = targetMod - currentMod;
            if (diff < 0) diff += 360;

            const finalRotation = rotation + diff + extraSpins;

            setRotation(finalRotation);

            setTimeout(() => {
                onFinish(winner);
            }, 5000);
        }
    }, [isSpinning, winner]);

    // SVG Math Helpers
    const getCoordinates = (percent: number, radius: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x * radius, y * radius];
    };

    return (
        <div className="relative w-full max-w-[500px] aspect-square mx-auto">
            {/* Outer Glow/Frame */}
            <div className="absolute inset-[-4%] rounded-full border-4 border-slate-900/10 shadow-2xl bg-white/5 backdrop-blur-sm z-0"></div>

            {/* SVG Wheel */}
            <svg
                viewBox="-100 -100 200 200"
                className="w-full h-full transform transition-transform duration-[5000ms] cubic-bezier(0.2, 0, 0.1, 1)"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {segments.map((prize, i) => {
                    const count = segments.length;
                    const sliceAngle = 360 / count;
                    const startAngle = i * sliceAngle;
                    const endAngle = (i + 1) * sliceAngle;

                    // Use recorded color, fallback to pattern
                    const color = prize.color || colors[i % colors.length];

                    // Convert angles to range [0, 1]
                    const startPercent = startAngle / 360;
                    const endPercent = endAngle / 360;

                    const [startX, startY] = getCoordinates(startPercent, 95); // Radius 95 (leave 5 for border)
                    const [endX, endY] = getCoordinates(endPercent, 95);

                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                    const pathData = [
                        `M 0 0`,
                        `L ${startX} ${startY}`,
                        `A 95 95 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `Z`
                    ].join(' ');

                    // Text Positioning
                    // We rotate the text to be in the middle of the slice
                    const midAngle = startAngle + sliceAngle / 2;

                    // Parse text for visual hierarchy based on User Request:
                    let highlight = "";
                    let detail = "";

                    if (/(\d+%\s*Off)/i.test(prize.name)) {
                        // Case: "5% Off..." -> Highlight "5% Off"
                        const match = prize.name.match(/^(\d+%\s*Off)\s*(.*)/i);
                        if (match) {
                            highlight = match[1].toUpperCase();
                            detail = match[2];
                        }
                    } else if (/^\d+(\s?BD)?/.test(prize.name) && prize.name.includes('BD')) {
                        // Case: "3 BD Cashback..."
                        const match = prize.name.match(/^(\d+\s?BD)\s*(.*)/);
                        if (match) {
                            highlight = match[1];
                            detail = match[2];
                        }
                    } else if (/^Free/i.test(prize.name)) {
                        // Case: "Free in Body..."
                        const match = prize.name.match(/^(Free)\s*(.*)/i);
                        if (match) {
                            highlight = match[1].toUpperCase();
                            detail = match[2];
                        }
                    } else {
                        // Fallback: Split by first space
                        const parts = prize.name.split(' ');
                        highlight = parts[0];
                        detail = parts.slice(1).join(' ');
                    }

                    // STRICT REQUIREMENT: Detail must be single line
                    const detailText = detail.trim();

                    // Center radius - Pushed further out from center (48 -> 62)
                    // limit is ~90 (wheel radius 95 - border 5)
                    const textRadius = 62;

                    // Centering Logic - REFINED
                    // To perfectly center a 2-line block:
                    // Line 1 (Highlight) needs to be moved UP from the center.
                    // Line 2 (Detail) needs to be strictly below it.

                    let startDy = "0.35em"; // Default 1 line (optical center)
                    let detailDy = "05";

                    if (detailText) {
                        // If 2 lines with a gap:
                        // Move Highlight UP more to balance the larger total height
                        startDy = "-0.55em";
                        // Increase gap to 1.5em (from 1.1em) for visual separation
                        detailDy = "2em";
                    }

                    // Dynamic font size for detail to ensure it fits in one line
                    let detailFontSize = "6";
                    if (detailText.length > 18) detailFontSize = "5";
                    else if (detailText.length > 12) detailFontSize = "5";

                    return (
                        <g key={prize.id}>
                            <path d={pathData} fill={color} stroke="white" strokeWidth="1.5" />
                            <text
                                x={textRadius}
                                y={0}
                                fill="#ffffff"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${midAngle}) translate(0, 0)`}
                                style={{
                                    textShadow: 'rgba(0,0,0,0.4) 0px 1px 2px',
                                    fontFamily: 'system-ui, sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                {/* HIGHLIGHT: Big, Bold, Top */}
                                <tspan
                                    x={textRadius}
                                    dy={startDy}
                                    fontSize="9"
                                    fontWeight="900"
                                >
                                    {highlight}
                                </tspan>

                                {/* DETAILS: Regular, Smaller, Bottom */}
                                {detailText && (
                                    <tspan
                                        x={textRadius}
                                        dy={detailDy}
                                        fontSize={detailFontSize}
                                        fontWeight="500"
                                    >
                                        {detailText}
                                    </tspan>
                                )}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Center Boss/Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] bg-slate-900 rounded-full border-4 border-white shadow-xl z-20 flex items-center justify-center">
                <div className="w-1/3 h-1/3 bg-brand rounded-full animate-pulse shadow-[0_0_15px_currentColor] text-rose-500"></div>
            </div>

            {/* Indicator Arrow */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-lg">
                <svg width="40" height="40" viewBox="0 0 40 40">
                    <path d="M 20 40 L 5 10 L 35 10 Z" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                    <circle cx="20" cy="10" r="3" fill="#1e293b" />
                </svg>
            </div>

        </div>
    );
};
