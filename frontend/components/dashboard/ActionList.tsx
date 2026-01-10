"use client";

import { motion } from "framer-motion";
import { MousePointer, Type, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionStatus = "pending" | "active" | "complete";

export interface Action {
    id: string;
    index: number;
    type: "CLICK" | "TYPE" | "NAVIGATE" | "WAIT";
    description: string;
    status: ActionStatus;
    target?: string;
}

interface ActionListProps {
    actions: Action[];
    className?: string;
    darkMode?: boolean;
}

const actionIcons = {
    CLICK: MousePointer,
    TYPE: Type,
    NAVIGATE: Navigation,
    WAIT: Clock,
};

// Punch card style checkbox
function PunchCardCheckbox({ checked, active, darkMode = true }: { checked: boolean; active: boolean; darkMode?: boolean }) {
    return (
        <div
            className={cn(
                "w-5 h-5 border flex items-center justify-center text-xs font-bold rounded-sm transition-colors",
                checked
                    ? "bg-primary border-primary text-black"
                    : active
                        ? "border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise"
                        : "border-white/20 bg-transparent text-transparent"
            )}
        >
            {checked && "✓"}
            {active && !checked && (
                <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-brand-turquoise"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
            )}
        </div>
    );
}

function ActionCard({ action, darkMode = true }: { action: Action; darkMode?: boolean }) {
    const Icon = actionIcons[action.type];
    const isPending = action.status === "pending";
    const isActive = action.status === "active";
    const isComplete = action.status === "complete";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative p-3 lg:p-4 rounded-lg border transition-all duration-200",
                isPending && "bg-white/[0.02] border-white/5 opacity-50",
                isActive && "bg-white/[0.08] border-brand-turquoise/30 shadow-[0_0_15px_rgba(31,213,249,0.1)]",
                isComplete && "bg-white/[0.02] border-white/5"
            )}
        >
            <div className="flex items-start gap-3 lg:gap-4">
                {/* Punch card checkbox */}
                <PunchCardCheckbox checked={isComplete} active={isActive} darkMode={true} />

                {/* Step number */}
                <div
                    className={cn(
                        "flex-shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-md flex items-center justify-center font-mono text-sm lg:text-base font-bold border",
                        isPending && "bg-white/5 border-white/5 text-muted-foreground",
                        isActive && "bg-brand-turquoise/20 border-brand-turquoise/30 text-brand-turquoise",
                        isComplete && "bg-white/10 border-white/10 text-foreground"
                    )}
                >
                    {String(action.index).padStart(2, "0")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Icon
                            className={cn(
                                "w-3.5 h-3.5 lg:w-4 lg:h-4",
                                isPending && "text-muted-foreground",
                                isActive && "text-brand-turquoise",
                                isComplete && "text-foreground"
                            )}
                        />
                        <span
                            className={cn(
                                "font-mono text-[10px] lg:text-xs uppercase tracking-wider",
                                isPending && "text-muted-foreground",
                                isActive && "text-brand-turquoise font-bold",
                                isComplete && "text-foreground"
                            )}
                        >
                            {action.type}
                        </span>
                    </div>
                    <p
                        className={cn(
                            "text-sm lg:text-base font-sans",
                            isPending && "text-muted-foreground",
                            isActive && "text-foreground font-medium",
                            isComplete && "text-muted-foreground line-through decoration-white/20"
                        )}
                    >
                        {action.description}
                    </p>
                    {action.target && (
                        <p className="mt-1.5 font-mono text-[10px] lg:text-xs truncate text-muted-foreground/60">
                            TARGET: {action.target}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function ActionList({ actions, className, darkMode = true }: ActionListProps) {
    const completedCount = actions.filter((a) => a.status === "complete").length;

    return (
        <div className={cn("h-full flex flex-col", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-xs lg:text-sm uppercase tracking-widest font-bold text-brand-persimmon font-display">
                        ▶ ACTION QUEUE
                    </span>
                </div>
                <span className="text-[10px] lg:text-xs font-mono text-muted-foreground">
                    [{completedCount}/{actions.length}] COMPLETE
                </span>
            </div>

            {/* Action Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-2.5 lg:space-y-3 pr-1 scrollbar-thin">
                {actions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center p-6 lg:p-8 border-2 border-dashed border-white/10 rounded-xl">
                            <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-3 lg:mb-4 rounded-xl flex items-center justify-center border bg-white/5 border-white/10">
                                <Navigation className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm lg:text-base font-mono uppercase text-muted-foreground">
                                NO ACTIONS QUEUED
                            </p>
                            <p className="text-xs lg:text-sm mt-1 font-mono text-muted-foreground/50">
                                Upload a video to begin
                            </p>
                        </div>
                    </div>
                ) : (
                    actions.map((action) => (
                        <ActionCard key={action.id} action={action} darkMode={true} />
                    ))
                )}
            </div>
        </div>
    );
}
