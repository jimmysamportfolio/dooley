"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Terminal, Code2, Cpu, Eye, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// The Data: What shows up for each tab
const tabs = [
    {
        id: "gemini",
        label: "Gemini 3.0 Pro",
        subtitle: "The Vision Engine",
        icon: Sparkles,
        color: "#1FD5F9", // Brand Cyan
        description: "Multimodal reasoning that understands video context frame-by-frame. It doesn't just see pixels; it decodes user intent, identifying buttons and flows even when layouts change.",
        features: ["1M+ Token Context Window", "Native Video Understanding", "Zero-Shot UI Analysis"],
        visualIcon: Eye,
        image: "/google_gemini_gif.gif",
    },
    {
        id: "fastapi",
        label: "FastAPI",
        subtitle: "The Orchestrator",
        icon: Zap,
        color: "#FFDD00", // Electric Yellow
        description: "High-performance async backend that streams agent instructions in real-time. Handles the heavy lifting of video processing and state management with millisecond latency.",
        features: ["Async WebSocket Streaming", "Type-Safe Python Backend", "Horizontal Scaling"],
        visualIcon: Cpu,
        image: "/fastapi.svg",
    },
    {
        id: "playwright",
        label: "Playwright",
        subtitle: "The Executor",
        icon: Terminal,
        color: "#FF6352", // Brand Orange
        description: "The industry standard for browser automation. We generate robust, self-healing Playwright scripts that execute reliably across Chromium, Firefox, and WebKit.",
        features: ["Auto-Waiting Mechanisms", "Headless & Headed Modes", "Trace Viewer Integration"],
        visualIcon: Code2,
        image: "/playwright.webp",
    },
];

export function TechStackSection() {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-24">
            <div className="mb-12 space-y-4">
                <h3 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                    Modern Tech Stack
                </h3>
                <h2 className="text-4xl lg:text-5xl font-normal tracking-tighter text-white font-display">
                    Powered by <span className="text-brand-turquoise">modern</span> infrastructure
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Dooley combines state-of-the-art vision models with battle-tested automation tools.
                </p>
            </div>

            {/* The Main "LiveKit Style" Container */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">

                {/* Diagonal Diamond Grid Background */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%),
                            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* LEFT COLUMN: Navigation Tabs */}
                <div className="lg:col-span-4 flex flex-col border-r border-white/5 bg-white/[0.02]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "group relative flex items-center gap-4 p-6 lg:p-8 text-left transition-all hover:bg-white/[0.04]",
                                activeTab.id === tab.id ? "bg-white/[0.04]" : "text-muted-foreground"
                            )}
                        >
                            {/* Active Indicator Line */}
                            {activeTab.id === tab.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-turquoise to-blue-600"
                                />
                            )}

                            {/* Icon Box */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                                    activeTab.id === tab.id
                                        ? "bg-white/10 border-white/20"
                                        : "bg-transparent border-white/5 group-hover:border-white/10"
                                )}
                            >
                                <tab.icon
                                    className="w-5 h-5"
                                    style={{ color: activeTab.id === tab.id ? tab.color : "#666" }}
                                />
                            </div>

                            {/* Text Info */}
                            <div>
                                <span
                                    className={cn(
                                        "block font-medium text-base transition-colors tracking-tight",
                                        activeTab.id === tab.id ? "text-white" : "group-hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                </span>
                                <span className="text-xs font-mono uppercase tracking-wider opacity-60">
                                    {tab.subtitle}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* RIGHT COLUMN: Content Preview Area */}
                <div className="lg:col-span-8 p-8 lg:p-12 relative min-h-[400px] flex flex-col justify-center">

                    {/* Background Glow Effect based on active color */}
                    <div
                        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 blur-[100px] pointer-events-none transition-colors duration-700"
                        style={{ backgroundColor: activeTab.color }}
                    />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                        >
                            {/* Text Content */}
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 w-fit">
                                    <activeTab.icon className="w-3 h-3" style={{ color: activeTab.color }} />
                                    <span className="text-xs font-mono text-white/80">{activeTab.id.toUpperCase()}_V1.0</span>
                                </div>

                                <h3 className="text-3xl font-normal tracking-tighter text-white">
                                    {activeTab.description.split(".")[0]}.
                                </h3>

                                <p className="text-muted-foreground leading-relaxed">
                                    {activeTab.description.split(".").slice(1).join(".")}
                                </p>

                                <ul className="space-y-3 pt-4">
                                    {activeTab.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTab.color }} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button className="flex items-center gap-2 text-sm font-medium text-white hover:underline decoration-white/30 underline-offset-4 mt-4 group">
                                    View Documentation
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>

                            {/* Visual Card (The "Phone" equivalent) */}
                            <div className="relative aspect-square md:aspect-[4/5] bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-grid-white/[0.02]" />

                                {activeTab.image ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={activeTab.image}
                                            alt={activeTab.label}
                                            fill
                                            className="object-cover opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Central Floating Icon */}
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="w-24 h-24 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative z-20"
                                        >
                                            <activeTab.visualIcon className="w-10 h-10" style={{ color: activeTab.color }} />
                                        </motion.div>

                                        {/* Decorative Circles */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-48 h-48 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
                                            <div className="absolute w-64 h-64 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-50" />
                                        </div>
                                    </>
                                )}
                            </div>

                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </section>
    );
}
