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
}

const logPrefixes: Record<LogType, string> = {
    SUBJ: "SUBJ:",
    ACTION: "ACTION:",
    SYSTEM: "SYS:",
    ERROR: "ERR:",
    CONFIRM: "CONFIRM:",
};

function LogLine({ entry }: { entry: LogEntry }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="py-0.5 font-mono text-xs leading-relaxed"
            style={{ fontFamily: 'JetBrains Mono' }}
        >
            <span className="text-typewriter/50">{entry.timestamp}</span>
            <span className="mx-2 text-typewriter/30">|</span>
            <span className={cn(
                "font-bold",
                entry.type === "SUBJ" && "text-jet",
                entry.type === "ACTION" && "text-kraft-dark",
                entry.type === "SYSTEM" && "text-typewriter",
                entry.type === "ERROR" && "text-red-ink",
                entry.type === "CONFIRM" && "text-green-800"
            )}>
                {logPrefixes[entry.type]}
            </span>
            <span className="ml-2 text-jet">{entry.message}</span>
        </motion.div>
    );
}

export function TeletypeLog({ logs, className }: TeletypeLogProps) {
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
                "flex flex-col bg-ivory border border-kraft rounded-sm overflow-hidden",
                className
            )}
        >
            {/* Receipt paper header with perforated edge effect */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-kraft bg-ivory">
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs uppercase tracking-widest text-jet font-bold"
                        style={{ fontFamily: 'Roboto Slab' }}
                    >
                        ▶ TELETYPE LOG
                    </span>
                </div>
                <span className="text-[10px] font-mono text-typewriter">
                    {logs.length} ENTRIES
                </span>
            </div>

            {/* Perforated edge decoration */}
            <div className="h-2 bg-ivory border-b border-dashed border-kraft/50 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-full flex justify-around">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-kraft/30" />
                    ))}
                </div>
            </div>

            {/* Log Content - receipt/teletype paper style */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-2 scrollbar-paper"
                style={{
                    background: 'repeating-linear-gradient(transparent, transparent 19px, rgba(212, 162, 127, 0.1) 20px)'
                }}
            >
                <AnimatePresence>
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-typewriter/50 font-mono text-xs">
                                <p>--- AWAITING INPUT ---</p>
                                <p className="mt-1 text-[10px]">Teletype ready for transmission</p>
                            </div>
                        </div>
                    ) : (
                        logs.map((entry) => <LogLine key={entry.id} entry={entry} />)
                    )}
                </AnimatePresence>

                {/* Cursor at end */}
                {logs.length > 0 && (
                    <div className="flex items-center py-1 font-mono text-xs">
                        <span className="text-typewriter">&gt;</span>
                        <motion.span
                            className="w-2 h-3 bg-jet ml-1"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
