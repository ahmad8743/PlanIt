from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
from pymilvus import connections, Collection
import os
from typing import List, Optional
from dotenv import load_dotenv
from sklearn.mixture import GaussianMixture

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
    filters: Optional[dict] = None  # Example: {"school": 5, "park": 3}
    gmm_enabled: Optional[bool] = True
    gmm_n_components: Optional[int] = 3
    gmm_threshold_percentile: Optional[float] = 0.8
    gmm_uniform_score: Optional[float] = 1.0
    gmm_min_samples: Optional[int] = 10


class SearchResponse(BaseModel):
    status: str
    query: str
    results: List[dict]
    heatmap_scores: dict  # 🧠 now correctly a dict of amenity → [scores]

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
                print(f"✅ Connected to Zilliz collection: {collection_name}")
            except Exception as e:
                print(f"⚠️  Failed to connect to Zilliz: {e}")
                print("Using mock search mode")
        else:
            print("⚠️  Zilliz credentials not found. Using mock search mode")
    
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
            
            # Perform search
            results = self.collection.search(
    data=query_embedding.tolist(),
    anns_field="embedding",
    param=search_params,
    limit=top_k,
    output_fields=["id"]  # ✅ ONLY include fields that exist in the schema
)
            print(results)
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
                        'path': hit.entity.get('path'),
                        'score': float(hit.score),
                        'distance': float(hit.distance),
                        'coordinates': {
                            'lat': lat,
                            'lng': lng
                        }
                    })
            
            return matches
        else:
            raise HTTPException(status_code=500, detail="Failed to connect to Zilliz")

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
    """Apply softmax to scores for heatmap visualization."""
    if not scores:
        return []
    
    # Convert to numpy array
    scores_array = np.array(scores)
    
    # Apply temperature scaling
    scaled_scores = scores_array / temperature
    
    # Apply softmax
    exp_scores = np.exp(scaled_scores - np.max(scaled_scores))  # Subtract max for numerical stability
    softmax_scores = exp_scores / np.sum(exp_scores)
    
    return softmax_scores.tolist()

def apply_gmm_filtering(scores: List[float], n_components: int = 3, 
                       threshold_percentile: float = 0.8, uniform_score: float = 1.0,
                       min_samples: int = 10) -> List[float]:
    """
    Apply Gaussian Mixture Model filtering to keep only statistically significant high scores.
    
    Args:
        scores: List of similarity scores
        n_components: Number of GMM components
        threshold_percentile: Percentile threshold within the highest component
        uniform_score: Uniform score for filtered locations
        min_samples: Minimum samples required for GMM fitting
    
    Returns:
        Filtered scores with uniform values for high-scoring locations, 0 for others
    """
    if not scores or len(scores) < min_samples:
        return scores
    
    scores_array = np.array(scores).reshape(-1, 1)
    
    try:
        # Fit Gaussian Mixture Model
        gmm = GaussianMixture(n_components=n_components, random_state=42)
        gmm.fit(scores_array)
        
        # Find the component with the highest mean (highest scoring cluster)
        component_means = gmm.means_.flatten()
        highest_component_idx = np.argmax(component_means)
        
        # Get the mean and std of the highest component
        highest_mean = component_means[highest_component_idx]
        highest_std = np.sqrt(gmm.covariances_[highest_component_idx][0, 0])
        
        # Calculate threshold based on percentile within the highest component
        threshold = highest_mean + (highest_std * np.percentile(
            np.random.normal(0, 1, 1000), threshold_percentile * 100
        ))
        
        # Create filtered scores
        filtered_scores = []
        for score in scores:
            if score >= threshold:
                filtered_scores.append(uniform_score)
            else:
                filtered_scores.append(0.0)
        
        print(f"🔬 GMM Filtering: {sum(1 for s in filtered_scores if s > 0)}/{len(scores)} locations kept above threshold {threshold:.4f}")
        return filtered_scores
        
    except Exception as e:
        print(f"⚠️ GMM filtering failed: {e}. Using original scores.")
        return scores

@router.post("/search", response_model=SearchResponse)
def search_locations(request: SearchRequest):
    """
    Perform one search per active amenity filter and return per-amenity heatmap scores.
    """
    try:
        print(f"🔍 Received search request: query='{request.query}', filters={request.filters}")

        searcher_instance = get_searcher()
        all_results = []
        all_scores = {}

        if request.filters:
            # Run search per amenity
            for amenity, distance in request.filters.items():
                subquery = f"{request.query} near {amenity}"
                print(f"🔎 Searching for amenity '{amenity}' → {subquery}")

                # Perform search
                results = searcher_instance.search(subquery, request.top_k)
                scores = [r["score"] for r in results]
                soft_scores = apply_softmax(scores, temperature=request.softmax_temperature)
                
                # Apply GMM filtering if enabled
                if request.gmm_enabled:
                    soft_scores = apply_gmm_filtering(
                        soft_scores,
                        n_components=request.gmm_n_components,
                        threshold_percentile=request.gmm_threshold_percentile,
                        uniform_score=request.gmm_uniform_score,
                        min_samples=request.gmm_min_samples
                    )

                # Save scores by amenity
                all_scores[amenity] = soft_scores

                # Just grab first result set for now (all results assumed same structure)
                if not all_results:
                    all_results = results

            return SearchResponse(
                status="success",
                query=request.query,
                results=all_results,
                heatmap_scores=all_scores
            )

        # Fallback: no filters, basic search
        results = searcher_instance.search(request.query, request.top_k)
        scores = [r["score"] for r in results]
        soft_scores = apply_softmax(scores, temperature=request.softmax_temperature)
        
        # Apply GMM filtering if enabled
        if request.gmm_enabled:
            soft_scores = apply_gmm_filtering(
                soft_scores,
                n_components=request.gmm_n_components,
                threshold_percentile=request.gmm_threshold_percentile,
                uniform_score=request.gmm_uniform_score,
                min_samples=request.gmm_min_samples
            )

        return SearchResponse(
            status="success",
            query=request.query,
            results=results,
            heatmap_scores={"default": soft_scores}
        )

    except Exception as e:
        import traceback
        error_msg = f"❌ Search error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        searcher_instance = get_searcher()
        return {"status": "healthy", "message": "Search service is running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search service unhealthy: {str(e)}")
