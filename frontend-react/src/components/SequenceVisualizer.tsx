
import React, { useRef, useEffect } from 'react';

const frameCount = 30;
const images: HTMLImageElement[] = [];

// Preload images
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    const filename = i < 10 ? `0${i}.png` : `${i}.png`;
    img.src = `/sequence/${filename}`;
    images.push(img);
}

interface SequenceVisualizerProps {
    progress: number; // 0 to 1
}

const SequenceVisualizer: React.FC<SequenceVisualizerProps> = ({ progress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Draw & Resize Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Trigger a redraw by slightly shifting progress or just let the next render handle it?
            // Actually, we need to manually redraw the current frame here
            drawFrame(progress, canvas);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Initial check for first image
        if (images[0].complete && images[0].naturalWidth > 0) {
            drawFrame(0, canvas);
        } else {
            images[0].onload = () => {
                if (images[0].naturalWidth > 0) drawFrame(0, canvas);
            };
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Draw Frame on Progress Change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawFrame(progress, canvas);
    }, [progress]);

    const drawFrame = (p: number, canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        if (!context) return;

        const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(p * frameCount)
        );

        const currentImg = images[frameIndex];
        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
            const hRatio = canvas.width / currentImg.width;
            const vRatio = canvas.height / currentImg.height;
            const ratio = Math.max(hRatio, vRatio);
            const centerShift_x = (canvas.width - currentImg.width * ratio) / 2;
            const centerShift_y = (canvas.height - currentImg.height * ratio) / 2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                currentImg,
                centerShift_x,
                centerShift_y,
                currentImg.width * ratio,
                currentImg.height * ratio
            );
        }
    };

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>
    );
};

export default SequenceVisualizer;
