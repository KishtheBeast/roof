import * as GeoTIFF from 'geotiff';

/**
 * Fetches a GeoTIFF from a URL and converts it to a PNG Data URL.
 * Handles RGB (3-band) and Grayscale (1-band like DSM) images.
 * @param {string} url - The signed URL of the GeoTIFF
 * @param {string} [apiKey] - Optional Google Maps API Key
 * @returns {Promise<string|null>} - PNG Data URL or null
 */
export async function geoTiffToDataUrl(url, apiKey) {
    if (!url) return null;

    try {
        let fetchUrl = url;
        if (apiKey && url.includes('solar.googleapis.com') && !url.includes('key=')) {
            fetchUrl += `${url.includes('?') ? '&' : '?'}key=${apiKey}`;
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
            console.error(`Failed to fetch GeoTIFF: ${response.status} ${response.statusText}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        const width = image.getWidth();
        const height = image.getHeight();
        const rasters = await image.readRasters();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);

        // RGB GeoTIFF (Solar RGB layer)
        if (rasters.length >= 3) {
            for (let i = 0; i < rasters[0].length; i++) {
                imageData.data[i * 4] = rasters[0][i];     // R
                imageData.data[i * 4 + 1] = rasters[1][i]; // G
                imageData.data[i * 4 + 2] = rasters[2][i]; // B
                imageData.data[i * 4 + 3] = 255;           // A
            }
        }
        // Grayscale GeoTIFF (DSM, Mask, Flux)
        else if (rasters.length === 1) {
            const data = rasters[0];
            let min = Infinity;
            let max = -Infinity;

            // For DSM/Flux, we need to normalize values to 0-255 for visualization
            for (let i = 0; i < data.length; i++) {
                if (data[i] < min) min = data[i];
                if (data[i] > max) max = data[i];
            }

            const range = max - min || 1;
            for (let i = 0; i < data.length; i++) {
                const val = ((data[i] - min) / range) * 255;
                imageData.data[i * 4] = val;
                imageData.data[i * 4 + 1] = val;
                imageData.data[i * 4 + 2] = val;
                imageData.data[i * 4 + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error processing GeoTIFF:', error);
        return null;
    }
}
