# Roof Measurement Calculation

## Setup Instructions

### 1. Create Environment File
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

Then edit `.env` and add:
- **VITE_GOOGLE_MAPS_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **VITE_ANTHROPIC_API_KEY**: Get from [Anthropic Console](https://console.anthropic.com/)

### 2. Enable Required Google APIs
In Google Cloud Console, enable these APIs for your project:
1. **Maps JavaScript API** - For map display and interaction
2. **Places API** - For address search and autocomplete
3. **Solar API** - For building insights (roof data)

See [Google Places Migration Guide](https://developers.google.com/maps/documentation/javascript/places-migration-overview) for details.

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173/roof/`

---

## Currently Active APIs

- **Address Search**: [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) (Requires API key)
- **Map Display**: Google Maps JavaScript API
- **Building Data**: [Google Solar API](https://developers.google.com/solar)
- **AI Analysis**: [Anthropic Claude API](https://www.anthropic.com/)

---

## Technical Methodology

This document outlines the current methodology used for estimating roof surface area and discusses future improvements for precision using LiDAR data.

## Current Calculation Methodology

The application currently estimates roof area based on 2D satellite imagery combined with user-provided adjustment factors.

### Formula

1.  **Base Area Calculation (2D)**:
    -   The user draws a polygon on the map.
    -   We calculate the planar area of this polygon using `Turf.js`.
    -   **Result**: $Area_{base}$ (sq ft)

2.  **Pitch Adjustment (Slope)**:
    -   Multiplied based on user-selected steepness (Default: x1.12).

3.  **Waste Factor**:
    -   Added for overlap and cutting (Default: 10%).

---

## Future Improvements

### 1. Google Places Autocomplete (Optional)

To improve address accuracy, you can optionally enable Google Places. 

1. Create a `.env` file and add: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`.
2. Enable the **Places API** and **Maps JavaScript API** in Google Cloud Console.

### 2. LiDAR / Solar API Integration (Roadmap)


The application currently estimates roof area based on 2D satellite imagery combined with user-provided adjustment factors.

### Formula

The final estimated area is calculated using the following steps:

1.  **Base Area Calculation (2D)**:
    -   The user draws a polygon on the map.
    -   We calculate the planar area of this polygon using geospatial libraries (e.g., `Turf.js`).
    -   **Result**: $Area_{base}$ (sq ft)

2.  **Pitch Adjustment (Slope)**:
    -   Since satellite imagery is 2-dimensional, it does not account for the slope of the roof. A steeper roof has more surface area than a flat one for the same footprint.
    -   We apply a multiplier based on the user's selection of roof steepness.
    -   **Formula**: $Area_{slope} = Area_{base} \times PitchMultiplier$

    | Roof Type | Pitch Multiplier | Description |
    | :--- | :--- | :--- |
    | Flat Roof | 1.00 | Walking Surface |
    | Low Slope | 1.05 | Slight Incline |
    | Standard House | 1.12 | Typical Residential (Default) |
    | Steep | 1.25 | Difficult to Walk |
    | Very Steep | 1.40 | Professional Only |

3.  **Waste Factor**:
    -   We add a percentage to account for material overlap, cutting waste, and ridge/hip caps.
    -   **Formula**: $Area_{final} = Area_{slope} \times (1 + \frac{Waste\%}{100})$
    -   Default waste factor is 10%.

### Variables Summary

| Variable | Source | Default Value | Notes |
| :--- | :--- | :--- | :--- |
| **Base Area** | Map Polygon | N/A | Calculated from user drawing. |
| **Pitch** | User Input | 1.12 (Standard) | Critical variable. Guessing wrong can lead to significant error (10-30%). |
| **Waste** | User Input | 10% | Standard industry practice is 10-15%. |

---

## Future Improvement: LiDAR Integration

To achieve "professional grade" accuracy without relying on user estimations of pitch, integration with a LiDAR (Light Detection and Ranging) data provider is recommended.

### Why LiDAR?

-   **True 3D Data**: LiDAR scans provie a 3D point cloud of the earth's surface.
-   **Automatic Pitch Detection**: Instead of a global multiplier, LiDAR data allows us to calculate the exact slope and azimuth (orientation) of every facet of the roof.
-   **Obstruction Detection**: Can identify chimneys, dormers, and trees.

### Recommended API: Google Solar API

The **Google Solar API** (formerly Project Sunroof) is the industry standard for this data.

-   **Building Insights endpoint**: Returns the bounding box, center, and **roof segment stats** (pitch, azimuth, area) for a given location.
-   **Data Layers endpoint**: Provides raw Digital Surface Models (DSM) and RGB imagery.

### Proposed Implementation

1.  **User Enters Address**.
2.  **Call Solar API**: Fetch `buildingInsights` for that location.
3.  **Extract Data**:
    -   Get the total roof area directly from the API (which already accounts for 3D pitch).
    -   Alternatively, get the pitch degrees for each roof segment and apply them automatically.
4.  **Refine**:
    -   The user still draws the box to confirm the building, but the *area calculation* comes from the rigorous 3D model data rather than the 2D polygon area.

### Impact on Accuracy

| Method | Accuracy | User Effort | Cost |
| :--- | :--- | :--- | :--- |
| **Current (2D + Multiplier)** | ~85-90% | High (Must guess pitch) | Free |
| **LiDAR / Solar API** | >98% | Low (Address only) | Per-API-call cost |
