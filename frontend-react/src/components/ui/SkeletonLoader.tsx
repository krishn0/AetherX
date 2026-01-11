import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
    variant?: "text" | "card" | "chart" | "weather"
    className?: string
}

export default function SkeletonLoader({ variant = "text", className }: SkeletonLoaderProps) {
    if (variant === "text") {
        return (
            <div className={cn("animate-pulse space-y-2", className)}>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
        )
    }

    if (variant === "card") {
        return (
            <div className={cn("animate-pulse space-y-3", className)}>
                <div className="h-6 bg-white/10 rounded w-1/3"></div>
                <div className="h-12 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
        )
    }

    if (variant === "chart") {
        return (
            <div className={cn("animate-pulse flex items-end justify-between gap-2 h-full", className)}>
                {[...Array(7)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-white/10 rounded-t w-full"
                        style={{ height: `${Math.random() * 60 + 40}%` }}
                    ></div>
                ))}
            </div>
        )
    }

    if (variant === "weather") {
        return (
            <div className={cn("animate-pulse space-y-3", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="h-8 bg-white/10 rounded w-20"></div>
                            <div className="h-3 bg-white/10 rounded w-16"></div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded"></div>
                </div>
            </div>
        )
    }

    return null
}

// Shimmer effect component for more advanced loading states
export function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden", className)}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
    )
}
