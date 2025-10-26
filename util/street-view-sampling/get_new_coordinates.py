import os
import requests
import csv
from math import radians, cos, sin, atan2, sqrt, degrees
from concurrent.futures import ThreadPoolExecutor, as_completed

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'creds'))
from creds import GOOGLE_MAPS_API_KEY

def parse_coord(s):
    s = s.strip().strip(", '\"")  # remove commas/quotes/spaces
    if "_" not in s: 
        return None
    a, b = s.split("_", 1)
    try:
        lat = float(a)
        lon = float(b)
        return lat, lon
    except ValueError:
        return None

def midpoint_planar(p1, p2):
    (lat1, lon1), (lat2, lon2) = p1, p2
    return ( (lat1+lat2)/2.0, (lon1+lon2)/2.0 )

def midpoint_great_circle(p1, p2):
    # https://www.movable-type.co.uk/scripts/latlong.html midpoint
    lat1, lon1 = map(radians, p1)
    lat2, lon2 = map(radians, p2)
    dlon = lon2 - lon1
    Bx = cos(lat2) * cos(dlon)
    By = cos(lat2) * sin(dlon)
    lat3 = atan2( sin(lat1)+sin(lat2), sqrt((cos(lat1)+Bx)**2 + By**2) )
    lon3 = lon1 + atan2(By, cos(lat1)+Bx)
    return (degrees(lat3), degrees(lon3))

def midpoints_between_consecutive(raw_list, method="great_circle"):
    # method: "great_circle" or "planar"
    pts = []
    for s in raw_list:
        p = parse_coord(s)
        if p is not None:
            pts.append(p)
    mids = []
    f = midpoint_great_circle if method == "great_circle" else midpoint_planar
    for a, b in zip(pts, pts[1:]):
        mids.append(f(a, b))
    return mids

def get_existing_coordinates():
    folders = [name for name in os.listdir('./images')
           if os.path.isdir(os.path.join('./images', name))]
    return folders

def query_google(lat, lon):
    params = f'size=600x600&location={lat},{lon}&fov=90&heading=0&pitch=0&key={GOOGLE_MAPS_API_KEY}'
    meta_url = f'https://maps.googleapis.com/maps/api/streetview/metadata?{params}'
    image_url = f'https://maps.googleapis.com/maps/api/streetview?{params}'
    response = requests.get(meta_url)
    data = response.json()
    return data['status'] == 'OK'



def main():
    existing_coordinates = get_existing_coordinates()
    mids_gc = midpoints_between_consecutive(existing_coordinates, method="great_circle")  # accurate
    mids_avg = midpoints_between_consecutive(existing_coordinates, method="planar")       # quick
    print("Great-circle midpoints (first 5):", mids_gc[:5])
    print("Planar midpoints (first 5):", mids_avg[:5])
    print(len(mids_gc), len(mids_avg))
    def worker(mid):
        lat, lon = mid
        if query_google(lat, lon):  # your Street View check function
            print(f"Found new coordinate: {mid}")
            return mid  # keep it
        return None     # discard

    new_coordinates = []

    with ThreadPoolExecutor(max_workers=100) as executor:  # adjust thread count as needed
        futures = [executor.submit(worker, mid) for mid in mids_gc]

        for fut in as_completed(futures):
            result = fut.result()
            if result is not None:
                new_coordinates.append(result)

    print(f"Found {len(new_coordinates)} new coordinates")
    with open('new_coordinates.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['latitude', 'longitude'])
        for coord in new_coordinates:
            writer.writerow([coord[0], coord[1]])

if __name__ == "__main__":
    main()
