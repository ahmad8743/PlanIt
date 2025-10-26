from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
from pymilvus import connections, Collection
import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the feature extractor
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'util'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'creds'))
import creds
from feature_extractors import FeatureExtractorFactory

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 50
    softmax_temperature: Optional[float] = 1.0

class SearchResponse(BaseModel):
    status: str
    query: str
    results: List[dict]
    heatmap_scores: List[float]

class SigLIP2Searcher:
    """Search captions using SigLIP2 text embeddings."""
    
    def __init__(self):
        """Initialize searcher with environment variables."""
        # Get configuration from environment
        zilliz_uri = creds.ZILLIZ_URI
        zilliz_token = creds.ZILLIZ_TOKEN
        collection_name = creds.ZILLIZ_COLLECTION
        model_name = "google/siglip2-base-patch16-512"  # Hardcoded model name
        
        # Load SigLIP2 model using feature extractor factory
        self.device = torch.device("cpu")  # Force CPU for better compatibility
        self.extractor = FeatureExtractorFactory.create_extractor(model_name, self.device)
        
        # Initialize Zilliz connection if credentials are available
        self.collection = None
        self.schema_info = None
        
        if zilliz_uri and zilliz_token:
            try:
                # Connect to Zilliz
                connections.connect(
                    alias="default",
                    uri=zilliz_uri,
                    token=zilliz_token
                )
                
                # Load collection
                self.collection = Collection(collection_name)
                self.collection.load()
                
                # Detect schema to determine available fields
                self.schema_info = self._detect_schema()
                
                print(f"✅ Connected to Zilliz collection: {collection_name}")
                print(f"📊 Schema detected: {self.schema_info}")
            except Exception as e:
                print(f"⚠️  Failed to connect to Zilliz: {e}")
                print("Using mock search mode")
        else:
            print("⚠️  Zilliz credentials not found. Using mock search mode")
    
    def _detect_schema(self):
        """Detect the schema of the collection to determine available fields."""
        if not self.collection:
            return None
            
        schema = self.collection.schema
        field_names = [field.name for field in schema.fields]
        
        schema_info = {
            'fields': field_names,
            'has_caption': 'caption' in field_names,
            'has_path': 'path' in field_names,
            'has_lat': 'lat' in field_names,
            'has_lon': 'lon' in field_names,
            'has_lng': 'lng' in field_names,
            'has_grid_i': 'grid_i' in field_names,
            'has_grid_j': 'grid_j' in field_names
        }
        
        return schema_info
    
    def encode_text(self, text: str) -> np.ndarray:
        """Encode text to embedding using SigLIP2."""
        embedding = self.extractor.extract_text_features([text])
        return embedding.cpu().float().numpy()
    
    def search(self, query_text: str, top_k: int = 50) -> List[dict]:
        """Search for similar captions."""
        # Generate query embedding using SigLIP2
        query_embedding = self.encode_text(query_text)
        
        if self.collection is not None:
            # Real Zilliz search
            search_params = {
                "metric_type": "IP",  # Inner Product for normalized embeddings
                "params": {"ef": 128}
            }
            
            # Determine output fields based on schema
            output_fields = ["id"]  # Always include ID
            
            if self.schema_info:
                if self.schema_info['has_caption']:
                    output_fields.append("caption")
                if self.schema_info['has_path']:
                    output_fields.append("path")
                if self.schema_info['has_lat']:
                    output_fields.append("lat")
                if self.schema_info['has_lon']:
                    output_fields.append("lon")
                elif self.schema_info['has_lng']:
                    output_fields.append("lng")
            
            print(f"🔍 Requesting fields: {output_fields}")
            
            # Perform search
            results = self.collection.search(
                data=query_embedding.tolist(),
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                output_fields=output_fields
            )
            
            # Format results
            matches = []
            for hits in results:
                for hit in hits:
                    # Extract coordinates from ID (format: "lat_lng")
                    coords = hit.id.split('_')
                    lat, lng = None, None
                    if len(coords) >= 2:
                        try:
                            lat = float(coords[0])
                            lng = float(coords[1])
                        except ValueError:
                            pass
                    
                    matches.append({
                        'id': hit.id,
                        'caption': f"Location at {lat:.4f}, {lng:.4f}" if lat and lng else f"Location {hit.id}",
                        'path': f"/location/{hit.id}",
                        'score': float(hit.score),
                        'distance': float(hit.distance),
                        'coordinates': {
                            'lat': lat,
                            'lng': lng
                        }
                    })
            
            return matches
        else:
            # Mock search with SigLIP2 embeddings
            mock_results = []
            for i in range(min(top_k, 20)):  # Return up to 20 mock results
                # Generate mock coordinates around St. Louis area
                base_lat = 38.6270
                base_lng = -90.1994
                lat = base_lat + (i * 0.01 - 0.1)  # Spread around the area
                lng = base_lng + (i * 0.01 - 0.1)
                
                mock_results.append({
                    'id': f"{lat}_{lng}",
                    'caption': f"Mock location {i+1}: {query_text} related content (SigLIP2 encoded)",
                    'path': f"/mock/path/{i}",
                    'score': float(0.9 - (i * 0.05)),  # Decreasing scores
                    'distance': float(i * 0.1),
                    'coordinates': {
                        'lat': lat,
                        'lng': lng
                    }
                })
            
            return mock_results

