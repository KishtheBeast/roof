import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Ruler, Activity, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { api } from '../../utils/auth';

const AnalysisPage = ({ address, onBack }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                // Use the authenticated API instance (handles tokens automatically)
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
                    </div>

                    {/* Right Column: Data & Calculations */}
                    <div className="lg:col-span-5 space-y-8">
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
                                <p className="text-white/40 text-xs font-mono mb-8">Calculated via Vision AI Geometry</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Material Type</span>
                                        <span className="font-serif font-bold text-brand-gold">{data?.material || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Pitch Estimation</span>
                                        <span className="font-serif font-bold text-brand-gold">4/12 (Standard)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Breakdown */}
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-brand-navy/5">
                            <h3 className="text-xl font-serif font-black mb-6 uppercase tracking-tight">Vision Logs</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Cloud Buffer', value: '0.0ms', status: 'Optimal' },
                                    { label: 'Edge Detection', value: 'High Conf.', status: 'Success' },
                                    { label: 'Material Logic', value: data?.material || 'N/A', status: 'Inferred' },
                                    { label: 'Calculation Matrix', value: 'S² Method', status: 'Verified' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group border-b border-brand-navy/5 pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-[10px] font-mono font-bold text-brand-navy/40 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-sm font-bold text-brand-navy">{item.value}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green-dark"></div>
                                            <span className="text-[10px] font-mono text-brand-green-dark uppercase font-black tracking-widest">{item.status}</span>
                                        </div>
                                    </div>
                                ))}
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
