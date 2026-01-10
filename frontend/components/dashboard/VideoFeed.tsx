import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Link, Upload, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { LiveKitHero } from "@/components/hero/LiveKitHero";

interface MicrofilmViewerProps {
    isLoaded: boolean;
    isAnalyzing: boolean;
    onUpload?: () => void;
    onUrlSubmit?: (url: string) => void;
    fullScreen?: boolean;
}

export function MicrofilmViewer({ isLoaded, isAnalyzing, onUpload, onUrlSubmit, fullScreen = false }: MicrofilmViewerProps) {
    const [urlInput, setUrlInput] = useState("");
    const [inputMode, setInputMode] = useState<"video" | "url">("video");

    const handleUrlSubmit = () => {
        if (urlInput.trim() && onUrlSubmit) {
            onUrlSubmit(urlInput.trim());
            setUrlInput("");
        } else if (urlInput.trim() && onUpload) {
            onUpload();
        }
    };

    // Full screen View
    if (fullScreen && !isLoaded) {
        return (
            <div className="h-screen w-full bg-background text-foreground overflow-hidden flex flex-col relative">
                {/* Isometric Background */}
                <div className="hero-grid-bg" />

                {/* Ambient Glows */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-turquoise/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Navigation */}
                <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Image src="/dooley-favicon.png" alt="Dooley" width={40} height={40} className="object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground font-display">Dooley</span>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Hero Section */}
                    <LiveKitHero>
                        <div className="bg-[#111111] border border-white/10 rounded-xl lg:rounded-2xl shadow-2xl p-5 lg:p-7 xl:p-8 w-full relative">
                            <div className="flex items-center justify-between mb-5 lg:mb-6">
                                <h3 className="text-base lg:text-lg font-bold text-foreground">Start Building</h3>
                                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                                    <button
                                        onClick={() => setInputMode("video")}
                                        className={cn(
                                            "p-1.5 lg:p-2 rounded-md transition-all text-xs lg:text-sm",
                                            inputMode === "video"
                                                ? "bg-white/10 text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="Video"
                                    >
                                        <Film className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    </button>
                                    <button
                                        onClick={() => setInputMode("url")}
                                        className={cn(
                                            "p-1.5 lg:p-2 rounded-md transition-all text-xs lg:text-sm",
                                            inputMode === "url"
                                                ? "bg-white/10 text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title="URL"
                                    >
                                        <Link className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Input Area */}
                            {inputMode === "video" ? (
                                <motion.div
                                    key="video"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div
                                        className="cursor-pointer group border border-dashed border-white/10 rounded-lg p-6 lg:p-8 hover:border-brand-turquoise/50 hover:bg-brand-turquoise/5 transition-all text-center"
                                        onClick={onUpload}
                                    >
                                        <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-brand-turquoise/10">
                                            <Upload className="w-6 h-6 lg:w-7 lg:h-7 text-muted-foreground group-hover:text-brand-turquoise transition-colors" />
                                        </div>
                                        <p className="text-base lg:text-lg font-medium text-foreground mb-5">
                                            Upload screen recording
                                        </p>
                                        <div className="inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 lg:py-3 rounded-md bg-primary text-white font-medium text-sm lg:text-base transition-transform group-hover:translate-y-[-1px] hover:bg-primary/90 shadow-lg shadow-primary/20 w-full justify-center">
                                            Analyze File
                                            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="url"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-3"
                                >
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-4 lg:px-5 py-3 lg:py-3.5 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-brand-turquoise/50 focus:ring-1 focus:ring-brand-turquoise/20 transition-all font-mono text-sm lg:text-base placeholder:text-muted-foreground/50"
                                            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUrlSubmit}
                                        disabled={!urlInput.trim()}
                                        className={cn(
                                            "w-full py-3 lg:py-3.5 rounded-lg font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all",
                                            urlInput.trim()
                                                ? "bg-primary text-white hover:bg-primary/90 hover:translate-y-[-1px] shadow-lg shadow-primary/20"
                                                : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
                                        )}
                                    >
                                        Start Analysis
                                        <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </LiveKitHero>

                    {/* Content Sections */}
                    <div className="w-full max-w-7xl mx-auto px-8 py-20 border-t border-white/5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4 lg:space-y-5">
                                <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold font-display">How it works</h2>
                                <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Dooley captures video input, analyzes visual elements using multimodal models, and converts them into executable Playwright scripts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                <div className="p-6 lg:p-8 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 hover:border-brand-turquoise/30 transition-colors">
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-brand-turquoise/10 flex items-center justify-center mb-4 lg:mb-5">
                                        <Film className="w-6 h-6 lg:w-7 lg:h-7 text-brand-turquoise" />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">1. Capture</h3>
                                    <p className="text-sm lg:text-base text-muted-foreground">Record your screen workflow or provide a URL. Dooley watches like a human would.</p>
                                </div>
                                <div className="p-6 lg:p-8 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 hover:border-brand-turquoise/30 transition-colors">
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 lg:mb-5">
                                        <Sparkles className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">2. Analyze</h3>
                                    <p className="text-sm lg:text-base text-muted-foreground">Vision models identify interactive elements, text, and user intent frame-by-frame.</p>
                                </div>
                                <div className="p-6 lg:p-8 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 hover:border-brand-turquoise/30 transition-colors">
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 lg:mb-5">
                                        <CheckCircle2 className="w-6 h-6 lg:w-7 lg:h-7 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">3. Execute</h3>
                                    <p className="text-sm lg:text-base text-muted-foreground">The workflow is converted into robust code, ready to be replayed at scale.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>


                    {/* Demo Section Placeholder */}
                    <div className="w-full bg-white/2 py-20 border-t border-white/5">
                        <div className="max-w-7xl mx-auto px-8 text-center space-y-8">
                            <h2 className="text-3xl font-bold font-display">Interactive Demo</h2>
                            <div className="w-full aspect-video rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                <div className="relative z-20 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform cursor-pointer">
                                        <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2" />
                                    </div>
                                    <span className="text-sm font-medium text-white/80">Watch Workflow Replication</span>
                                </div>
                                {/* Grid Background for Demo */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="w-full py-12 border-t border-white/10 bg-black/50">
                        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-xs text-muted-foreground">
                            <p>© 2024 Dooley Framework. Open Source.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-foreground">GitHub</a>
                                <a href="#" className="hover:text-foreground">Discord</a>
                                <a href="#" className="hover:text-foreground">Twitter</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }

    // Compact view (for when not fullScreen or when loaded)
    return (
        <div className="h-full flex flex-col">
            <div
                className={cn(
                    "relative flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-sm"
                )}
            >
                {isLoaded ? (
                    /* Loaded State - Analyzing indicator */
                    <div className="relative w-full h-full flex items-center justify-center">
                        {isAnalyzing ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-turquoise/10 flex items-center justify-center">
                                    <motion.div
                                        className="w-8 h-8 border-2 border-brand-turquoise border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                                <p className="text-base font-medium text-foreground">Analyzing...</p>
                                <p className="text-sm text-muted-foreground">Extracting actions from video</p>
                            </motion.div>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <p className="text-base font-medium text-foreground">Ready</p>
                                <p className="text-sm text-muted-foreground">Actions extracted successfully</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State - Minimal indicator */
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <p className="text-sm text-muted-foreground/50">No input loaded</p>
                    </div>
                )}
            </div>
        </div>
    );
}
