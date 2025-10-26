# backend/routers/extract_filters.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
import os

# Ensure util and credentials paths are accessible
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the function
from util.match_queries.match_queries import extract_city_and_filters

router = APIRouter()

class ExtractRequest(BaseModel):
    prompt: str

class ExtractResponse(BaseModel):
    city: Optional[str]
    filters: Dict[str, Any]

@router.post("/extract", response_model=ExtractResponse)
def extract_from_prompt(request: ExtractRequest):
    """
    Extract city and filters from natural language input using OpenAI model.
    """
    try:
        result = extract_city_and_filters(request.prompt)
        return ExtractResponse(city=result.get("city"), filters=result.get("filters", {}))
    except Exception as e:
        print(f"❌ Error in /extract: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract filters")