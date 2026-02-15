import React, { useState } from 'react';
import RoofMap from './components/MapContainer';
import AddressSearch from './components/AddressSearch';
import MeasurementDisplay from './components/MeasurementDisplay';
import { calculatePolygonArea } from './utils/calculateArea';
import { fetchBuildingInsights, processSolarData } from './utils/solarApi';
import { analyzeRoofWithClaude } from './utils/anthropicApi';
import { Ruler, Maximize, Shield } from 'lucide-react';
import html2canvas from 'html2canvas';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Initialize Google Maps API
if (API_KEY) {
    setOptions({
        apiKey: API_KEY, // Try both standard and potential variations
        key: API_KEY,
        version: "weekly"
    });
    console.log('[Google Maps] Key configured (length:', API_KEY.length, ')');
} else {
    console.error('[Google Maps] CRITICAL: VITE_GOOGLE_MAPS_API_KEY is missing!');
}

async function initializeGoogleMaps() {
    if (!API_KEY) return;

    try {
        // Load libraries sequentially to ensure correct initialization
        await importLibrary("places");
        await importLibrary("maps");
        console.log('[Google Maps] Libraries loaded successfully');
    } catch (e) {
        console.error('[Google Maps] Library Load Failure:', e);
    }
}

// Start loading the API immediately in the background
initializeGoogleMaps().catch(e => console.error('[Google Maps] Init Promise Error:', e));

function App() {
    const [mapCenter, setMapCenter] = useState([39.6368, -74.8035]); // Default: South Jersey (Hammonton area)
    const [mapZoom, setMapZoom] = useState(18);
    const [areaSqFt, setAreaSqFt] = useState(0);
    const [hasLocation, setHasLocation] = useState(false);
    const [solarData, setSolarData] = useState(null);
    const [aiMeasurements, setAiMeasurements] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedFootprint, setSuggestedFootprint] = useState(null);

    const handleLocationSelect = React.useCallback(async (location) => {
        setMapCenter([location.lat, location.lon]);
        setMapZoom(21); // Zoom in very close for roof detail
        setAreaSqFt(0); // Reset area
        setSuggestedFootprint(null);
        setHasLocation(true);

        // Fetch professional LiDAR data
        const data = await fetchBuildingInsights(location.lat, location.lon);
        setSolarData(data);

        // Auto-run AI analysis if solar data is available
        if (data) {
            setIsAnalyzing(true);
            try {
                // Wait for map tiles to stabilize before capturing
                await new Promise(resolve => setTimeout(resolve, 3000));

                let imageBase64 = null;
                let mapBounds = null;
                const mapElement = document.querySelector('.leaflet-container');

                if (mapElement) {
                    try {
                        // Capture map bounds at the time of screenshot
                        // This allows us to map normalized (0-1) coordinates back to Lat/Lng
                        const mapInstance = window.L?.DomUtil.get(mapElement)?._leaflet_map;
                        if (mapInstance) {
                            const bounds = mapInstance.getBounds();
                            mapBounds = {
                                north: bounds.getNorth(),
                                south: bounds.getSouth(),
                                east: bounds.getEast(),
                                west: bounds.getWest()
                            };
                        }

                        const canvas = await html2canvas(mapElement, {
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: null,
                            logging: false
                        });
                        imageBase64 = canvas.toDataURL('image/png');
                        console.log('[Capture] Map screenshot generated successfully');
                    } catch (captureErr) {
                        console.error('[Capture] Failed to generate map screenshot:', captureErr);
                    }
                }

                const processed = processSolarData(data);
                const aiResult = await analyzeRoofWithClaude(processed, data, imageBase64);
                setAiMeasurements(aiResult);

                // [AI MOVE BOX] Map normalized footprint (0-1) to Lat/Lng
                if (aiResult?.normalizedFootprint && mapBounds) {
                    const latRange = mapBounds.north - mapBounds.south;
                    const lngRange = mapBounds.east - mapBounds.west;

                    const latsLngs = aiResult.normalizedFootprint.map(p => [
                        mapBounds.north - (p.y * latRange), // y=0 is north
                        mapBounds.west + (p.x * lngRange)   // x=0 is west
                    ]);
                    setSuggestedFootprint(latsLngs);
                    console.log('[AI] Footprint refined and mapped to Lat/Lng');
                }

                // [AUTO-SET] Automatically populate the ground area if AI verified it
                if (aiResult?.estimatedGroundAreaSqFt) {
                    setAreaSqFt(aiResult.estimatedGroundAreaSqFt);
                } else if (processed.wholeRoofStats?.groundAreaSqFt) {
                    setAreaSqFt(processed.wholeRoofStats.groundAreaSqFt);
                }
            } catch (err) {
                console.error('AI Analysis failed:', err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    }, []);

    const handlePolygonUpdate = React.useCallback((layer) => {
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
                            <AddressSearch
                                onLocationSelect={handleLocationSelect}
                                className="w-full relative z-20"
                            />
                            {/* Decorative glow */}
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
                                <p className="text-sm text-gray-400 leading-relaxed">Powered by Esri World Imagery for crystal clear views up to zoom level 22.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Application Mode - Split Screen Layout */}
            {hasLocation && (
                <div className="flex flex-col h-full w-full">

                    {/* Top: Map Section */}
                    <div className="flex-1 relative w-full isolate">
                        <div className="absolute inset-0">
                            <RoofMap
                                center={mapCenter}
                                zoom={mapZoom}
                                solarData={solarData}
                                suggestedFootprint={suggestedFootprint}
                                onPolygonUpdate={handlePolygonUpdate}
                            />
                        </div>

                        <AddressSearch
                            onLocationSelect={handleLocationSelect}
                            className="absolute top-6 left-6 right-6 md:right-auto md:w-96 z-[5000]"
                        />

                        {/* Developer Tools */}
                        <div className="absolute top-6 right-6 z-[5000] flex gap-2">
                            <button
                                onClick={handleDevManualInit}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-[10px] text-white/40 font-mono font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 hover:text-white"
                            >
                                <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
                                [DEV] MANUAL INIT
                            </button>
                        </div>

                        {/* Instructional Banner (Only if solar data is NOT present) */}
                        {!solarData && (
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[4000] w-max max-w-[90vw]">
                                <div className="bg-brand-navy/90 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-brand-gold rounded-full p-1.5 mt-0.5">
                                            <Maximize className="w-4 h-4 text-brand-navy" strokeWidth={3} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold">Drag the Blue Box</span>
                                            <span className="text-xs text-white/80">Pull corners to match your roof exactly</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom: Measurement Details Panel */}
                    <div className="flex-none relative z-[1000]">
                        <MeasurementDisplay
                            areaSqFt={areaSqFt}
                            solarData={solarData}
                            aiMeasurements={aiMeasurements}
                            isAnalyzing={isAnalyzing}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}

export default App;