# Global searcher instance
searcher = None

def get_searcher():
    """Get or create searcher instance."""
    global searcher
    if searcher is None:
        try:
            print("🔧 Initializing SigLIP2Searcher...")
            searcher = SigLIP2Searcher()
            print("✅ SigLIP2Searcher initialized successfully")
        except Exception as e:
            import traceback
            error_msg = f"Failed to initialize searcher: {str(e)}\n{traceback.format_exc()}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize searcher: {str(e)}")
    return searcher

def apply_softmax(scores: List[float], temperature: float = 1.0) -> List[float]:
    """Apply min-max normalization with temperature scaling for heatmap visualization."""
    if not scores:
        return []
    
    # Convert to numpy array
    scores_array = np.array(scores)
    
    # Apply temperature scaling
    scaled_scores = scores_array / temperature
    
    # Apply min-max normalization instead of softmax for better visualization
    min_score = np.min(scaled_scores)
    max_score = np.max(scaled_scores)
    
    if max_score == min_score:
        # All scores are the same, return uniform distribution
        return [1.0 / len(scores)] * len(scores)
    
    # Normalize to [0, 1] range
    normalized_scores = (scaled_scores - min_score) / (max_score - min_score)
    
    # Scale to make heatmap more visible (multiply by 10 to make values more prominent)
    scaled_normalized = normalized_scores * 10
    
    return scaled_normalized.tolist()

@router.post("/search", response_model=SearchResponse)
def search_locations(request: SearchRequest):
    """Search for locations using SigLIP2 embeddings."""
    try:
        print(f"🔍 Received search request: query='{request.query}', top_k={request.top_k}, temperature={request.softmax_temperature}")
        searcher_instance = get_searcher()
        
        # Perform search
        results = searcher_instance.search(request.query, request.top_k)
        
        if not results:
            return SearchResponse(
                status="success",
                query=request.query,
                results=[],
                heatmap_scores=[]
            )
        
        # Extract scores for softmax
        scores = [result['score'] for result in results]
        
        # Apply softmax to scores
        heatmap_scores = apply_softmax(scores, temperature=request.softmax_temperature)
        
        # Update results with softmax scores
        for i, result in enumerate(results):
            result['heatmap_score'] = heatmap_scores[i]
        
        print(f"✅ Search completed: {len(results)} results found")
        return SearchResponse(
            status="success",
            query=request.query,
            results=results,
            heatmap_scores=heatmap_scores
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Search error: {str(e)}\n{traceback.format_exc()}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        searcher_instance = get_searcher()
        return {"status": "healthy", "message": "Search service is running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search service unhealthy: {str(e)}")
