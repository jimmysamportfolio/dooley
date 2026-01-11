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
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-20 items-center">
            {/* Left Column: Typography */}
            {/* Added 'justify-center' and 'h-full' to ensure it centers vertically against the tall graph */}
            <div className="flex flex-col justify-center items-start text-left space-y-3 lg:space-y-4 xl:space-y-6 z-10 order-2 lg:order-1 min-w-[280px] lg:pr-4 xl:pr-8 h-full py-12">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tighter leading-tight text-foreground font-display"
                >
                    Don&apos;t watch
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FD5F9] to-[#3B82F6]">
                        Just do.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-sm sm:text-base lg:text-lg text-muted-foreground/80 max-w-none leading-relaxed font-sans"
                >
                    Have AI watch your long tutorials and do them for you.
                    <div></div>Dooley is your AI brower automator powered by Gemini 3.0 Pro and FastAPI that executes your tutorials in real time.
                </motion.p>

                {children && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="w-full max-w-md pt-2"
                    >
                        {children}
                    </motion.div>
                )}
            </div>

            {/* Right Column: 3D Scene */}
            {/* Reduced lg:h-[700px] to lg:h-[600px] for a tighter fit */}
            <div className="relative h-[400px] lg:h-[600px] w-full lg:block order-1 lg:order-2 flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-turquoise/5 blur-[80px] rounded-full pointer-events-none" />
                <Canvas className="w-full h-full">
                    <WorkflowGraph />
                </Canvas>
            </div>
        </div>
    );
}
