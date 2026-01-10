"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Square, FileText, Eye, Zap } from "lucide-react";
import { MicrofilmViewer } from "@/components/dashboard/VideoFeed";
import { ActionList, type Action, type ActionStatus } from "@/components/dashboard/ActionList";
import { TeletypeLog, type LogEntry, type LogType } from "@/components/dashboard/TerminalLog";
import { cn } from "@/lib/utils";

// System status types
type SystemStatus = "IDLE" | "ANALYZING" | "RUNNING" | "COMPLETE";
type TabType = "SURVEILLANCE" | "EVIDENCE" | "ACTION";

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

// Folder Tab Component
function FolderTab({
    label,
    icon: Icon,
    isActive,
    onClick
}: {
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative px-4 py-2 rounded-t-sm border border-b-0 transition-all",
                "font-bold text-xs uppercase tracking-wider flex items-center gap-2",
                isActive
                    ? "bg-ivory border-kraft text-jet z-10 -mb-px"
                    : "bg-kraft/30 border-kraft/50 text-typewriter hover:bg-kraft/50"
            )}
            style={{ fontFamily: 'Roboto Slab' }}
        >
            <Icon className="w-3 h-3" />
            {label}
        </button>
    );
}

export default function CaseFilePage() {
    const [status, setStatus] = useState<SystemStatus>("IDLE");
    const [activeTab, setActiveTab] = useState<TabType>("SURVEILLANCE");
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(-1);

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
        if (status !== "RUNNING" || currentStep < 0) return;

        if (currentStep >= actions.length) {
            setStatus("COMPLETE");
            addLog("CONFIRM", "ALL ACTIONS EXECUTED SUCCESSFULLY");
            addLog("SYSTEM", "CASE FILE COMPLETE");
            return;
        }

        // Update current action to active
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

        const currentAction = actions[currentStep];
        addLog("ACTION", `${currentAction.type} - ${currentAction.description.toUpperCase()}`);

        if (currentAction.type === "CLICK" || currentAction.type === "TYPE") {
            setTimeout(() => {
                addLog("SUBJ", `ELEMENT LOCATED: ${currentAction.target}`);
            }, 500);
        }

        // Progress to next step after delay
        const timer = setTimeout(() => {
            setActions((prev) =>
                prev.map((action, idx) => ({
                    ...action,
                    status: idx <= currentStep ? "complete" : action.status,
                }))
            );
            addLog("CONFIRM", `STEP ${currentStep + 1} COMPLETE`);
            setCurrentStep((prev) => prev + 1);
        }, 2000);

        return () => clearTimeout(timer);
    }, [status, currentStep, actions, addLog]);

    // Reset functionality
    const resetMission = useCallback(() => {
        setStatus("IDLE");
        setIsVideoLoaded(false);
        setActions([]);
        setLogs([]);
        setCurrentStep(-1);
    }, []);

    return (
        <div className="min-h-screen w-screen bg-manilla p-6 md:p-8">
            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-kraft rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                            <Image src="/dooley-favicon.png" alt="Dooley" width={36} height={36} className="object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-jet tracking-wide">
                                Dooley
                            </h1>
                            <p className="text-xs text-typewriter/70">
                                Automated Browser Agent
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={cn(
                        "px-4 py-2 rounded-full text-xs font-medium",
                        status === "IDLE" && "bg-gray-100 text-gray-600",
                        status === "ANALYZING" && "bg-amber-50 text-amber-700",
                        status === "RUNNING" && "bg-red-50 text-red-600",
                        status === "COMPLETE" && "bg-green-50 text-green-700"
                    )}>
                        {status === "IDLE" && "Ready"}
                        {status === "ANALYZING" && "Analyzing..."}
                        {status === "RUNNING" && "Running"}
                        {status === "COMPLETE" && "Complete"}
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-ivory rounded-2xl shadow-sm overflow-hidden">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[520px]">
                        {/* Left Panel - Input Viewer */}
                        <div className="lg:col-span-3 p-6">
                            <MicrofilmViewer
                                isLoaded={isVideoLoaded}
                                isAnalyzing={status === "ANALYZING"}
                                onUpload={handleVideoUpload}
                            />
                        </div>

                        {/* Right Panel - Action Queue */}
                        <div className="lg:col-span-2 p-6 bg-gray-50/50 flex flex-col">
                            <ActionList actions={actions} className="flex-1 min-h-0" />

                            {/* Action Button */}
                            <div className="mt-4 pt-4">
                                {status === "RUNNING" ? (
                                    <motion.button
                                        onClick={stopMission}
                                        className="w-full py-3 rounded-xl bg-red-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Square className="w-4 h-4" />
                                        Stop
                                    </motion.button>
                                ) : status === "COMPLETE" ? (
                                    <motion.button
                                        onClick={resetMission}
                                        className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Start New
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        onClick={runMission}
                                        disabled={actions.length === 0}
                                        className={cn(
                                            "w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
                                            actions.length > 0
                                                ? "bg-kraft text-jet hover:bg-kraft-dark"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        )}
                                        whileTap={actions.length > 0 ? { scale: 0.98 } : {}}
                                    >
                                        <Play className="w-4 h-4" />
                                        Execute
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Log Panel */}
                    <div className="border-t border-gray-100">
                        <TeletypeLog logs={logs} className="h-40 rounded-none border-0" />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-typewriter/40">
                        Stillwater · Journey Hacks 2026
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

