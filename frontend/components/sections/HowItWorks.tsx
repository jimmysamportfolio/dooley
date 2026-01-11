"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Eye, Cpu, Terminal } from "lucide-react";

// --- 1. THE DATA ---
const features = [
    {
        id: "capture",
        title: "Capture & Upload",
        description: "User uploads a screen recording or URL. Dooley accepts raw video, Loom links, or YouTube tutorials.",
        icon: <Upload className="w-8 h-8 text-white" />,
        color: "#A855F7", // Purple
    },
    {
        id: "analyze",
        title: "Visual Analysis",
        description: "The Vision Engine scans the footage frame-by-frame, identifying interactive elements and user intent.",
        icon: <Eye className="w-8 h-8 text-white" />,
        color: "#1FD5F9", // Cyan
    },
    {
        id: "extract",
        title: "Logic Extraction",
        description: "Dooley converts visual actions into a structured, self-healing execution plan (JSON).",
        icon: <Cpu className="w-8 h-8 text-white" />,
        color: "#FACC15", // Yellow
    },
    {
        id: "execute",
        title: "Autonomous Execution",
        description: "The Agent takes over the browser, running the generated Playwright script at 10x speed.",
        icon: <Terminal className="w-8 h-8 text-white" />,
        color: "#F97316", // Orange
    },
];

export function HowItWorks() {
    const [activeId, setActiveId] = useState(features[0].id);
    const sectionRef = useRef<HTMLDivElement>(null);
    const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

    // --- 2. SCROLL LOGIC ---
    useEffect(() => {
        const options = {
            root: null,
            // Trigger when item enters the middle 20% of the viewport
            rootMargin: "-40% 0px -40% 0px",
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, options);

        observerRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full max-w-7xl mx-auto px-6 py-24">
            {/* Header - aligned with left column content */}
            <div className="mb-16 space-y-4 max-w-2xl lg:pl-6">
                <h3 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                    The Process
                </h3>
                <h2 className="text-4xl md:text-5xl font-normal tracking-tighter text-white font-display">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FD5F9] to-blue-600">How</span> it works
                </h2>
            </div>

            {/* Main "Card" Container */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-2">

                    {/* ----- LEFT SIDE: Scrolling Timeline ----- */}
                    <div className="relative flex flex-col border-r border-white/5 bg-white/[0.02] p-6 lg:p-8">

                        {features.map((feature, index) => {
                            const isActive = activeId === feature.id;

                            return (
                                <div
                                    key={feature.id}
                                    id={feature.id}
                                    ref={(el) => { observerRefs.current[index] = el; }}
                                    className="relative flex items-start gap-4 py-6 transition-all duration-500"
                                >
                                    {/* The Number Circle */}
                                    <div
                                        className="flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 bg-[#0A0A0A]"
                                        style={{
                                            borderColor: isActive ? feature.color : 'rgba(255,255,255,0.1)',
                                            backgroundColor: isActive ? `${feature.color}20` : '#0A0A0A',
                                            boxShadow: isActive ? `0 0 20px ${feature.color}40` : 'none',
                                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                    >
                                        <span
                                            className="text-sm font-bold transition-colors duration-300"
                                            style={{ color: isActive ? feature.color : 'rgba(255,255,255,0.3)' }}
                                        >
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Text Content */}
                                    <div className={`flex-1 space-y-2 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                        <h3
                                            className="text-xl font-bold tracking-tight transition-colors duration-300"
                                            style={{ color: isActive ? feature.color : 'white' }}
                                        >
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ----- RIGHT SIDE: Sticky Visual ----- */}
                    <div className="hidden lg:flex sticky top-0 h-[400px] items-center justify-center bg-black/20 overflow-hidden">

                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

                        {/* Fade at top/bottom */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A] pointer-events-none" />

                        <AnimatePresence mode="wait">
                            {features.map((feature) => (
                                activeId === feature.id && (
                                    <motion.div
                                        key={feature.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="absolute inset-0 flex items-center justify-center p-8"
                                    >
                                        <div className="relative flex flex-col items-center gap-6">

                                            {/* Glow Behind */}
                                            <div
                                                className="absolute w-48 h-48 rounded-full blur-[100px] opacity-30 pointer-events-none"
                                                style={{ backgroundColor: feature.color }}
                                            />

                                            {/* The Icon Box */}
                                            <div className="relative w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-sm group">
                                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-white/20" />
                                                {feature.icon}
                                            </div>

                                            {/* Label */}
                                            <div className="text-center space-y-1 relative z-10">
                                                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                                                    Step {features.findIndex(f => f.id === feature.id) + 1}
                                                </div>
                                                <div className="text-xl font-bold text-white">
                                                    {feature.title}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
}
