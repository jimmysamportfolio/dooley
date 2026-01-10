// ... imports
import { useState, useRef, useEffect } from "react";
import { motion, useDragControls, PanInfo } from "framer-motion";
import { GripHorizontal, Minimize2, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeletypeLog, type LogEntry } from "./TerminalLog";

interface DraggableLogProps {
    logs: LogEntry[];
    className?: string;
    darkMode?: boolean;
}

export function DraggableLog({ logs, className, darkMode }: DraggableLogProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const constraintsRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    // Set initial position to bottom-right on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Use setTimeout to avoid synchronous state update in effect warning
            const timer = setTimeout(() => {
                setPosition({
                    x: window.innerWidth - 420,
                    y: window.innerHeight - 320,
                });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        setPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
        }));
    };

    if (!isVisible) {
        return (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform border",
                    "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                )}
                onClick={() => setIsVisible(true)}
            >
                <span className="text-xs font-mono font-bold">
                    {logs.length}
                </span>
            </motion.button>
        );
    }

    return (
        <>
            {/* Invisible constraints container */}
            <div
                ref={constraintsRef}
                className="fixed inset-4 pointer-events-none z-40"
            />

            <motion.div
                drag
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={constraintsRef}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                initial={{ x: position.x, y: position.y, opacity: 0, scale: 0.9 }}
                animate={{
                    x: position.x,
                    y: position.y,
                    opacity: 1,
                    scale: 1,
                }}
                className={cn(
                    "fixed z-50 w-[380px] rounded-xl overflow-hidden border backdrop-blur-xl bg-black/80 border-white/10 box-shadow-xl",
                    isDragging && "shadow-2xl cursor-grabbing",
                    className
                )}
                style={{ touchAction: "none" }}
            >
                {/* Drag Handle Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 draggable-handle cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="flex items-center gap-2">
                        <GripHorizontal className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-widest font-bold text-foreground font-display">
                            ▶ TELETYPE LOG
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono mr-2 text-muted-foreground">
                            {logs.length} ENTRIES
                        </span>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-muted-foreground hover:text-foreground"
                        >
                            {isMinimized ? (
                                <Maximize2 className="w-3.5 h-3.5" />
                            ) : (
                                <Minimize2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Collapsible Content */}
                <motion.div
                    initial={false}
                    animate={{
                        height: isMinimized ? 0 : "auto",
                        opacity: isMinimized ? 0 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <TeletypeLog
                        logs={logs}
                        className="h-48 rounded-none border-0 bg-transparent"
                        hideHeader
                        darkMode={true}
                    />
                </motion.div>
            </motion.div>
        </>
    );
}
