// ... imports
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, RefreshCw } from "lucide-react";

interface BrowserViewProps {
    isAnalyzing: boolean;
    isRunning: boolean;
    currentAction?: string;
    className?: string;
    darkMode?: boolean;
}

export function BrowserView({ isAnalyzing, isRunning, currentAction, className, darkMode = true }: BrowserViewProps) {
    return (
        <div className={cn("h-full flex flex-col", className)}>
            {/* Browser Window */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-white/[0.02]">
                {/* Browser Chrome */}
                <div className="h-12 flex items-center px-4 gap-3 border-b border-white/10 bg-white/[0.02]">
                    {/* Traffic Lights */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>

                    {/* URL Bar */}
                    <div className="flex-1 max-w-lg mx-auto">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg border bg-white/5 border-white/10 text-muted-foreground">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className="text-xs font-mono truncate text-muted-foreground/80">
                                https://target-site.com
                            </span>
                            {isRunning && (
                                <RefreshCw className="w-3 h-3 animate-spin ml-auto text-brand-turquoise" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Browser Content */}
                <div className="relative flex-1 p-6 h-[calc(100%-3rem)]">
                    {/* Page Skeleton */}
                    <div className="h-full rounded-xl overflow-hidden border bg-white/[0.02] border-white/5">
                        {/* Header area */}
                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                <Skeleton className="h-8 w-3/4 rounded-lg bg-white/10" />
                                <Skeleton className="h-4 w-full rounded bg-white/5" />
                                <Skeleton className="h-4 w-5/6 rounded bg-white/5" />
                            </div>

                            {/* Form area */}
                            <div className="space-y-4 mt-8">
                                <Skeleton className="h-12 w-full rounded-lg bg-white/10" />
                                <Skeleton className="h-12 w-full rounded-lg bg-white/10" />
                                <div className="flex gap-4 pt-4">
                                    <Skeleton className="h-11 w-32 rounded-lg bg-white/10" />
                                    <Skeleton className="h-11 w-32 rounded-lg bg-white/10" />
                                </div>
                            </div>

                            {/* Additional content */}
                            <div className="space-y-3 pt-6">
                                <Skeleton className="h-4 w-2/3 rounded bg-white/5" />
                                <Skeleton className="h-4 w-1/2 rounded bg-white/5" />
                            </div>
                        </div>
                    </div>

                    {/* Scan line effect when analyzing - Turquoise */}
                    {isAnalyzing && (
                        <motion.div
                            className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-brand-turquoise to-transparent rounded-full shadow-[0_0_15px_rgba(31,213,249,0.5)]"
                            initial={{ top: "10%" }}
                            animate={{ top: "90%" }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    )}

                    {/* Active action indicator - Glass card + Turquoise glow */}
                    {isRunning && currentAction && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-8 left-8 right-8"
                        >
                            <div className="px-4 py-3 rounded-xl flex items-center gap-3 border backdrop-blur-md bg-black/60 border-brand-turquoise/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                                <div className="w-2 h-2 rounded-full bg-brand-turquoise animate-pulse shadow-[0_0_10px_rgba(31,213,249,0.8)]" />
                                <span className="text-sm font-mono text-white">
                                    {currentAction}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
