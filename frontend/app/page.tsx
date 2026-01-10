// ... imports
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Square, RotateCcw } from "lucide-react";
import { MicrofilmViewer } from "@/components/dashboard/VideoFeed";
import { ActionList, type Action, type ActionStatus } from "@/components/dashboard/ActionList";
import { BrowserView } from "@/components/dashboard/BrowserView";
import { DraggableLog } from "@/components/dashboard/DraggableLog";
import { type LogEntry, type LogType } from "@/components/dashboard/TerminalLog";
import { cn } from "@/lib/utils";

// System status types
type SystemStatus = "IDLE" | "ANALYZING" | "RUNNING" | "COMPLETE";
type ViewMode = "upload" | "execution";

// Mock actions that will be executed
const MOCK_ACTIONS: Omit<Action, "status">[] = [
    {
        id: "1",
        index: 1,
        type: "NAVIGATE",
        description: "Access target portal",
        target: "https://target-site.com/login",
    },
    {
        id: "2",
        index: 2,
        type: "WAIT",
        description: "Confirm page loaded",
        target: "document.readyState",
    },
    {
        id: "3",
        index: 3,
        type: "TYPE",
        description: "Input username field",
        target: "input#username",
    },
    {
        id: "4",
        index: 4,
        type: "TYPE",
        description: "Input password field",
        target: "input#password",
    },
    {
        id: "5",
        index: 5,
        type: "CLICK",
        description: "Submit credentials",
        target: "button.submit",
    },
    {
        id: "6",
        index: 6,
        type: "WAIT",
        description: "Verify access granted",
        target: "dashboard.visible",
    },
];

// Helper to generate timestamps
function getTimestamp(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
}

