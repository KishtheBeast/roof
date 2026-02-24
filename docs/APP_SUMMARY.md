# Roof Measuring App - Project Summary

## Overview
A React + Vite application for measuring roof areas from satellite imagery using AI analysis and Google Maps Places API.

## Tech Stack
- **Frontend**: React 18.2 + Vite 5.0 + Tailwind CSS
- **Maps**: Google Maps Places API (for address search)
- **HTTP**: axios with token refresh interceptors
- **Icons**: lucide-react

## Current Structure
```
src/
├── components/
│   ├── AddressSearch.jsx      # Google Places autocomplete input
│   ├── MeasurementDisplay.jsx # Results panel with metrics & costs
│   └── PasswordGate.jsx       # Auth gate (localStorage password)
├── hooks/
│   ├── useAiAnalysis.js       # AI analysis state & API calls
│   ├── useAuth.js             # Authentication hook
│   └── useMapControl.js       # Google Maps search logic
├── pages/
│   ├── LandingPage.jsx        # Initial search view
│   ├── LoadingPage.jsx        # Loading state view
│   └── ResultsPage.jsx        # Analysis results view
├── services/
│   ├── googleMaps.js          # Google Maps API service
│   └── roofApi.js             # Backend API service
├── utils/
│   └── auth.js                # Token management & API instance
├── App.jsx                    # Main orchestrator (state management)
└── main.jsx                   # Entry point
```

## Key Features
1. **Address Search**: Google Places autocomplete with session tokens.
2. **AI Analysis**: Fully automated roof measurement via backend AI (area, pitch, facets, linear edges).
3. **Automatic Cost Estimation**: Defaults to "Asphalt Shingle" on initial analysis to provide immediate cost feedback.
4. **Dynamic Material Updates**: Users can switch materials to update cost estimates in real-time.
5. **Direct Address Update**: Users can change the address directly from the `ResultsPage` header.
6. **Security**: Password gate and API key authentication with auto-refreshing JWT tokens.

## Data Flow
```
User Input → AddressSearch (useMapControl)
    → App.handleLocationSelect
    → triggerAiAnalysis(address, 'Asphalt Shingle') (useAiAnalysis)
    → /analyze-roof API (Backend AI)
    → setAiMeasurements (includes costEstimate)
    → View Switch to ResultsPage (MeasurementDisplay initializes with costEstimate)
```

## Optimizations & UI Improvements (Implemented)

### Frontend (Roof App)
- **[Perf] Instant Material Switching**: Uses `all_cost_estimates` from the initial API response to update costs without extra network requests.
- **[Perf] Client-Side Caching**: Implemented `localStorage` caching for the last 10 searched addresses to eliminate duplicate API calls and provide instant results for repeated searches.
- **[UX] Automatic Cost Estimation**: Defaults to "Asphalt Shingle" on initial analysis to provide immediate cost feedback.

### Backend (FastAPI Roof)
- **[API] Batch Costing**: The `/analyze-roof` endpoint now returns cost estimates for all supported materials in a single response.
- **[Img] WebP Compression**: Satellite imagery is converted to WebP format (75% quality) on the server, reducing payload size by ~60% compared to JPEG.
- **[Perf] Redis-style Caching**: In-memory caching for Google Solar data minimizes API latency and costs for repeat lookups.

## Current Status
- **Enhanced UX**: The app now provides a complete measurement and cost profile immediately upon searching an address.
- **Backend-First Architecture**: Client-side calculations have been successfully offloaded to a high-performance AI backend.
- **Clean Codebase**: Purged of legacy drawing and GeoTIFF processing logic.

## Planned Improvements
1. **TypeScript Migration**: Convert key files to `.tsx` for better type safety.
2. **Testing**: Add unit tests for hooks and utility functions.
3. **Error Handling**: Improve user feedback for specific API failures (e.g., "Address not a building").
