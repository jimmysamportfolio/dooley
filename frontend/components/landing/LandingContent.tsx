"use client";

export function LandingContent() {
    return (
        <div className="w-full">
            {/* Demo Section Placeholder */}
            <div className="w-full bg-white/2 py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-8 text-center space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                            See It In Action
                        </h3>
                        <h2 className="text-4xl lg:text-5xl font-normal tracking-tighter text-white font-display">
                            Video <span className="text-brand-turquoise">Demo</span>
                        </h2>
                    </div>
                    <div className="max-w-4xl mx-auto w-full aspect-video rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative overflow-hidden group">
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
                    <p>Team Stillwater: Jimmy Sam and Daniel Tong</p>
                    <div className="flex gap-6">
                        <a href="https://github.com/jimmysamportfolio/dooley" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
                        <a href="https://devpost.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Devpost</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
