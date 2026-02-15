import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';

// Hide the draw toolbar UI but keep functionality
const hideToolbarStyle = document.createElement('style');
hideToolbarStyle.innerHTML = `.leaflet-draw-toolbar { display: none !important; }`;
document.head.appendChild(hideToolbarStyle);

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle drawing logic
function DrawControl({ center, solarData, onCreated, onDeleted, onEdited }) {
    const map = useMap();
    const featureGroupRef = useRef(new L.FeatureGroup());
    const drawControlRef = useRef(null);

    // 1. Initialize Draw Control and Event Listeners
    useEffect(() => {
        map.addLayer(featureGroupRef.current);

        // Define custom style for the drawing
        const drawStyle = {
            color: '#3b82f6', // Tailwind blue-500
            weight: 3,
            opacity: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
        };

        // Initialize draw control
        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: featureGroupRef.current,
                remove: true,
            },
            draw: {
                marker: false,
                circle: false,
                circlemarker: false,
                polyline: false,
                rectangle: false,
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: drawStyle
                },
            },
        });

        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        // Custom handler for real-time updates
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

        // Event listeners
        map.on(L.Draw.Event.CREATED, (e) => {
            featureGroupRef.current.clearLayers();
            const layer = e.layer;
            featureGroupRef.current.addLayer(layer);

            if (onCreated) onCreated(layer);

            if (layer.editing) {
                layer.editing.enable();
            }
        });

        map.on(L.Draw.Event.EDITED, (e) => {
            if (onEdited) onEdited(e.layers);
        });

        map.on('draw:editmove', handleUpdate);
        map.on('draw:editvertex', handleUpdate);

        map.on(L.Draw.Event.DELETED, (e) => {
            if (onDeleted) onDeleted(e.layers);
        });

        return () => {
            if (map) {
                map.removeControl(drawControl);
                map.removeLayer(featureGroupRef.current);
                map.off(L.Draw.Event.CREATED);
                map.off(L.Draw.Event.EDITED);
                map.off('draw:editmove');
                map.off('draw:editvertex');
                map.off(L.Draw.Event.DELETED);
            }
        };
    }, [map, onEdited, onCreated, onDeleted]);

    // 2. Handle Auto-Box Creation on Center Change (Search)
    useEffect(() => {
        if (!center) return;

        featureGroupRef.current.clearLayers();

        const offset = 0.00008;
        const defaultBox = [
            [center[0] + offset, center[1] - offset],
            [center[0] + offset, center[1] + offset],
            [center[0] - offset, center[1] + offset],
            [center[0] - offset, center[1] - offset]
        ];

        const drawStyle = {
            color: '#3b82f6',
            weight: 3,
            opacity: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
        };

        const polygon = L.polygon(defaultBox, drawStyle);
        featureGroupRef.current.addLayer(polygon);

        if (onCreated) onCreated(polygon);

        if (polygon.editing) {
            polygon.editing.enable();
        }

        // IMPORTANT: Added solarData to dependencies so that clearing solar data (Manual Init)
        // re-triggers the box creation.
    }, [center[0], center[1], solarData]);

    return null;
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
export default function RoofMap({ center, zoom, solarData, onPolygonUpdate }) {
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
            />

            <TileLayer
                url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
                opacity={0.7}
            />

            <DrawControl
                center={center}
                solarData={solarData}
                onCreated={handleCreated}
                onEdited={handleEdited}
                onDeleted={handleDeleted}
            />
        </MapContainer>
    );
}
