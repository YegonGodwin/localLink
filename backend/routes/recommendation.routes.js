import express from 'express';
import { 
  getRecommendations,
  getSimilarServices,
  getPersonalizedRecommendations,
  checkRecommendationServiceHealth
} from '../controllers/recommendation.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get recommended services for current user
router.get('/services', getRecommendations);

// Get similar services by service ID
router.get('/similar/:serviceId', getSimilarServices);

// Get personalized recommendations
router.get('/personalized', getPersonalizedRecommendations);

// Health check for recommendation service
router.get('/health', checkRecommendationServiceHealth);

export default router;
