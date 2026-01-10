"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Link, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MicrofilmViewerProps {
    isLoaded: boolean;
    isAnalyzing: boolean;
    onUpload?: () => void;
    onUrlSubmit?: (url: string) => void;
    detectedElements?: { x: number; y: number; label: string }[];
}

// Red ink target circle for detected elements
function TargetMarker({ x, y, label }: { x: number; y: number; label: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <circle
                cx={x}
                cy={y}
                r="25"
                className="target-circle"
                strokeDasharray="6 4"
            />
            <circle cx={x} cy={y} r="3" fill="#9B2C2C" />
            <text
                x={x}
                y={y + 40}
                textAnchor="middle"
                className="fill-red-ink text-[10px] font-mono uppercase"
                style={{ fontFamily: 'JetBrains Mono' }}
            >
                {label}
            </text>
        </motion.g>
    );
}

export function MicrofilmViewer({ isLoaded, isAnalyzing, onUpload, onUrlSubmit, detectedElements = [] }: MicrofilmViewerProps) {
    const [urlInput, setUrlInput] = useState("");
    const [inputMode, setInputMode] = useState<"video" | "url">("video");

    const handleUrlSubmit = () => {
        if (urlInput.trim() && onUrlSubmit) {
            onUrlSubmit(urlInput.trim());
            setUrlInput("");
        } else if (urlInput.trim() && onUpload) {
            // Fallback to onUpload if onUrlSubmit is not provided
            onUpload();
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div
                className={cn(
                    "relative flex-1 bg-ivory rounded-lg overflow-hidden",
                    "border border-kraft/50"
                )}
            >
                {isLoaded ? (
                    /* Loaded State - Skeleton placeholder */
                    <div className="relative w-full h-full p-6">
                        {/* Browser-like skeleton */}
                        <div className="h-full bg-white rounded-xl border border-gray-100 overflow-hidden">
                            {/* Browser header skeleton */}
                            <div className="h-10 bg-gray-50 flex items-center px-4 gap-3 border-b border-gray-100">
                                <div className="flex gap-1.5">
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                </div>
                                <Skeleton className="flex-1 h-6 rounded-md max-w-md mx-auto" />
                            </div>

                            {/* Page content skeleton */}
                            <div className="p-6 space-y-6">
                                {/* Header area */}
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-3/4 rounded-lg" />
                                    <Skeleton className="h-4 w-full rounded" />
                                    <Skeleton className="h-4 w-5/6 rounded" />
                                </div>

                                {/* Form area */}
                                <div className="space-y-4 mt-8">
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <div className="flex gap-4 pt-4">
                                        <Skeleton className="h-11 w-28 rounded-lg" />
                                        <Skeleton className="h-11 w-28 rounded-lg" />
                                    </div>
                                </div>

                                {/* Additional content */}
                                <div className="space-y-3 pt-6">
                                    <Skeleton className="h-4 w-2/3 rounded" />
                                    <Skeleton className="h-4 w-1/2 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Scan line effect when analyzing */}
                        {isAnalyzing && (
                            <motion.div
                                className="absolute left-6 right-6 h-0.5 bg-kraft/50 rounded-full"
                                initial={{ top: "10%" }}
                                animate={{ top: "90%" }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        )}
                    </div>
                ) : (
                    /* Empty State - Upload prompt */
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        {/* Tab Switcher */}
                        <div className="flex gap-2 mb-8">
                            <button
                                onClick={() => setInputMode("video")}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                    inputMode === "video"
                                        ? "bg-kraft text-jet"
                                        : "bg-transparent text-typewriter hover:bg-kraft/20"
                                )}
                            >
                                <Film className="w-4 h-4" />
                                Video File
                            </button>
                            <button
                                onClick={() => setInputMode("url")}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                    inputMode === "url"
                                        ? "bg-kraft text-jet"
                                        : "bg-transparent text-typewriter hover:bg-kraft/20"
                                )}
                            >
                                <Link className="w-4 h-4" />
                                Website URL
                            </button>
                        </div>

                        {inputMode === "video" ? (
                            /* Video Upload */
                            <motion.div
                                className="w-full max-w-md cursor-pointer group"
                                onClick={onUpload}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="border-2 border-dashed border-kraft/50 rounded-lg p-12 text-center hover:border-kraft hover:bg-kraft/5 transition-all">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-kraft/10 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-typewriter" />
                                    </div>
                                    <p className="text-base font-medium text-jet mb-2">
                                        Upload Video
                                    </p>
                                    <p className="text-sm text-typewriter">
                                        Drop file here or click to browse
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            /* URL Input */
                            <div className="w-full max-w-md">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-4 py-3 rounded-lg border border-kraft/50 bg-white text-jet placeholder:text-typewriter/50 focus:outline-none focus:border-kraft focus:ring-2 focus:ring-kraft/20 transition-all"
                                            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUrlSubmit}
                                        disabled={!urlInput.trim()}
                                        className={cn(
                                            "w-full py-3 rounded-lg font-medium transition-all",
                                            urlInput.trim()
                                                ? "bg-kraft text-jet hover:bg-kraft-dark"
                                                : "bg-kraft/30 text-typewriter/50 cursor-not-allowed"
                                        )}
                                    >
                                        Load Website
                                    </button>
                                    <p className="text-xs text-center text-typewriter">
                                        Enter a URL to capture and analyze
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Status indicator - simplified */}
                <div className="absolute bottom-4 left-6 flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isAnalyzing ? "bg-kraft animate-pulse" : isLoaded ? "bg-green-600" : "bg-gray-300"
                    )} />
                    <span className="text-xs font-mono text-typewriter">
                        {isAnalyzing ? "Analyzing..." : isLoaded ? "Ready" : "No input"}
                    </span>
                </div>
            </div>
        </div>
    );
}
