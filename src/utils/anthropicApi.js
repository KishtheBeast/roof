import axios from 'axios';

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Analyzes roof segment data using Anthropic Claude to estimate linear measurements.
 * @param {Object} solarData - Processed solar data from processSolarData
 * @param {Object} rawSolarData - Raw API response for deeper geometric context if needed
 * @returns {Promise<Object|null>} - Estimated linear measurements or null
 */
export async function analyzeRoofWithClaude(solarData, rawSolarData, imageBase64 = null, address = '') {
    // The API key is now handled server-side by the Vite proxy

    const prompt = `
You are a professional roofing estimator and 3D geometry engine. Analyze the following roof LIDAR data ${imageBase64 ? 'and the provided satellite imagery ' : ''}from the Google Solar API.

TARGET ADDRESS: ${address}
CRITICAL: Only identify and analyze the ROOF part of the house located at EXACTLY this address.

Your goal is to provide a comprehensive structural analysis, detailed linear measurements, and a refined 2D map footprint for the target roof.

${imageBase64 ? `SATELLITE IMAGE ANALYSIS:
1. LOCATE TARGET: The house at "${address}" is located EXACTLY IN THE CENTER of the provided image.
2. PRECISION: This is high-resolution raw imagery from the Solar API. Use visual cues to trace the ridges, valleys, and rakes for ONLY the central house.
3. OUTPUT: Provide the "normalizedFootprint" which is an array of 4-8 coordinates (x, y) where 0,0 is top-left and 1,1 is bottom-right of the image, perfectly outlining only the ROOF portion of the central house.` : ''}

ROOF GEOMETRY DATA:
${JSON.stringify(solarData, null, 2)}

TASK:
1. Estimate all linear measurements (Ridges/Hips, Valleys, Rakes, Eaves).
2. Calculate the "Ground Footprint" (2D area) and "Total Surface Area" (3D sloped area).
3. Assess the "Complexity Rating" based on facet count and pitch variety.
4. Verify/Refine the 2D House Footprint on the map.
5. Provide a brief professional reasoning for your estimates.

GEOMETRIC PRINCIPLES:
- Ridges/Hips: Intersections between facets of different azimuths with positive (convex) angles.
- Valleys: Intersections with negative (concave) angles.
- Eaves: Perimeter edges at the bottom of slopes.
- Rakes: Sloped perimeter edges (gable ends).
- Complexity: 
    - SIMPLE: 1-4 facets, consistent pitch.
    - MODERATE: 5-12 facets, mixed pitches.
    - COMPLEX: 13+ facets, many valleys/hips, multiple levels.

RETURN ONLY A JSON OBJECT with these exact keys:
{
  "ridgesHipsFeet": number,
  "valleysFeet": number,
  "rakesFeet": number,
  "eavesFeet": number,
  "predominantPitch": string (e.g. "8/12"),
  "facetCount": number,
  "estimatedGroundAreaSqFt": number,
  "estimatedSurfaceAreaSqFt": number,
  "complexity": "SIMPLE" | "MODERATE" | "COMPLEX",
  "confidenceScore": number (0-1),
  "estimationNotes": string
}
`;

    try {
        const messages = [
            {
                role: 'user',
                content: imageBase64 ? [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/png',
                            data: imageBase64.split(',')[1] || imageBase64
                        }
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ] : [
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            }
        ];

        const isGitHub = window.location.hostname.includes('github.io');
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

        // Use proxy in local dev, direct URL in prod (GitHub Pages)
        const url = (isGitHub || !isLocal) ? 'https://api.anthropic.com/v1/messages' : '/api/anthropic';

        console.info('[AI] Environment Diagnostics:', {
            hostname: window.location.hostname,
            isGitHub,
            isLocal,
            targetingUrl: url,
            hasApiKey: !!apiKey
        });

        const headers = {
            'Content-Type': 'application/json'
        };

        // If in production/static environment, we must provide headers directly
        // WARNING: This exposes the API key in the browser.
        if (isGitHub || !isLocal) {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-direct-browser-access'] = 'true';
        }

        const response = await axios.post(url, {
            model: CLAUDE_MODEL,
            max_tokens: 1000,
            messages
        }, { headers });

        const content = response.data.content[0].text;

        // Extract JSON if Claude adds conversational filler
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }
        return null;
    } catch (error) {
        const errorData = error.response?.data;
        console.error('[AI] Detailed Error Response:', errorData);

        console.error('[AI] Error calling proxy endpoint:', {
            status: error.response?.status,
            message: error.message,
            errorType: errorData?.error?.type,
            errorMessage: errorData?.error?.message
        });
        return null;
    }
}
