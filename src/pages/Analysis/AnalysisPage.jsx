import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Ruler, Activity, CheckCircle2, ChevronRight, Info, DollarSign, Layers } from 'lucide-react';
import { api } from '../../utils/auth';

const ROOF_MATERIALS = [
    { value: 'Asphalt Shingle', label: 'Asphalt Shingle', pricePerSqFt: '$4.50' },
    { value: 'Metal', label: 'Metal', pricePerSqFt: '$9.00' },
    { value: 'Concrete Tile', label: 'Concrete Tile', pricePerSqFt: '$12.00' },
    { value: 'Clay Tile', label: 'Clay Tile', pricePerSqFt: '$15.00' },
    { value: 'Slate', label: 'Slate', pricePerSqFt: '$18.00' },
];

const AnalysisPage = ({ address, onBack }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [isCalculatingCost, setIsCalculatingCost] = useState(false);

    // Fetch roof data on mount (without material)
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // First call: get roof info without material
                const response = await api.post('/analyze-roof', { address });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching analysis:', err);
                const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch analysis data';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (address) {
            fetchAnalysis();
        } else {
            setIsLoading(false);
            setError("No address provided for analysis.");
        }
    }, [address]);

    // Handle material selection - call API with material to get cost
    const handleMaterialChange = async (material) => {
        setSelectedMaterial(material);
        if (!material) return;

        setIsCalculatingCost(true);
        try {
            // Second call: use cached Google data, calculate cost with material
            const response = await api.post('/analyze-roof', { address, material });
            setData(response.data);
        } catch (err) {
            console.error('Error calculating cost:', err);
        } finally {
            setIsCalculatingCost(false);
        }
    };

    // Helper to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Helper to convert pitch degrees to ratio
    const degreesToPitchRatio = (degrees) => {
        if (!degrees || degrees === 0) return 'N/A';
        const slope = Math.tan(degrees * Math.PI / 180);
        const ratio = slope * 12;
        return `${ratio.toFixed(1)}/12`;
    };

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-brand-navy text-white">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-brand-gold" />
                    </div>
                </div>
                <h2 className="mt-8 text-2xl font-serif font-black tracking-widest uppercase text-brand-gold">Generating Analysis...</h2>
                <p className="mt-3 text-white/40 font-mono text-xs uppercase tracking-[0.3em]">Connecting to AI Processing Engine</p>
                <div className="mt-12 max-w-xs w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/10">
                    <div className="h-full bg-brand-gold animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-brand-navy text-white p-6">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                    <Info className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold mb-4">Analysis Interrupted</h2>
                <p className="text-white/60 text-center max-w-md mb-8">{error}</p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all font-bold uppercase tracking-widest text-xs"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Map
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-y-auto bg-brand-beige font-sans selection:bg-brand-gold/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-brand-navy text-white px-8 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-brand-navy/90">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-full bg-white/5 hover:bg-brand-gold hover:text-brand-navy transition-all border border-white/10 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-black tracking-[0.4em] uppercase text-brand-gold">Report #882-VISION</span>
                            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
                        </div>
                        <h1 className="text-xl font-serif font-bold tracking-tight">AI Vision Analysis</h1>
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-8 text-[11px] font-mono uppercase tracking-widest text-white/40">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-gold" />
                        <span>Live Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-brand-gold" />
                        <span>HD Imagery Verified</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Image Display */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-brand-gold/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-brand-navy shadow-2xl border border-white/10">
                                {data?.full_image_base64 && (
                                    <img
                                        id="roofImage"
                                        src={`data:image/jpeg;base64,${data.full_image_base64}`}
                                        alt="Analyzed Roof"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                    <div className="bg-brand-navy/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                                        <span className="text-[10px] text-white font-mono font-black tracking-widest uppercase">Detection Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-navy/5">
                            <h3 className="text-2xl font-serif font-black mb-8 border-b border-brand-navy/5 pb-4 italic">Property Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-[.2em] text-brand-navy/40 mb-2">Subject Address</p>
                                    <p className="text-lg font-serif font-bold text-brand-navy leading-snug">{address}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-[.2em] text-brand-navy/40 mb-2">Status</p>
                                    <div className="flex items-center gap-2 text-brand-green-dark font-bold">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Analysis Complete</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roof Measurements */}
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-navy/5">
                            <h3 className="text-xl font-serif font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Layers className="w-5 h-5 text-brand-gold" />
                                Roof Measurements
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-brand-navy/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Area</p>
                                    <p className="text-2xl font-serif font-black text-brand-navy">
                                        {data?.total_area_sqft?.toLocaleString() || '0'}
                                    </p>
                                    <p className="text-[10px] font-mono text-brand-navy/40">sq ft</p>
                                </div>
                                <div className="bg-brand-navy/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Pitch</p>
                                    <p className="text-2xl font-serif font-black text-brand-navy">
                                        {degreesToPitchRatio(data?.predominant_pitch)}
                                    </p>
                                    <p className="text-[10px] font-mono text-brand-navy/40">{data?.predominant_pitch}°</p>
                                </div>
                                <div className="bg-brand-navy/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Facets</p>
                                    <p className="text-2xl font-serif font-black text-brand-navy">
                                        {data?.facet_count || '0'}
                                    </p>
                                    <p className="text-[10px] font-mono text-brand-navy/40">planes</p>
                                </div>
                                <div className="bg-brand-navy/5 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Material</p>
                                    <select
                                        value={selectedMaterial}
                                        onChange={(e) => handleMaterialChange(e.target.value)}
                                        className="w-full bg-white border-2 border-brand-navy/10 rounded-xl px-3 py-2 text-lg font-serif font-black text-brand-navy text-center focus:outline-none focus:border-brand-gold cursor-pointer"
                                    >
                                        <option value="">Select Material</option>
                                        {ROOF_MATERIALS.map((mat) => (
                                            <option key={mat.value} value={mat.value}>
                                                {mat.label} ({mat.pricePerSqFt}/sqft)
                                            </option>
                                        ))}
                                    </select>
                                    {isCalculatingCost && (
                                        <p className="text-[10px] font-mono text-brand-navy/40 mt-2">Calculating...</p>
                                    )}
                                </div>
                            </div>

                            {/* Linear Measurements */}
                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-navy/60">Ridges/Hips</span>
                                    <span className="font-serif font-bold text-brand-navy">{data?.ridges_hips?.toFixed(1) || '0'} ft</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-navy/60">Valleys</span>
                                    <span className="font-serif font-bold text-brand-navy">{data?.valleys?.toFixed(1) || '0'} ft</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-navy/60">Rakes</span>
                                    <span className="font-serif font-bold text-brand-navy">{data?.rakes?.toFixed(1) || '0'} ft</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-xl">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-navy/60">Eaves</span>
                                    <span className="font-serif font-bold text-brand-navy">{data?.eaves?.toFixed(1) || '0'} ft</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Data & Calculations */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Cost Estimate Card */}
                        <div className="bg-gradient-to-br from-brand-navy to-brand-navy/90 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <DollarSign className="w-6 h-6 text-brand-gold" />
                                    </div>
                                    <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-white/40">Estimated Cost</span>
                                </div>

                                <div className="mb-6">
                                    <p className="text-white/40 text-xs font-mono mb-2">Average Estimate</p>
                                    <div className="flex items-baseline gap-2">
                                        {data?.estimated_cost_avg ? (
                                            <span className="text-5xl font-serif font-black text-brand-gold">
                                                {formatCurrency(data.estimated_cost_avg)}
                                            </span>
                                        ) : (
                                            <span className="text-4xl font-serif font-black text-white/30">--</span>
                                        )}
                                    </div>
                                    {!data?.estimated_cost_avg && (
                                        <p className="text-white/40 text-xs font-mono mt-2">Select a material to calculate cost</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Low</p>
                                        <p className="text-xl font-serif font-bold text-white">
                                            {data?.estimated_cost_low ? formatCurrency(data.estimated_cost_low) : '--'}
                                        </p>
                                    </div>
                                    <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">High</p>
                                        <p className="text-xl font-serif font-bold text-white">
                                            {data?.estimated_cost_high ? formatCurrency(data.estimated_cost_high) : '--'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Area Card */}
                        <div className="bg-brand-navy text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <Ruler className="w-6 h-6 text-brand-gold" />
                                    </div>
                                    <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-white/40">Total Surface Area</span>
                                </div>

                                <div className="flex items-baseline gap-4 mb-2">
                                    <span className="text-7xl font-serif font-black text-brand-gold">
                                        {data?.total_area_sqft?.toLocaleString() || '0'}
                                    </span>
                                    <span className="text-xl font-serif font-bold text-white/40 italic">sq ft</span>
                                </div>
                                <p className="text-white/40 text-xs font-mono mb-8">Professional roof estimation</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Material Type</span>
                                        <span className="font-serif font-bold text-brand-gold">{data?.material?.replace(' (baseline)', '') || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Pitch Estimation</span>
                                        <span className="font-serif font-bold text-brand-gold">{degreesToPitchRatio(data?.predominant_pitch)} ({data?.predominant_pitch}°)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-6 bg-brand-gold text-brand-navy rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                            Export Professional PDF
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
            `}</style>
        </div>
    );
};

export default AnalysisPage;
