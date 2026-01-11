"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Link, Upload, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionInputProps {
    onUpload?: () => void;
    onUrlSubmit?: (url: string) => void;
}

export function MissionInput({ onUpload, onUrlSubmit }: MissionInputProps) {
    const [urlInput, setUrlInput] = useState("");
    const [inputMode, setInputMode] = useState<"video" | "url">("url");

    const handleUrlSubmit = () => {
        if (urlInput.trim() && onUrlSubmit) {
            onUrlSubmit(urlInput.trim());
            setUrlInput("");
        } else if (inputMode === "video" && onUpload) {
            onUpload();
        }
    };

    return (
        <div className="w-full max-w-[400px]">
            {/* Tab Toggles - Outside the box for cleaner look */}
            <div className="flex gap-4 mb-3 px-1">
                <button
                    onClick={() => setInputMode("url")}
                    className={cn(
                        "text-xs lg:text-sm font-medium flex items-center gap-2 transition-colors",
                        inputMode === "url" ? "text-brand-turquoise" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <Link className="w-3.5 h-3.5" />
                    URL
                </button>
                <div className="w-px h-4 bg-white/10 my-auto" />
                <button
                    onClick={() => setInputMode("video")}
                    className={cn(
                        "text-xs lg:text-sm font-medium flex items-center gap-2 transition-colors",
                        inputMode === "video" ? "text-brand-turquoise" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <Film className="w-3.5 h-3.5" />
                    Video
                </button>
            </div>

            {/* Compact Blue Box */}
            <div className="bg-brand-turquoise/5 border border-brand-turquoise/20 rounded-xl p-2 relative group overflow-hidden transition-all hover:bg-brand-turquoise/10 hover:border-brand-turquoise/30 hover:shadow-[0_0_20px_-10px_rgba(31,213,249,0.3)]">
                <AnimatePresence mode="wait">
                    {inputMode === "video" ? (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={onUpload}
                        >
                            <div className="h-10 w-10 rounded-lg bg-brand-turquoise text-black flex items-center justify-center shrink-0">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Upload recording</p>
                                <p className="text-xs text-brand-turquoise/80 truncate">Supports .mp4, .mov</p>
                            </div>
                            <div className="pr-2">
                                <ArrowRight className="w-4 h-4 text-brand-turquoise group-hover:translate-x-1 transition-transform" />
                            </div>
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
                                    placeholder="Paste Url Here"
                                    className="w-full bg-black/20 border border-brand-turquoise/10 rounded-lg pl-3 pr-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-turquoise/40 font-mono transition-all"
                                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleUrlSubmit}
                                disabled={!urlInput.trim()}
                                className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                    urlInput.trim()
                                        ? "bg-brand-turquoise text-black hover:bg-brand-turquoise/90"
                                        : "bg-white/5 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
