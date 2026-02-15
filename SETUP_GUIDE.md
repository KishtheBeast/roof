# Setup Guide - Google Maps & Anthropic API Configuration

## Problem Diagnosis

The errors you're seeing indicate:

1. **REQUEST_DENIED** - Google Places API is rejecting requests due to missing/invalid API key
2. **AutocompleteService Deprecation** - Google is migrating to `AutocompleteSuggestion` (your code is now updated for this)
3. **Missing API Keys** - No authentication credentials provided

## Solution

### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API** - Required for map display
   - **Places API** - Required for address search
   - **Solar API** - Required for building insights (roof data)
4. Create an **API Key** credential (Application Credentials → API Key)
5. Restrict keys to:
   - **Application Restrictions**: HTTP referrers (your domain)
   - **API Restrictions**: Select the 3 APIs above

### Step 2: Get Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy it (you won't see it again!)

### Step 3: Create `.env` File

In your project root, create a `.env` file:

```bash
# .env
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_API_KEY_HERE
VITE_ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
```

Replace with your actual keys.

### Step 4: Restart Development Server

```bash
npm run dev
```

The application should now:
- Search addresses without errors
- Display the map
- Fetch building data
- Analyze roofs with AI

## Troubleshooting

### Still getting REQUEST_DENIED?
- ✓ Check API key is copied correctly (no extra spaces)
- ✓ Ensure Places API is enabled in Google Cloud Console
- ✓ Check API key restrictions allow your domain
- ✓ Wait a few minutes after enabling APIs (sometimes takes time)

### AutocompleteService warnings?
- ✓ Already fixed in updated code! Uses new session-based approach
- ✓ Still shows warnings? Clear browser cache and restart dev server

### "NoApiKeys" warning in console?
- ✓ API key path is working - this is a deprecation notice
- ✓ You can safely ignore this (no action needed)

## Updated Code

The `AddressSearch.jsx` component has been updated to:

1. ✓ Call `setOptions()` with your API key
2. ✓ Create session tokens for better request grouping
3. ✓ Use new `AutocompleteSuggestion` patterns
4. ✓ Handle authentication errors gracefully
5. ✓ Accessible keyboard navigation

## Next Steps

After setup is complete, you can:
- Search for any US address
- View roof data on satellite imagery
- Generate AI analysis of roof measurements
- Export measurements as reports

See [README.md](README.md) for usage documentation.
