import { useState, useCallback, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Initialize Google Maps API at module load time
const API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

// Global flag to ensure Google Maps is initialized only once
if (API_KEY && !window.__GOOGLE_MAPS_INITIALIZED__) {
    try {
        setOptions({
            apiKey: API_KEY,
            key: API_KEY,
            version: 'weekly',
            libraries: ['places']
        });
        
        // Pre-initialize libraries at module load
        importLibrary('maps').catch(e => console.error('[Google Maps] Maps library load error:', e));
        importLibrary('places').catch(e => console.error('[Google Maps] Places library load error:', e));
        
        window.__GOOGLE_MAPS_INITIALIZED__ = true;
    } catch (e) {
        console.error('[Google Maps] Initialization error:', e);
    }
}

/**
 * Custom hook for Google Maps initialization and address search
 */
export function useMapControl() {
    const [isMapsLoading, setIsMapsLoading] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [hasMoreResults, setHasMoreResults] = useState(false);
    const sessionTokenRef = useRef(null);

    // Initialize Google Maps libraries (already loading at module level, but ensure ready)
    const initializeMaps = useCallback(async () => {
        try {
            setIsMapsLoading(true);
            setMapError(null);
            
            // Wait for Google Maps to be available (pre-initialized at module load)
            let attempts = 0;
            while (!window.google?.maps && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.google?.maps) {
                throw new Error('Google Maps failed to load. Please check your internet connection or disable ad-blockers for this site.');
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize Google Maps:', error);
            setMapError(error.message);
            return false;
        } finally {
            setIsMapsLoading(false);
        }
    }, []);

    // Search addresses using Google Places Autocomplete
    const searchAddresses = useCallback(async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return [];
        }

        try {
            if (!window.google?.maps?.places) {
                await initializeMaps();
            }

            const { AutocompleteSuggestion, AutocompleteSessionToken } = window.google.maps;

            // Create session token if not exists
            if (!sessionTokenRef.current) {
                sessionTokenRef.current = new AutocompleteSessionToken();
            }

            const request = {
                input: query,
                includedRegionCodes: ['us'],
                includedPrimaryTypes: ['geocode'],
                sessionToken: sessionTokenRef.current
            };

            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

            setSearchResults(suggestions || []);
            setHasMoreResults((suggestions?.length || 0) > 0);

            return suggestions || [];
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            return [];
        }
    }, [initializeMaps]);

    // Get detailed place information
    const fetchPlaceDetails = useCallback(async (placeId) => {
        try {
            if (!window.google?.maps?.places) {
                await initializeMaps();
            }

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
    }, [initializeMaps]);

    // Reset search results
    const resetSearch = useCallback(() => {
        setSearchResults([]);
        setHasMoreResults(false);
    }, []);

    // Reset session token for new search session
    const resetSessionToken = useCallback(() => {
        sessionTokenRef.current = null;
    }, []);

    return {
        isMapsLoading,
        mapError,
        searchResults,
        hasMoreResults,
        initializeMaps,
        searchAddresses,
        fetchPlaceDetails,
        resetSearch,
        resetSessionToken
    };
}

export default useMapControl;
