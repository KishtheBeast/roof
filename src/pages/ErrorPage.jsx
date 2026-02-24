import React from 'react';
import { ShieldX, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Error Page Component
 * Displayed when an API call or analysis fails
 */
export default function ErrorPage({ error, onRetry, onBack }) {
    const errorMessage = error || "We couldn't process this address at the moment.";

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-brand-navy text-white px-6">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-red-500/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldX className="w-12 h-12 text-red-500" />
                </div>
            </div>

            <h2 className="text-3xl font-serif font-black tracking-widest uppercase mb-4 text-center">Something Went Wrong</h2>
            
            <div className="max-w-md w-full p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur mb-8 text-center">
                <p className="text-white/60 mb-2 uppercase text-[10px] tracking-widest font-mono">Error Details</p>
                <p className="text-white/80 font-medium leading-relaxed">
                    {errorMessage}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button
                    onClick={onRetry}
                    className="flex-1 px-8 py-4 bg-brand-gold text-brand-navy font-bold rounded-xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 group"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Retry Analysis
                </button>
                
                <button
                    onClick={onBack}
                    className="flex-1 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>

            <p className="mt-12 text-white/30 text-[10px] uppercase tracking-[0.3em] text-center max-w-xs leading-relaxed">
                If the problem persists, try searching for a different address or contact support.
            </p>
        </div>
    );
}
