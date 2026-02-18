import React from 'react';
import { ShieldCheck, Info, Zap, Layers, TrendingUp, Calculator, MousePointer2, Loader2, ArrowRight, Ruler, History, Maximize } from 'lucide-react';
import { processSolarData } from '../utils/solarApi';

export default function MeasurementDisplay({ areaSqFt, solarData, aiMeasurements, isAnalyzing, address }) {
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
        <div className="w-full h-full bg-white flex overflow-hidden font-sans text-brand-navy">

            {/* LEFT PANE - 65% - Satellite Image Map */}
            <div className="w-[65%] h-full relative bg-brand-navy/5 group overflow-hidden">
                {aiMeasurements?.highlightedImage ? (
                    <>
                        <img
                            src={aiMeasurements.highlightedImage}
                            alt="Satellite Map"
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay: AI Badge */}
                        <div className="absolute top-8 left-8">
                            <span className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                AI Analysis Complete
                            </span>
                        </div>

                        {/* Overlay: Map Controls (Visual Only) */}
                        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                            <button className="w-10 h-10 bg-white rounded-lg shadow-xl flex items-center justify-center text-brand-navy hover:bg-gray-50 transition-colors">
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-brand-navy/20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <span className="font-mono text-xs uppercase tracking-widest">Loading Imagery...</span>
                    </div>
                )}
            </div>

            {/* RIGHT PANE - 35% - Data Sidebar */}
            <div className="w-[35%] h-full bg-white flex flex-col border-l border-brand-navy/10 relative shadow-2xl z-20">

                {/* Header */}
                <div className="px-8 pt-10 pb-6 shrink-0">
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                            Ready for Review
                        </span>
                        <h1 className="text-2xl font-bold leading-tight text-brand-navy mb-1">
                            {address || "Unknown Address"}
                        </h1>
                        <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Roof Measurement Report</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">

                    {/* Hero Metric */}
                    <div className="mb-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-brand-navy tracking-tighter">
                                {Math.round(aiMeasurements?.totalAreaSqFt || 0).toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-gray-400">sq ft</span>
                        </div>
                        <span className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest">Total Surface Area</span>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-brand-navy/40">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Pitch</span>
                            </div>
                            <span className="text-xl font-bold text-brand-navy">
                                {typeof aiMeasurements?.pitch === 'number'
                                    ? `${Math.round(aiMeasurements.pitch)}°`
                                    : (aiMeasurements?.pitch || 'Std')}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-brand-navy/40">
                                <Ruler className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Footprint</span>
                            </div>
                            <span className="text-xl font-bold text-brand-navy">
                                {Math.round(aiMeasurements?.footprintSqFt || 0).toLocaleString()} <span className="text-xs text-gray-400">ft²</span>
                            </span>
                        </div>
                    </div>

                    {/* Detailed List */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Measurements</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Ridges', value: aiMeasurements?.ridges },
                                { label: 'Valleys', value: aiMeasurements?.valleys },
                                { label: 'Rakes', value: aiMeasurements?.rakes },
                                { label: 'Eaves', value: aiMeasurements?.eaves }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-brand-navy transition-colors">{item.label}</span>
                                    <div className="grow mx-4 border-b border-dotted border-gray-200 relative top-1"></div>
                                    <span className="text-sm font-bold text-brand-navy font-mono">
                                        {Math.round(item.value || 0)} <span className="text-xs text-gray-400 font-normal">ft</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-8 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => alert('Order integration coming soon')}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Order Materials
                        </button>
                        <button
                            onClick={handleSave}
                            className="w-full py-4 bg-white border-2 border-gray-200 text-brand-navy rounded-xl font-bold uppercase tracking-widest text-xs hover:border-brand-navy hover:bg-gray-50 transition-all"
                        >
                            Download Report
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
