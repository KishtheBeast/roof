import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://solar.googleapis.com/v1/buildingInsights:findClosest';
const SQM_TO_SQFT = 10.7639;

/**
 * Fetches building insights for a given location using Google Solar API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object|null>} - Raw building insights data or null if not found/error
 */
export async function fetchBuildingInsights(lat, lng) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('Google Maps API Key not set. Solar API features will be disabled.');
        return null;
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                'location.latitude': lat,
                'location.longitude': lng,
                key: API_KEY
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching Solar API data:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Processes raw Solar API data into useful measurements for roofing.
 * @param {Object} apiResponse - Raw response from Solar API
 * @returns {Object|null} - Processed measurements or null
 */
export function processSolarData(apiResponse) {
    if (!apiResponse?.solarPotential) return null;

    const { solarPotential } = apiResponse;
    const segments = solarPotential.roofSegmentStats || [];

    // Calculate predominant pitch (weighted average by area)
    const totalArea = segments.reduce((sum, s) => sum + s.stats.areaMeters2, 0);
    const predominantPitch = totalArea > 0
        ? segments.reduce((sum, s) => sum + (s.pitchDegrees * s.stats.areaMeters2), 0) / totalArea
        : 0;

    // Convert whole roof area to sq ft
    const totalRoofArea = solarPotential.wholeRoofStats?.areaMeters2 * SQM_TO_SQFT || 0;
    const wholeRoofStats = {
        areaSqFt: Math.round(totalRoofArea),
        groundAreaSqFt: Math.round(solarPotential.wholeRoofStats?.groundAreaMeters2 * SQM_TO_SQFT || 0)
    };

    return {
        facetCount: segments.length,
        predominantPitchDegrees: Math.round(predominantPitch * 10) / 10,
        predominantPitchRatio: degreesToPitchRatio(predominantPitch),
        totalAreaSqFt: Math.round(totalRoofArea),
        wholeRoofStats,
        maxSolarPanels: solarPotential.maxArrayPanelsCount || 0,
        imageryDate: apiResponse.imageryDate,
        segments: segments.map((s, i) => ({
            id: i + 1,
            pitch: Math.round(s.pitchDegrees * 10) / 10,
            area: Math.round(s.stats.areaMeters2 * SQM_TO_SQFT),
            azimuth: Math.round(s.azimuthDegrees),
            center: s.center
        }))
    };
}

/**
 * Converts pitch in degrees to traditional roof pitch ratio (rise/12).
 * @param {number} degrees - Pitch in degrees
 * @returns {string} - Pitch ratio like "8/12"
 */
export function degreesToPitchRatio(degrees) {
    const rise = Math.tan(degrees * Math.PI / 180) * 12;
    const roundedRise = Math.round(rise * 2) / 2; // Round to nearest 0.5
    return `${roundedRise}/12`;
}

/**
 * Legacy function for backward compatibility.
 * Calculates dominant pitch (now superseded by processSolarData).
 */
function calculateDominantPitch(segments) {
    if (!segments || segments.length === 0) return 0;
    const sorted = [...segments].sort((a, b) => b.stats.areaMeters2 - a.stats.areaMeters2);
    return sorted[0].pitchDegrees || 0;
}
