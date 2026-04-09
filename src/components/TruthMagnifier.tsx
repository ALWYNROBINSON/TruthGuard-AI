import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function TruthMagnifier() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({ x, y });
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative w-full h-[600px] overflow-hidden rounded-xl cursor-none"
        >
            {/* Base Layer: Fake/Manipulated */}
            <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1618060932014-4deda4932554?q=80&w=2070&auto=format&fit=crop"
                    alt="Manipulated Data"
                    className="w-full h-full object-cover opacity-60 mix-blend-screen mix-blend-luminosity filter blur-sm contrast-150 saturate-0"
                />
                <div className="absolute inset-0 bg-cyber-bg/40 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 scan-line opacity-30"></div>
                <div className="absolute top-4 left-4 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold backdrop-blur-md">
                    <ShieldAlert size={16} />
                    <span>MANIPULATED: 94% CONFIDENCE</span>
                </div>
            </div>

            {/* Truth Layer: Revealed under magnifying glass */}
            <motion.div
                className="absolute inset-0 z-10 pointer-events-none"
                animate={{
                    clipPath: isHovering
                        ? `circle(120px at ${position.x}px ${position.y}px)`
                        : `circle(0px at ${position.x}px ${position.y}px)`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
            >
                <img
                    src="https://images.unsplash.com/photo-1618060932014-4deda4932554?q=80&w=2070&auto=format&fit=crop"
                    alt="Authentic Base"
                    className="w-full h-full object-cover saturate-150 contrast-125 brightness-110 hue-rotate-15"
                />
                {/* Verification overlay on the truth side */}
                <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay"></div>

                {/* Hidden grid pattern representing data structures */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                <div className="absolute bottom-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <ShieldCheck size={16} />
                    <span>SOURCE VERIFIED</span>
                </div>
            </motion.div>

            {/* Magnifying Glass Ring */}
            <motion.div
                className="absolute top-0 left-0 pointer-events-none z-20 flex items-center justify-center"
                animate={{
                    x: position.x - 120, // Center the 240x240 circle
                    y: position.y - 120,
                    opacity: isHovering ? 1 : 0,
                    scale: isHovering ? 1 : 0.8
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
            >
                <div className="w-[240px] h-[240px] rounded-full border-2 border-cyber-accent/50 shadow-[0_0_30px_rgba(56,189,248,0.3),inset_0_0_20px_rgba(56,189,248,0.2)] flex items-center justify-center relative backdrop-blur-[1px]">
                    {/* Inner targeting reticle */}
                    <div className="absolute opacity-30 text-cyber-accent flex items-center justify-center">
                        <div className="w-[200px] h-[1px] bg-cyber-accent/30 absolute"></div>
                        <div className="w-[1px] h-[200px] bg-cyber-accent/30 absolute"></div>
                        {/* Center dot */}
                        <div className="w-1.5 h-1.5 bg-cyber-accent rounded-full absolute"></div>
                        {/* Reticle corners */}
                        <div className="absolute top-[20px] left-[20px] w-4 h-4 border-t-2 border-l-2 border-cyber-accent"></div>
                        <div className="absolute top-[20px] right-[20px] w-4 h-4 border-t-2 border-r-2 border-cyber-accent"></div>
                        <div className="absolute bottom-[20px] left-[20px] w-4 h-4 border-b-2 border-l-2 border-cyber-accent"></div>
                        <div className="absolute bottom-[20px] right-[20px] w-4 h-4 border-b-2 border-r-2 border-cyber-accent"></div>
                    </div>

                    {/* Floating UI attached to glass */}
                    <div className="absolute -right-32 top-10 bg-cyber-card/80 border border-cyber-accent/30 p-3 rounded-lg backdrop-blur-md w-48 shadow-xl hidden sm:block">
                        <p className="text-[10px] text-cyber-accent font-mono mb-1 uppercase tracking-widest">Active Scan</p>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Pixel Variance</span>
                                    <span>98%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyber-accent w-[98%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Compression</span>
                                    <span>Mismatch</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 w-[100%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Instruction text (disappears on hover) */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                animate={{ opacity: isHovering ? 0 : 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="bg-cyber-bg/80 border border-cyber-accent/30 text-cyber-accent px-6 py-3 rounded-full backdrop-blur-md font-medium text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Hover to reveal the truth
                </div>
            </motion.div>
        </div>
    );
}
