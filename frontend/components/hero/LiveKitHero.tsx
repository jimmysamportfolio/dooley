"use client";

import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WorkflowGraph } from "./WorkflowGraph";

interface LiveKitHeroProps {
    onStart?: () => void;
    children?: React.ReactNode;
}

export function LiveKitHero({ onStart, children }: LiveKitHeroProps) {
    return (
        <div className="w-full max-w-[1400px] mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
            {/* Left Column: Typography */}
            <div className="flex flex-col items-start text-left space-y-6 z-10 order-2 lg:order-1 min-w-[300px]">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-foreground font-display"
                >
                    Build apps that can
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FD5F9] to-[#3B82F6]">
                        see, hear, and speak.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg text-muted-foreground/80 max-w-md leading-relaxed font-sans"
                >
                    The open source framework for browser automation agents.
                    Orchestrate complex web workflows with visual understanding.
                </motion.p>

                {children && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="w-full max-w-md pt-4"
                    >
                        {children}
                    </motion.div>
                )}

                {!children && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap gap-3 pt-2"
                    >
                        <button
                            onClick={onStart}
                            className="px-6 py-2.5 rounded-lg bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-all flex items-center gap-2"
                        >
                            Start Building
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground font-medium text-sm hover:bg-white/10 transition-colors">
                            Documentation
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Right Column: 3D Scene */}
            <div className="relative h-[500px] lg:h-[700px] w-full lg:block order-1 lg:order-2">
                <div className="absolute inset-0 bg-brand-turquoise/5 blur-[80px] rounded-full pointer-events-none" />
                <Canvas className="w-full h-full">
                    <WorkflowGraph />
                </Canvas>
            </div>
        </div>
    );
}
