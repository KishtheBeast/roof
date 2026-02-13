import React, { useState } from 'react';
import RoofMap from './components/MapContainer';
import AddressSearch from './components/AddressSearch';
import MeasurementDisplay from './components/MeasurementDisplay';
import { calculatePolygonArea } from './utils/calculateArea';
import { Ruler, Maximize, Shield, ArrowRight } from 'lucide-react';

function App() {
    const [mapCenter, setMapCenter] = useState([39.6368, -74.8035]); // Default: South Jersey (Hammonton area)
    const [mapZoom, setMapZoom] = useState(18);
    const [areaSqFt, setAreaSqFt] = useState(0);
    const [hasLocation, setHasLocation] = useState(false);

    const handleLocationSelect = React.useCallback((location) => {
        setMapCenter([location.lat, location.lon]);
        setMapZoom(21); // Zoom in very close for roof detail
        setAreaSqFt(0); // Will be updated by auto-box
        setHasLocation(true);
    }, []);

    const handlePolygonUpdate = React.useCallback((layer) => {
        if (layer) {
            const area = calculatePolygonArea(layer);
            setAreaSqFt(area);
        } else {
            setAreaSqFt(0);
        }
    }, []);

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
                                onPolygonUpdate={handlePolygonUpdate}
                            />
                        </div>

                        <AddressSearch
                            onLocationSelect={handleLocationSelect}
                            className="absolute top-6 left-6 right-6 md:right-auto md:w-96 z-[5000]"
                        />

                        {/* Instructional Banner */}
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[4000] w-max max-w-[90vw]">
                            <div className="bg-brand-navy/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="bg-brand-gold rounded-full p-1">
                                    <Maximize className="w-3 h-3 text-brand-navy" strokeWidth={3} />
                                </div>
                                <span className="text-xs font-mono tracking-wider font-bold uppercase">Adjust boundaries to cover full roof</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Measurement Details Panel */}
                    <div className="flex-none relative z-[1000]">
                        <MeasurementDisplay areaSqFt={areaSqFt} />
                    </div>

                </div>
            )}
        </div>
    );
}

export default App;
