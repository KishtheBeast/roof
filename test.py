import requests
import matplotlib.pyplot as plt
import rasterio
from rasterio.plot import show
import io
import numpy as np

# Configuration
API_KEY = "AIzaSyCfxDwHZvymMomZRdsg1SaifnZRuxSXg00" # User needs to replace this
ADDRESS = "450 East Main St, Norwich, CT"

def get_tight_roof_crop(address):
    try:
        # 1. Geocode
        geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={API_KEY}"
        location = requests.get(geo_url).json()['results'][0]['geometry']['location']
        lat, lng = location['lat'], location['lng']

        # 2. Get Solar Data (Requesting RGB and MASK)
        solar_url = f"https://solar.googleapis.com/v1/dataLayers:get?location.latitude={lat}&location.longitude={lng}&radiusMeters=50&view=IMAGERY_AND_ANNUAL_FLUX_LAYERS&key={API_KEY}"
        solar_data = requests.get(solar_url).json()
        
        # 3. Download RGB and Mask
        rgb_bytes = requests.get(solar_data['rgbUrl'] + f"&key={API_KEY}").content
        mask_bytes = requests.get(solar_data['maskUrl'] + f"&key={API_KEY}").content

        with rasterio.open(io.BytesIO(rgb_bytes)) as rgb_src, \
             rasterio.open(io.BytesIO(mask_bytes)) as mask_src:
            
            # Read the data
            rgb_img = rgb_src.read()   # Shape: (3, height, width)
            mask_img = mask_src.read(1) # Shape: (height, width)

            # 4. Find the "White" pixels in the mask (the house)
            # Mask values: 0 = background, 1 = house
            coords = np.argwhere(mask_img > 0)
            
            # Find the bounding box of the house
            y_min, x_min = coords.min(axis=0)
            y_max, x_max = coords.max(axis=0)

            # Add a small padding (e.g., 20 pixels) so it's not too tight
            padding = 20
            y_min = max(0, y_min - padding)
            x_min = max(0, x_min - padding)
            y_max = min(rgb_img.shape[1], y_max + padding)
            x_max = min(rgb_img.shape[2], x_max + padding)

            # 5. Crop the image
            cropped_img = rgb_img[:, y_min:y_max, x_min:x_max]

            # 6. Display
            plt.figure(figsize=(6, 6))
            plt.title(f"Tight Crop: {address}")
            # Transpose for matplotlib (C, H, W) -> (H, W, C)
            plt.imshow(np.transpose(cropped_img, (1, 2, 0)))
            plt.axis('off')
            plt.show()

    except Exception as e:
        print(f"Error: {e}")

get_tight_roof_crop(ADDRESS)