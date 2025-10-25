from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from logic.heatmap import generate_heatmap_array

router = APIRouter()

# Expected request structure
class FilterRequest(BaseModel):
    city: str
    filters: dict  # e.g., { "bus": 5, "school": 3, ... }

@router.post("/process-filters")
def process_filters(data: FilterRequest):
    try:
        city = data.city
        filters = data.filters

        # Call your backend logic to generate NumPy array
        result_array = generate_heatmap_array(city, filters)

        # Return as list (JSON-safe)
        return {
            "status": "success",
            "city": city,
            "heatmap": result_array.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))