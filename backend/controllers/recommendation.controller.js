import recommendationClient from '../utils/recommendationClient.js';
import recommendationMonitor from '../utils/recommendationMonitor.js';
import Service from '../models/Service.model.js';
import Booking from '../models/Booking.model.js';
import mongoose from 'mongoose';

// Get recommended services for a user
export const getRecommendations = async (req, res) => {
  const startTime = Date.now();
  let usedFallback = false;
  
  try {
    const userId = req.user.id;
    const { limit = 10, model = 'hybrid' } = req.query;

    // Call recommendation service
    const recommendations = await recommendationClient.getServiceRecommendations(
      userId,
      parseInt(limit),
      model
    );

    // Filter valid MongoDB ObjectIds only
    const validRecommendations = recommendations.recommendations.filter(r => 
      mongoose.Types.ObjectId.isValid(r.service_id)
    );

    let enrichedRecommendations = [];
    
    if (validRecommendations.length > 0) {
      // Fetch actual service details from database
      const serviceIds = validRecommendations.map(r => r.service_id);
      const services = await Service.find({ _id: { $in: serviceIds } })
        .populate('provider', 'name avatar')
        .lean();

      // Merge recommendations with service details
      enrichedRecommendations = validRecommendations.map(rec => {
        const service = services.find(s => s._id.toString() === rec.service_id);
        return service ? {
          ...service,
          recommendationScore: rec.score,
          recommendationReason: rec.reason
        } : null;
      }).filter(r => r !== null);
    }

    // If we have no valid results after filtering, use the fallback
    if (enrichedRecommendations.length === 0) {
      usedFallback = true;
      const fallbackServices = await Service.find({})
        .sort({ rating: -1, reviews: -1 })
        .limit(parseInt(req.query.limit) || 10)
        .populate('provider', 'name avatar')
        .lean();

      return res.json({
        success: true,
        data: fallbackServices,
        modelUsed: 'fallback',
        message: 'Using fallback recommendations'
      });
    }

    res.json({
      success: true,
      data: enrichedRecommendations,
      modelUsed: recommendations.model_used
    });
    
    // Record success
    const responseTime = Date.now() - startTime;
    recommendationMonitor.recordRequest(true, responseTime, usedFallback);
    
  } catch (error) {
    console.error('Error getting recommendations:', error);
    usedFallback = true;
    
    // Fallback to popular services if recommendation service fails
    const fallbackServices = await Service.find({})
      .sort({ rating: -1, reviews: -1 })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name avatar')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      modelUsed: 'fallback',
      message: 'Using fallback recommendations'
    });
    
    // Record fallback
    const responseTime = Date.now() - startTime;
    recommendationMonitor.recordRequest(false, responseTime, usedFallback);
  }
};

// Get similar services
export const getSimilarServices = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { limit = 10 } = req.query;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Call recommendation service
    const recommendations = await recommendationClient.getSimilarServices(
      serviceId,
      parseInt(limit)
    );

    // Filter valid MongoDB ObjectIds only
    const validRecommendations = recommendations.recommendations.filter(r => 
      mongoose.Types.ObjectId.isValid(r.service_id)
    );

    // Fetch actual service details
    const serviceIds = validRecommendations.map(r => r.service_id);
    const services = await Service.find({ 
      _id: { $in: serviceIds }
    })
      .populate('provider', 'name avatar')
      .lean();

    const enrichedRecommendations = validRecommendations.map(rec => {
      const service = services.find(s => s._id.toString() === rec.service_id);
      return service ? {
        ...service,
        similarityScore: rec.score
      } : null;
    }).filter(r => r !== null);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Error getting similar services:', error);
    
    // Fallback to same category services
    const service = await Service.findById(req.params.serviceId);
    const fallbackServices = await Service.find({
      category: service?.category,
      _id: { $ne: req.params.serviceId }
    })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name avatar')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      message: 'Using fallback similar services'
    });
  }
};

// Get personalized recommendations
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Call recommendation service
    const recommendations = await recommendationClient.getPersonalizedRecommendations(
      userId,
      parseInt(limit)
    );

    // Filter valid MongoDB ObjectIds only
    const validRecommendations = recommendations.recommendations.filter(r => 
      mongoose.Types.ObjectId.isValid(r.service_id)
    );

    // Fetch actual service details
    const serviceIds = validRecommendations.map(r => r.service_id);
    const services = await Service.find({ 
      _id: { $in: serviceIds }
    })
      .populate('provider', 'name avatar')
      .lean();

    const enrichedRecommendations = validRecommendations.map(rec => {
      const service = services.find(s => s._id.toString() === rec.service_id);
      return service ? {
        ...service,
        recommendationScore: rec.score
      } : null;
    }).filter(r => r !== null);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    
    // Fallback based on user's booking history
    const userBookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('service');
    
    const bookedServices = await Service.find({
      _id: { $in: userBookings.map(b => b.service) }
    }).select('category');

    const categories = [...new Set(bookedServices.map(s => s.category))];
    
    const fallbackServices = await Service.find({
      category: { $in: categories }
    })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name avatar')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      message: 'Using fallback personalized recommendations'
    });
  }
};

// Health check for recommendation service
export const checkRecommendationServiceHealth = async (req, res) => {
  try {
    const health = await recommendationClient.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Recommendation service unavailable',
      error: error.message
    });
  }
};


// Get recommendation system metrics
export const getRecommendationMetrics = async (req, res) => {
  try {
    const metrics = recommendationMonitor.getMetrics();
    const serviceHealth = await recommendationMonitor.checkServiceHealth();
    
    res.json({
      success: true,
      data: {
        metrics,
        serviceHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics',
      error: error.message
    });
  }
};
