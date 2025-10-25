import numpy as np

def generate_heatmap_array(city: str, filters: dict) -> np.ndarray:
    # Example: create a 10x10 heatmap with values based on filters
    weight = sum(filters.values()) or 1
    array = np.random.rand(10, 10) * weight  # Scale heatmap intensity
    return array