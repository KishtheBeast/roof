import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import { Eraser } from 'lucide-react';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fix for window.L access in App.jsx
if (typeof window !== 'undefined') {
    window.L = L;
}

// Component to handle drawing logic
function DrawControl({ center, solarData, suggestedFootprint, onCreated, onDeleted, onEdited }) {
    const map = useMap();
    const featureGroupRef = useRef(new L.FeatureGroup());
    const drawControlRef = useRef(null);
    const drawHandlerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasPolygon, setHasPolygon] = useState(false);

    // Attach map instance to DOM for App.jsx access
    useEffect(() => {
        if (map && map._container) {
            map._container._leaflet_map = map;
        }
    }, [map]);

    // 1. Initialize Draw Control and Event Listeners
    useEffect(() => {
        map.addLayer(featureGroupRef.current);

        const drawStyle = {
            color: '#eab308', // Yellow-500 (Highlighter Look)
            weight: 4,
            opacity: 0.8,
            fillColor: '#facc15', // Yellow-400
            fillOpacity: 0.4,
            dashArray: '', // Solid line for "paint" feel
        };

        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: featureGroupRef.current,
                remove: false, // We handle deletion with a custom button
                edit: false, // We don't want to edit existing shapes
            },
            draw: {
                marker: false,
                circle: false,
                circlemarker: false,
                polyline: false,
                polygon: false,
                rectangle: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: drawStyle,
                    metric: false, // Use imperial
                    repeatMode: false
                },
            },
        });

        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        // We don't add the toolbar control to the map anymore (headless mode)
        // But we need the options for our manual handler
        const rectangleOptions = {
            allowIntersection: false,
            showArea: true,
            shapeOptions: drawStyle,
            metric: false
        };

        // Initialize the Draw.Rectangle handler manually for "make a box"
        // Rectangle tool is easier: drag from corner to corner
        drawHandlerRef.current = new L.Draw.Rectangle(map, rectangleOptions);

        // Edit handler (using standard Control.Draw for edit features if needed, 
        // but since we want "erase only", we might skip full edit control)
        // Actually, let's keep a hidden edit control for internal logic if needed, 
        // or just handle clearing manually.

        // AUTO-ENABLE DRAW on load if no polygon exists
        if (!hasPolygon && !suggestedFootprint) {
            drawHandlerRef.current.enable();
            setIsDrawing(true);
        }

        const handleUpdate = (e) => {
            const layers = featureGroupRef.current.getLayers();
            if (layers.length > 0) {
                if (onEdited) {
                    const mockLayers = {
                        eachLayer: (cb) => layers.forEach(cb)
                    };
                    onEdited(mockLayers);
                }
            }
        };

        map.on(L.Draw.Event.CREATED, (e) => {
            featureGroupRef.current.clearLayers();
            const layer = e.layer;
            featureGroupRef.current.addLayer(layer);
            setHasPolygon(true);
            setIsDrawing(false);

            if (onCreated) onCreated(layer);

            // Enable direct editing on the layer
            // layer.editing.enable(); 
            // Better to let user erase and redraw for simplicity as per request
        });

        map.on(L.Draw.Event.EDITED, (e) => {
            if (onEdited) onEdited(e.layers);
        });

        // Loop manual enable if we want continuous drawing? No, just once.

        return () => {
            if (map) {
                map.removeLayer(featureGroupRef.current);
                if (drawHandlerRef.current) drawHandlerRef.current.disable();
                map.off(L.Draw.Event.CREATED);
                map.off(L.Draw.Event.EDITED);
            }
        };
    }, [map]); // Run once on mount (map ready)

    // 2. Handle AI Suggested Footprint (AI MOVE BOX)
    useEffect(() => {
        if (!suggestedFootprint || suggestedFootprint.length < 3) return;

        featureGroupRef.current.clearLayers();
        const drawStyle = {
            color: '#3b82f6',
            weight: 3,
            opacity: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
        };

        const polygon = L.polygon(suggestedFootprint, drawStyle);
        featureGroupRef.current.addLayer(polygon);
        setHasPolygon(true);

        // If suggested footprint added, disable draw tool
        if (drawHandlerRef.current) drawHandlerRef.current.disable();
        setIsDrawing(false);

        if (onCreated) onCreated(polygon);

        if (onEdited) {
            const mockLayers = { eachLayer: (cb) => cb(polygon) };
            onEdited(mockLayers);
        }
    }, [suggestedFootprint, onCreated, onEdited]);

    // Custom Erase Handler
    const handleErase = () => {
        featureGroupRef.current.clearLayers();
        setHasPolygon(false);
        if (onDeleted) onDeleted(); // Clears state in parent

        // Re-enable drawing immediately
        if (drawHandlerRef.current) {
            drawHandlerRef.current.enable();
            setIsDrawing(true);
        }
    };

    // Render Erase Button (Custom Control)
    if (!hasPolygon) return null;

    return (
        <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto' }}>
            <div className="leaflet-control">
                <button
                    onClick={(e) => {
                        L.DomEvent.stopPropagation(e); // Prevent map click
                        handleErase();
                    }}
                    className="bg-white text-red-600 px-4 py-2 rounded-lg shadow-xl font-bold text-sm flex items-center gap-2 hover:bg-red-50 border border-red-100 transition-all transform hover:scale-105"
                >
                    <Eraser className="w-4 h-4" />
                    Erase Highlight
                </button>
            </div>
        </div>
    );
}

// Component to update map view when props change
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5
        });
    }, [center, zoom, map]);
    return null;
}

// Map Component
export default function RoofMap({ center, zoom, solarData, suggestedFootprint, onPolygonUpdate }) {
    // Stable callbacks to prevent unnecessary re-renders of DrawControl
    const handleCreated = onPolygonUpdate;

    const handleEdited = useCallback((layers) => {
        layers.eachLayer(layer => onPolygonUpdate(layer));
    }, [onPolygonUpdate]);

    const handleDeleted = useCallback(() => {
        onPolygonUpdate(null);
    }, [onPolygonUpdate]);

    return (
        <MapContainer center={center} zoom={zoom} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={center} zoom={zoom} />
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={19}
                maxZoom={22}
                crossOrigin="anonymous"
            />

            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                opacity={0.8}
                crossOrigin="anonymous"
            />

            <DrawControl
                center={center}
                solarData={solarData}
                suggestedFootprint={suggestedFootprint}
                onCreated={handleCreated}
                onEdited={handleEdited}
                onDeleted={handleDeleted}
            />

            {/* AI Automated House Highlight (Golden Dashed Box) - Only if no manual polygon? Or overlay? */}
            {/* Keeping it as reference for now unless overridden */}
            {solarData?.boundingPoly?.vertices && !suggestedFootprint && (
                <Polygon
                    positions={solarData.boundingPoly.vertices.map(v => [v.latitude, v.longitude])}
                    pathOptions={{
                        color: '#fbbf24', // brand-gold
                        weight: 2,
                        opacity: 0.5,
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        dashArray: '5, 10'
                    }}
                />
            )}
        </MapContainer>
    );
}
