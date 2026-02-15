import React from 'react';
import { ShieldCheck, Info, Zap, Layers, TrendingUp, Calculator, MousePointer2, Loader2, ArrowRight, Ruler, History, Maximize } from 'lucide-react';
import { processSolarData } from '../utils/solarApi';

export default function MeasurementDisplay({ areaSqFt, solarData, aiMeasurements, isAnalyzing }) {
    // Process Solar API data
    const solarMeasurements = solarData ? processSolarData(solarData) : null;

    // Pitch multipliers (Standard defaults)
    const pitches = [
        { label: 'Flat Roof', value: 1.00 },
        { label: 'Low Slope', value: 1.05 },
        { label: 'Standard House', value: 1.12 },
        { label: 'Steep', value: 1.25 },
        { label: 'Very Steep', value: 1.40 },
    ];

    const [multiplier, setMultiplier] = React.useState(1.12);
    const [hasSaved, setHasSaved] = React.useState(false);
    const [showMethodology, setShowMethodology] = React.useState(false);

    // Derived area (Hybrid) 
    // If we have solar data + manual/ai area, use specialized hybrid math
    const solarPitchDegrees = solarMeasurements?.predominantPitchDegrees || 0;
    const solarPitchMultiplier = solarPitchDegrees > 0 ? (1 / Math.cos(solarPitchDegrees * Math.PI / 180)) : multiplier;

    // finalDisplayArea uses the areaSqFt (auto-set by AI or manual) 
    const finalDisplayArea = (areaSqFt || 0) * solarPitchMultiplier;

    const handleSave = () => {
        const report = `
ROOF MEASUREMENT REPORT
----------------------------------
DATE: ${new Date().toLocaleString()}
STATUS: ${aiMeasurements ? 'AI ANALYZED' : 'MANUAL/LIDAR HYBRID'}

PRIMARY ESTIMATE
- Total Surface Area: ${Math.round(finalDisplayArea).toLocaleString()} sq ft
- Base Ground Area: ${Math.round(areaSqFt).toLocaleString()} sq ft
- Applied Pitch: ${solarMeasurements?.predominantPitchRatio || 'Manual'}

${aiMeasurements ? `AI AUTOMATED INSIGHTS
- Total Ridges/Hips: ${aiMeasurements.ridgesHipsFeet} ft
- Total Valleys: ${aiMeasurements.valleysFeet} ft
- Total Rakes: ${aiMeasurements.rakesFeet} ft
- Total Eaves: ${aiMeasurements.eavesFeet} ft
- Complexity: ${aiMeasurements.complexity}
- Confidence: ${Math.round(aiMeasurements.confidenceScore * 100)}%
- Notes: ${aiMeasurements.estimationNotes}` : ''}

DATA SOURCE: Google Solar API LiDAR + Anthropic Claude AI
----------------------------------
        `.trim();

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `roof-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setHasSaved(true);
    };

    if (!areaSqFt && !isAnalyzing && !aiMeasurements) return (
        <div className="h-full w-full flex items-center justify-center text-brand-navy/30">
            <div className="text-center">
                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-base uppercase tracking-widest">Waiting for Roof Highlight...</p>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full bg-brand-beige select-none">
            <div className="h-full flex flex-col">
                {/* Header - Compact */}
                <div className="bg-brand-navy px-6 py-3 flex justify-between items-center bg-gradient-to-r from-brand-navy to-brand-navy/90 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-brand-gold text-brand-navy">
                            <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">Measurement Dashboard</span>
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{isAnalyzing ? 'Processing...' : 'Ready'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMethodology(!showMethodology)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {/* Dashboard Grid - Three Column Horizontal */}
                <div className="flex-1 px-6 py-4 flex gap-6 min-h-0">

                    {/* COL 1: PRIMARY METRIC (The "Big Number") */}
                    <div className="w-[30%] flex flex-col justify-center">
                        <div className="relative p-6 rounded-[2rem] bg-white border border-brand-navy/5 shadow-sm overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-5">
                                <Maximize className="w-12 h-12 text-brand-navy" />
                            </div>
                            <div className="relative z-10 text-center">
                                <div className="flex items-baseline justify-center gap-1.5">
                                    <span className="text-5xl font-serif font-black text-brand-navy tracking-tighter">
                                        {Math.round(finalDisplayArea).toLocaleString()}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-brand-navy/30 uppercase">sq ft</span>
                                </div>
                                <div className="mt-1 px-3 py-1 bg-brand-navy/5 rounded-full inline-block">
                                    <span className="text-[9px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest">Est. Surface Area</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: KEY DETAILS (Property Facts) */}
                    <div className="w-[25%] flex flex-col justify-center gap-3 border-l border-brand-navy/5 pl-6">
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-[9px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Ruler className="w-3 h-3" /> Property Details
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-brand-navy/5">
                                        <span className="text-[9px] font-bold text-brand-navy/40 uppercase">Footprint</span>
                                        <span className="text-sm font-serif font-bold text-brand-navy">{Math.round(areaSqFt).toLocaleString()} <span className="text-[10px] opacity-40">ft²</span></span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-brand-navy/5">
                                        <span className="text-[9px] font-bold text-brand-navy/40 uppercase">Avg Pitch</span>
                                        <span className="text-sm font-serif font-bold text-brand-navy">{solarMeasurements?.predominantPitchRatio || 'Standard'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COL 3: AI VISION INSIGHTS */}
                    <div className="flex-1 flex flex-col justify-center gap-3 border-l border-brand-navy/5 pl-6">
                        <h3 className="text-[9px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-brand-gold" /> AI Vision Insights</span>
                            {aiMeasurements && <span className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/10">VERIFIED</span>}
                        </h3>

                        {isAnalyzing ? (
                            <div className="h-full flex items-center justify-center bg-brand-gold/5 rounded-2xl border border-brand-gold/10 animate-pulse">
                                <Loader2 className="w-5 h-5 text-brand-gold animate-spin mr-3" />
                                <span className="text-[10px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest">Analyzing LIDAR...</span>
                            </div>
                        ) : aiMeasurements ? (
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: 'Ridges', value: aiMeasurements.ridgesHipsFeet, color: 'bg-brand-gold text-brand-navy' },
                                    { label: 'Valleys', value: aiMeasurements.valleysFeet, color: 'bg-brand-navy text-white shadow-lg shadow-brand-navy/10' },
                                    { label: 'Rakes', value: aiMeasurements.rakesFeet, color: 'bg-white border border-brand-navy/5' },
                                    { label: 'Eaves', value: aiMeasurements.eavesFeet, color: 'bg-white border border-brand-navy/5' }
                                ].map((stat) => (
                                    <div key={stat.label} className={`p-2.5 rounded-xl flex flex-col items-center justify-center ${stat.color}`}>
                                        <span className="text-[8px] font-black uppercase opacity-60 mb-0.5">{stat.label}</span>
                                        <span className="text-sm font-serif font-black">{stat.value}<span className="text-[9px] opacity-40 ml-0.5 font-normal">ft</span></span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center border border-dashed border-brand-navy/10 rounded-2xl text-brand-navy/20">
                                <ShieldCheck className="w-5 h-5 opacity-30 mr-2" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Awaiting Analysis</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Actions */}
                <div className="px-6 py-4 bg-white/50 border-t border-brand-navy/5">
                    <div className="flex gap-3 h-10">
                        <button
                            onClick={handleSave}
                            disabled={isAnalyzing}
                            className="flex-1 bg-brand-navy text-white rounded-xl flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-navy transition-all font-mono font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Generate Report
                        </button>
                        {(hasSaved || aiMeasurements) && (
                            <button
                                onClick={() => alert('Order integration coming soon!')}
                                className="flex-1 bg-brand-gold text-brand-navy rounded-xl flex items-center justify-center gap-2 hover:bg-brand-navy hover:text-white transition-all font-mono font-black uppercase tracking-widest text-[10px] shadow-sm shadow-brand-gold/10"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Order Materials
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
