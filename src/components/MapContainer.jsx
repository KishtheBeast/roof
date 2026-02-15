import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Polygon, ImageOverlay, Pane } from 'react-leaflet';
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
function DrawControl({ center, suggestedFootprint, onCreated, onDeleted, onEdited }) {
    const map = useMap();
    const featureGroupRef = useRef(new L.FeatureGroup());
    const drawControlRef = useRef(null);

    // 1. Initialize Draw Control and Event Listeners
    useEffect(() => {
        map.addLayer(featureGroupRef.current);

        // Define custom style for the drawing (Brand Gold)
        const drawStyle = {
            color: '#fbbf24', // Brand Gold
            weight: 3,
            opacity: 1,
            fillColor: '#fbbf24',
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
        if (!center && !suggestedFootprint) return;

        featureGroupRef.current.clearLayers();

        let initialBox;
        if (suggestedFootprint && suggestedFootprint.length > 0) {
            // Use high-precision building footprint from Solar API
            initialBox = suggestedFootprint;
        } else if (center) {
            // Fallback to generic box around center
            const offset = 0.00012;
            initialBox = [
                [center[0] + offset, center[1] - offset],
                [center[0] + offset, center[1] + offset],
                [center[0] - offset, center[1] + offset],
                [center[0] - offset, center[1] - offset]
            ];
        } else {
            return;
        }

        const drawStyle = {
            color: '#fbbf24',
            weight: 3,
            opacity: 1,
            fillColor: '#fbbf24',
            fillOpacity: 0.2,
        };

        const polygon = L.polygon(initialBox, drawStyle);
        featureGroupRef.current.addLayer(polygon);

        if (onCreated) onCreated(polygon);

        if (polygon.editing) {
            polygon.editing.enable();
        }

        // IMPORTANT: Only re-initialize when the location source changes to prevent reset during manual editing
    }, [center?.[0], center?.[1], JSON.stringify(suggestedFootprint)]);

    return null;
}

// Viewfinder component removed in favor of native Leaflet Draw controls

// Component to update map view when props change
function ChangeView({ center, zoom, bounds }) {
    const map = useMap();
    useEffect(() => {
        // Ensure map knows its actual size (fixes gray bars/misalignment)
        map.invalidateSize();

        if (bounds) {
            map.fitBounds(bounds, {
                padding: [5, 5], // Tighter fit for Studio mode
                maxZoom: 22,
                animate: true,
                duration: 1.5
            });
        } else {
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, bounds, map]);
    return null;
}

// Map Component
export default function RoofMap({ center, zoom, solarData, suggestedFootprint, onPolygonUpdate, rgbOverlay, isAnalysisMode }) {
    // Stable callbacks to prevent unnecessary re-renders of DrawControl
    const handleCreated = onPolygonUpdate;

    const handleEdited = useCallback((layers) => {
        layers.eachLayer(layer => onPolygonUpdate(layer));
    }, [onPolygonUpdate]);

    const handleDeleted = useCallback(() => {
        onPolygonUpdate(null);
    }, [onPolygonUpdate]);

    return (
        <div className={`h-full w-full transition-all duration-700 ${isAnalysisMode ? 'p-4 bg-brand-navy' : ''}`}>
            <div className={`h-full w-full relative overflow-hidden transition-all duration-700 ${isAnalysisMode ? 'rounded-[2rem] border-[12px] border-brand-gold/20 shadow-[0_0_100px_rgba(251,191,36,0.15)] ring-1 ring-brand-gold/30' : ''}`}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    zoomControl={false}
                    attributionControl={false}
                    dragging={true}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    boxZoom={true}
                    keyboard={true}
                    touchZoom={true}
                    style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }} // brand-navy background
                >
                    <ChangeView center={center} zoom={zoom} bounds={rgbOverlay?.bounds} />

                    {/* Standard Map Tiles - ONLY loaded if no high-res solar data exists */}
                    {!rgbOverlay && (
                        <>
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
                        </>
                    )}

                    {/* High-Res Solar API RGB Overlay - Rendered in a custom pane BELOW the overlay pane (zIndex 400) */}
                    {rgbOverlay && (
                        <Pane name="solarPane" style={{ zIndex: 399 }}>
                            <ImageOverlay
                                url={rgbOverlay.url}
                                bounds={rgbOverlay.bounds}
                                opacity={1}
                                interactive={false}
                            />
                        </Pane>
                    )}

                    <DrawControl
                        center={center}
                        suggestedFootprint={suggestedFootprint}
                        onCreated={handleCreated}
                        onEdited={handleEdited}
                        onDeleted={handleDeleted}
                    />


                    {/* Native drawing controls handles the highlight box functionality */}

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

                {/* Studio Vignette Overlay */}
                {isAnalysisMode && (
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(15,23,42,0.8)] z-[1000]"></div>
                )}
            </div>
        </div>
    );
}
