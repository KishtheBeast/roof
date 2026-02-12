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
        <div className="h-screen w-screen relative overflow-hidden bg-gray-50">
            {/* Landing Page Mode */}
            {!hasLocation && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-gray-900 text-white">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486430290-35657a918550?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 transform scale-105"></div>

                    <div className="relative z-10 max-w-4xl px-4 text-center">
                        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-300 uppercase bg-blue-900/50 rounded-full border border-blue-700/50 backdrop-blur-sm">
                            Professional Grade
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                            Satellite Roof Measurement
                        </h1>
                        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Instantly measure roof area from high-resolution satellite imagery.
                            Auto-detection, pitch adjustment, and detailed reports in seconds.
                        </p>

                        <div className="relative w-full max-w-xl mx-auto mb-16">
                            <AddressSearch
                                onLocationSelect={handleLocationSelect}
                                className="w-full relative z-20 shadow-2xl"
                            />
                            {/* Decorative glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-8">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-transform hover:-translate-y-1">
                                <Maximize className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Auto-Measure</h3>
                                <p className="text-sm text-blue-100/70">Smart detection algorithms instantly outline and calculate roof surface area.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-transform hover:-translate-y-1">
                                <Ruler className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Pitch & Waste</h3>
                                <p className="text-sm text-blue-100/70">Adjust for roof slope and material waste factors for precise estimation.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur transition-transform hover:-translate-y-1">
                                <Shield className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="text-lg font-bold mb-2">High-Res Imagery</h3>
                                <p className="text-sm text-blue-100/70">Powered by Esri World Imagery for crystal clear views up to zoom level 22.</p>
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
                            className="absolute top-4 left-4 right-4 md:right-auto md:w-96 z-[5000] font-sans"
                        />
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
