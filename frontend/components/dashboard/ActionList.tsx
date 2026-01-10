"use client";

import { motion } from "framer-motion";
import { Check, MousePointer, Type, Navigation, Clock } from "lucide-react";
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
}

const actionIcons = {
    CLICK: MousePointer,
    TYPE: Type,
    NAVIGATE: Navigation,
    WAIT: Clock,
};

// Punch card style checkbox
function PunchCardCheckbox({ checked, active }: { checked: boolean; active: boolean }) {
    return (
        <div
            className={cn(
                "w-5 h-5 border-2 border-jet flex items-center justify-center text-xs font-bold",
                checked && "bg-jet text-ivory",
                active && !checked && "border-red-ink",
                !checked && !active && "bg-ivory"
            )}
        >
            {checked && "X"}
            {active && !checked && (
                <motion.div
                    className="w-2 h-2 bg-red-ink rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
            )}
        </div>
    );
}

function ActionCard({ action }: { action: Action }) {
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
                "relative p-3 rounded-sm border transition-all duration-200",
                isPending && "bg-ivory/50 border-kraft/50 opacity-60",
                isActive && "bg-ivory border-red-ink border-2 shadow-md",
                isComplete && "bg-ivory border-kraft"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Punch card checkbox */}
                <PunchCardCheckbox checked={isComplete} active={isActive} />

                {/* Step number */}
                <div
                    className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm font-bold border",
                        isPending && "bg-ivory border-kraft/50 text-typewriter/50",
                        isActive && "bg-kraft border-kraft-dark text-jet",
                        isComplete && "bg-jet border-jet text-ivory"
                    )}
                >
                    {String(action.index).padStart(2, "0")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon
                            className={cn(
                                "w-3 h-3",
                                isPending && "text-typewriter/50",
                                isActive && "text-red-ink",
                                isComplete && "text-jet"
                            )}
                        />
                        <span
                            className={cn(
                                "font-mono text-[10px] uppercase tracking-wider",
                                isPending && "text-typewriter/50",
                                isActive && "text-red-ink font-bold",
                                isComplete && "text-jet"
                            )}
                        >
                            {action.type}
                        </span>
                    </div>
                    <p
                        className={cn(
                            "text-sm",
                            isPending && "text-typewriter/50",
                            isActive && "text-jet font-medium",
                            isComplete && "text-typewriter line-through"
                        )}
                        style={{ fontFamily: 'Courier Prime' }}
                    >
                        {action.description}
                    </p>
                    {action.target && (
                        <p className="mt-1 font-mono text-[10px] text-typewriter/60 truncate">
                            TARGET: {action.target}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function ActionList({ actions, className }: ActionListProps) {
    const completedCount = actions.filter((a) => a.status === "complete").length;

    return (
        <div className={cn("h-full flex flex-col", className)}>
            {/* Header - stamped style */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-kraft">
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs uppercase tracking-widest text-red-ink font-bold"
                        style={{ fontFamily: 'Roboto Slab' }}
                    >
                        ▶ ACTION QUEUE
                    </span>
                </div>
                <span className="text-[10px] font-mono text-typewriter">
                    [{completedCount}/{actions.length}] COMPLETE
                </span>
            </div>

            {/* Action Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-paper">
                {actions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center p-6 border-2 border-dashed border-kraft rounded-sm">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-sm bg-kraft/20 flex items-center justify-center border border-kraft">
                                <Navigation className="w-5 h-5 text-typewriter" />
                            </div>
                            <p className="text-sm text-typewriter font-mono uppercase">NO ACTIONS QUEUED</p>
                            <p className="text-[10px] text-typewriter/60 mt-1 font-mono">
                                Insert surveillance film to begin
                            </p>
                        </div>
                    </div>
                ) : (
                    actions.map((action) => (
                        <ActionCard key={action.id} action={action} />
                    ))
                )}
            </div>
        </div>
    );
}
