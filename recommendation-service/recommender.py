import pickle
import os
from typing import List, Dict
import numpy as np

class RecommendationEngine:
    def __init__(self):
        self.models_dir = "models"
        self.content_model = None
        self.collaborative_model = None
        self.hybrid_model = None
        
        self._load_models()
    
    def _load_models(self):
        """Load trained models from disk"""
        # Try different pickle loading strategies
        content_path = os.path.join(self.models_dir, "content_based.pkl")
        if os.path.exists(content_path):
            self.content_model = self._safe_load_pickle(content_path, "content_based")
        
        collab_path = os.path.join(self.models_dir, "collaborative.pkl")
        if os.path.exists(collab_path):
            self.collaborative_model = self._safe_load_pickle(collab_path, "collaborative")
        
        hybrid_path = os.path.join(self.models_dir, "hybrid.pkl")
        if os.path.exists(hybrid_path):
            self.hybrid_model = self._safe_load_pickle(hybrid_path, "hybrid")
    
    def _safe_load_pickle(self, filepath: str, model_name: str):
        """Safely load pickle file with multiple strategies"""
        strategies = [
            # Strategy 1: Standard pickle load
            lambda f: pickle.load(f),
            # Strategy 2: Load with latin1 encoding (Python 2 compatibility)
            lambda f: pickle.load(f, encoding='latin1'),
            # Strategy 3: Load with bytes encoding
            lambda f: pickle.load(f, encoding='bytes'),
        ]
        
        for i, strategy in enumerate(strategies):
            try:
                with open(filepath, "rb") as f:
                    model = strategy(f)
                    print(f"✓ Loaded {model_name} model (strategy {i+1})")
                    return model
            except Exception as e:
                if i == len(strategies) - 1:
                    print(f"✗ Failed to load {model_name} model: {e}")
                    print(f"  File: {filepath}")
                    print(f"  Try re-saving the model with: pickle.dump(model, file, protocol=4)")
                continue
        
        return None
    
    def models_loaded(self) -> Dict[str, bool]:
        """Check which models are loaded"""
        return {
            "content_based": self.content_model is not None,
            "collaborative": self.collaborative_model is not None,
            "hybrid": self.hybrid_model is not None
        }
    
    def get_recommendations(self, user_id: str, limit: int = 10, model_type: str = "hybrid") -> List[Dict]:
        """Get recommendations using specified model"""
        
        if model_type == "hybrid" and self.hybrid_model:
            return self._get_hybrid_recommendations(user_id, limit)
        elif model_type == "collaborative" and self.collaborative_model:
            return self._get_collaborative_recommendations(user_id, limit)
        elif model_type == "content" and self.content_model:
            return self._get_content_recommendations(user_id, limit)
        else:
            # Fallback to mock recommendations
            return self._get_fallback_recommendations(user_id, limit)
    
    def get_similar_services(self, service_id: str, limit: int = 10) -> List[Dict]:
        """Get similar services using content-based filtering"""
        if self.content_model:
            # Use your trained content-based model
            # predictions = self.content_model.predict(service_id, limit)
            pass
        
        # Fallback
        return self._get_fallback_recommendations(service_id, limit)
    
    def get_personalized(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get personalized recommendations using collaborative filtering"""
        if self.collaborative_model:
            return self._get_collaborative_recommendations(user_id, limit)
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_hybrid_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Hybrid model predictions"""
        # Replace with your actual hybrid model logic
        # predictions = self.hybrid_model.predict(user_id, limit)
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_collaborative_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Collaborative filtering predictions"""
        # Replace with your actual collaborative model logic
        # predictions = self.collaborative_model.predict(user_id, limit)
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_content_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Content-based predictions"""
        # Replace with your actual content-based model logic
        # predictions = self.content_model.predict(user_id, limit)
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_fallback_recommendations(self, identifier: str, limit: int) -> List[Dict]:
        """Fallback recommendations when models aren't loaded"""
        # This is a placeholder - replace with actual fallback logic
        # Could query popular services from database
        return [
            {
                "service_id": f"service_{i}",
                "score": round(0.9 - (i * 0.05), 2),
                "reason": "Popular service"
            }
            for i in range(limit)
        ]
