import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Polygon } from 'react-leaflet';
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

// Fix for window.L access in App.jsx
if (typeof window !== 'undefined') {
    window.L = L;
}

// Component to handle drawing logic
function DrawControl({ center, solarData, suggestedFootprint, onCreated, onDeleted, onEdited }) {
    const map = useMap();
    const featureGroupRef = useRef(new L.FeatureGroup());
    const drawControlRef = useRef(null);

    // Attach map instance to DOM for App.jsx access
    useEffect(() => {
        if (map && map._container) {
            map._container._leaflet_map = map;
        }
    }, [map]);

    // ... (rest of 1. Initialize Draw Control and Event Listeners logic is the same)
    // 1. Initialize Draw Control and Event Listeners
    useEffect(() => {
        map.addLayer(featureGroupRef.current);

        const drawStyle = {
            color: '#3b82f6',
            weight: 3,
            opacity: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
        };

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
            if (onCreated) onCreated(layer);
            if (layer.editing) layer.editing.enable();
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
        if (!center || suggestedFootprint) return;

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

        // --- Custom Dragging Logic (Move the whole box) ---
        let isMoving = false;
        let lastLatLng = null;

        polygon.on('mousedown', (e) => {
            if (e.originalEvent.target.classList.contains('leaflet-interactive')) {
                isMoving = true;
                lastLatLng = e.latlng;
                map.dragging.disable();
                L.DomEvent.stopPropagation(e);
            }
        });

        const handleMouseMove = (e) => {
            if (!isMoving || !lastLatLng) return;
            const deltaLat = e.latlng.lat - lastLatLng.lat;
            const deltaLng = e.latlng.lng - lastLatLng.lng;
            const latlngs = polygon.getLatLngs()[0];
            const newLatlngs = latlngs.map(p => ({
                lat: p.lat + deltaLat,
                lng: p.lng + deltaLng
            }));
            polygon.setLatLngs([newLatlngs]);
            lastLatLng = e.latlng;
            if (onEdited) {
                const mockLayers = { eachLayer: (cb) => cb(polygon) };
                onEdited(mockLayers);
            }
        };

        const handleMouseUp = () => {
            if (isMoving) {
                isMoving = false;
                lastLatLng = null;
                map.dragging.enable();
            }
        };

        map.on('mousemove', handleMouseMove);
        map.on('mouseup', handleMouseUp);
        // --------------------------------------------------

        if (onCreated) onCreated(polygon);
        if (polygon.editing) polygon.editing.enable();

        return () => {
            map.off('mousemove', handleMouseMove);
            map.off('mouseup', handleMouseUp);
        };
    }, [center[0], center[1], solarData]);

    // 3. Handle AI Suggested Footprint (AI MOVE BOX)
    useEffect(() => {
        if (!suggestedFootprint || suggestedFootprint.length < 3) return;

        console.log('[Map] Applying AI suggested footprint...');
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

        if (onCreated) onCreated(polygon);
        if (polygon.editing) polygon.editing.enable();

        // Trigger area calculation for the new box
        if (onEdited) {
            const mockLayers = { eachLayer: (cb) => cb(polygon) };
            onEdited(mockLayers);
        }
    }, [suggestedFootprint, onCreated, onEdited]);

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

            {/* AI Automated House Highlight */}
            {solarData?.boundingPoly?.vertices && (
                <Polygon
                    positions={solarData.boundingPoly.vertices.map(v => [v.latitude, v.longitude])}
                    pathOptions={{
                        color: '#fbbf24', // brand-gold
                        weight: 4,
                        opacity: 0.8,
                        fillColor: '#fbbf24',
                        fillOpacity: 0.1,
                        dashArray: '5, 10'
                    }}
                />
            )}
        </MapContainer>
    );
}
