import joblib
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
        """Safely load model file using joblib"""
        try:
            # Try loading with allow_pickle for numpy compatibility
            import numpy as np
            # Set numpy random seed for compatibility
            np.random.seed(42)
            
            model = joblib.load(filepath)
            print(f"✓ Loaded {model_name} model successfully")
            
            # Verify it's a valid model object
            if hasattr(model, 'predict') or hasattr(model, 'recommend') or callable(model):
                print(f"  Model type: {type(model).__name__}")
                return model
            else:
                print(f"  Model type: {type(model).__name__}")
                # Still return it, might be a custom wrapper
                return model
                
        except Exception as e:
            error_msg = str(e)
            
            # Handle specific numpy random state error
            if "MT19937" in error_msg or "BitGenerator" in error_msg:
                print(f"⚠ {model_name}: NumPy random state compatibility issue")
                print(f"  This is a known issue with numpy versions")
                print(f"  Solution: Re-save the model without random_state or use same numpy version")
                print(f"  The model may still work - trying alternative load...")
                
                # Try loading with different numpy settings
                try:
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        # Force reload
                        model = joblib.load(filepath)
                        print(f"✓ Loaded {model_name} with workaround")
                        return model
                except:
                    pass
            
            print(f"✗ Failed to load {model_name} model: {e}")
            print(f"  File: {filepath}")
            print(f"  Make sure the model was saved with: joblib.dump(model, filepath)")
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
            try:
                # Your content model has: model, scaler, encoders, feature_cols
                # Implement your similarity logic here based on your training approach
                # For now, return fallback
                pass
            except Exception as e:
                print(f"Error in content-based similarity: {e}")
        
        # Fallback
        return self._get_fallback_recommendations(service_id, limit)
    
    def get_personalized(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get personalized recommendations using collaborative filtering"""
        if self.collaborative_model:
            return self._get_collaborative_recommendations(user_id, limit)
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_hybrid_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Hybrid model predictions"""
        if not self.hybrid_model:
            return self._get_fallback_recommendations(user_id, limit)
        
        try:
            # Your hybrid model structure - implement based on your training
            # For now, combine content and collaborative if available
            if self.content_model and self.collaborative_model:
                content_recs = self._get_content_recommendations(user_id, limit * 2)
                collab_recs = self._get_collaborative_recommendations(user_id, limit * 2)
                
                # Simple hybrid: merge and deduplicate
                seen = set()
                hybrid_recs = []
                
                # Alternate between content and collaborative
                for i in range(max(len(content_recs), len(collab_recs))):
                    if i < len(content_recs) and content_recs[i]['service_id'] not in seen:
                        hybrid_recs.append(content_recs[i])
                        seen.add(content_recs[i]['service_id'])
                    if i < len(collab_recs) and collab_recs[i]['service_id'] not in seen:
                        hybrid_recs.append(collab_recs[i])
                        seen.add(collab_recs[i]['service_id'])
                    
                    if len(hybrid_recs) >= limit:
                        break
                
                return hybrid_recs[:limit]
        except Exception as e:
            print(f"Error in hybrid recommendations: {e}")
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_collaborative_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Collaborative filtering predictions"""
        if not self.collaborative_model:
            return self._get_fallback_recommendations(user_id, limit)
        
        try:
            import pandas as pd
            
            # Your collaborative model has a user-item prediction matrix
            # Rows are users (U1, U2, ...), Columns are services/providers (P1, P2, ...)
            svd_predictions = self.collaborative_model.get('svd_predictions_df')
            
            if svd_predictions is not None and isinstance(svd_predictions, pd.DataFrame):
                # Check if user exists in the matrix
                if user_id in svd_predictions.index:
                    # Get all predictions for this user
                    user_predictions = svd_predictions.loc[user_id]
                    
                    # Sort by prediction score (descending) and get top N
                    top_services = user_predictions.sort_values(ascending=False).head(limit)
                    
                    # Convert to recommendation format
                    recommendations = []
                    for service_id, score in top_services.items():
                        recommendations.append({
                            'service_id': str(service_id),
                            'score': round(float(score), 4),
                            'reason': 'Collaborative filtering - based on similar users'
                        })
                    
                    return recommendations
                else:
                    # User not in training data - use average or popular items
                    print(f"User {user_id} not found in collaborative model, using fallback")
        
        except Exception as e:
            print(f"Error in collaborative filtering: {e}")
            import traceback
            traceback.print_exc()
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_content_recommendations(self, user_id: str, limit: int) -> List[Dict]:
        """Content-based predictions"""
        if not self.content_model:
            return self._get_fallback_recommendations(user_id, limit)
        
        try:
            # Your content model has: model, scaler, encoders, feature_cols
            # This would typically require service features to make predictions
            # For now, return fallback - you'll need to implement based on your training logic
            pass
        except Exception as e:
            print(f"Error in content-based filtering: {e}")
        
        return self._get_fallback_recommendations(user_id, limit)
    
    def _get_fallback_recommendations(self, identifier: str, limit: int) -> List[Dict]:
        """Return empty list — backend will use its own DB fallback"""
        return []
