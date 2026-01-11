
import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SequenceVisualizer from './SequenceVisualizer';

const HeroSection: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const targetProgress = useRef(0);
    const currentProgress = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const { height } = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const scrollDistance = height - viewportHeight;
            const scrolled = window.scrollY;

            // Update TARGET only
            const p = Math.min(1, Math.max(0, scrolled / scrollDistance));
            targetProgress.current = p;
        };

        window.addEventListener('scroll', handleScroll);

        // Animation Loop for Smoothing (Lerp)
        let animationFrameId: number;
        const animate = () => {
            // Smoothly interpolate current -> target
            // Factor 0.05 = very smooth/heavy, 0.1 = responsive
            const diff = targetProgress.current - currentProgress.current;

            // Optimization: Stop updating if close enough
            if (Math.abs(diff) > 0.0001) {
                currentProgress.current += diff * 0.05;
                setProgress(currentProgress.current);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Text Content based on progress
    const getTextContent = () => {
        if (progress < 0.25) return {
            title: "AETHERX",
            subtitle: "Global Surveillance Network Online",
            opacity: 1 - (progress * 4) // Fade out by 0.25
        };
        if (progress >= 0.25 && progress < 0.6) return {
            title: "DETECT",
            subtitle: "Analysing Satellite Telemetry...",
            opacity: Math.min(1, (progress - 0.25) * 4) * (progress > 0.5 ? 1 - ((progress - 0.5) * 10) : 1)
        };
        if (progress >= 0.6) return {
            title: "DEPLOY",
            subtitle: "Rapid Response Units Active",
            opacity: Math.min(1, (progress - 0.6) * 4)
        };
        return { title: "", subtitle: "", opacity: 0 };
    };

    const text = getTextContent();

    return (
        // Tall container to enable scrolling
        <div ref={containerRef} className="relative h-[400vh] bg-black">

            {/* Sticky Viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center text-white">

                {/* Controlled Visualizer */}
                <SequenceVisualizer progress={progress} />

                {/* Dynamic Text Overlay */}
                <div className="relative z-10 text-center space-y-4 mix-blend-overlay" style={{ opacity: text.opacity }}>
                    <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                        {text.title}
                    </h1>
                    <p className="text-2xl md:text-3xl font-light tracking-widest uppercase text-blue-300">
                        {text.subtitle}
                    </p>
                </div>

                <div
                    className={`absolute bottom-20 transition-all duration-1000 ${progress > 0.9 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <button
                        onClick={() => navigate('/operation-office')}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-[0_0_50px_rgba(37,99,235,0.8)] animate-pulse flex items-center gap-3"
                    >
                        ENTER COMMAND <ChevronRight />
                    </button>
                </div>

                {/* Scroll Indicator (Only visible at start) */}
                <div
                    className={`absolute bottom-10 animate-bounce transition-opacity duration-500 ${progress > 0.1 ? 'opacity-0' : 'opacity-100'}`}
                >
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Initialize System</p>
                    <div className="w-[1px] h-12 bg-gray-500 mx-auto" />
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
