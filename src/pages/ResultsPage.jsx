import React, { useState } from 'react';
import MeasurementDisplay from '../components/MeasurementDisplay';
import AddressSearch from '../components/AddressSearch';
import { ShieldCheck, ArrowLeft, Search, X } from 'lucide-react';

/**
 * Results Page Component
 * Displays roof analysis results and measurements
 */
export default function ResultsPage({ aiMeasurements, areaSqFt, address, onBack, onLocationSelect }) {
    const [isSearching, setIsSearching] = useState(false);

    return (
        <div className="absolute inset-0 z-0 h-full w-full bg-brand-beige flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="h-16 md:h-20 bg-brand-navy flex items-center justify-between px-4 md:px-8 border-b border-white/10 shrink-0 shadow-lg z-20">
                {!isSearching ? (
                    <>
                        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                            <div className="p-1.5 md:p-2 bg-brand-gold rounded-lg shrink-0">
                                <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-brand-navy" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-white font-serif font-black text-sm md:text-xl tracking-tight truncate">{address}</span>
                                <span className="text-brand-gold text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="hidden sm:inline">AI Analysis Complete</span>
                                    <span className="sm:hidden">Complete</span>
                                </span>
                            </div>
                            <button 
                                onClick={() => setIsSearching(true)}
                                className="ml-2 p-2 text-white/40 hover:text-brand-gold transition-colors"
                                title="Change Address"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onBack}
                                className="px-3 md:px-6 py-2 md:py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 group"
                            >
                                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">New Search</span>
                                <span className="sm:hidden">Back</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                        <AddressSearch 
                            onLocationSelect={(loc) => {
                                setIsSearching(false);
                                onLocationSelect(loc);
                            }}
                            className="flex-1 max-w-2xl"
                        />
                        <button 
                            onClick={() => setIsSearching(false)}
                            className="p-2 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative p-3 md:p-8 bg-brand-beige">
                <div className="h-full w-full bg-white rounded-2xl md:rounded-[3rem] shadow-2xl border border-brand-navy/5 overflow-hidden">
                    <MeasurementDisplay
                        areaSqFt={areaSqFt}
                        aiMeasurements={aiMeasurements}
                        isAnalyzing={false}
                        address={address}
                    />
                </div>
            </div>
        </div>
    );
}
