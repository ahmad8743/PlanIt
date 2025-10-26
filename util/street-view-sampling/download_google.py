import os
import sys
import requests
import json
from io import BytesIO
from PIL import Image
import pandas as pd
from tqdm import tqdm
import time
import random
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import as_completed
import threading
seen_coords = set()
seen_pano_ids = set()
seen_lock = threading.Lock()

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'creds'))
from creds import GOOGLE_MAPS_API_KEY

IMAGE_FOLDER = './images'
os.makedirs(IMAGE_FOLDER, exist_ok=True)


def calculate_tile_dimensions(zoom):
    """Calculate the number of tiles needed for a given zoom level"""
    num_x = 2 ** zoom
    num_y = 2 ** (zoom - 1)
    return num_x, num_y

def download_single_tile(panoid, zoom, x, y):
    """Download a single tile from Street View API"""
    url = f"https://cbk0.googleapis.com/cbk?output=tile&panoid={panoid}&zoom={zoom}&x={x}&y={y}"
    resp = requests.get(url)
    
    if resp.status_code != 200:
        print(f"Failed to download tile {x},{y} for pano {panoid}: {resp.status_code}")
        return None
    
    return Image.open(BytesIO(resp.content))

def get_tile_size(panoid, zoom):
    """Get the tile size by downloading a test tile"""
    test_tile = download_single_tile(panoid, zoom, 0, 0)
    if test_tile is None:
        return None
    return test_tile.size[0]  # Assuming square tiles

def create_panorama_canvas(num_x, num_y, tile_size):
    """Create a blank canvas for the panorama image"""
    return Image.new('RGB', (num_x * tile_size, num_y * tile_size))

def download_remaining_tiles(panoid, zoom, num_x, num_y, pano_img, tile_size):
    """Download and paste remaining tiles onto the panorama canvas"""
    for x in range(num_x):
        for y in range(num_y):
            if x == 0 and y == 0:  # Skip the first tile we already downloaded
                continue
            
            tile = download_single_tile(panoid, zoom, x, y)
            if tile is None:
                return False
            
            pano_img.paste(tile, (x * tile_size, y * tile_size))
    
    return True

def download_streetview_tiles(panoid, zoom=2):
    """
    Download and stitch Street View tiles for a given panorama ID.
    Street View panoramas are equirectangular: horizontal tiles = 2**zoom, vertical tiles = max(1, 2**zoom // 2).
    Returns a PIL Image or None on error.
    """
    num_x, num_y = calculate_tile_dimensions(zoom)
    
    tile_size = get_tile_size(panoid, zoom)
    if tile_size is None:
        return None
    
    pano_img = create_panorama_canvas(num_x, num_y, tile_size)
    
    test_tile = download_single_tile(panoid, zoom, 0, 0)
    if test_tile is None:
        return None
    pano_img.paste(test_tile, (0, 0))
    
    success = download_remaining_tiles(panoid, zoom, num_x, num_y, pano_img, tile_size)
    if not success:
        return None
    
    return pano_img


def check_existing_image(lat, lon):
    """Check if image already exists in cache"""
    cache_dir = os.path.join(IMAGE_FOLDER, f"{lat}_{lon}")
    pano_dir = os.path.join(cache_dir, 'pano.jpg')
    
    if os.path.exists(pano_dir):
        print(f"Image already exists for {lat},{lon}, skipping...")
        return True
    return False

def create_cache_directory(lat, lon):
    """Create cache directory for the coordinate"""
    cache_dir = os.path.join(IMAGE_FOLDER, f"{lat}_{lon}")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir

def get_panorama_metadata(lat, lon):
    """Get panorama metadata from Google Street View API"""
    meta_resp = requests.get(
        f"https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lon}&key={GOOGLE_MAPS_API_KEY}"
    )
    return meta_resp.json()

def save_metadata_to_file(meta, cache_dir):
    """Save metadata JSON to a file"""
    meta_file = os.path.join(cache_dir, 'metadata.json')
    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"Saved metadata to {meta_file}")

def check_metadata_status(meta, lat, lon, csv_file=None, row_index=None):
    """Check if metadata indicates a valid panorama"""
    if meta.get('status') != 'OK':
        print(f"No panorama at {lat},{lon}: {meta.get('status')} - removing from CSV")
        # Remove this row from the CSV file
        if csv_file and row_index is not None:
            df = pd.read_csv(csv_file)
            df = df[~((df['latitude'] == lat) & (df['longitude'] == lon))]
            df.to_csv(csv_file, index=False)
            print(f"Removed row {row_index} from {csv_file}")
        return False
    return True

def extract_panorama_id(meta):
    """Extract panorama ID from metadata"""
    return meta.get('pano_id') or meta.get('panoId')

def download_and_save_panorama(pano_id, zoom, cache_dir):
    """Download panorama and save to cache directory"""
    pano_img = download_streetview_tiles(pano_id, zoom)
    if pano_img is None:
        print(f"Failed to download panorama")
        return False
    
    pano_img.save(os.path.join(cache_dir, 'pano.jpg'))
    return True

def process_coordinate_row(row, zoom=2, csv_file=None, row_index=None):
    lat, lon = row['latitude'], row['longitude']

    # fast in-memory gate (same-run duplicate rows)
    ck = f"{lat}_{lon}"
    with seen_lock:
        if ck in seen_coords:
            return
        seen_coords.add(ck)

    if check_existing_image(lat, lon):
        return

    cache_dir = create_cache_directory(lat, lon)
    meta = get_panorama_metadata(lat, lon)
    if not check_metadata_status(meta, lat, lon, csv_file, row_index):
        return

    pano_id = extract_panorama_id(meta)
    if not pano_id:
        return True

    # de-dupe by pano_id across different coords
    with seen_lock:
        if pano_id in seen_pano_ids:
            return  # already downloaded this pano in this run
        seen_pano_ids.add(pano_id)

    success = download_and_save_panorama(pano_id, zoom, cache_dir)
    if not success:
        return True

    save_metadata_to_file(meta, cache_dir)
    return False



def process_coordinates(csv_file, zoom=2, limit=None, max_workers=5):
    df = pd.read_csv(csv_file)

    # Optional: limit rows for testing
    if limit:
        df = df.head(limit)
        print(f"Processing only first {limit} coordinates for testing")

    # Collect indices to drop AFTER threading (avoid per-thread CSV writes)
    to_drop = []

    def worker(idx, row):
        # tiny jitter to avoid bursty requests
        time.sleep(random.uniform(0.02, 0.08))
        # IMPORTANT: do not pass csv_file into the row processor (avoid races)
        return idx, process_coordinate_row(row, zoom=zoom, csv_file=None, row_index=idx)
        # return value is (idx, should_drop)

    futures = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        for idx, row in df.iterrows():
            futures.append(ex.submit(worker, idx, row))

        for fut in tqdm(as_completed(futures), total=len(futures), desc="Downloading"):
            idx, should_drop = fut.result()
            if should_drop:
                to_drop.append(idx)

    if to_drop:
        print(f"Dropping {len(to_drop)} rows with no/failed pano")
        # Map original indices to positions in current df
        df = df.drop(index=to_drop, errors="ignore")
        df.to_csv(csv_file, index=False)
        


def main():
    # Get the path to coords.csv in the same directory as this script
    csv_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'new_coordinates.csv')
    # Process only first 5 coordinates for testing
    process_coordinates(csv_file, zoom=1, max_workers=10)


if __name__ == '__main__':
    main() 
