import React from 'react';
import { ShieldCheck, Info, Zap, Layers, TrendingUp, Calculator, MousePointer2, Loader2, ArrowRight, Ruler, History, Maximize } from 'lucide-react';
import { api } from '../utils/auth';

const ROOF_MATERIALS = [
    { value: 'Asphalt Shingle', label: 'Asphalt Shingle', pricePerSqFt: 4.50 },
    { value: 'Metal', label: 'Metal', pricePerSqFt: 9.00 },
    { value: 'Concrete Tile', label: 'Concrete Tile', pricePerSqFt: 12.00 },
    { value: 'Clay Tile', label: 'Clay Tile', pricePerSqFt: 15.00 },
    { value: 'Slate', label: 'Slate', pricePerSqFt: 18.00 },
];

export default function MeasurementDisplay({ areaSqFt, aiMeasurements, isAnalyzing, address }) {
    const [hasSaved, setHasSaved] = React.useState(false);
    const [selectedMaterial, setSelectedMaterial] = React.useState(aiMeasurements?.material || '');
    const [isCalculatingCost, setIsCalculatingCost] = React.useState(false);
    const [costEstimate, setCostEstimate] = React.useState(null);

    const handleMaterialChange = async (material) => {
        setSelectedMaterial(material);
        if (!material || !address) return;

        setIsCalculatingCost(true);
        try {
            const response = await api.post('/analyze-roof', { address, material });
            const data = response.data;

            setCostEstimate({
                material: data.material,
                totalCost: data.estimated_cost_avg,
                lowCost: data.estimated_cost_low,
                highCost: data.estimated_cost_high,
                costPerSqFt: data.cost_per_sqft,
                reasoning: data.reasoning
            });
        } catch (err) {
            console.error('Error calculating cost:', err);
        } finally {
            setIsCalculatingCost(false);
        }
    };

    const handleSave = () => {
        const report = `
ROOF MEASUREMENT REPORT
==================================
DATE: ${new Date().toLocaleString()}
ADDRESS: ${address || 'Unknown'}

==================================
AREA MEASUREMENTS
==================================
Total Surface Area: ${Math.round(aiMeasurements?.totalAreaSqFt || areaSqFt || 0).toLocaleString()} sq ft

==================================
ROOF GEOMETRY
==================================
Predominant Pitch: ${aiMeasurements?.pitch || 'Standard'}
Roof Facets: ${aiMeasurements?.facetCount || 'N/A'}
Complexity: ${aiMeasurements?.complexity || 'Unknown'}
Confidence Score: ${Math.round((aiMeasurements?.confidenceScore || 0) * 100)}%

==================================
LINEAR MEASUREMENTS
==================================
Ridges/Hips: ${Math.round(aiMeasurements?.ridges || 0)} ft
Valleys: ${Math.round(aiMeasurements?.valleys || 0)} ft
Rakes: ${Math.round(aiMeasurements?.rakes || 0)} ft
Eaves: ${Math.round(aiMeasurements?.eaves || 0)} ft
Total Linear Edges: ${Math.round(
    (aiMeasurements?.ridges || 0) +
    (aiMeasurements?.valleys || 0) +
    (aiMeasurements?.rakes || 0) +
    (aiMeasurements?.eaves || 0)
)} ft

${selectedMaterial ? `==================================
ROOFING MATERIAL
==================================
${selectedMaterial}` : (aiMeasurements?.material ? `==================================
ROOFING MATERIAL
==================================
${aiMeasurements.material}` : '')}

${costEstimate ? `==================================
COST ESTIMATE
==================================
Selected Material: ${costEstimate.material}
Total Estimated Cost: $${costEstimate.totalCost?.toLocaleString() || '0'}
Price Range: $${costEstimate.lowCost?.toLocaleString() || '0'} - $${costEstimate.highCost?.toLocaleString() || '0'}
Cost Per Sq Ft: $${costEstimate.costPerSqFt || '0'}` : ''}

${aiMeasurements?.estimationNotes ? `==================================
ESTIMATION NOTES
==================================
${aiMeasurements.estimationNotes}` : ''}

==================================
DATA SOURCES
==================================
- AI Analysis API
- ${address || 'Property Address'}

Generated: ${new Date().toLocaleString()}
==================================
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
                                {Math.round(aiMeasurements?.totalAreaSqFt || areaSqFt || 0).toLocaleString()}
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
                                {Math.round(aiMeasurements?.footprintSqFt || areaSqFt || 0).toLocaleString()} <span className="text-xs text-gray-400">ft²</span>
                            </span>
                        </div>
                    </div>

                    {/* Material Selection */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Material Selection</h3>
                        <div className="space-y-3">
                            <select
                                value={selectedMaterial}
                                onChange={(e) => handleMaterialChange(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-brand-navy font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                            >
                                <option value="">Select Material...</option>
                                {ROOF_MATERIALS.map((mat) => (
                                    <option key={mat.value} value={mat.value}>
                                        {mat.label} (${mat.pricePerSqFt}/sq ft)
                                    </option>
                                ))}
                            </select>

                            {isCalculatingCost && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Calculating cost...
                                </div>
                            )}

                            {costEstimate && !isCalculatingCost && (
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-3xl font-black text-green-700">
                                            ${costEstimate.totalCost?.toLocaleString() || '0'}
                                        </span>
                                        <span className="text-sm font-medium text-green-600">estimated total</span>
                                    </div>
                                    <div className="text-xs text-green-600/70 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Low estimate:</span>
                                            <span className="font-mono">${costEstimate.lowCost?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>High estimate:</span>
                                            <span className="font-mono">${costEstimate.highCost?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Cost per sq ft:</span>
                                            <span className="font-mono">${costEstimate.costPerSqFt || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
