"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Link, Upload, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionInputProps {
    onUpload?: (file: File) => void;
    onUrlSubmit?: (url: string) => void;
    isLoading?: boolean;
}

export function MissionInput({ onUpload, onUrlSubmit, isLoading = false }: MissionInputProps) {
    const [urlInput, setUrlInput] = useState("");
    const [inputMode, setInputMode] = useState<"video" | "url">("url");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = () => {
        if (urlInput.trim() && onUrlSubmit) {
            onUrlSubmit(urlInput.trim());
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-[400px]">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Tab Toggles - Outside the box for cleaner look */}
            <div className="flex gap-4 mb-3 px-1">
                <button
                    onClick={() => setInputMode("url")}
                    disabled={isLoading}
                    className={cn(
                        "text-xs lg:text-sm font-medium flex items-center gap-2 transition-colors",
                        inputMode === "url" ? "text-brand-turquoise" : "text-muted-foreground hover:text-white",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Link className="w-3.5 h-3.5" />
                    URL
                </button>
                <div className="w-px h-4 bg-white/10 my-auto" />
                <button
                    onClick={() => setInputMode("video")}
                    disabled={isLoading}
                    className={cn(
                        "text-xs lg:text-sm font-medium flex items-center gap-2 transition-colors",
                        inputMode === "video" ? "text-brand-turquoise" : "text-muted-foreground hover:text-white",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Film className="w-3.5 h-3.5" />
                    Video
                </button>
            </div>

            {/* Compact Blue Box */}
            <div className={cn(
                "bg-brand-turquoise/5 border border-brand-turquoise/20 rounded-xl p-2 relative group overflow-hidden transition-all",
                !isLoading && "hover:bg-brand-turquoise/10 hover:border-brand-turquoise/30 hover:shadow-[0_0_20px_-10px_rgba(31,213,249,0.3)]",
                isLoading && "opacity-75"
            )}>
                <AnimatePresence mode="wait">
                    {inputMode === "video" ? (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "flex items-center gap-3",
                                !isLoading && "cursor-pointer"
                            )}
                            onClick={!isLoading ? triggerFileInput : undefined}
                        >
                            <div className="h-10 w-10 rounded-lg bg-brand-turquoise text-black flex items-center justify-center shrink-0">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {isLoading ? "Analyzing video..." : "Upload recording"}
                                </p>
                                <p className="text-xs text-brand-turquoise/80 truncate">
                                    {isLoading ? "Please wait" : "Supports .mp4, .mov, .webm"}
                                </p>
                            </div>
                            {!isLoading && (
                                <div className="pr-2">
                                    <ArrowRight className="w-4 h-4 text-brand-turquoise group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="url"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                        >
                            <div className="flex-1 relative">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Paste video URL here"
                                    disabled={isLoading}
                                    className="w-full bg-black/20 border border-brand-turquoise/10 rounded-lg pl-3 pr-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-turquoise/40 font-mono transition-all disabled:opacity-50"
                                    onKeyDown={(e) => e.key === "Enter" && !isLoading && handleUrlSubmit()}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleUrlSubmit}
                                disabled={!urlInput.trim() || isLoading}
                                className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                    urlInput.trim() && !isLoading
                                        ? "bg-brand-turquoise text-black hover:bg-brand-turquoise/90"
                                        : "bg-white/5 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-5 h-5" />
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
