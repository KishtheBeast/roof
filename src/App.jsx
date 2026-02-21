import React, { useState, useEffect } from 'react';
import AddressSearch from './components/AddressSearch';
import MeasurementDisplay from './components/MeasurementDisplay';
import PasswordGate from './components/PasswordGate';
import { calculatePolygonArea } from './utils/calculateArea';
import { Maximize, Shield, ArrowLeft, ShieldCheck } from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { loginWithApiKey, api } from './utils/auth';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Initialize Google Maps API
if (API_KEY) {
    setOptions({
        apiKey: API_KEY,
        key: API_KEY,
        version: "weekly"
    });
}

async function initializeGoogleMaps() {
    if (!API_KEY) return;
    try {
        await importLibrary("places");
        await importLibrary("maps");
    } catch (e) {
        console.error('[Google Maps] Library Load Failure:', e);
    }
}

initializeGoogleMaps().catch(e => console.error('[Google Maps] Init Promise Error:', e));

const ROOF_API_KEY = import.meta.env.VITE_BACKEND_API_KEY;

function App() {
    // Authenticate with backend on mount
    useEffect(() => {
        if (ROOF_API_KEY) {
            loginWithApiKey(ROOF_API_KEY);
        } else {
            console.warn("⚠️ VITE_BACKEND_API_KEY is missing in .env");
        }
    }, []);

    const [mapCenter, setMapCenter] = useState([39.6368, -74.8035]);
    const [mapZoom, setMapZoom] = useState(18);
    const [areaSqFt, setAreaSqFt] = useState(0);
    const [hasLocation, setHasLocation] = useState(false);
    const [solarData, setSolarData] = useState(null);
    const [rgbOverlay, setRgbOverlay] = useState(null);
    const [isLoadingSolar, setIsLoadingSolar] = useState(false);
    const [aiMeasurements, setAiMeasurements] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedFootprint, setSuggestedFootprint] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const currentPolygonRef = React.useRef(null);



    const handleLocationSelect = React.useCallback(async (location) => {
        // Start "Loading" state - this will trigger the loading screen UI
        setIsLoadingSolar(true);
        setHasLocation(false);

        setMapCenter([location.lat, location.lon]);
        setMapZoom(20);
        setAreaSqFt(0);
        setSuggestedFootprint(null);
        setSelectedAddress(location.address || '');
        setRgbOverlay(null);
        setSolarData(null); // clear old data
        setAiMeasurements(null); // clear old analysis

        // SKIP Google Solar API calls as requested.
        // We go straight to local AI analysis.

        // Short timeout to allow state to settle, then trigger analysis
        setTimeout(() => {
            triggerAiAnalysis(location.address);
        }, 100);

    }, []);

    const triggerAiAnalysis = React.useCallback(async (addressOverride) => {
        const addressToAnalyze = addressOverride || selectedAddress;
        if (!addressToAnalyze) return;

        setIsAnalyzing(true);
        // Ensure loading screen stays up if called from handleLocationSelect
        setIsLoadingSolar(true);

        try {
            // Use authenticated API client
            const response = await api.post('/analyze-roof', { address: addressToAnalyze });

            const data = response.data;

            // Transform API response to match UI needs
            const aiResult = {
                totalAreaSqFt: data.total_area_sqft,
                footprintSqFt: data.total_area_sqft,
                pitch: data.predominant_pitch,
                facetCount: data.facet_count,
                ridges: data.ridges_hips,
                valleys: data.valleys,
                rakes: data.rakes,
                eaves: data.eaves,
                material: data.material,
                confidenceScore: 0.98,
                estimationNotes: data.reasoning
            };

            setAiMeasurements(aiResult);

            if (data.total_area_sqft) {
                setAreaSqFt(data.total_area_sqft);
            }

            if (data.full_image_base64) {
                const imageUrl = `data:image/jpeg;base64,${data.full_image_base64}`;
                aiResult.highlightedImage = imageUrl;
                setAiMeasurements({ ...aiResult });
            }

        } catch (err) {
            console.error('AI Analysis failed:', err);
            // Optional: Show error to user
        } finally {
            setIsAnalyzing(false);
            setIsLoadingSolar(false); // Hide loading screen
            setHasLocation(true); // Show dashboard
        }
    }, [selectedAddress]);

    const handlePolygonUpdate = React.useCallback((layer) => {
        currentPolygonRef.current = layer;
        if (layer) {
            const area = calculatePolygonArea(layer);
            setAreaSqFt(area);
        } else {
            setAreaSqFt(0);
        }
    }, []);

    // Auto-trigger AI analysis when solar data is loaded
    React.useEffect(() => {
        if (solarData && hasLocation && !isAnalyzing && !aiMeasurements) {
            const timer = setTimeout(() => {
                triggerAiAnalysis();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [solarData, hasLocation, isAnalyzing, aiMeasurements, triggerAiAnalysis]);

    const handleDevManualInit = () => {
        setSolarData(null);
        setAreaSqFt(0);
        setSuggestedFootprint(null);
    };

    return (
        <PasswordGate>
            <div className="h-[100dvh] w-screen relative overflow-hidden bg-brand-beige font-sans touch-manipulation">
                {/* Landing Page Mode */}
                {!hasLocation && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy text-white">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486430290-35657a918550?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 grayscale transform scale-105"></div>
                        <div className="relative z-10 max-w-4xl px-4 text-center">
                            <div className="inline-block px-3 py-1 mb-4 md:mb-6 text-[9px] md:text-[11px] font-bold tracking-[0.2em] text-brand-gold uppercase bg-white/5 rounded-full border border-white/10 backdrop-blur-sm font-mono">
                                The Modern Professional Craftsman
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-serif font-black leading-[0.9] tracking-tight mb-3 md:mb-6">
                                Satellite <span className="text-brand-gold italic">Roof</span> <br />Measurement
                            </h1>
                            <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed font-sans px-2">
                                Instantly measure roof area from high-resolution satellite imagery.
                            </p>
                            <div className="w-full max-w-xl mx-auto mb-12 md:mb-16 px-4">
                                <AddressSearch onLocationSelect={handleLocationSelect} className="w-full relative z-20" />
                                <div className="absolute -inset-1 bg-brand-gold/20 rounded-lg blur-2xl opacity-50"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Solar State - Full Screen Overlay */}
                {isLoadingSolar && (
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
                )}

                {/* Analysis Results View - Replaces Map */}
                {hasLocation && !isLoadingSolar && aiMeasurements && (
                    <div className="absolute inset-0 z-0 h-full w-full bg-brand-beige flex flex-col animate-in fade-in duration-500">
                        {/* Header */}
                        <div className="h-16 md:h-20 bg-brand-navy flex items-center justify-between px-4 md:px-8 border-b border-white/10 shrink-0 shadow-lg z-10">
                            <div className="flex items-center gap-3 md:gap-6">
                                <div className="p-1.5 md:p-2 bg-brand-gold rounded-lg">
                                    <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-brand-navy" />
                                </div>
                                <div className="flex flex-col max-w-[180px] md:max-w-none">
                                    <span className="text-white font-serif font-black text-sm md:text-xl tracking-tight truncate">{selectedAddress}</span>
                                    <span className="text-brand-gold text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="hidden sm:inline">AI Analysis Complete</span>
                                        <span className="sm:hidden">Complete</span>
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setHasLocation(false);
                                    setAiMeasurements(null);
                                    setSelectedAddress('');
                                    setSolarData(null);
                                }}
                                className="px-3 md:px-6 py-2 md:py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 group"
                            >
                                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">New Search</span>
                                <span className="sm:hidden">Back</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative p-3 md:p-8 bg-brand-beige">
                            <div className="h-full w-full bg-white rounded-2xl md:rounded-[3rem] shadow-2xl border border-brand-navy/5 overflow-hidden">
                                <MeasurementDisplay
                                    areaSqFt={areaSqFt}
                                    aiMeasurements={aiMeasurements}
                                    isAnalyzing={false}
                                    address={selectedAddress}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Fallback / Error State */}
                {hasLocation && !isLoadingSolar && !aiMeasurements && (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-brand-navy text-white">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur text-center max-w-md">
                            <Shield className="w-12 h-12 text-brand-gold mx-auto mb-6 opacity-50" />
                            <h3 className="text-2xl font-serif font-bold mb-2">Analysis Pending...</h3>
                            <p className="text-white/40 mb-8">Data processing in progress.</p>
                            <button
                                onClick={() => triggerAiAnalysis()}
                                className="px-8 py-3 bg-brand-gold text-brand-navy font-bold rounded-xl uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                Retry Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PasswordGate>
    );
}

export default App;
