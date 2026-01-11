"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Square, RotateCcw } from "lucide-react";
import { ActionList, type Action, type ActionStatus } from "@/components/dashboard/ActionList";
import { BrowserView } from "@/components/dashboard/BrowserView";
import { DraggableLog } from "@/components/dashboard/DraggableLog";
import { type LogEntry, type LogType } from "@/components/dashboard/TerminalLog";
import { cn } from "@/lib/utils";

import { LiveKitHero } from "@/components/hero/LiveKitHero";
import { MissionInput } from "@/components/landing/MissionInput";
import { LandingContent } from "@/components/landing/LandingContent";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { HowItWorks } from "@/components/sections/HowItWorks";

// API imports
import {
    analyzeVideo,
    analyzeUrl,
    startExecution,
    subscribeToExecution,
    type ExecutionPlan,
    type ActionStep,
} from "@/lib/api";

// System status types
type SystemStatus = "IDLE" | "ANALYZING" | "RUNNING" | "COMPLETE" | "ERROR";
type ViewMode = "setup" | "execution";

// Helper to generate timestamps
function getTimestamp(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
}

// Helper to generate unique IDs
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

// Map backend ActionStep to frontend Action type
function mapActionStepToAction(step: ActionStep): Action {
    return {
        id: String(step.id),
        index: step.id,
        type: step.action_type === "SCROLL" ? "WAIT" : step.action_type, // Map SCROLL to WAIT for now
        description: step.description,
        status: "pending" as ActionStatus,
        target: step.value || step.cached_selector || undefined,
    };
}

