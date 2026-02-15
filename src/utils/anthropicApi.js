import axios from 'axios';

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Analyzes roof segment data using Anthropic Claude to estimate linear measurements.
 * @param {Object} solarData - Processed solar data from processSolarData
 * @param {Object} rawSolarData - Raw API response for deeper geometric context if needed
 * @returns {Promise<Object|null>} - Estimated linear measurements or null
 */
export async function analyzeRoofWithClaude(solarData, rawSolarData) {
    // The API key is now handled server-side by the Vite proxy

    // Prepare a concise description of the roof for Claude
    // We send segment counts, area, pitch, and azimuth to help it "visualize" the geometry
    const roofSummary = {
        totalAreaSqFt: solarData.totalAreaSqFt,
        facetCount: solarData.facetCount,
        predominantPitch: solarData.predominantPitchRatio,
        segments: solarData.segments.map((s, i) => ({
            id: i + 1,
            areaSqFt: s.area,
            pitchDegrees: s.pitch,
            azimuthDegrees: s.azimuth
        }))
    };

    const prompt = `
You are a professional roofing estimator. Analyze the following roof geometric data provided by LiDAR sensors (Google Solar API).
Your goal is to estimate the linear measurements (in feet) for the entire roof structure.

ROOF DATA:
${JSON.stringify(roofSummary, null, 2)}

TASK:
Based on the number of facets, their areas, pitches, and azimuths, estimate the following:
1. Total Ridges and Hips (combined linear feet)
2. Total Valleys (linear feet)
3. Total Rakes (linear feet)
4. Total Eaves (linear feet)
5. Predominant Pitch (verify the provided pitch or suggest a more accurate residential representative pitch)
6. Total Number of Roof Facets

GEOMETRIC HINTS:
- Ridges/Hips usually exist where facets of different azimuths meet.
- Valleys occur at concave intersections of facets.
- Eaves are the bottom horizontal edges (often related to the square root of area for simple shapes).
- Rakes are the sloped edges on gables.
- For a standard residential roof of ~${solarData.totalAreaSqFt} sq ft with ${solarData.facetCount} facets, the linear measurements should be proportionate.

RETURN ONLY A JSON OBJECT with these exact keys:
{
  "ridgesHipsFeet": number,
  "valleysFeet": number,
  "rakesFeet": number,
  "eavesFeet": number,
  "predominantPitch": string (e.g. "8/12"),
  "facetCount": number,
  "confidenceScore": number (0-1),
  "estimationNotes": string (brief explanation of your reasoning)
}
`;

    console.log('[AI] Starting analysis with Claude...', {
        facets: solarData.facetCount,
        area: solarData.totalAreaSqFt
    });

    try {
        const response = await axios.post('/api/anthropic', {
            model: CLAUDE_MODEL,
            max_tokens: 1000,
            messages: [
                { role: 'user', content: prompt }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.content[0].text;
        console.log('[AI] Received response from Claude');

        // Extract JSON if Claude adds conversational filler
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('[AI] Successfully parsed measurements:', parsed);
            return parsed;
        }
        console.warn('[AI] Could not find JSON in Claude response:', content);
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
