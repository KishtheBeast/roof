import React, { useState } from 'react';
import RoofMap from './components/MapContainer';
import AddressSearch from './components/AddressSearch';
import MeasurementDisplay from './components/MeasurementDisplay';
import { calculatePolygonArea } from './utils/calculateArea';

function App() {
    const [mapCenter, setMapCenter] = useState([38.8977, -77.0365]); // Default: White House
    const [mapZoom, setMapZoom] = useState(18);
    const [areaSqFt, setAreaSqFt] = useState(0);

    const handleLocationSelect = React.useCallback((location) => {
        setMapCenter([location.lat, location.lon]);
        setMapZoom(21); // Zoom in very close for roof detail (requires MaxZoom=22 on tile layer)
        setAreaSqFt(0); // Will be updated by auto-box
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
        <div className="h-screen w-screen relative overflow-hidden">
            <AddressSearch onLocationSelect={handleLocationSelect} />

            {/* Map handles view changes internal via ChangeView now */}
            <RoofMap
                center={mapCenter}
                zoom={mapZoom}
                onPolygonUpdate={handlePolygonUpdate}
            />

            <MeasurementDisplay areaSqFt={areaSqFt} />
        </div>
    );
}

export default App;