export default function CaseFilePage() {
    const [viewMode, setViewMode] = useState<ViewMode>("setup");
    const [status, setStatus] = useState<SystemStatus>("IDLE");
    const [actions, setActions] = useState<Action[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const completionHandled = useRef(false);
    const inputSectionRef = useRef<HTMLDivElement>(null);
    const sseCleanupRef = useRef<(() => void) | null>(null);

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

    // Handle video file upload
    const handleVideoUpload = useCallback(async (file: File) => {
        setStatus("ANALYZING");
        setIsAnalyzing(true);
        setViewMode("execution");
        addLog("SYSTEM", `VIDEO LOADED: ${file.name}`);
        addLog("SUBJ", "UPLOADING TO ANALYSIS ENGINE...");

        try {
            const plan = await analyzeVideo(file);
            setExecutionPlan(plan);

            const mappedActions = plan.steps.map(mapActionStepToAction);
            setActions(mappedActions);

            addLog("SUBJ", `FRAME ANALYSIS COMPLETE`);
            addLog("CONFIRM", `${plan.steps.length} ACTIONS EXTRACTED`);
            if (plan.source_url) {
                addLog("SUBJ", `SOURCE URL DETECTED: ${plan.source_url}`);
            }
            setStatus("IDLE");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addLog("ERROR", `ANALYSIS FAILED: ${errorMessage}`);
            setStatus("ERROR");
        } finally {
            setIsAnalyzing(false);
        }
    }, [addLog]);

    // Handle URL submission
    const handleUrlSubmit = useCallback(async (url: string) => {
        setStatus("ANALYZING");
        setIsAnalyzing(true);
        setViewMode("execution");
        addLog("SYSTEM", `URL SUBMITTED: ${url}`);
        addLog("SUBJ", "DOWNLOADING AND ANALYZING VIDEO...");

        try {
            const plan = await analyzeUrl(url);
            setExecutionPlan(plan);

            const mappedActions = plan.steps.map(mapActionStepToAction);
            setActions(mappedActions);

            addLog("SUBJ", `VIDEO ANALYSIS COMPLETE`);
            addLog("CONFIRM", `${plan.steps.length} ACTIONS EXTRACTED`);
            if (plan.source_url) {
                addLog("SUBJ", `SOURCE URL DETECTED: ${plan.source_url}`);
            }
            setStatus("IDLE");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addLog("ERROR", `ANALYSIS FAILED: ${errorMessage}`);
            setStatus("ERROR");
        } finally {
            setIsAnalyzing(false);
        }
    }, [addLog]);

    // Run mission with real execution
    const runMission = useCallback(async () => {
        if (actions.length === 0 || !executionPlan) return;

        setStatus("RUNNING");
        setCurrentStep(0);
        addLog("SYSTEM", "EXECUTION SEQUENCE INITIATED");

        try {
            const executionId = crypto.randomUUID();
            await startExecution(executionId, executionPlan);

            addLog("SUBJ", `EXECUTION ID: ${executionId}`);
            addLog("SUBJ", "CONNECTING TO LIVE STREAM...");

            // Subscribe to SSE for real-time updates
            const cleanup = subscribeToExecution(executionId, {
                onActionUpdate: (stepId, actionStatus, screenshot) => {
                    setActions(prev => prev.map(action => {
                        if (action.id === String(stepId)) {
                            return {
                                ...action,
                                status: actionStatus === "running" ? "active"
                                    : actionStatus === "complete" ? "complete"
                                        : "pending"
                            };
                        }
                        // Mark previous steps as complete
                        if (parseInt(action.id) < stepId && actionStatus === "running") {
                            return { ...action, status: "complete" };
                        }
                        return action;
                    }));
                    setCurrentStep(stepId - 1); // stepId is 1-indexed
                },
                onLog: (message, level) => {
                    const logType: LogType = level === "error" ? "ERROR"
                        : level === "success" ? "CONFIRM"
                            : "SUBJ";
                    addLog(logType, message.toUpperCase());
                },
                onComplete: () => {
                    setStatus("COMPLETE");
                    addLog("CONFIRM", "ALL ACTIONS EXECUTED SUCCESSFULLY");
                    addLog("SYSTEM", "MISSION COMPLETE");
                },
                onError: (error) => {
                    addLog("ERROR", error.toUpperCase());
                    setStatus("ERROR");
                },
            });

            sseCleanupRef.current = cleanup;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addLog("ERROR", `EXECUTION FAILED: ${errorMessage}`);
            setStatus("ERROR");
        }
    }, [actions.length, executionPlan, addLog]);

    // Stop mission
    const stopMission = useCallback(() => {
        if (sseCleanupRef.current) {
            sseCleanupRef.current();
            sseCleanupRef.current = null;
        }
        setStatus("IDLE");
        setCurrentStep(-1);
        addLog("ERROR", "OPERATION ABORTED BY OPERATOR");
    }, [addLog]);

    // Reset functionality
    const resetMission = useCallback(() => {
        if (sseCleanupRef.current) {
            sseCleanupRef.current();
            sseCleanupRef.current = null;
        }
        setStatus("IDLE");
        setActions([]);
        setLogs([]);
        setCurrentStep(-1);
        setViewMode("setup");
        setExecutionPlan(null);
    }, []);

    const scrollToInput = () => {
        inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Header Component
    const Header = () => (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center gap-3">
                <Image src="/Dooley.png" alt="Dooley" width={32} height={32} className="object-contain" />
                <h1 className="text-xl font-normal text-foreground font-display tracking-tighter">Dooley</h1>
            </div>

            <div className="flex items-center gap-6">
                <a href="https://github.com/jimmysamportfolio/dooley" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-brand-turquoise transition-colors hidden sm:block">
                    Github
                </a>
                <a href="https://devpost.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-brand-turquoise transition-colors hidden sm:block">
                    Devpost
                </a>

                <motion.a
                    href="https://journeyhacks.sfusurge.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 bg-brand-turquoise text-black hover:bg-brand-turquoise/90"
                >
                    Journey Hacks 2026
                    <Play className="w-3 h-3 ml-1 fill-current" />
                </motion.a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-screen bg-background text-foreground grid-bg relative overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-turquoise/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Global Header (except execution mode which has its own panel header) */}
            {viewMode !== "execution" && <Header />}

            <AnimatePresence mode="wait">
                {viewMode === "setup" ? (
                    /* Unified Setup View */
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className="min-h-screen flex flex-col pt-16"
                    >
                        {/* Hero with Input - Pass Input as Children */}
                        <div ref={inputSectionRef}>
                            <LiveKitHero>
                                <MissionInput onUpload={handleVideoUpload} onUrlSubmit={handleUrlSubmit} isLoading={isAnalyzing} />
                            </LiveKitHero>
                        </div>

                        {/* Tech Stack Section */}
                        <TechStackSection />

                        {/* How It Works Section */}
                        <HowItWorks />

                        {/* Landing Content */}
                        <LandingContent />
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
                        {/* Header for Execution Mode */}
                        <div className="relative z-10 flex items-center justify-between px-6 lg:px-8 py-4 lg:py-5 border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                                    <Image src="/Dooley.png" alt="Dooley" width={32} height={32} className="object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-normal text-foreground tracking-tighter font-display">
                                        Dooley
                                    </h1>
                                    <p className="text-xs lg:text-sm text-muted-foreground">
                                        Execution
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={cn(
                                "px-4 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium border shadow-sm backdrop-blur-sm",
                                status === "IDLE" && "bg-white/5 border-white/10 text-muted-foreground",
                                status === "ANALYZING" && "bg-brand-turquoise/10 border-brand-turquoise/20 text-brand-turquoise",
                                status === "RUNNING" && "bg-brand-turquoise/10 border-brand-turquoise/20 text-brand-turquoise",
                                status === "COMPLETE" && "bg-green-500/10 border-green-500/20 text-green-400"
                            )}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full",
                                        status === "IDLE" && "bg-muted-foreground",
                                        status === "ANALYZING" && "bg-brand-turquoise animate-pulse",
                                        status === "RUNNING" && "bg-brand-turquoise animate-pulse",
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
                                                className="w-full py-3 lg:py-3.5 rounded-xl bg-brand-turquoise/10 text-brand-turquoise border border-brand-turquoise/20 font-medium text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-brand-turquoise/20 transition-colors shadow-sm"
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
                                                        ? "bg-brand-turquoise text-black hover:bg-brand-turquoise/90 shadow-lg shadow-brand-turquoise/20"
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
