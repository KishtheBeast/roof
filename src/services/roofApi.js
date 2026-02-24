import { api } from '../utils/auth';

/**
 * Roof API Service Layer
 * Contains business logic for roof analysis API calls
 */
export const roofApi = {
    /**
     * Analyze roof at given address
     * @param {string} address - The property address to analyze
     * @param {string} [material] - Optional material for cost estimation
     * @returns {Promise<Object>} - Roof analysis results
     */
    async analyzeRoof(address, material = null) {
        const payload = { address };
        if (material) {
            payload.material = material;
        }

        const response = await api.post('/analyze-roof', payload);
        return response.data;
    },

    /**
     * Get cost estimate for a specific material
     * @param {string} address - The property address
     * @param {string} material - The roofing material
     * @returns {Promise<Object>} - Cost estimate data
     */
    async getCostEstimate(address, material) {
        const response = await api.post('/analyze-roof', {
            address,
            material
        });
        return response.data;
    },

    /**
     * Get roof geometry details
     * @param {Object} coordinates - Polygon coordinates
     * @returns {Promise<Object>} - Geometry analysis
     */
    async getGeometryDetails(coordinates) {
        const response = await api.post('/analyze-geometry', { coordinates });
        return response.data;
    }
};

export default roofApi;
