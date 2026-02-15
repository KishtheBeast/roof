import * as GeoTIFF from 'geotiff';
import proj4 from 'proj4';

// Standard definitions (WGS84)
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
// UTM zone definitions will be added dynamically as needed

/**
 * Fetches a GeoTIFF from a URL and converts it to a PNG Data URL with bounds.
 * @param {string} url - The signed URL of the GeoTIFF
 * @param {string} [apiKey] - Optional Google Maps API Key
 * @param {[number, number]} [expectedCenter] - Optional [lat, lng] to center the bounds on (Alignment Fix)
 * @returns {Promise<{url: string, bounds: [[number, number], [number, number]]}|null>} - Overlay object or null
 */
export async function geoTiffToDataUrl(url, apiKey, expectedCenter) {
    if (!url) return null;

    try {
        console.log("Starting GeoTIFF fetch for:", url);
        let fetchUrl = url;
        if (apiKey && url.includes('solar.googleapis.com') && !url.includes('key=')) {
            fetchUrl += `${url.includes('?') ? '&' : '?'}key=${apiKey}`;
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
            console.error(`Failed to fetch GeoTIFF: ${response.status} ${response.statusText}`);
            return null;
        }

        console.log("GeoTIFF fetched, reading buffer...");
        const arrayBuffer = await response.arrayBuffer();
        console.log("Buffer read, parsing TIFF...");
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        console.log("TIFF image parsed, reading rasters...");

        // 1. Get Image Data
        const width = image.getWidth();
        const height = image.getHeight();
        const rasters = await image.readRasters();
        console.log(`Rasters read: ${width}x${height}, bands: ${rasters.length}`);

        console.log("Creating canvas...");
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

        console.log("Putting image data to canvas...");
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');

        // 2. Calculate Bounds (Georeferencing)
        const geoKeys = image.getGeoKeys();

        // Using built-in getOrigin() and getResolution() which are more robust
        let origin, resolution;
        try {
            origin = image.getOrigin(); // [x, y, z]
            resolution = image.getResolution(); // [x, y, z]
        } catch (e) {
            console.error("Failed to use getOrigin/getResolution helpers", e);
        }

        let originX, originY, pixelWidth, pixelHeight;

        if (origin && resolution) {
            originX = origin[0];
            originY = origin[1];
            pixelWidth = resolution[0];
            pixelHeight = resolution[1];
        } else {
            // Fallback to manual extraction if helpers fail
            const modelTiepoint = image.getTiePoints() && image.getTiePoints()[0];
            const fileDirectory = image.getFileDirectory();
            const modelPixelScale = fileDirectory.ModelPixelScale;

            if (modelTiepoint && modelPixelScale) {
                originX = modelTiepoint.x;
                originY = modelTiepoint.y;
                pixelWidth = modelPixelScale[0];
                pixelHeight = -modelPixelScale[1];
            } else if (fileDirectory.ModelTransformation) {
                const transform = fileDirectory.ModelTransformation;
                pixelWidth = transform[0];
                pixelHeight = transform[5];
                originX = transform[3];
                originY = transform[7];
            } else {
                console.error("GeoTIFF missing georeference metadata.");
                return { url: dataUrl, bounds: null };
            }
        }

        // Calculate Extents in Projected Coordinates
        const x1 = originX;
        const y1 = originY;
        const x2 = originX + (width * pixelWidth);
        const y2 = originY + (height * pixelHeight);

        // Determine Projection
        let projection = null;
        const pcsCode = geoKeys.ProjectedCSTypeGeoKey;
        console.log("EPSG Code found:", pcsCode);

        let bounds = null;

        if (pcsCode) {
            // Standard UTM EPSG codes: 326xx (North) or 327xx (South)
            if (pcsCode >= 32601 && pcsCode <= 32660) {
                const zone = pcsCode - 32600;
                projection = `+proj=utm +zone=${zone} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
            } else if (pcsCode >= 32701 && pcsCode <= 32760) {
                const zone = pcsCode - 32700;
                projection = `+proj=utm +zone=${zone} +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
            } else if (pcsCode === 4326) {
                // If it's already WGS84
                const latMin = Math.min(y1, y2);
                const latMax = Math.max(y1, y2);
                const lngMin = Math.min(x1, x2);
                const lngMax = Math.max(x1, x2);
                bounds = [[latMin, lngMin], [latMax, lngMax]];
            }
        }

        if (projection && !bounds) {
            // Project all 4 corners to be absolutely sure of the bbox
            const p1 = proj4(projection, "EPSG:4326", [x1, y1]); // [Lng, Lat]
            const p2 = proj4(projection, "EPSG:4326", [x2, y2]);
            const p3 = proj4(projection, [x1, y2]); // proj4 handles [Lng, Lat]
            const p4 = proj4(projection, [x2, y1]);

            // Re-evaluating corners for absolute safety
            const points = [
                proj4(projection, "EPSG:4326", [x1, y1]),
                proj4(projection, "EPSG:4326", [x2, y2]),
                proj4(projection, "EPSG:4326", [x1, y2]),
                proj4(projection, "EPSG:4326", [x2, y1])
            ];

            const lats = points.map(p => p[1]);
            const lngs = points.map(p => p[0]);

            const latMin = Math.min(...lats);
            const latMax = Math.max(...lats);
            const lngMin = Math.min(...lngs);
            const lngMax = Math.max(...lngs);

            bounds = [[latMin, lngMin], [latMax, lngMax]];
        }

        if (bounds) {
            // 3. APPLY CENTERING CORRECTION (Critical for Alignment)
            if (expectedCenter && expectedCenter[0] && expectedCenter[1]) {
                const currentCenterLat = (bounds[0][0] + bounds[1][0]) / 2;
                const currentCenterLng = (bounds[0][1] + bounds[1][1]) / 2;

                const latOffset = expectedCenter[0] - currentCenterLat;
                const lngOffset = expectedCenter[1] - currentCenterLng;

                console.log(`[Alignment] Applying offset: Lat ${latOffset}, Lng ${lngOffset}`);

                bounds = [
                    [bounds[0][0] + latOffset, bounds[0][1] + lngOffset],
                    [bounds[1][0] + latOffset, bounds[1][1] + lngOffset]
                ];
            }

            return {
                url: dataUrl,
                bounds: bounds // [[South, West], [North, East]]
            };
        }

        console.warn("Could not determine projection. Returning data URL without bounds.");
        return { url: dataUrl, bounds: null };

    } catch (error) {
        console.error('Error processing GeoTIFF:', error);
        return null;
    }
}
