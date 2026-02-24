# Roof Measuring App

A professional React + Vite application for measuring roof areas from satellite imagery using AI-powered analysis.

## Setup Instructions

### 1. Create Environment File
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

Required variables:
- **VITE_GOOGLE_MAPS_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **VITE_BACKEND_API_URL**: The URL of your roof analysis backend.
- **VITE_BACKEND_API_KEY**: The API key for authentication with the backend.

### 2. Enable Required Google APIs
In Google Cloud Console, enable these APIs:
1. **Maps JavaScript API** - For map display and interaction.
2. **Places API** - For address search and autocomplete.

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173/`

---

## Technical Features

- **AI-Powered Analysis**: Automates roof measurement (area, pitch, facets, linear feet for ridges/valleys) via backend integration.
- **Address Autocomplete**: Uses Google Places API for precise location targeting.
- **Interactive Results**: Dynamic cost estimation based on material selection and AI measurements.
- **Security**: Password gate protection and token-based API authentication with auto-refresh.
- **Modern UI**: Built with Tailwind CSS, Lucide-react icons, and responsive design for mobile/desktop.

---

## Current Status

The application has been refactored to use a "Backend API-first" approach. Legacy client-side calculation scripts (Turf.js drawing, GeoTIFF processing) have been replaced by robust server-side AI analysis for higher precision and reliability.
