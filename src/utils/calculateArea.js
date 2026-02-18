import * as turf from '@turf/turf';

export function calculatePolygonArea(layer) {
    if (!layer) return 0;

    // Get GeoJSON from Leaflet layer
    const geoJson = layer.toGeoJSON();

    // Calculate area in square meters
    const areaSqMeters = turf.area(geoJson);

    // Convert to square feet (1 sq meter = 10.7639 sq feet)
    const areaSqFeet = areaSqMeters * 10.7639;

    return areaSqFeet;
}
