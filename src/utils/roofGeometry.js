import * as turf from '@turf/turf';

/**
 * Edge types for roof measurements
 */
export const EDGE_TYPES = {
    RIDGE: 'ridge',
    VALLEY: 'valley',
    RAKE: 'rake',
    EAVE: 'eave',
    HIP: 'hip',
    UNKNOWN: 'unknown'
};

/**
 * Calculate distance between two [lat, lng] points in feet
 */
export function calculateDistanceFeet(point1, point2) {
    const from = turf.point([point1[1], point1[0]]); // turf uses [lng, lat]
    const to = turf.point([point2[1], point2[0]]);
    const distanceMeters = turf.distance(from, to, { units: 'meters' });
    return distanceMeters * 3.28084; // Convert to feet
}

/**
 * Calculate linear measurements from facet edges
 * @param {Array} facets - Array of facet objects with {polygon, edgeTypes}
 * @returns {Object} - Linear measurements by edge type
 */
export function calculateLinearMeasurements(facets) {
    const measurements = {
        [EDGE_TYPES.RIDGE]: 0,
        [EDGE_TYPES.VALLEY]: 0,
        [EDGE_TYPES.RAKE]: 0,
        [EDGE_TYPES.EAVE]: 0,
        [EDGE_TYPES.HIP]: 0,
        [EDGE_TYPES.UNKNOWN]: 0,
        total: 0
    };

    if (!facets || facets.length === 0) return measurements;

    facets.forEach(facet => {
        const { polygon, edgeTypes } = facet;
        if (!polygon || !edgeTypes) return;

        const latLngs = polygon.getLatLngs()[0];

        for (let i = 0; i < latLngs.length; i++) {
            const point1 = [latLngs[i].lat, latLngs[i].lng];
            const point2 = [latLngs[(i + 1) % latLngs.length].lat, latLngs[(i + 1) % latLngs.length].lng];

            const distance = calculateDistanceFeet(point1, point2);
            const edgeType = edgeTypes[i] || EDGE_TYPES.UNKNOWN;

            measurements[edgeType] += distance;
            measurements.total += distance;
        }
    });

    return measurements;
}

/**
 * Get detailed facet information
 */
export function getFacetDetails(facets, areaSqFt) {
    if (!facets || facets.length === 0) return [];

    return facets.map((facet, index) => {
        const { polygon, edgeTypes, pitch } = facet;
        const latLngs = polygon.getLatLngs()[0];

        // Calculate perimeter
        let perimeter = 0;
        for (let i = 0; i < latLngs.length; i++) {
            const point1 = [latLngs[i].lat, latLngs[i].lng];
            const point2 = [latLngs[(i + 1) % latLngs.length].lat, latLngs[(i + 1) % latLngs.length].lng];
            perimeter += calculateDistanceFeet(point1, point2);
        }

        return {
            index: index + 1,
            vertices: latLngs.length,
            perimeter: Math.round(perimeter),
            pitch: pitch || 'Unknown',
            edgeTypes: edgeTypes || []
        };
    });
}
