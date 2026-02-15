import React from 'react';
import { ShieldCheck, Info, Zap, Layers, TrendingUp, Calculator, MousePointer2, Loader2, ArrowRight, Ruler, History, Maximize } from 'lucide-react';
import { processSolarData } from '../utils/solarApi';

export default function MeasurementDisplay({ areaSqFt, solarData, aiMeasurements, isAnalyzing }) {
    // Process Solar API data
    const solarMeasurements = solarData ? processSolarData(solarData) : null;

    // Pitch multipliers
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
    const [isCollapsed, setIsCollapsed] = React.useState(false);

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

    if (!areaSqFt && !isAnalyzing && !aiMeasurements) return null;

    return (
        <div className={`fixed bottom-8 right-8 z-[1000] transition-all duration-500 ease-in-out ${isCollapsed ? 'w-16 h-16' : 'w-[850px]'}`}>
            {isCollapsed ? (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="w-16 h-16 bg-brand-navy text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-gold hover:text-brand-navy transition-all group animate-in zoom-in duration-300"
                >
                    <Calculator className="w-6 h-6 group-hover:scale-110" />
                </button>
            ) : (
                <div className="bg-white/95 backdrop-blur-3xl border border-white/40 shadow-[0_40px_80px_rgba(0,0,0,0.4)] rounded-[40px] overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500">
                    {/* Header */}
                    <div className="bg-brand-navy p-5 flex justify-between items-center bg-gradient-to-r from-brand-navy to-brand-navy/90">
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
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all ml-1"
                            >
                                <div className="w-6 h-1 bg-current rounded-full" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 flex gap-8">
                        {/* PANEL 1: HYBRID MEASUREMENTS */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between mb-2">
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

                            <div className="p-6 rounded-3xl bg-brand-navy/5 border border-brand-navy/5 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Ruler className="w-12 h-12 text-brand-navy rotate-45" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-serif font-black text-brand-navy tracking-tighter">
                                            {Math.round(finalDisplayArea).toLocaleString()}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-brand-navy/30 uppercase">sq ft</span>
                                    </div>
                                    <p className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest mt-2 px-4 py-1.5 bg-brand-navy/10 rounded-full inline-block">
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

                            <div className="p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[8px] font-mono font-bold text-brand-navy/40 uppercase">Waste & Complexity</span>
                                    {aiMeasurements?.complexity && (
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${aiMeasurements.complexity === 'SIMPLE' ? 'bg-green-100 text-green-700' :
                                            aiMeasurements.complexity === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {aiMeasurements.complexity}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {['10%', '15%', '20%'].map((label, i) => {
                                        const values = [10, 15, 20];
                                        const isActive = wasteFactor === values[i];
                                        return (
                                            <button
                                                key={label}
                                                onClick={() => setWasteFactor(values[i])}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${isActive ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-navy/60 border-brand-navy/10'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 border-l border-brand-navy/5 pl-8">
                            <div className="flex items-center justify-between mb-2">
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
                                    <div className="p-3 rounded-2xl bg-brand-gold text-brand-navy flex flex-col items-center">
                                        <p className="text-[8px] font-black uppercase opacity-60">Ridges/Hips</p>
                                        <p className="text-xl font-serif font-black">{aiMeasurements.ridgesHipsFeet}ft</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-brand-navy text-white flex flex-col items-center">
                                        <p className="text-[8px] font-black uppercase opacity-60">Valleys</p>
                                        <p className="text-xl font-serif font-black">{aiMeasurements.valleysFeet}ft</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white border border-brand-navy/10 flex flex-col items-center">
                                        <p className="text-[8px] font-bold text-brand-navy/40 uppercase">Rakes</p>
                                        <p className="text-lg font-serif font-bold text-brand-navy">{aiMeasurements.rakesFeet}ft</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white border border-brand-navy/10 flex flex-col items-center">
                                        <p className="text-[8px] font-bold text-brand-navy/40 uppercase">Eaves</p>
                                        <p className="text-lg font-serif font-bold text-brand-navy">{aiMeasurements.eavesFeet}ft</p>
                                    </div>
                                    <div className="col-span-2 p-3 rounded-2xl bg-brand-navy/5 border border-dashed border-brand-navy/10">
                                        <p className="text-[8px] font-bold text-brand-navy/40 uppercase mb-1">AI Reasoning</p>
                                        <p className="text-[10px] text-brand-navy/80 italic leading-tight">"{aiMeasurements.estimationNotes}"</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-brand-navy/10 rounded-3xl text-brand-navy/20">
                                    <ShieldCheck className="w-6 h-6 opacity-20" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest">Pending Analysis</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-8 pb-8 pt-4">
                        <div className="flex gap-4">
                            <button
                                onClick={handleSave}
                                disabled={isAnalyzing}
                                className="flex-1 bg-brand-navy text-white h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-navy transition-all font-mono font-bold uppercase tracking-widest text-[11px] disabled:opacity-50"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Download Report
                            </button>
                            {(hasSaved || aiMeasurements) && (
                                <button
                                    onClick={() => alert('Order integration coming soon!')}
                                    className="px-8 bg-brand-gold text-brand-navy h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-navy hover:text-white transition-all font-mono font-bold uppercase tracking-widest text-[11px]"
                                >
                                    Order Materials
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
