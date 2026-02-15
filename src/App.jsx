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
    const [selectedAddress, setSelectedAddress] = useState('');
    const currentPolygonRef = React.useRef(null);

    const handleLocationSelect = React.useCallback(async (location) => {
        setMapCenter([location.lat, location.lon]);
        setMapZoom(21); // Zoom in very close for roof detail
        setAreaSqFt(0); // Reset area
        setSuggestedFootprint(null);
        setHasLocation(true);
        setSelectedAddress(location.address || '');

        // Fetch professional LiDAR data (Standard JSON only, no heavy imagery)
        const data = await fetchBuildingInsights(location.lat, location.lon);
        setSolarData(data);

        // NOTE: High-res Solar Layers (RGB/DSM) disabled for performance.
        // We rely on the user's manual highlight and the standard map screenshot.
    }, []);

    // NOTE: We no longer auto-run AI here. 
    // User must confirm selection with "Analyze Selection" button.
    const triggerAiAnalysis = React.useCallback(async () => {
        if (!solarData || !currentPolygonRef.current) return;

        setIsAnalyzing(true);
        try {
            const mapElement = document.querySelector('.leaflet-container');
            if (!mapElement) return;

            // 1. Capture full map screenshot
            const canvas = await html2canvas(mapElement, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            });

            // 2. Get map instance and poly bounds in pixel space
            const mapInstance = window.L?.DomUtil.get(mapElement)?._leaflet_map;
            let finalImage = canvas.toDataURL('image/png');
            let cropOffsets = { x: 0, y: 0, width: canvas.width, height: canvas.height };
            let mapBounds = null;

            if (mapInstance && currentPolygonRef.current) {
                const latlngs = currentPolygonRef.current.getLatLngs()[0];
                const points = latlngs.map(ll => mapInstance.latLngToContainerPoint(ll));

                const minX = Math.min(...points.map(p => p.x));
                const maxX = Math.max(...points.map(p => p.x));
                const minY = Math.min(...points.map(p => p.y));
                const maxY = Math.max(...points.map(p => p.y));

                // Add some padding (e.g., 20% of width/height)
                const w = maxX - minX;
                const h = maxY - minY;
                const padding = Math.max(w, h) * 0.2;

                const cropX = Math.max(0, minX - padding);
                const cropY = Math.max(0, minY - padding);
                const cropW = Math.min(canvas.width - cropX, w + padding * 2);
                const cropH = Math.min(canvas.height - cropY, h + padding * 2);

                cropOffsets = { x: cropX, y: cropY, width: cropW, height: cropH };

                // 3. Create cropped canvas
                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = cropW;
                croppedCanvas.height = cropH;
                const ctx = croppedCanvas.getContext('2d');
                ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                finalImage = croppedCanvas.toDataURL('image/png');

                // Get map bounds for later coordinate conversion
                const bounds = mapInstance.getBounds();
                mapBounds = {
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                };
            }

            const processed = processSolarData(solarData);

            // Use the standard map screenshot (finalImage)
            const aiResult = await analyzeRoofWithClaude(processed, solarData, finalImage, selectedAddress);
            setAiMeasurements(aiResult);

            // 5. Map results back (accounting for crop)
            if (aiResult?.normalizedFootprint && mapBounds) {
                // Adjust normalized footprint from cropped space back to full map space
                const latRange = mapBounds.north - mapBounds.south;
                const lngRange = mapBounds.east - mapBounds.west;

                const latsLngs = aiResult.normalizedFootprint.map(p => {
                    // p is normalized (0-1) within the CROPPED image
                    // Convert to pixel coordinates in original canvas
                    const pxX = cropOffsets.x + (p.x * cropOffsets.width);
                    const pxY = cropOffsets.y + (p.y * cropOffsets.height);

                    // Convert pixel to normalized map coordinate (0-1)
                    const normX = pxX / canvas.width;
                    const normY = pxY / canvas.height;

                    return [
                        mapBounds.north - (normY * latRange),
                        mapBounds.west + (normX * lngRange)
                    ];
                });
                setSuggestedFootprint(latsLngs);
            }

            if (aiResult?.estimatedGroundAreaSqFt) {
                setAreaSqFt(aiResult.estimatedGroundAreaSqFt);
            }
        } catch (err) {
            console.error('AI Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [solarData, selectedAddress]);


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

                    {/* Top: Map Section (70%) */}
                    <div className="h-[70%] relative w-full isolate border-b-4 border-brand-navy">
                        <div className="absolute inset-0">
                            <RoofMap
                                center={mapCenter}
                                zoom={mapZoom}
                                solarData={solarData}
                                suggestedFootprint={suggestedFootprint}
                                onPolygonUpdate={handlePolygonUpdate}
                            />
                        </div>

                        {/* Address Search Header */}
                        <div className="absolute top-6 left-6 right-6 z-[2000] flex items-center gap-3">
                            <div className="flex-1">
                                <AddressSearch onLocationSelect={handleLocationSelect} className="relative w-full" />
                            </div>

                            {hasLocation && solarData && (
                                <div className="flex items-center gap-2">
                                    {!areaSqFt ? (
                                        <div className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white animate-pulse">
                                            <Maximize className="w-4 h-4 text-brand-gold" />
                                            <span className="text-sm font-bold tracking-wide">Step 1: Draw a box around the roof</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={triggerAiAnalysis}
                                            disabled={isAnalyzing}
                                            className={`px-6 py-4 rounded-3xl font-bold text-sm tracking-wide shadow-2xl transition-all duration-300 flex items-center gap-2 group ${isAnalyzing
                                                ? 'bg-brand-navy/50 text-white/50 cursor-not-allowed'
                                                : 'bg-brand-gold text-brand-navy hover:scale-105 active:scale-95'
                                                }`}
                                        >
                                            <Shield className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
                                            {isAnalyzing ? 'Analyzing Highlight...' : 'Step 2: Analyze Highlight'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

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
                    </div>

                    {/* Bottom: Measurement Details Panel (30%) */}
                    <div className="h-[30%] relative z-10 w-full bg-brand-beige">
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
