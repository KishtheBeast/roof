import { useState, useCallback } from 'react';
import { api } from '../utils/auth';

/**
 * Custom hook for AI roof analysis
 * Handles API calls to /analyze-roof endpoint
 */
export function useAiAnalysis() {
    const [aiMeasurements, setAiMeasurements] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

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
                complexity: data.complexity || 'Unknown'
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
                aiResult.highlightedImage = `data:image/jpeg;base64,${data.full_image_base64}`;
            }

            setAiMeasurements(aiResult);
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
