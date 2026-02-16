import React, { useState, useEffect } from 'react';
import RoofMap from './components/MapContainer';
import AddressSearch from './components/AddressSearch';
import MeasurementDisplay from './components/MeasurementDisplay';
import PasswordGate from './components/PasswordGate';
import { calculatePolygonArea } from './utils/calculateArea';
import { fetchBuildingInsights, fetchSolarDataLayers, processSolarData } from './utils/solarApi';
import { geoTiffToDataUrl } from './utils/geotiffUtils';
import { analyzeRoofWithClaude } from './utils/anthropicApi';
import { Ruler, Maximize, Shield, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

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

function App() {
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
        setIsLoadingSolar(true);
        setHasLocation(false);
        setMapCenter([location.lat, location.lon]);
        setMapZoom(21);
        setAreaSqFt(0);
        setSuggestedFootprint(null);
        setSelectedAddress(location.address || '');
        setRgbOverlay(null);

        try {
            const data = await fetchBuildingInsights(location.lat, location.lon);
            setSolarData(data);

            if (data) {
                const buildingLat = data.center?.latitude || location.lat;
                const buildingLng = data.center?.longitude || location.lon;
                setMapCenter([buildingLat, buildingLng]);
                setMapZoom(20);

                const layers = await fetchSolarDataLayers(buildingLat, buildingLng, 50);
                if (layers && layers.rgbUrl) {
                    const overlay = await geoTiffToDataUrl(layers.rgbUrl, API_KEY, [buildingLat, buildingLng]);
                    if (overlay && overlay.bounds) {
                        setRgbOverlay(overlay);
                    }
                }

                if (data.boundingPoly?.vertices) {
                    const footprint = data.boundingPoly.vertices.map(v => [v.latitude, v.longitude]);
                    setSuggestedFootprint(footprint);

                    const processed = processSolarData(data);
                    if (processed?.totalAreaSqFt) {
                        setAreaSqFt(processed.totalAreaSqFt);
                    }
                }
            }
        } catch (e) {
            console.error("Error loading location details:", e);
        } finally {
            setIsLoadingSolar(false);
            setHasLocation(true);
        }
    }, [API_KEY]);

    const triggerAiAnalysis = React.useCallback(async () => {
        if (!solarData) return;

        setIsAnalyzing(true);
        try {
            let finalImage = null;
            let imageBounds = null;

            if (rgbOverlay && rgbOverlay.url) {
                finalImage = rgbOverlay.url;
                imageBounds = {
                    south: rgbOverlay.bounds[0][0],
                    west: rgbOverlay.bounds[0][1],
                    north: rgbOverlay.bounds[1][0],
                    east: rgbOverlay.bounds[1][1]
                };
            } else {
                const mapElement = document.querySelector('.leaflet-container');
                if (!mapElement) return;

                const canvas = await html2canvas(mapElement, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false
                });
                finalImage = canvas.toDataURL('image/png');

                const mapInstance = window.L?.DomUtil.get(mapElement)?._leaflet_map;
                if (mapInstance) {
                    const bounds = mapInstance.getBounds();
                    imageBounds = {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest()
                    };
                }
            }

            const processed = processSolarData(solarData);
            const aiResult = await analyzeRoofWithClaude(processed, solarData, finalImage, selectedAddress);
            setAiMeasurements(aiResult);

            if (aiResult?.estimatedGroundAreaSqFt) {
                setAreaSqFt(aiResult.estimatedGroundAreaSqFt);
            }
        } catch (err) {
            console.error('AI Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
            setIsLoadingSolar(false);
            setHasLocation(true);
        }
    }, [solarData, selectedAddress, rgbOverlay]);

    const handlePolygonUpdate = React.useCallback((layer) => {
        currentPolygonRef.current = layer;
        if (layer) {
            const area = calculatePolygonArea(layer);
            setAreaSqFt(area);
        } else {
            setAreaSqFt(0);
        }
    }, []);

    const handleDevManualInit = () => {
        setSolarData(null);
        setAreaSqFt(0);
        setSuggestedFootprint(null);
    };

    return (
        <PasswordGate>
            <div className="h-screen w-screen relative overflow-hidden bg-brand-beige font-sans">
                {/* Landing Page Mode */}
                {!hasLocation && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy text-white">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486430290-35657a918550?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 grayscale transform scale-105"></div>
                        <div className="relative z-10 max-w-4xl px-4 text-center">
                            <div className="inline-block px-4 py-1.5 mb-8 text-[11px] font-bold tracking-[0.2em] text-brand-gold uppercase bg-white/5 rounded-full border border-white/10 backdrop-blur-sm font-mono">
                                The Modern Professional Craftsman
                            </div>
                            <h1 className="text-6xl md:text-8xl font-serif font-black leading-[0.9] tracking-tight mb-8">
                                Satellite <span className="text-brand-gold italic">Roof</span> <br />Measurement
                            </h1>
                            <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-sans">
                                Instantly measure roof area from high-resolution satellite imagery.
                                Professional precision with automated pitch adjustment and detailed reporting.
                            </p>
                            <div className="relative w-full max-w-xl mx-auto mb-16">
                                <AddressSearch onLocationSelect={handleLocationSelect} className="w-full relative z-20" />
                                <div className="absolute -inset-1 bg-brand-gold/20 rounded-lg blur-2xl opacity-50"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-8">
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-all hover:bg-white/10">
                                    <Maximize className="w-8 h-8 text-brand-gold mb-4" />
                                    <h3 className="text-xl font-serif font-bold mb-2">Auto-Measure</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Smart detection algorithms instantly outline and calculate roof surface area.</p>
                                </div>
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-all hover:bg-white/10">
                                    <Ruler className="w-8 h-8 text-brand-gold mb-4" />
                                    <h3 className="text-xl font-serif font-bold mb-2">Pitch & Waste</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Adjust for roof slope and material waste factors for precise estimation.</p>
                                </div>
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-all hover:bg-white/10">
                                    <Shield className="w-8 h-8 text-brand-gold mb-4" />
                                    <h3 className="text-xl font-serif font-bold mb-2">High-Res Imagery</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">Powered by Solar API for crystal clear views up to zoom level 22.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Solar State */}
                {isLoadingSolar && (
                    <div className="flex-1 h-full flex flex-col items-center justify-center bg-brand-navy text-white">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Maximize className="w-6 h-6 text-brand-gold" />
                            </div>
                        </div>
                        <h2 className="mt-6 text-xl font-serif font-black tracking-widest uppercase">Fetching LIDAR...</h2>
                        <p className="mt-2 text-white/40 font-mono text-[10px] uppercase tracking-[0.3em]">Preparing High-Resolution Roof Analysis</p>
                    </div>
                )}

                {/* Map Application Mode - Full Screen Immersive Layout */}
                {hasLocation && !isLoadingSolar && (
                    <div className="h-full w-full relative">
                        {/* Full Screen Map (100%) */}
                        <div className="absolute inset-0 z-0 h-full w-full">
                            <RoofMap
                                center={mapCenter}
                                zoom={mapZoom}
                                solarData={solarData}
                                suggestedFootprint={suggestedFootprint}
                                onPolygonUpdate={handlePolygonUpdate}
                                rgbOverlay={rgbOverlay}
                                isAnalysisMode={!!rgbOverlay}
                            />
                        </div>

                        {/* Pro-Mode Header: Focus Mode Indicator & Instructions */}
                        <div className="absolute top-0 left-0 right-0 h-1 z-[2100] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"></div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[2200] pointer-events-none w-full flex justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-4 bg-brand-navy/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                                        <span className="text-[10px] text-brand-gold font-mono font-black tracking-[0.4em] uppercase">Solar Vision</span>
                                    </div>
                                    <div className="w-[1px] h-3 bg-white/20"></div>
                                    <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase italic">
                                        {rgbOverlay ? 'Studio Analysis Active' : 'High-Precision Capture Active'}
                                    </span>
                                </div>

                                {rgbOverlay && (
                                    <div className="bg-brand-navy/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-2xl skew-x-[-10deg] pointer-events-auto">
                                        <span className="block text-[12px] text-white font-mono font-bold tracking-[0.2em] uppercase skew-x-[10deg]">
                                            Use the drawing tool to highlight your roof
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Overlay: Address Search & Analysis Headers */}
                        {!rgbOverlay && (
                            <div className="absolute top-6 left-6 right-6 z-[2000] flex items-center gap-3">
                                <div className="max-w-xl flex-1 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:bg-white/10">
                                    <AddressSearch onLocationSelect={handleLocationSelect} className="relative w-full" />
                                </div>
                            </div>
                        )}

                        {hasLocation && solarData && (
                            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2">
                                <button
                                    onClick={triggerAiAnalysis}
                                    disabled={isAnalyzing}
                                    className={`px-12 py-6 rounded-[2.5rem] font-black text-[12px] tracking-[0.2em] uppercase shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300 flex items-center gap-4 group border border-white/20 backdrop-blur-2xl ${isAnalyzing
                                        ? 'bg-brand-navy/80 text-white/50 cursor-not-allowed'
                                        : 'bg-brand-gold text-brand-navy hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    <Shield className={`w-6 h-6 ${isAnalyzing ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
                                    {isAnalyzing ? 'Analyzing Roof Geometry...' : 'Analyze Building'}
                                </button>
                            </div>
                        )}

                        {/* Floating Overlay: Measurement Details Panel - ONLY shown during/after analysis */}
                        {(isAnalyzing || aiMeasurements) && (
                            <div className="absolute bottom-10 left-10 right-10 z-[3000] flex justify-center pointer-events-none animate-in slide-in-from-bottom duration-700">
                                <div className="w-full max-w-6xl h-[320px] pointer-events-auto rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-2xl bg-brand-navy/85 transition-all duration-500">
                                    <MeasurementDisplay
                                        areaSqFt={areaSqFt}
                                        solarData={solarData}
                                        aiMeasurements={aiMeasurements}
                                        isAnalyzing={isAnalyzing}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Global Overrides for Leaflet Draw to hide toolbar */}
                        <style>{`
                        .leaflet-draw-toolbar {
                            display: none !important;
                        }
                    `}</style>

                        {/* Subtle Corner Vignette */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-brand-navy/30 via-transparent to-brand-navy/50 z-[1]"></div>
                    </div>
                )}
            </div>
        </PasswordGate>
    );
}

export default App;
