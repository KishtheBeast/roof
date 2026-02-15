(async () => {
  const API_KEY = "AIzaSyCfxDwHZvymMomZRdsg1SaifnZRuxSXg00"; // 🔴 REPLACE THIS WITH YOUR KEY
  const LAT = 41.5234392;
  const LNG = -72.0664661;

  console.log(`Testing Solar API for: ${LAT}, ${LNG}`);

  try {
    // 1. Call findClosest to get building data
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${LAT}&location.longitude=${LNG}&requiredQuality=HIGH&key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`findClosest failed: ${response.status}`);
    
    const data = await response.json();
    console.log("✅ Building Found:", data.name);
    console.log("📍 Center:", data.center);

    // 2. Get Data Layers (RGB, Mask, DSM)
    const layersUrl = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${LAT}&location.longitude=${LNG}&radiusMeters=50&view=IMAGERY_AND_ANNUAL_FLUX_LAYERS&requiredQuality=HIGH&key=${API_KEY}`;
    
    const layersResponse = await fetch(layersUrl);
    if (!layersResponse.ok) throw new Error(`dataLayers failed: ${layersResponse.status}`);
    
    const layersData = await layersResponse.json();
    console.log("✅ Data Layers Received!");
    console.log("📸 RGB URL (Raw):", layersData.rgbUrl);
    console.log("🎭 Mask URL (Raw):", layersData.maskUrl);
    console.log("⛰️ DSM URL (Raw):", layersData.dsmUrl);

    // 3. Test Fetching the RGB Image (Crucial Step)
    // The URL returned by the API does NOT have the key appended. We must add it.
    const rgbFetchUrl = `${layersData.rgbUrl}&key=${API_KEY}`;
    console.log("🔗 Fetching RGB Image from:", rgbFetchUrl);

    const imageResponse = await fetch(rgbFetchUrl);
    if (!imageResponse.ok) {
      console.error("❌ Image Fetch Failed:", imageResponse.status, await imageResponse.text());
    } else {
      console.log("✅ Image Fetch Successful! (Status 200)");
      console.log("📦 Image Size:", (await imageResponse.arrayBuffer()).byteLength, "bytes");
      console.log("🎉 SUCCESS: The API Key works and the image is accessible.");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
})();