"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type LogType = "SUBJ" | "ACTION" | "SYSTEM" | "ERROR" | "CONFIRM";

export interface LogEntry {
    id: string;
    timestamp: string;
    type: LogType;
    message: string;
}

interface TeletypeLogProps {
    logs: LogEntry[];
    className?: string;
    hideHeader?: boolean;
    darkMode?: boolean;
}

const logPrefixes: Record<LogType, string> = {
    SUBJ: "SUBJ:",
    ACTION: "ACTION:",
    SYSTEM: "SYS:",
    ERROR: "ERR:",
    CONFIRM: "CONFIRM:",
};

function LogLine({ entry }: { entry: LogEntry; darkMode?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="py-0.5 font-mono text-xs leading-relaxed border-l-2 border-transparent hover:border-white/10 hover:bg-white/5 px-2 -mx-2 rounded-sm transition-colors"
        >
            <span className="text-muted-foreground/40">{entry.timestamp}</span>
            <span className="mx-2 text-muted-foreground/20">|</span>
            <span className={cn(
                "font-bold",
                entry.type === "SUBJ" && "text-foreground",
                entry.type === "ACTION" && "text-brand-persimmon",
                entry.type === "SYSTEM" && "text-muted-foreground",
                entry.type === "ERROR" && "text-red-400",
                entry.type === "CONFIRM" && "text-brand-turquoise"
            )}>
                {logPrefixes[entry.type]}
            </span>
            <span className="ml-2 text-foreground/90">{entry.message}</span>
        </motion.div>
    );
}

export function TeletypeLog({ logs, className, hideHeader, darkMode = true }: TeletypeLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div
            className={cn(
                "flex flex-col rounded-xl overflow-hidden glass",
                className
            )}
        >
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest font-bold text-foreground font-display">
                            ▶ TELETYPE LOG
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                        {logs.length} ENTRIES
                    </span>
                </div>
            )}

            {/* Log Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin"
            >
                <AnimatePresence>
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center font-mono text-xs text-muted-foreground/50">
                                <p>--- AWAITING INPUT ---</p>
                                <p className="mt-1 text-[10px]">Teletype ready for transmission</p>
                            </div>
                        </div>
                    ) : (
                        logs.map((entry) => <LogLine key={entry.id} entry={entry} darkMode={true} />)
                    )}
                </AnimatePresence>

                {/* Cursor at end */}
                {logs.length > 0 && (
                    <div className="flex items-center py-1 font-mono text-xs">
                        <span className="text-muted-foreground">&gt;</span>
                        <motion.span
                            className="w-2 h-3 ml-1 bg-primary"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
