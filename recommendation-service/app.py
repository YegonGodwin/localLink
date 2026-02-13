from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from recommender import RecommendationEngine

app = FastAPI(title="Recommendation Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize recommendation engine
rec_engine = RecommendationEngine()

class RecommendationResponse(BaseModel):
    service_id: str
    score: float
    reason: Optional[str] = None

class RecommendationsResult(BaseModel):
    recommendations: List[RecommendationResponse]
    model_used: str

@app.get("/")
def root():
    return {"status": "Recommendation Service is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": rec_engine.models_loaded()}

@app.get("/api/recommendations/services/{user_id}")
def get_service_recommendations(
    user_id: str,
    limit: int = 10,
    model: str = "hybrid"
):
    """Get personalized service recommendations for a user"""
    try:
        recommendations = rec_engine.get_recommendations(
            user_id=user_id,
            limit=limit,
            model_type=model
        )
        return RecommendationsResult(
            recommendations=recommendations,
            model_used=model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/similar/{service_id}")
def get_similar_services(service_id: str, limit: int = 10):
    """Get similar services based on content"""
    try:
        recommendations = rec_engine.get_similar_services(
            service_id=service_id,
            limit=limit
        )
        return RecommendationsResult(
            recommendations=recommendations,
            model_used="content_based"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/personalized/{user_id}")
def get_personalized_recommendations(user_id: str, limit: int = 10):
    """Get personalized recommendations using collaborative filtering"""
    try:
        recommendations = rec_engine.get_personalized(
            user_id=user_id,
            limit=limit
        )
        return RecommendationsResult(
            recommendations=recommendations,
            model_used="collaborative"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
