import React from 'react';
import { Maximize, Shield, ShieldCheck, ArrowLeft } from 'lucide-react';

/**
 * Loading Page Component
 * Full-screen loading state during analysis
 */
export default function LoadingPage() {
    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-brand-navy text-white">
            <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-brand-gold/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Maximize className="w-8 h-8 text-brand-gold animate-pulse" />
                </div>
            </div>

            <h2 className="text-3xl font-serif font-black tracking-widest uppercase mb-4">Analyzing Geometry</h2>

            {/* Progress Bar Container */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-gold animate-[progress_12s_ease-in-out_forwards] w-full origin-left"></div>
            </div>

            <p className="text-brand-gold/60 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
                Processing Satellite Imagery...
            </p>

            <style>{`
                @keyframes progress {
                    0% { transform: scaleX(0); }
                    20% { transform: scaleX(0.4); }
                    50% { transform: scaleX(0.6); }
                    80% { transform: scaleX(0.8); }
                    100% { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
}
