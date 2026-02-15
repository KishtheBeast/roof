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
    const [wasteFactor, setWasteFactor] = React.useState(0);
    const [hasSaved, setHasSaved] = React.useState(false);
    const [showMethodology, setShowMethodology] = React.useState(false);

    // Derived area (Hybrid) 
    // If we have solar data + manual/ai area, use specialized hybrid math
    const solarPitchDegrees = solarMeasurements?.predominantPitchDegrees || 0;
    const solarPitchMultiplier = solarPitchDegrees > 0 ? (1 / Math.cos(solarPitchDegrees * Math.PI / 180)) : multiplier;

    // finalHybridArea uses the areaSqFt (auto-set by AI or manual) 
    const finalHybridArea = (areaSqFt || 0) * solarPitchMultiplier;
    const finalDisplayArea = finalHybridArea * (1 + wasteFactor / 100);

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
- Waste Factor: ${wasteFactor}%

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
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-sm uppercase tracking-widest">Wating for Roof Highlight...</p>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full bg-brand-beige overflow-y-auto">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="bg-brand-navy p-4 flex justify-between items-center bg-gradient-to-r from-brand-navy to-brand-navy/90 shrink-0 sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/20">
                            <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">Roof Measuring Hub</span>
                            <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">{isAnalyzing ? 'Processing Geometry...' : 'Analysis Complete'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMethodology(!showMethodology)}
                            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 flex gap-6 h-full items-start overflow-y-auto">
                    {/* PANEL 1: HYBRID MEASUREMENTS */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-brand-gold" />
                                <h3 className="text-[10px] font-mono font-bold text-brand-navy/60 uppercase tracking-widest">Hybrid Analysis</h3>
                            </div>
                            {aiMeasurements && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-gold/10 text-brand-gold text-[9px] font-black rounded-full border border-brand-gold/20 animate-in fade-in zoom-in duration-500">
                                    <ShieldCheck className="w-3 h-3" />
                                    AI AUTO-SET
                                </span>
                            )}
                        </div>

                        <div className="p-4 rounded-3xl bg-white border border-brand-navy/10 text-center relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Ruler className="w-12 h-12 text-brand-navy rotate-45" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-4xl md:text-5xl font-serif font-black text-brand-navy tracking-tighter">
                                        {Math.round(finalDisplayArea).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-mono font-bold text-brand-navy/30 uppercase">sq ft</span>
                                </div>
                                <p className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest mt-1 px-4 py-1 bg-brand-navy/5 rounded-full inline-block">
                                    Surface Estimate
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-white border border-brand-navy/10">
                                <p className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase mb-1">Base Footprint</p>
                                <p className="text-sm font-serif font-bold text-brand-navy">{Math.round(areaSqFt).toLocaleString()}<span className="text-[10px] text-brand-navy/40 ml-1">sq ft</span></p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white border border-brand-navy/10">
                                <p className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase mb-1">Pitch Used</p>
                                <p className="text-sm font-serif font-bold text-brand-navy">{solarMeasurements?.predominantPitchRatio || 'Manual'}</p>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 2: AI INSIGHTS */}
                    <div className="flex-1 space-y-4 border-l border-brand-navy/5 pl-6">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-brand-gold" />
                                <h3 className="text-[10px] font-mono font-bold text-brand-navy/60 uppercase tracking-widest">AI Automated Insights</h3>
                            </div>
                            {aiMeasurements && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded-full border border-blue-500/20 animate-in fade-in zoom-in duration-700">
                                    <Layers className="w-3 h-3" />
                                    VISION VERIFIED
                                </span>
                            )}
                        </div>

                        {isAnalyzing ? (
                            <div className="h-[120px] flex flex-col items-center justify-center space-y-3 rounded-3xl bg-brand-gold/5 border border-brand-gold/10 animate-pulse">
                                <Loader2 className="w-6 h-6 text-brand-gold animate-spin" />
                                <p className="text-[9px] font-mono font-bold text-brand-navy/60 uppercase tracking-widest">Processing LIDAR...</p>
                            </div>
                        ) : aiMeasurements ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-brand-gold text-brand-navy flex flex-col items-center justify-center shadow-lg shadow-brand-gold/20">
                                    <p className="text-[8px] font-black uppercase opacity-60">Ridges/Hips</p>
                                    <p className="text-lg font-serif font-black">{aiMeasurements.ridgesHipsFeet}ft</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-brand-navy text-white flex flex-col items-center justify-center shadow-lg shadow-brand-navy/20">
                                    <p className="text-[8px] font-black uppercase opacity-60">Valleys</p>
                                    <p className="text-lg font-serif font-black">{aiMeasurements.valleysFeet}ft</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white border border-brand-navy/10 flex flex-col items-center justify-center">
                                    <p className="text-[8px] font-bold text-brand-navy/40 uppercase">Rakes</p>
                                    <p className="text-md font-serif font-bold text-brand-navy">{aiMeasurements.rakesFeet}ft</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white border border-brand-navy/10 flex flex-col items-center justify-center">
                                    <p className="text-[8px] font-bold text-brand-navy/40 uppercase">Eaves</p>
                                    <p className="text-md font-serif font-bold text-brand-navy">{aiMeasurements.eavesFeet}ft</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-brand-navy/10 rounded-3xl text-brand-navy/20">
                                <ShieldCheck className="w-6 h-6 opacity-20" />
                                <p className="text-[9px] font-bold uppercase tracking-widest">Pending Analysis</p>
                            </div>
                        )}

                        <div className="p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase">Waste Factor</span>
                            </div>
                            <div className="flex gap-2">
                                {['10%', '15%', '20%'].map((label, i) => {
                                    const values = [10, 15, 20];
                                    const isActive = wasteFactor === values[i];
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setWasteFactor(values[i])}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isActive ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-navy/60 border-brand-navy/10'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 pt-0 mt-auto">
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isAnalyzing}
                            className="flex-1 bg-brand-navy text-white h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-navy transition-all font-mono font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-xl shadow-brand-navy/10"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Download Report
                        </button>
                        {(hasSaved || aiMeasurements) && (
                            <button
                                onClick={() => alert('Order integration coming soon!')}
                                className="px-8 bg-brand-gold text-brand-navy h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-brand-navy hover:text-white transition-all font-mono font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-brand-gold/10"
                            >
                                Order Materials
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
