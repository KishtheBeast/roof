# Roof Measurement Calculation

## Setup

### Google Maps API Key

To use the address search features, you must provide a valid Google Maps API Key with the **Places API** and **Maps JavaScript API** enabled.

1.  Create a file named `.env` in the root directory.
2.  Add your key:
    ```
    VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
    ```

This document outlines the current methodology used for estimating roof surface area and discusses future improvements for precision using LiDAR data.

## Current Calculation Methodology

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
