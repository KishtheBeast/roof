import { useState, useCallback } from 'react';
import { api } from '../utils/auth';

const CACHE_KEY = 'roof_analysis_cache';
const MAX_CACHE_SIZE = 10;

/**
 * Custom hook for AI roof analysis
 * Handles API calls to /analyze-roof endpoint with client-side caching
 */
export function useAiAnalysis() {
    const [aiMeasurements, setAiMeasurements] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    // Helper: Get cache from localStorage
    const getCache = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : {};
        } catch (e) {
            return {};
        }
    };

    // Helper: Save to cache
    const saveToCache = (address, data) => {
        try {
            const cache = getCache();
            cache[address.toLowerCase()] = {
                data,
                timestamp: Date.now()
            };

            // Limit cache size (keep only most recent)
            const keys = Object.keys(cache);
            if (keys.length > MAX_CACHE_SIZE) {
                const sortedKeys = keys.sort((a, b) => cache[b].timestamp - cache[a].timestamp);
                const newCache = {};
                sortedKeys.slice(0, MAX_CACHE_SIZE).forEach(k => {
                    newCache[k] = cache[k];
                });
                localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
            } else {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            }
        } catch (e) {
            console.error('Failed to save to cache:', e);
        }
    };

    // Reset measurements
    const clearMeasurements = useCallback(() => {
        setAiMeasurements(null);
        setError(null);
    }, []);

    // Trigger AI analysis for an address
    const triggerAiAnalysis = useCallback(async (address, material = 'Asphalt Shingle') => {
        if (!address) {
            setError('Address is required for analysis');
            return null;
        }

        // 1. Check Cache First
        const cache = getCache();
        const cachedResult = cache[address.toLowerCase()];
        
        // Cache valid for 24 hours
        if (cachedResult && (Date.now() - cachedResult.timestamp < 24 * 60 * 60 * 1000)) {
            console.debug('🚀 Using cached analysis for:', address);
            setAiMeasurements(cachedResult.data);
            return cachedResult.data;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await api.post('/analyze-roof', { address, material });
            const data = response.data;

            // Transform API response to match UI needs
            const aiResult = {
                totalAreaSqFt: data.total_area_sqft,
                footprintSqFt: data.total_area_sqft,
                pitch: data.predominant_pitch,
                facetCount: data.facet_count,
                ridges: data.ridges_hips,
                valleys: data.valleys,
                rakes: data.rakes,
                eaves: data.eaves,
                material: data.material,
                confidenceScore: data.confidence_score || 0.98,
                estimationNotes: data.reasoning,
                complexity: data.complexity || 'Unknown',
                allCostEstimates: data.all_cost_estimates,
                propertyType: data.property_type || 'Single Family'
            };

            // Include cost estimate if provided by the backend
            if (data.estimated_cost_avg) {
                aiResult.costEstimate = {
                    material: data.material,
                    totalCost: data.estimated_cost_avg,
                    lowCost: data.estimated_cost_low,
                    highCost: data.estimated_cost_high,
                    costPerSqFt: data.cost_per_sqft,
                    reasoning: data.reasoning
                };
            }

            if (data.full_image_base64) {
                aiResult.highlightedImage = `data:image/webp;base64,${data.full_image_base64}`;
            }

            setAiMeasurements(aiResult);
            
            // 2. Save to Cache
            saveToCache(address, aiResult);
            
            return aiResult;
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'AI analysis failed';
            setError(errorMessage);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // Calculate cost estimate for a material
    const calculateCost = useCallback(async (address, material) => {
        if (!address || !material) return null;

        try {
            const response = await api.post('/analyze-roof', { address, material });
            const data = response.data;

            return {
                material: data.material,
                totalCost: data.estimated_cost_avg,
                lowCost: data.estimated_cost_low,
                highCost: data.estimated_cost_high,
                costPerSqFt: data.cost_per_sqft,
                reasoning: data.reasoning
            };
        } catch (err) {
            console.error('Error calculating cost:', err);
            return null;
        }
    }, []);

    return {
        aiMeasurements,
        isAnalyzing,
        error,
        triggerAiAnalysis,
        calculateCost,
        clearMeasurements,
        setAiMeasurements
    };
}

export default useAiAnalysis;
