/**
 * Google Maps Service Layer
 * Wraps Google Maps API initialization and usage
 */

// Google Maps initialization state
let mapsInitialized = false;
let placesLoaded = false;

/**
 * Initialize Google Maps libraries
 * @returns {Promise<boolean>} - True if initialization successful
 */
export async function initializeGoogleMaps() {
    if (mapsInitialized) return true;

    try {
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

        const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!API_KEY) {
            console.warn('VITE_GOOGLE_MAPS_API_KEY is not set');
            return false;
        }

        setOptions({
            apiKey: API_KEY,
            key: API_KEY,
            version: 'weekly'
        });

        // Load required libraries
        await importLibrary('places');
        await importLibrary('maps');

        mapsInitialized = true;
        placesLoaded = true;

        return true;
    } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        return false;
    }
}

/**
 * Check if Google Maps is ready
 * @returns {boolean}
 */
export function isGoogleMapsReady() {
    return mapsInitialized && !!window.google?.maps?.places;
}

/**
 * Search addresses using Google Places Autocomplete
 * @param {string} query - Search query
 * @param {Object} sessionToken - Optional session token
 * @returns {Promise<Array>} - List of suggestions
 */
export async function searchAddresses(query, sessionToken = null) {
    if (!isGoogleMapsReady()) {
        await initializeGoogleMaps();
    }

    if (!window.google?.maps?.places || !query || query.length < 3) {
        return [];
    }

    try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = window.google.maps;

        // Create session token if not provided
        const token = sessionToken || new AutocompleteSessionToken();

        const request = {
            input: query,
            includedRegionCodes: ['us'],
            includedPrimaryTypes: ['geocode'],
            sessionToken: token
        };

        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        return suggestions || [];
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

/**
 * Fetch detailed place information
 * @param {string} placeId - The place ID
 * @returns {Promise<Object|null>} - Place details or null
 */
export async function fetchPlaceDetails(placeId) {
    if (!isGoogleMapsReady()) {
        await initializeGoogleMaps();
    }

    if (!window.google?.maps?.Places) {
        return null;
    }

    try {
        const { Place } = window.google.maps;
        const place = new Place({ id: placeId });

        await place.fetchFields({ fields: ['location', 'name', 'formatted_address'] });

        if (place.location) {
            return {
                lat: place.location.lat(),
                lng: place.location.lng(),
                address: place.formatted_address || place.name,
                name: place.name
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching place details:', error);
        return null;
    }
}

/**
 * Get map configuration options
 * @returns {Object} - Map options
 */
export function getMapOptions() {
    return {
        center: { lat: 39.6368, lng: -74.8035 },
        zoom: 18,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        touchZoom: true
    };
}

/**
 * Reset map initialization state
 */
export function resetMapsState() {
    mapsInitialized = false;
    placesLoaded = false;
}

export default {
    initializeGoogleMaps,
    isGoogleMapsReady,
    searchAddresses,
    fetchPlaceDetails,
    getMapOptions,
    resetMapsState
};