// Helper to generate unique IDs
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export default function CaseFilePage() {
    const [viewMode, setViewMode] = useState<ViewMode>("upload");
    const [status, setStatus] = useState<SystemStatus>("IDLE");
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const completionHandled = useRef(false);

    // Derive current action description
    const currentAction = currentStep >= 0 && currentStep < actions.length ? actions[currentStep] : null;
    const currentActionDescription = currentAction ? `${currentAction.type}: ${currentAction.description}` : "";

    // Add a log entry
    const addLog = useCallback((type: LogType, message: string) => {
        setLogs((prev) => [
            ...prev,
            {
                id: generateId(),
                timestamp: getTimestamp(),
                type,
                message,
            },
        ]);
    }, []);

    // Initialize actions with pending status
    const initializeActions = useCallback(() => {
        setActions(
            MOCK_ACTIONS.map((action) => ({
                ...action,
                status: "pending" as ActionStatus,
            }))
        );
    }, []);

    // Handle video upload (simulated)
    const handleVideoUpload = useCallback(() => {
        setIsVideoLoaded(true);
        setStatus("ANALYZING");
        setViewMode("execution"); // Transition to split-screen
        addLog("SYSTEM", "SURVEILLANCE FILM LOADED");
        addLog("SUBJ", "INITIATING FRAME ANALYSIS...");

        // Simulate analysis delay
        setTimeout(() => {
            addLog("SUBJ", "FRAME EXTRACTION COMPLETE - 247 FRAMES");
            addLog("SUBJ", "SCANNING FOR UI ELEMENTS...");
        }, 1000);

        setTimeout(() => {
            addLog("SUBJ", "LOGIN BUTTON IDENTIFIED");
            addLog("SUBJ", "INPUT FIELDS DETECTED [2]");
            addLog("CONFIRM", "ANALYSIS COMPLETE - 6 ACTIONS QUEUED");
            initializeActions();
            setStatus("IDLE");
        }, 2500);
    }, [addLog, initializeActions]);

    // Run mission simulation
    const runMission = useCallback(() => {
        if (actions.length === 0) return;

        setStatus("RUNNING");
        setCurrentStep(0);
        addLog("SYSTEM", "EXECUTION SEQUENCE INITIATED");
    }, [actions.length, addLog]);

    // Stop mission
    const stopMission = useCallback(() => {
        setStatus("IDLE");
        setCurrentStep(-1);
        addLog("ERROR", "OPERATION ABORTED BY OPERATOR");
    }, [addLog]);

    // Effect to handle step progression during RUNNING status
    useEffect(() => {
        if (status !== "RUNNING" || currentStep < 0) {
            completionHandled.current = false;
            return;
        }

        if (currentStep >= actions.length) {
            if (!completionHandled.current) {
                completionHandled.current = true;
                setTimeout(() => {
                    setStatus("COMPLETE");
                    addLog("CONFIRM", "ALL ACTIONS EXECUTED SUCCESSFULLY");
                    addLog("SYSTEM", "CASE FILE COMPLETE");
                }, 0);
            }
            return;
        }

        const currentAction = actions[currentStep];

        // Use setTimeout to update actions state (avoids sync setState in effect)
        const updateTimer = setTimeout(() => {
            setActions((prev) =>
                prev.map((action, idx) => ({
                    ...action,
                    status:
                        idx < currentStep
                            ? "complete"
                            : idx === currentStep
                                ? "active"
                                : "pending",
                }))
            );
            addLog("ACTION", `${currentAction.type} - ${currentAction.description.toUpperCase()}`);

            if (currentAction.type === "CLICK" || currentAction.type === "TYPE") {
                setTimeout(() => {
                    addLog("SUBJ", `ELEMENT LOCATED: ${currentAction.target}`);
                }, 500);
            }
        }, 0);

        // Progress to next step after delay
        const progressTimer = setTimeout(() => {
            setActions((prev) =>
                prev.map((action, idx) => ({
                    ...action,
                    status: idx <= currentStep ? "complete" : action.status,
                }))
            );
            addLog("CONFIRM", `STEP ${currentStep + 1} COMPLETE`);
            setCurrentStep((prev) => prev + 1);
        }, 2000);

        return () => {
            clearTimeout(updateTimer);
            clearTimeout(progressTimer);
        };
    }, [status, currentStep, actions, addLog]);

    // Reset functionality
    const resetMission = useCallback(() => {
        setStatus("IDLE");
        setIsVideoLoaded(false);
        setActions([]);
        setLogs([]);
        setCurrentStep(-1);

        setViewMode("upload"); // Go back to upload screen
    }, []);

    return (
        <div className="min-h-screen w-screen bg-background text-foreground grid-bg">
            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-turquoise/5 rounded-full blur-[100px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {viewMode === "upload" ? (
                    /* Full Screen Upload View - Horizontal Layout */
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MicrofilmViewer
                            isLoaded={isVideoLoaded}
                            isAnalyzing={status === "ANALYZING"}
                            onUpload={handleVideoUpload}
                            fullScreen
                        />
                    </motion.div>
                ) : (
                    /* Split Screen Execution View */
                    <motion.div
                        key="execution"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="min-h-screen flex flex-col relative z-10"
                    >
                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-6 lg:px-8 py-4 lg:py-5 border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                                    <Image src="/dooley-favicon.png" alt="Dooley" width={32} height={32} className="object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-wide font-display">
                                        Dooley
                                    </h1>
                                    <p className="text-xs lg:text-sm text-muted-foreground">
                                        Mission Control
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={cn(
                                "px-4 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium border shadow-sm backdrop-blur-sm",
                                status === "IDLE" && "bg-white/5 border-white/10 text-muted-foreground",
                                status === "ANALYZING" && "bg-brand-turquoise/10 border-brand-turquoise/20 text-brand-turquoise",
                                status === "RUNNING" && "bg-primary/10 border-primary/20 text-primary",
                                status === "COMPLETE" && "bg-green-500/10 border-green-500/20 text-green-400"
                            )}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full",
                                        status === "IDLE" && "bg-muted-foreground",
                                        status === "ANALYZING" && "bg-brand-turquoise animate-pulse",
                                        status === "RUNNING" && "bg-primary animate-pulse",
                                        status === "COMPLETE" && "bg-green-500"
                                    )} />
                                    {status === "IDLE" && "Ready"}
                                    {status === "ANALYZING" && "Analyzing..."}
                                    {status === "RUNNING" && "Running"}
                                    {status === "COMPLETE" && "Complete"}
                                </div>
                            </div>
                        </div>

                        {/* Main Split Screen Content */}
                        <div className="relative z-10 flex-1 flex flex-col lg:flex-row p-4 lg:p-6 xl:p-8 gap-4 lg:gap-6 xl:gap-8 overflow-hidden">
                            {/* Left Panel - Action Queue (40%) */}
                            <div className="lg:w-[40%] flex flex-col">
                                <div className="flex-1 bg-card border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 flex flex-col shadow-2xl overflow-hidden glass-card">
                                    <ActionList actions={actions} className="flex-1 min-h-0" />

                                    {/* Action Button */}
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        {status === "RUNNING" ? (
                                            <motion.button
                                                onClick={stopMission}
                                                className="w-full py-3 lg:py-3.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors shadow-sm"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Square className="w-4 h-4 lg:w-5 lg:h-5" />
                                                Stop Execution
                                            </motion.button>
                                        ) : status === "COMPLETE" ? (
                                            <motion.button
                                                onClick={resetMission}
                                                className="w-full py-3 lg:py-3.5 rounded-xl bg-white/10 text-foreground border border-white/10 font-medium text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-white/20 transition-colors shadow-sm"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5" />
                                                Start New Mission
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={runMission}
                                                disabled={actions.length === 0}
                                                className={cn(
                                                    "w-full py-3 lg:py-3.5 rounded-xl font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all shadow-sm",
                                                    actions.length > 0
                                                        ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                        : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
                                                )}
                                                whileTap={actions.length > 0 ? { scale: 0.98 } : {}}
                                            >
                                                <Play className="w-4 h-4 lg:w-5 lg:h-5" />
                                                Execute Actions
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Browser View (60%) */}
                            <div className="lg:w-[60%] h-full min-h-0">
                                <BrowserView
                                    isAnalyzing={status === "ANALYZING"}
                                    isRunning={status === "RUNNING"}
                                    currentAction={currentActionDescription}
                                    className="h-full"
                                    darkMode={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Draggable Log - Only show in execution mode */}
            {viewMode === "execution" && (
                <DraggableLog
                    logs={logs}
                    darkMode={true}
                />
            )}
        </div>
    );
}
